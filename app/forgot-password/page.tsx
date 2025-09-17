'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import Navbar from '@/components/Navbar';
import { Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/user-not-found':
        return 'כתובת הדוא"ל לא נמצאה במערכת';
      case 'auth/invalid-email':
        return 'כתובת דוא"ל לא תקינה';
      case 'auth/too-many-requests':
        return 'יותר מדי בקשות, נסה שוב מאוחר יותר';
      case 'auth/network-request-failed':
        return 'שגיאת רשת, בדוק את החיבור לאינטרנט';
      default:
        return 'שגיאה בשליחת הדוא"ל, נסה שוב';
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen">
        <Navbar />
        
        <div className="section-container py-16">
          <div className="max-w-md mx-auto">
            <div className="card text-center">
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">דוא"ל נשלח בהצלחה!</h1>
                <p className="text-gray-300">
                  שלחנו לך קישור לאיפוס סיסמה לכתובת:
                </p>
                <p className="text-brand-green font-medium mt-2">{email}</p>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200 text-right">
                    <p className="font-medium mb-1">חשוב לזכור:</p>
                    <ul className="space-y-1 text-right">
                      <li>• בדוק את תיבת הספאם אם לא קיבלת את הדוא"ל</li>
                      <li>• הקישור תקף ל-24 שעות בלבד</li>
                      <li>• לחץ על הקישור בדוא"ל לאיפוס הסיסמה</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                    setError('');
                  }}
                  className="btn-secondary w-full"
                >
                  שלח שוב
                </button>
                
                <Link href="/login" className="btn w-full inline-flex items-center justify-center gap-2">
                  חזרה להתחברות
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="section-container py-16">
        <div className="max-w-md mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <Mail className="w-12 h-12 text-brand-green mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">שכחת סיסמה?</h1>
              <p className="text-gray-300">
                הזן את כתובת הדוא"ל שלך ונשלח לך קישור לאיפוס הסיסמה
              </p>
            </div>
            
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">דוא"ל</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    שולח דוא"ל...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    שלח קישור לאיפוס סיסמה
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <Link href="/login" className="text-brand-green hover:underline text-sm inline-flex items-center gap-1">
                <ArrowRight className="w-4 h-4" />
                חזרה להתחברות
              </Link>
            </div>
            
            <div className="mt-4 text-center text-xs text-gray-400">
              אין לך חשבון?{' '}
              <Link href="/signup" className="text-brand-green hover:underline">
                הרשם כאן
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}