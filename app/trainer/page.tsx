'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase.client';
import Navbar from '@/components/Navbar';
import { Event, Registration, UserProfile } from '@/types';
import { Users, Calendar, MapPin, Clock, CheckCircle, XCircle, User, Phone, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface EventWithRegistrations extends Event {
  registrations: (Registration & { userProfile?: UserProfile })[];
}

interface TrainerGuideline {
  id: string;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function TrainerPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assignedEvents, setAssignedEvents] = useState<EventWithRegistrations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithRegistrations | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [guidelines, setGuidelines] = useState<TrainerGuideline[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Get user profile to check role
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          const profile = profileDoc.data() as UserProfile;
          setUserProfile(profile);
          
          // Only load events if user is trainer or admin
          if (profile.role === 'trainer' || profile.role === 'admin') {
            loadAssignedEvents(user.uid, profile.role);
            loadGuidelines();
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadGuidelines = async () => {
    try {
      const guidelinesSnapshot = await getDocs(collection(db, 'trainerGuidelines'));
      const guidelinesData = guidelinesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          order: data.order || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
        } as TrainerGuideline;
      });

      // Sort by order
      guidelinesData.sort((a, b) => a.order - b.order);
      setGuidelines(guidelinesData);
    } catch (error) {
      console.error('Error loading trainer guidelines:', error);
    }
  };

  const loadAssignedEvents = async (userId: string, role: string) => {
    try {
      setLoading(true);
      
      let eventsQuery;
      if (role === 'admin') {
        // Admin can see all events
        eventsQuery = query(collection(db, 'events'));
      } else {
        // Trainer can only see assigned events
        eventsQuery = query(
          collection(db, 'events'),
          where('assignedTrainers', 'array-contains', userId)
        );
      }

      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData: EventWithRegistrations[] = [];

      for (const eventDoc of eventsSnapshot.docs) {
        const data = eventDoc.data();
        const eventData: Event = {
          id: eventDoc.id,
          title: data.title,
          slug: (data.title || 'event').replace(/\s+/g, '-').toLowerCase(),
          description: data.description,
          startAt: new Date(data.date),
          endAt: new Date(data.date),
          locationName: data.location,
          capacity: data.maxParticipants,
          priceNis: data.price,
          cover: data.imageUrl || 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
          publish: data.publish,
          assignedTrainers: data.assignedTrainers || [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        };

        // Get registrations for this event - include both paid and pending
        const registrationsQuery = query(
          collection(db, 'registrations'),
          where('eventId', '==', eventDoc.id)
        );
        
        const registrationsSnapshot = await getDocs(registrationsQuery);
        console.log(`📊 Found ${registrationsSnapshot.docs.length} registrations for event: ${eventData.title}`);
        const registrations: (Registration & { userProfile?: UserProfile })[] = [];

        for (const regDoc of registrationsSnapshot.docs) {
          const regData = { id: regDoc.id, ...regDoc.data() } as Registration;
          
          // Skip cancelled registrations
          if (regData.status === 'cancelled') {
            console.log(`❌ Skipping cancelled registration for user: ${regData.uid}`);
            continue;
          }
          
          console.log(`✅ Processing registration for user: ${regData.uid}, status: ${regData.status}`);
          console.log(`📝 Registration data:`, {
            userName: regData.userName,
            userEmail: regData.userEmail, 
            userPhone: regData.userPhone
          });
          
          // Get user profile for this registration
          try {
            const userProfileDoc = await getDoc(doc(db, 'profiles', regData.uid));
            if (userProfileDoc.exists()) {
              regData.userProfile = userProfileDoc.data() as UserProfile;
              console.log(`👤 Loaded profile for ${regData.uid}:`, regData.userProfile.firstName, regData.userProfile.lastName);
            } else {
              console.log(`❌ No profile found for user ${regData.uid}`);
            }
          } catch (error) {
            console.error('Error loading user profile:', error);
          }

          registrations.push(regData);
        }

        console.log(`📋 Final registration count for ${eventData.title}: ${registrations.length}`);
        
        eventsData.push({
          ...eventData,
          registrations
        });
      }

      // Sort events by start date (upcoming first)
      eventsData.sort((a, b) => {
        const dateA = a.startAt ? new Date(a.startAt).getTime() : 0;
        const dateB = b.startAt ? new Date(b.startAt).getTime() : 0;
        return dateA - dateB;
      });
      
      setAssignedEvents(eventsData);
    } catch (error) {
      console.error('Error loading assigned events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (registrationId: string, currentStatus: boolean) => {
    if (!currentUser) return;
    
    setCheckingIn(registrationId);
    
    try {
      await updateDoc(doc(db, 'registrations', registrationId), {
        checkedIn: !currentStatus,
        checkedInAt: !currentStatus ? new Date() : null,
        checkedInBy: !currentStatus ? currentUser.uid : null
      });

      // Update local state
      if (selectedEvent) {
        const updatedRegistrations = selectedEvent.registrations.map(reg =>
          reg.id === registrationId
            ? { 
                ...reg, 
                checkedIn: !currentStatus,
                checkedInAt: !currentStatus ? new Date() : undefined,
                checkedInBy: !currentStatus ? currentUser.uid : undefined
              }
            : reg
        );
        
        setSelectedEvent({
          ...selectedEvent,
          registrations: updatedRegistrations
        });

        // Also update the main events list
        setAssignedEvents(events =>
          events.map(event =>
            event.id === selectedEvent.id
              ? { ...event, registrations: updatedRegistrations }
              : event
          )
        );
      }
    } catch (error) {
      console.error('Error updating check-in status:', error);
      alert('שגיאה בעדכון סטטוס נוכחות');
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto mb-4"></div>
          <div className="text-lg">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  // Check if user has access
  if (!userProfile || (userProfile.role !== 'trainer' && userProfile.role !== 'admin')) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">אין הרשאת גישה</h1>
          <p className="text-gray-400 mb-6">עמוד זה מיועד למדריכים בלבד</p>
          <Link href="/" className="btn">חזור לעמוד הבית</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="section-container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">פאנל מדריכים</h1>
          <p className="text-gray-400">
            שלום {userProfile.firstName}, כאן תוכל לנהל את האירועים שהוקצו לך ולבדוק נוכחות
          </p>
        </div>

        {/* Guidelines Section */}
        {!selectedEvent && guidelines.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-brand-green" />
              <h2 className="text-2xl font-bold">הנחיות למדריכים</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {guidelines.map((guideline) => (
                <div key={guideline.id} className="card">
                  <h3 className="text-lg font-semibold mb-3 text-brand-green">
                    {guideline.title}
                  </h3>
                  <div className="text-gray-300 whitespace-pre-line">
                    {guideline.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedEvent ? (
          /* Event Details and Check-in */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-blue-400 hover:text-blue-300"
              >
                ← חזור לרשימת אירועים
              </button>
              <div className="text-sm text-gray-400">
                {selectedEvent.registrations.filter(r => r.checkedIn).length} מתוך {selectedEvent.registrations.length} נבדקו
              </div>
            </div>

            {/* Event Info */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">{selectedEvent.title}</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{selectedEvent.startAt ? new Date(selectedEvent.startAt).toLocaleDateString('he-IL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'תאריך לא זמין'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{selectedEvent.locationName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>{selectedEvent.registrations.length} משתתפים</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{selectedEvent.registrations.filter(r => r.checkedIn).length} נבדקו</span>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="card">
              <h3 className="text-xl font-semibold mb-6">רשימת משתתפים</h3>
              
              {selectedEvent.registrations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  אין משתתפים רשומים לאירוע זה עדיין
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedEvent.registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className={`p-4 rounded-lg border transition-all ${
                        registration.checkedIn
                          ? 'bg-green-900/20 border-green-600/50'
                          : 'bg-gray-800/50 border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            registration.checkedIn ? 'bg-green-600' : 'bg-gray-600'
                          }`}>
                            {registration.checkedIn ? (
                              <CheckCircle size={20} className="text-white" />
                            ) : (
                              <User size={20} className="text-white" />
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-semibold">
                              {registration.userProfile
                                ? `${registration.userProfile.firstName} ${registration.userProfile.lastName}`
                                : registration.userName || registration.userEmail || 'משתתף לא זמין'
                              }
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              {(registration.userProfile?.phone || registration.userPhone) && (
                                <div className="flex items-center gap-1">
                                  <Phone size={14} />
                                  <span>{registration.userProfile?.phone || registration.userPhone}</span>
                                </div>
                              )}
                              {(registration.userProfile?.email || registration.userEmail) && (
                                <div className="flex items-center gap-1">
                                  <span>📧</span>
                                  <span>{registration.userProfile?.email || registration.userEmail}</span>
                                </div>
                              )}
                              {registration.checkedIn && registration.checkedInAt && (
                                <div className="flex items-center gap-1">
                                  <Clock size={14} />
                                  <span>נבדק: {new Date(registration.checkedInAt).toLocaleTimeString('he-IL')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCheckIn(registration.id, registration.checkedIn || false)}
                          disabled={checkingIn === registration.id}
                          className={`btn ${
                            registration.checkedIn
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {checkingIn === registration.id ? (
                            'מעדכן...'
                          ) : registration.checkedIn ? (
                            'בטל נוכחות'
                          ) : (
                            'בדוק נוכחות'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Events List */
          <div className="space-y-6">
            {assignedEvents.length === 0 ? (
              <div className="card text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">אין אירועים מוקצים</h3>
                <p className="text-gray-400">
                  {userProfile.role === 'admin' 
                    ? 'לא נמצאו אירועים במערכת'
                    : 'לא הוקצו לך אירועים עדיין. צור קשר עם המנהל לקבלת הקצאות.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {assignedEvents.map((event) => (
                  <div key={event.id} className="card hover:border-brand-green/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                        <div className="space-y-1 text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{event.startAt ? new Date(event.startAt).toLocaleDateString('he-IL', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'תאריך לא זמין'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>{event.locationName}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-brand-green">
                          {event.registrations.filter(r => r.checkedIn).length}
                        </div>
                        <div className="text-sm text-gray-400">
                          מתוך {event.registrations.length}
                        </div>
                        <div className="text-xs text-gray-500">נבדקו</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Users size={16} />
                          {event.registrations.length} משתתפים
                        </span>
                        {event.registrations.length > 0 && (
                          <span className="text-green-400">
                            {Math.round((event.registrations.filter(r => r.checkedIn).length / event.registrations.length) * 100)}% נוכחות
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="btn"
                      >
                        נהל נוכחות
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}