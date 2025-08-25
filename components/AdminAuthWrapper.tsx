'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import Navbar from './Navbar';

interface AdminAuthWrapperProps {
  children: ReactNode;
}

export default function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Try to get user profile directly from Firestore first
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase.client');
        
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        
        if (profileDoc.exists() && profileDoc.data()?.role === 'admin') {
          setIsAdmin(true);
          setUser(user);
        } else {
          // Fallback to API if direct access fails
          try {
            const token = await user.getIdToken();
            const response = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });

            if (response.ok) {
              const data = await response.json();
              if (data.profile?.role === 'admin') {
                setIsAdmin(true);
                setUser(user);
              } else {
                router.push('/');
                return;
              }
            } else {
              router.push('/');
              return;
            }
          } catch (apiError) {
            console.error('API fallback failed:', apiError);
            router.push('/');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto mb-4"></div>
            <p>בודק הרשאות...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin || !user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold mb-4">אין הרשאות גישה</h1>
            <p className="text-gray-400 mb-6">דף זה מיועד למנהלים בלבד</p>
            <button 
              onClick={() => router.push('/')}
              className="btn"
            >
              חזור לדף הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}