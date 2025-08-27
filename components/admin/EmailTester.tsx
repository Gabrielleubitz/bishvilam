'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailTester() {
  const [email, setEmail] = useState('');
  const [testType, setTestType] = useState<'basic' | 'welcome' | 'registration'>('basic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [settingAdmin, setSettingAdmin] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ configured: boolean; loading: boolean }>({ configured: false, loading: true });

  useEffect(() => {
    // Load email configuration status
    const loadEmailConfig = async () => {
      try {
        const response = await fetch('/api/email-config');
        const data = await response.json();
        setEmailConfig({
          configured: data.configured,
          loading: false
        });
      } catch (error) {
        console.error('Error loading email config:', error);
        setEmailConfig({ configured: false, loading: false });
      }
    };

    loadEmailConfig();
  }, []);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setResult({ success: false, message: 'נא הזן כתובת מייל' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let response;
      
      if (testType === 'basic') {
        response = await fetch('/api/test-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
      } else if (testType === 'welcome') {
        response = await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: email,
            userName: 'בוחן מערכת',
            userPhone: '050-1234567',
            userGroups: ['א', 'ב'],
            createdAt: new Date().toLocaleDateString('he-IL')
          }),
        });
      } else if (testType === 'registration') {
        response = await fetch('/api/send-registration-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: email,
            userName: 'בוחן מערכת',
            userPhone: '050-1234567',
            eventTitle: 'אימון בדיקה',
            eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            eventLocation: 'בוש עציון - מרכז האימון',
            registrationStatus: 'רשום ושולם'
          }),
        });
      }

      const data = await response!.json();
      
      setResult({
        success: data.success,
        message: data.success ? data.message : data.error
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'שגיאה בשליחת המייל: ' + (error as any).message
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await fetch('/api/admin/check-admins');
      const data = await response.json();
      setAdminInfo(data);
    } catch (error) {
      console.error('Error checking admins:', error);
      setAdminInfo({ success: false, error: 'Failed to check admin users' });
    } finally {
      setLoadingAdmins(false);
    }
  };

  const setAdminRole = async (makeAdmin: boolean) => {
    if (!adminEmail) {
      setResult({ success: false, message: 'נא הזן אימייל' });
      return;
    }

    setSettingAdmin(true);
    try {
      const response = await fetch('/api/admin/set-admin-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: adminEmail,
          makeAdmin
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({ success: true, message: data.message });
        // Refresh admin info
        checkAdmins();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'שגיאה בעדכון הרשאות: ' + (error as any).message
      });
    } finally {
      setSettingAdmin(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="text-blue-400" size={24} />
        <h3 className="text-lg font-semibold">בדיקת מערכת המייל</h3>
      </div>

      <form onSubmit={handleTest} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            סוג בדיקה
          </label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value as 'basic' | 'welcome' | 'registration')}
            className="input"
          >
            <option value="basic">מייל בדיקה בסיסי</option>
            <option value="welcome">מייל ברוכים הבאים + התראה למנהלים</option>
            <option value="registration">מייל אישור הרשמה + התראה למנהלים</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            כתובת מייל לבדיקה
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="input"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn flex items-center gap-2"
        >
          <Send size={16} />
          {loading ? 'שולח...' : 'שלח מייל בדיקה'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-4 rounded border-r-4 ${
          result.success 
            ? 'bg-green-900/30 border-green-500/30 text-green-300' 
            : 'bg-red-900/30 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-semibold">
              {result.success ? 'מייל נשלח בהצלחה!' : 'שגיאה בשליחה'}
            </span>
          </div>
          <p className="text-sm opacity-90">{result.message}</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-gray-800/50 rounded">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">מידע על מנהלים במערכת:</h4>
            <button
              onClick={checkAdmins}
              disabled={loadingAdmins}
              className="btn-outline text-sm px-3 py-1"
            >
              {loadingAdmins ? 'בודק...' : 'בדוק מנהלים'}
            </button>
          </div>
          
          {adminInfo && (
            <div className="text-sm space-y-2">
              {adminInfo.success ? (
                <>
                  <p>
                    <span className="text-gray-400">סה&quot;כ פרופילים:</span>{' '}
                    <span className="text-white">{adminInfo.data.totalProfiles}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">סה&quot;כ מנהלים:</span>{' '}
                    <span className={`font-medium ${adminInfo.data.totalAdmins > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {adminInfo.data.totalAdmins}
                    </span>
                  </p>
                  {adminInfo.data.totalAdmins > 0 && (
                    <div>
                      <span className="text-gray-400">אימיילי מנהלים:</span>
                      <div className="mt-1 space-y-1">
                        {adminInfo.data.adminProfiles.map((admin: any, index: number) => (
                          <div key={index} className="text-xs bg-gray-700/50 rounded px-2 py-1">
                            <span className="text-green-300">{admin.email}</span>
                            {admin.firstName && (
                              <span className="text-gray-400 mr-2">({admin.firstName} {admin.lastName})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-red-400">❌ {adminInfo.error}</p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-800/50 rounded">
          <h4 className="font-medium mb-3">ניהול הרשאות מנהל:</h4>
          <div className="space-y-3">
            <div>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="אימייל המשתמש"
                className="input text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAdminRole(true)}
                disabled={settingAdmin || !adminEmail}
                className="btn text-sm px-3 py-1 bg-green-600 hover:bg-green-700"
              >
                {settingAdmin ? 'מעדכן...' : 'הפוך למנהל'}
              </button>
              <button
                onClick={() => setAdminRole(false)}
                disabled={settingAdmin || !adminEmail}
                className="btn-outline text-sm px-3 py-1"
              >
                הסר הרשאות מנהל
              </button>
            </div>
            <p className="text-xs text-gray-500">
              השתמש בכלי זה כדי להפוך משתמשים למנהלים ולהתחיל לקבל התראות מייל
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-800/50 rounded">
          <h4 className="font-medium mb-2">מידע על התצורה:</h4>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-400">Mailjet API:</span>{' '}
              {emailConfig.loading ? (
                <span className="text-gray-400">בודק...</span>
              ) : emailConfig.configured ? 
                <span className="text-green-400">✅ מוגדר ופעיל</span> : 
                <span className="text-red-400">❌ לא מוגדר</span>
              }
            </p>
            <p className="text-xs text-gray-500">
              המערכת תחפש מנהלים ב-Firebase לפי role=&quot;admin&quot; ותשלח להם התראות
            </p>
            {!emailConfig.loading && !emailConfig.configured && (
              <p className="text-xs text-yellow-400 mt-2">
                ⚠️ יש להגדיר MAILJET_API_KEY ו-MAILJET_API_SECRET במשתני הסביבה
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}