'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import Navbar from '@/components/Navbar';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const [codeValid, setCodeValid] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode'); // Firebase reset code from URL

  useEffect(() => {
    if (!oobCode) {
      setError('קוד איפוס סיסמה לא תקין או חסר');
      setVerifyingCode(false);
      return;
    }

    // Verify the reset code
    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setCodeValid(true);
      } catch (error: any) {
        setError(getVerifyErrorMessage(error.code));
      } finally {
        setVerifyingCode(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות לא תואמות');
      return;
    }

    if (newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (!oobCode) {
      setError('קוד איפוס סיסמה לא תקין');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetComplete(true);
    } catch (error: any) {
      setError(getResetErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getVerifyErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/expired-action-code':
        return 'קוד איפוס הסיסמה פג תוקף. בקש קישור חדש לאיפוס סיסמה';
      case 'auth/invalid-action-code':
        return 'קוד איפוס סיסמה לא תקין או כבר נוצל';
      case 'auth/user-disabled':
        return 'החשבון הושבת';
      case 'auth/user-not-found':
        return 'משתמש לא נמצא במערכת';
      default:
        return 'שגיאה באימות קוד איפוס הסיסמה';
    }
  };

  const getResetErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/expired-action-code':
        return 'קוד איפוס הסיסמה פג תוקף. בקש קישור חדש לאיפוס סיסמה';
      case 'auth/invalid-action-code':
        return 'קוד איפוס סיסמה לא תקין או כבר נוצל';
      case 'auth/weak-password':
        return 'הסיסמה חלשה מדי. בחר סיסמה חזקה יותר';
      default:
        return 'שגיאה באיפוס הסיסמה, נסה שוב';
    }
  };

  // Loading state while verifying code
  if (verifyingCode) {
    return (
      <div className="min-h-screen">
        <Navbar />
        
        <div className="section-container py-16">
          <div className="max-w-md mx-auto">
            <div className="card text-center">
              <div className="w-8 h-8 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin mx-auto mb-4"></div>
              <h1 className="text-xl font-bold mb-2">אמת את קוד איפוס הסיסמה...</h1>
              <p className="text-gray-400 text-sm">אנא המתן</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (resetComplete) {
    return (
      <div className="min-h-screen">
        <Navbar />
        
        <div className="section-container py-16">
          <div className="max-w-md mx-auto">
            <div className="card text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">הסיסמה אופסה בהצלחה!</h1>
              <p className="text-gray-300 mb-6">
                עכשיו אתה יכול להתחבר עם הסיסמה החדשה שלך
              </p>
              
              <Link href="/login" className="btn w-full inline-flex items-center justify-center gap-2">
                התחבר עכשיו
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state or form
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="section-container py-16">
        <div className="max-w-md mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-brand-green mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">איפוס סיסמה</h1>
              {email && (
                <p className="text-gray-300 text-sm">
                  עבור: <span className="text-brand-green">{email}</span>
                </p>
              )}
            </div>
            
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{error}</p>
                  {(error.includes('פג תוקף') || error.includes('לא תקין')) && (
                    <div className="mt-2">
                      <Link href="/forgot-password" className="text-brand-green hover:underline text-sm">
                        בקש קישור חדש לאיפוס סיסמה
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {codeValid && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">סיסמה חדשה</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input pr-10"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">לפחות 6 תווים</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">אישור סיסמה</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input pr-10"
                      required
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="btn w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      מעדכן סיסמה...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      אפס סיסמה
                    </>
                  )}
                </button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <Link href="/login" className="text-brand-green hover:underline text-sm inline-flex items-center gap-1">
                <ArrowRight className="w-4 h-4" />
                חזרה להתחברות
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}