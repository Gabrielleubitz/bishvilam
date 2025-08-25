'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase.client';
import { UserProfile } from '@/types';
import Navbar from '@/components/Navbar';
import { Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    tzId: '',
    dob: '',
    emergency: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      console.log('User created:', userCredential.user.uid);

      const profile: UserProfile = {
        uid: userCredential.user.uid,
        role: 'student',
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        tzId: formData.tzId,
        dob: formData.dob,
        emergency: formData.emergency,
        lang: 'he',
        createdAt: new Date()
      };

      console.log('Creating profile:', profile);

      try {
        await setDoc(doc(db, 'profiles', userCredential.user.uid), profile);
        console.log('Profile created successfully');
        router.push('/events');
      } catch (firestoreError: any) {
        console.error('Firestore error:', firestoreError);
        
        // Fallback: try using the API route
        try {
          const token = await userCredential.user.getIdToken();
          const response = await fetch('/api/auth/ensure-profile', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              tzId: formData.tzId,
              dob: formData.dob,
              emergency: formData.emergency
            })
          });
          
          if (response.ok) {
            console.log('Profile created via API');
            router.push('/events');
          } else {
            setError('שגיאה ביצירת פרופיל - בדוק את חוקי Firestore');
          }
        } catch (apiError) {
          console.error('API fallback failed:', apiError);
          setError('שגיאה ביצירת פרופיל - בדוק את חוקי Firestore');
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(getErrorMessage(error.code || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'כתובת הדוא"ל כבר בשימוש';
      case 'auth/invalid-email':
        return 'כתובת דוא"ל לא תקינה';
      case 'auth/weak-password':
        return 'הסיסמה חלשה מדי';
      default:
        return 'שגיאה בהרשמה, נסה שוב';
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="section-container py-16">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h1 className="text-2xl font-bold text-center mb-6">הרשמה חדשה</h1>
            
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">שם פרטי *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input"
                    required
                    placeholder="שם פרטי"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">שם משפחה *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input"
                    required
                    placeholder="שם משפחה"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">דוא&quot;ל *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">סיסמה *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
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
                
                <div>
                  <label className="block text-sm font-medium mb-2">אישור סיסמה *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input"
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">טלפון *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                    required
                    placeholder="050-1234567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">תעודת זהות *</label>
                  <input
                    type="text"
                    name="tzId"
                    value={formData.tzId}
                    onChange={handleChange}
                    className="input"
                    required
                    placeholder="123456789"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">תאריך לידה</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">איש קשר חירום</label>
                  <input
                    type="text"
                    name="emergency"
                    value={formData.emergency}
                    onChange={handleChange}
                    className="input"
                    placeholder="שם ומספר טלפון"
                  />
                </div>
              </div>
              
              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 text-sm text-yellow-200">
                <p className="font-semibold mb-2">שים לב:</p>
                <p>למשתתפים מתחת לגיל 18 נדרשת הסכמת הורים. טופס ההסכמה יישלח אליך לאחר ההרשמה.</p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn w-full"
              >
                {loading ? 'נרשם...' : 'הרשמה'}
              </button>
            </form>
            
            <div className="mt-6 text-center text-gray-400 text-sm">
              יש לך כבר חשבון?{' '}
              <Link href="/login" className="text-brand-green hover:underline">
                התחבר כאן
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}