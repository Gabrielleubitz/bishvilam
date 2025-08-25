'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import Navbar from '@/components/Navbar';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/events');
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/user-not-found':
        return 'משתמש לא נמצא במערכת';
      case 'auth/wrong-password':
        return 'סיסמה שגויה';
      case 'auth/invalid-email':
        return 'כתובת דוא"ל לא תקינה';
      case 'auth/user-disabled':
        return 'החשבון הושבת';
      default:
        return 'שגיאה בהתחברות, נסה שוב';
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="section-container py-16">
        <div className="max-w-md mx-auto">
          <div className="card">
            <h1 className="text-2xl font-bold text-center mb-6">התחברות</h1>
            
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
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">סיסמה</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-10"
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn w-full"
              >
                {loading ? 'מתחבר...' : 'התחברות'}
              </button>
            </form>
            
            <div className="mt-6 text-center space-y-2">
              <Link href="/forgot-password" className="text-brand-green hover:underline text-sm">
                שכחת סיסמה?
              </Link>
              <div className="text-gray-400 text-sm">
                אין לך חשבון?{' '}
                <Link href="/signup" className="text-brand-green hover:underline">
                  הרשם כאן
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}