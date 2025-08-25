'use client';

import { useState, useRef, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, PhoneAuthProvider, linkWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import { Phone, Shield, RefreshCw } from 'lucide-react';

interface PhoneVerificationProps {
  phoneNumber: string;
  onVerificationSuccess: (phoneCredential: any) => void;
  onError: (error: string) => void;
  existingUser?: any; // If linking to existing user
}

export default function PhoneVerification({ 
  phoneNumber, 
  onVerificationSuccess, 
  onError,
  existingUser 
}: PhoneVerificationProps) {
  const [step, setStep] = useState<'setup' | 'code-sent' | 'verifying'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA
    if (recaptchaRef.current && !recaptchaVerifier.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          onError('אימות reCAPTCHA פג תוקף, נסה שוב');
        }
      });
    }

    return () => {
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhoneNumber = (phone: string): string => {
    // Convert Israeli phone number to international format
    let formatted = phone.replace(/\D/g, ''); // Remove all non-digits
    
    // Handle Israeli numbers
    if (formatted.startsWith('0')) {
      formatted = '+972' + formatted.substring(1);
    } else if (!formatted.startsWith('+')) {
      formatted = '+972' + formatted;
    }
    
    return formatted;
  };

  const sendVerificationCode = async () => {
    if (!recaptchaVerifier.current) {
      onError('reCAPTCHA לא הוכן, נסה לרענן את הדף');
      return;
    }

    setLoading(true);
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('Sending SMS to:', formattedPhone);
      
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier.current
      );
      
      setConfirmationResult(confirmationResult);
      setStep('code-sent');
      setCountdown(60); // 60 second countdown for resend
      
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      
      // Reset reCAPTCHA
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
      
      // Reinitialize reCAPTCHA for retry
      setTimeout(() => {
        if (recaptchaRef.current) {
          recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'normal',
            callback: () => console.log('reCAPTCHA solved'),
            'expired-callback': () => onError('אימות reCAPTCHA פג תוקף, נסה שוב')
          });
        }
      }, 1000);
      
      let errorMessage = 'שגיאה בשליחת קוד האימות';
      
      switch (error.code) {
        case 'auth/invalid-phone-number':
          errorMessage = 'מספר הטלפון לא תקין';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'יותר מדי בקשות. נסה שוב מאוחר יותר';
          break;
        case 'auth/captcha-check-failed':
          errorMessage = 'אימות reCAPTCHA נכשל. נסה שוב';
          break;
        default:
          errorMessage = error.message || 'שגיאה בשליחת קוד האימות';
      }
      
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult || !verificationCode) {
      onError('קוד האימות חסר');
      return;
    }

    if (verificationCode.length !== 6) {
      onError('קוד האימות חייב להכיל 6 ספרות');
      return;
    }

    setLoading(true);
    setStep('verifying');

    try {
      if (existingUser) {
        // Link phone credential to existing user
        const phoneCredential = PhoneAuthProvider.credential(
          confirmationResult.verificationId,
          verificationCode
        );
        
        await linkWithCredential(existingUser, phoneCredential);
        onVerificationSuccess(phoneCredential);
      } else {
        // Complete phone sign-in
        const result = await confirmationResult.confirm(verificationCode);
        onVerificationSuccess(result.user);
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      
      let errorMessage = 'קוד האימות שגוי';
      
      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = 'קוד האימות שגוי';
          break;
        case 'auth/code-expired':
          errorMessage = 'קוד האימות פג תוקף. בקש קוד חדש';
          break;
        default:
          errorMessage = error.message || 'שגיאה באימות הקוד';
      }
      
      onError(errorMessage);
      setStep('code-sent');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setStep('setup');
    setVerificationCode('');
    setConfirmationResult(null);
    await sendVerificationCode();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="text-white" size={24} />
        </div>
        <h2 className="text-xl font-semibold mb-2">אימות מספר טלפון</h2>
        <p className="text-gray-400">
          נשלח קוד אימות ל-{phoneNumber} כדי לוודא שהמספר שייך לך
        </p>
      </div>

      {step === 'setup' && (
        <div className="space-y-4">
          {/* reCAPTCHA container */}
          <div className="flex justify-center">
            <div id="recaptcha-container" ref={recaptchaRef}></div>
          </div>
          
          <button
            onClick={sendVerificationCode}
            disabled={loading}
            className="btn w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                שולח קוד...
              </>
            ) : (
              <>
                <Phone size={20} />
                שלח קוד אימות
              </>
            )}
          </button>
        </div>
      )}

      {step === 'code-sent' && (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 text-center">
            <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-300 text-sm">
              קוד אימות נשלח ל-{phoneNumber}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">קוד אימות (6 ספרות)</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              className="input text-center text-lg font-mono"
              placeholder="123456"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>

          <button
            onClick={verifyCode}
            disabled={loading || verificationCode.length !== 6}
            className="btn w-full"
          >
            {loading ? 'מאמת...' : 'אמת קוד'}
          </button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-gray-400 text-sm">
                שלח קוד חדש בעוד {countdown} שניות
              </p>
            ) : (
              <button
                onClick={resendCode}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
                disabled={loading}
              >
                לא קיבלת קוד? שלח שוב
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'verifying' && (
        <div className="text-center py-8">
          <RefreshCw size={32} className="animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">מאמת קוד...</p>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-sm text-gray-300">
        <p className="font-semibold mb-2 text-blue-400">טיפים:</p>
        <ul className="space-y-1 text-xs">
          <li>• הקוד יגיע תוך דקה או שתיים</li>
          <li>• בדוק גם בהודעות זבל (SPAM)</li>
          <li>• וודא שהמספר נכון ונגיש</li>
          <li>• אם לא מגיע קוד, נסה לשלוח שוב</li>
        </ul>
      </div>
    </div>
  );
}