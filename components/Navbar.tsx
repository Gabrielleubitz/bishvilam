'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase.client';
import { UserProfile } from '@/types';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useMedia } from '@/hooks/useMedia';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getNavbarLogo } = useMedia();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Force refresh of authentication token to ensure Firestore has proper context
        await user.getIdToken(true);
        setUser(user);
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-brand-black/90 backdrop-blur-md border-b border-brand-green/20 sticky top-0 z-50">
      <div className="section-container">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img 
              src={getNavbarLogo()}
              alt="בשבילם"
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="hover:text-brand-green transition-colors">
              דף הבית
            </Link>
            <Link href="/events" className="hover:text-brand-green transition-colors">
              אירועים
            </Link>
            <Link href="/about" className="hover:text-brand-green transition-colors">
              עלינו
            </Link>
            <Link href="/lizchram" className="hover:text-yellow-400 transition-colors">
              לזכרם
            </Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/account" className="hover:text-brand-green transition-colors">
                  החשבון שלי
                </Link>
                {(profile?.role === 'trainer' || profile?.role === 'admin') && (
                  <Link href="/trainer" className="hover:text-brand-green transition-colors">
                    פאנל מדריכים
                  </Link>
                )}
                {profile?.role === 'admin' && (
                  <Link href="/admin" className="hover:text-brand-green transition-colors">
                    ניהול
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 hover:text-brand-green transition-colors"
                >
                  <LogOut size={16} />
                  יציאה
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="hover:text-brand-green transition-colors">
                  התחברות
                </Link>
                <Link href="/signup" className="btn">
                  הרשמה
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-brand-green/20 py-4">
            <div className="flex flex-col gap-4">
              <Link href="/" className="hover:text-brand-green transition-colors" onClick={() => setIsMenuOpen(false)}>
                דף הבית
              </Link>
              <Link href="/events" className="hover:text-brand-green transition-colors" onClick={() => setIsMenuOpen(false)}>
                אירועים
              </Link>
              <Link href="/about" className="hover:text-brand-green transition-colors" onClick={() => setIsMenuOpen(false)}>
                עלינו
              </Link>
              <Link href="/lizchram" className="hover:text-yellow-400 transition-colors" onClick={() => setIsMenuOpen(false)}>
                לזכרם
              </Link>
              
              {user ? (
                <>
                  <Link href="/account" className="hover:text-brand-green transition-colors" onClick={() => setIsMenuOpen(false)}>
                    החשבון שלי
                  </Link>
                  {(profile?.role === 'trainer' || profile?.role === 'admin') && (
                    <Link href="/trainer" className="hover:text-brand-green transition-colors" onClick={() => setIsMenuOpen(false)}>
                      פאנל מדריכים
                    </Link>
                  )}
                  {profile?.role === 'admin' && (
                    <Link href="/admin" className="hover:text-brand-green transition-colors" onClick={() => setIsMenuOpen(false)}>
                      ניהול
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="text-right hover:text-brand-green transition-colors"
                  >
                    יציאה
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-brand-green transition-colors" onClick={() => setIsMenuOpen(false)}>
                    התחברות
                  </Link>
                  <Link href="/signup" className="btn w-fit" onClick={() => setIsMenuOpen(false)}>
                    הרשמה
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}