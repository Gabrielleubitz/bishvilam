'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailTester() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setResult({ success: false, message: 'נא הזן כתובת מייל' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
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

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="text-blue-400" size={24} />
        <h3 className="text-lg font-semibold">בדיקת מערכת המייל</h3>
      </div>

      <form onSubmit={handleTest} className="space-y-4">
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

      <div className="mt-6 p-4 bg-gray-800/50 rounded">
        <h4 className="font-medium mb-2">מידע על התצורה:</h4>
        <div className="text-sm space-y-1">
          <p>
            <span className="text-gray-400">Mailjet API Key:</span>{' '}
            {process.env.NEXT_PUBLIC_MAILJET_CONFIGURED ? 
              <span className="text-green-400">✅ מוגדר</span> : 
              <span className="text-red-400">❌ לא מוגדר</span>
            }
          </p>
          <p className="text-xs text-gray-500">
            לאחר הגדרת המפתחות ב-.env.local, אתחל את השרת לכדי שהשינויים ייכנסו לתוקף
          </p>
        </div>
      </div>
    </div>
  );
}