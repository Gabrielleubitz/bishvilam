'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase.client';
import Navbar from '@/components/Navbar';
import { Calendar, MapPin, Users, DollarSign, Clock, Bell, User, Settings, LogOut, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  maxParticipants: number;
  price: number;
  imageUrl?: string;
}

interface Registration {
  id: string;
  eventId: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'free';
  registeredAt: any;
}

interface UserRegistration extends Registration {
  event: Event;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetGroups: string[];
  type: 'info' | 'warning' | 'success' | 'urgent';
  active: boolean;
  emailSent: boolean;
  createdAt: any;
  createdBy: string;
  expiresAt?: any;
}

export default function UserDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'announcements' | 'profile'>('events');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 User Dashboard - Auth state:', user ? user.email : 'Not logged in');
      setCurrentUser(user);
      if (user) {
        loadUserData(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserAnnouncements = async (profile: any) => {
    try {
      console.log('📢 Loading announcements for user:', profile?.email);
      
      // Get all active, non-expired announcements
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const announcementsSnapshot = await getDocs(announcementsQuery);
      const allAnnouncements = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];

      console.log(`📢 Found ${allAnnouncements.length} active announcements`);

      // Filter announcements relevant to user
      const userGroups = profile?.groups || [];
      const currentDate = new Date();
      
      const relevantAnnouncements = allAnnouncements.filter(announcement => {
        // Check if announcement is expired
        if (announcement.expiresAt) {
          const expiryDate = announcement.expiresAt.toDate ? announcement.expiresAt.toDate() : new Date(announcement.expiresAt);
          if (currentDate > expiryDate) {
            return false;
          }
        }

        // Check if user is in target groups
        const targetGroups = announcement.targetGroups || [];
        
        // If targeting all groups
        if (targetGroups.includes('ALL')) {
          return true;
        }
        
        // Check if user has any of the target groups
        return targetGroups.some(targetGroup => userGroups.includes(targetGroup));
      });

      console.log(`📢 User relevant announcements: ${relevantAnnouncements.length}`);
      console.log('📢 User groups:', userGroups);
      
      setAnnouncements(relevantAnnouncements);
    } catch (error) {
      console.error('❌ Error loading announcements:', error);
      setAnnouncements([]);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      setLoading(true);
      console.log('📊 Loading user data for:', userId);
      
      let profileData = null;

      // Load user profile
      const profilesSnapshot = await getDocs(
        query(collection(db, 'profiles'), where('uid', '==', userId))
      );
      
      if (!profilesSnapshot.empty) {
        profileData = {
          id: profilesSnapshot.docs[0].id,
          ...profilesSnapshot.docs[0].data()
        };
        console.log('👤 User profile loaded:', profileData);
        setUserProfile(profileData);
      }

      // Load user's registrations
      console.log('🔍 Loading registrations for user:', userId);
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('uid', '==', userId)
      );
      
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const userRegistrations = registrationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          eventId: data.eventId,
          status: data.status,
          paymentStatus: data.paymentStatus,
          registeredAt: data.registeredAt
        };
      }) as Registration[];

      console.log('📋 Raw registrations found:', userRegistrations);

      // Load ALL events to match with registrations
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const allEvents = eventsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          date: data.date,
          location: data.location,
          maxParticipants: data.maxParticipants,
          price: data.price,
          imageUrl: data.imageUrl
        };
      }) as Event[];

      console.log('🎯 All events loaded:', allEvents.length);

      // Combine registrations with event data
      const registrationsWithEvents: UserRegistration[] = [];
      
      for (const registration of userRegistrations) {
        const event = allEvents.find(e => e.id === registration.eventId);
        if (event) {
          registrationsWithEvents.push({
            ...registration,
            event: event
          });
          console.log(`✅ Matched registration to event: ${event.title}`);
        } else {
          console.log(`❌ No event found for registration: ${registration.eventId}`);
        }
      }

      console.log('🎊 Final registrations with events:', registrationsWithEvents);
      
      // Sort by registration date (newest first)
      registrationsWithEvents.sort((a, b) => {
        const dateA = a.registeredAt?.toDate ? a.registeredAt.toDate() : new Date(a.registeredAt);
        const dateB = b.registeredAt?.toDate ? b.registeredAt.toDate() : new Date(b.registeredAt);
        return dateB.getTime() - dateA.getTime();
      });

      setRegistrations(registrationsWithEvents);

      // Load relevant announcements for this user
      if (profileData) {
        await loadUserAnnouncements(profileData);
      }

    } catch (error) {
      console.error('❌ Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (registration: UserRegistration) => {
    if (registration.status === 'confirmed') {
      return <CheckCircle className="text-green-400" size={16} />;
    } else if (registration.status === 'pending') {
      return <Clock className="text-yellow-400" size={16} />;
    } else {
      return <XCircle className="text-red-400" size={16} />;
    }
  };

  const getStatusText = (registration: UserRegistration) => {
    const statusMap: Record<string, string> = {
      'confirmed': 'מאושר',
      'pending': 'ממתין',
      'cancelled': 'מבוטל'
    };
    return statusMap[registration.status] || registration.status;
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    const statusMap: Record<string, string> = {
      'paid': 'שולם',
      'pending': 'ממתין לתשלום', 
      'free': 'חינם'
    };
    return statusMap[paymentStatus] || paymentStatus;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <AlertCircle className="text-blue-400" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-400" size={20} />;
      case 'success': return <CheckCircle className="text-green-400" size={20} />;
      case 'urgent': return <AlertCircle className="text-red-400" size={20} />;
      default: return <Bell className="text-gray-400" size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'border-blue-500 bg-blue-900/20';
      case 'warning': return 'border-yellow-500 bg-yellow-900/20';
      case 'success': return 'border-green-500 bg-green-900/20';
      case 'urgent': return 'border-red-500 bg-red-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <div className="text-lg">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">נדרשת התחברות</h1>
          <p className="text-gray-400 mb-6">יש להתחבר כדי לצפות בחשבון האישי שלך</p>
          <Link href="/login" className="btn">
            התחבר
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Debug Info */}
      <div className="bg-gray-800/50 text-xs p-2 text-center">
        🔍 Debug: User: {currentUser.email} | Registrations: {registrations.length} | 
        Active: {registrations.filter(r => r.status === 'confirmed').length}
      </div>
      
      {/* Header */}
      <section className="bg-gray-900 py-12">
        <div className="section-container">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center">
              <User className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                שלום {userProfile?.firstName || currentUser.email?.split('@')[0]}! 👋
              </h1>
              <p className="text-gray-400">
                ברוך הבא לחשבון האישי שלך
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">הרשמות פעילות</p>
                  <p className="text-2xl font-bold">
                    {registrations.filter(r => r.status === 'confirmed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">סך הרשמות</p>
                  <p className="text-2xl font-bold">{registrations.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">הודעות חדשות</p>
                  <p className="text-2xl font-bold">{announcements.length}</p>
                </div>
                <Bell className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="border-b border-gray-700">
        <div className="section-container">
          <div className="flex gap-8">
            {[
              { id: 'events', label: 'האירועים שלי', icon: Calendar },
              { id: 'announcements', label: 'הודעות', icon: Bell },
              { id: 'profile', label: 'פרופיל', icon: User }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-green text-brand-green'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="py-12">
        <div className="section-container">
          
          {/* My Events Tab */}
          {activeTab === 'events' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">האירועים שלי</h2>
              
              {registrations.length === 0 ? (
                <div className="card text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין הרשמות עדיין</h3>
                  <p className="text-gray-400 mb-6">לא נרשמת לאף אירוע עדיין</p>
                  <Link href="/events" className="btn">
                    עיין באירועים זמינים
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {registrations.map((registration) => (
                    <div key={registration.id} className="card">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{registration.event.title}</h3>
                            
                            {/* Status Badge */}
                            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                              registration.status === 'confirmed' 
                                ? 'bg-green-900/50 text-green-300 border border-green-500/30'
                                : registration.status === 'pending'
                                ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30'
                                : 'bg-red-900/50 text-red-300 border border-red-500/30'
                            }`}>
                              {getStatusIcon(registration)}
                              {getStatusText(registration)}
                            </span>

                            {/* Payment Status */}
                            {registration.event.price > 0 && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                registration.paymentStatus === 'paid'
                                  ? 'bg-green-900/50 text-green-300'
                                  : 'bg-yellow-900/50 text-yellow-300'
                              }`}>
                                {getPaymentStatusText(registration.paymentStatus)}
                              </span>
                            )}
                          </div>

                          <p className="text-gray-300 mb-4">{registration.event.description}</p>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              <span>{new Date(registration.event.date).toLocaleDateString('he-IL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={16} />
                              <span>{registration.event.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={16} />
                              <span>{registration.event.price === 0 ? 'חינם' : `₪${registration.event.price}`}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={16} />
                              <span>נרשמת ב{new Date(registration.registeredAt?.toDate?.() || registration.registeredAt).toLocaleDateString('he-IL')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/events/${encodeURIComponent(registration.event.title.replace(/\s+/g, '-').toLowerCase())}`}
                            className="btn-outline text-sm"
                          >
                            פרטי האירוע
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">הודעות ועדכונים</h2>
              
              {announcements.length === 0 ? (
                <div className="card text-center py-12">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין הודעות חדשות</h3>
                  <p className="text-gray-400">כל ההודעות וההודעות יופיעו כאן</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className={`card border-l-4 ${getTypeColor(announcement.type)}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getTypeIcon(announcement.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{announcement.title}</h3>
                            {announcement.emailSent && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-500/30">
                                📧 נשלח במייל
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 mb-3 whitespace-pre-line">{announcement.content}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                              {new Date(announcement.createdAt?.toDate?.() || announcement.createdAt).toLocaleDateString('he-IL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {announcement.expiresAt && (
                              <p className="text-sm text-yellow-400">
                                פוגה: {new Date(announcement.expiresAt.toDate()).toLocaleDateString('he-IL')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">הפרופיל שלי</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Profile Info */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">פרטים אישיים</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">אימייל</label>
                      <p className="font-medium">{currentUser.email}</p>
                    </div>
                    {userProfile?.firstName && (
                      <div>
                        <label className="text-sm text-gray-400">שם פרטי</label>
                        <p className="font-medium">{userProfile.firstName}</p>
                      </div>
                    )}
                    {userProfile?.lastName && (
                      <div>
                        <label className="text-sm text-gray-400">שם משפחה</label>
                        <p className="font-medium">{userProfile.lastName}</p>
                      </div>
                    )}
                    {userProfile?.phone && (
                      <div>
                        <label className="text-sm text-gray-400">טלפון</label>
                        <p className="font-medium">{userProfile.phone}</p>
                      </div>
                    )}
                  </div>
                  
                  <button className="btn-outline w-full mt-4">
                    <Settings size={16} className="ml-2" />
                    עריכת פרופיל
                  </button>
                </div>

                {/* Account Actions */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">פעולות</h3>
                  <div className="space-y-3">
                    <Link href="/events" className="btn-outline w-full flex items-center justify-center">
                      <Calendar size={16} className="ml-2" />
                      עיין באירועים חדשים
                    </Link>
                    
                    <button className="btn-outline w-full flex items-center justify-center">
                      <Bell size={16} className="ml-2" />
                      הגדרות התראות
                    </button>
                    
                    <button 
                      onClick={() => auth.signOut()}
                      className="btn-outline w-full flex items-center justify-center text-red-400 hover:text-red-300"
                    >
                      <LogOut size={16} className="ml-2" />
                      התנתקות
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}