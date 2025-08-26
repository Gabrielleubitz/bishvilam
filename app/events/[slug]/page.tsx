'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase.client';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Event } from '@/types';
import { Calendar, MapPin, Users, DollarSign, Clock, ArrowRight, Phone, Mail, Plus, Navigation, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import WhatsAppGroupLinks from '@/components/WhatsAppGroupLinks';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [showWhatsAppLinks, setShowWhatsAppLinks] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 Auth state changed:', user ? user.email : 'Not logged in');
      setCurrentUser(user);
      if (user) {
        loadUserProfile(user.uid);
      }
    });

    if (slug) {
      loadEvent();
    }

    return () => unsubscribe();
  }, [slug]);

  useEffect(() => {
    if (event && currentUser) {
      checkExistingRegistration();
    } else {
      setIsRegistered(false);
      setUserRegistration(null);
    }
  }, [event?.id, currentUser?.uid]);

  // Show WhatsApp links for registered users with groups
  useEffect(() => {
    if (isRegistered && userProfile?.groups && userProfile.groups.length > 0) {
      setShowWhatsAppLinks(true);
    }
  }, [isRegistered, userProfile?.groups]);

  useEffect(() => {
    if (event) {
      loadRegistrationCount();
      // Auto-refresh count every 30 seconds
      const interval = setInterval(loadRegistrationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [event?.id]);

  const loadUserProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      if (profileDoc.exists()) {
        setUserProfile(profileDoc.data());
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadEvent = async () => {
    try {
      // Decode the URL slug to handle Hebrew characters
      const decodedSlug = decodeURIComponent(slug);
      console.log('🔍 Loading event with slug:', slug);
      console.log('🔍 Decoded slug:', decodedSlug);
      
      const eventsQuery = query(
        collection(db, 'events'),
        where('publish', '==', true)
      );
      
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => {
        const data = doc.data();
        const generatedSlug = (data.title || 'event').replace(/\s+/g, '-').toLowerCase();
        console.log(`🔍 Processing event "${data.title}" with slug: "${generatedSlug}"`);
        return {
          id: doc.id,
          title: data.title,
          slug: generatedSlug,
          description: data.description,
          startAt: new Date(data.date),
          endAt: new Date(data.date),
          locationName: data.location,
          capacity: data.maxParticipants,
          priceNis: data.price,
          cover: data.imageUrl || 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
          publish: data.publish,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Event;
      });
      
      console.log(`📊 All published events:`, events.map(e => ({ title: e.title, slug: e.slug })));
      console.log(`🎯 Looking for slug: "${slug}"`);
      console.log(`🎯 Looking for decoded slug: "${decodedSlug}"`);
      console.log(`🔍 Available slugs:`, events.map(e => e.slug));

      const foundEvent = events.find(e => e.slug === decodedSlug);
      
      if (foundEvent) {
        console.log('✅ Found event:', foundEvent.title, 'ID:', foundEvent.id);
        setEvent(foundEvent);
      } else {
        console.log('❌ Event not found for slug:', slug);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingRegistration = async () => {
    if (!event || !currentUser) return;

    setCheckingRegistration(true);
    try {
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('eventId', '==', event.id),
        where('uid', '==', currentUser.uid)
      );
      
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const existingRegistrations = registrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      const activeRegistration = existingRegistrations.find((reg: any) => reg.status !== 'cancelled');
      const registered = !!activeRegistration;

      console.log('✅ Registration status:', registered ? 'REGISTERED' : 'NOT REGISTERED');
      setIsRegistered(registered);
      setUserRegistration(activeRegistration || null);
      
    } catch (error) {
      console.error('❌ Error checking registration:', error);
      setIsRegistered(false);
      setUserRegistration(null);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const loadRegistrationCount = async () => {
    if (!event) return;

    try {
      // Get all registrations for this event
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('eventId', '==', event.id)
      );
      
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const allRegistrations = registrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Count active registrations (not cancelled)
      const activeCount = allRegistrations.filter((reg: any) => reg.status !== 'cancelled').length;
      console.log('📊 Registration count for', event.title, ':', activeCount);
      setRegistrationCount(activeCount);
      
    } catch (error) {
      console.error('❌ Error loading registration count:', error);
    }
  };

  const handleRegistration = async () => {
    if (!event || !currentUser) {
      alert('יש להתחבר כדי להירשם לאירוע');
      return;
    }

    if (isRegistered) {
      alert('כבר נרשמת לאירוע זה! 😊');
      return;
    }

    // Re-check availability before registration
    await loadRegistrationCount();
    if (registrationCount >= event.capacity) {
      alert('מצטערים, האירוע מלא! 😔');
      return;
    }
    
    setRegistering(true);
    
    try {
      const registrationData = {
        eventId: event.id,
        uid: currentUser.uid,
        userName: userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || currentUser.email?.split('@')[0] : currentUser.email?.split('@')[0],
        userEmail: currentUser.email,
        userPhone: userProfile?.phone || '',
        registeredAt: new Date(),
        status: event.priceNis === 0 ? 'paid' : 'pending',
        paymentStatus: event.priceNis === 0 ? 'free' : 'pending',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'registrations'), registrationData);
      
      // Send registration confirmation email
      try {
        const emailResponse = await fetch('/api/send-registration-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: currentUser.email,
            userName: registrationData.userName,
            eventTitle: event.title,
            eventDate: event.startAt.toISOString(),
            eventLocation: event.locationName,
          }),
        });

        if (emailResponse.ok) {
          console.log('✅ Registration email sent successfully');
        } else {
          console.warn('⚠️ Registration email failed, but registration completed');
        }
      } catch (emailError) {
        console.error('❌ Error sending registration email:', emailError);
        // Don't fail the registration if email fails
      }
      
      // Immediately update UI
      setIsRegistered(true);
      setRegistrationCount(prev => prev + 1);
      
      alert(`🎉 נרשמת בהצלחה לאירוع "${event.title}"!\n\n${event.priceNis > 0 ? 'פרטי התשלום יישלחו אליך במייל.' : 'ההרשמה הושלמה בהצלחה.'}`);

      // Show WhatsApp groups if user has groups
      if (userProfile?.groups && userProfile.groups.length > 0) {
        setShowWhatsAppLinks(true);
      }

      // Verify with fresh data from server
      setTimeout(() => {
        checkExistingRegistration();
        loadRegistrationCount();
      }, 1000);

    } catch (error) {
      console.error('❌ Error registering for event:', error);
      alert('שגיאה בהרשמה לאירוע. נסה שוב מאוחר יותר.');
      // Revert optimistic updates
      setIsRegistered(false);
      setRegistrationCount(prev => Math.max(0, prev - 1));
    } finally {
      setRegistering(false);
    }
  };

  const handlePayNow = () => {
    if (!event || !userRegistration) return;
    
    // Navigate to payment page with event and registration data
    const paymentUrl = `/payment?eventId=${event.id}&registrationId=${userRegistration.id}`;
    router.push(paymentUrl);
  };

  const addToCalendar = () => {
    if (!event) return;
    const startDate = event.startAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const endDate = new Date(event.startAt.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.locationName)}`;
    window.open(calendarUrl, '_blank');
  };

  const openInWaze = () => {
    if (!event) return;
    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(event.locationName)}`;
    window.open(wazeUrl, '_blank');
  };

  const openInGoogleMaps = () => {
    if (!event) return;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.locationName)}`;
    window.open(mapsUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <div className="text-lg">טוען אירוע...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">האירוע לא נמצא</h1>
          <p className="text-gray-400 mb-6">האירוע שחיפשת אינו קיים או שהוסר מהאתר</p>
          <Link href="/events" className="btn">חזור לכל האירועים</Link>
        </div>
      </div>
    );
  }

  const availableSpots = Math.max(0, event.capacity - registrationCount);
  const isFull = availableSpots === 0;
  const isAlmostFull = availableSpots > 0 && availableSpots <= 3;
  const needsPayment = isRegistered && userRegistration && event.priceNis > 0 && userRegistration.paymentStatus === 'pending';

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="section-container py-4 border-b border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/events" className="hover:text-white transition-colors">אירועים</Link>
          <ArrowRight size={16} className="rotate-180" />
          <span className="text-white">{event.title}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative">
        <div className="aspect-[21/9] bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
          {event.cover && (
            <img src={event.cover} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0">
            <div className="section-container py-12">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl md:text-5xl font-bold">{event.title}</h1>
                {/* Status Badges */}
                {isFull && (
                  <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold">🚫 מלא</span>
                )}
                {isAlmostFull && !isFull && (
                  <span className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold">⚠️ {availableSpots} נותרו</span>
                )}
                {isRegistered && (
                  <span className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold">✅ רשום</span>
                )}
                {needsPayment && (
                  <span className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold">💳 ממתין לתשלום</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-6 text-lg">
                <div className="flex items-center gap-2 text-blue-300">
                  <Calendar size={20} />
                  <span>{formatEventDate(event.startAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-green-300">
                  <MapPin size={20} />
                  <span>{event.locationName}</span>
                </div>
                <div className="flex items-center gap-2 text-purple-300">
                  <DollarSign size={20} />
                  <span>{event.priceNis === 0 ? 'חינם' : `₪${event.priceNis}`}</span>
                </div>
                <div className="flex items-center gap-2 text-orange-300">
                  <Users size={20} />
                  <span>{registrationCount}/{event.capacity} נרשמו</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="section-container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="prose prose-invert max-w-none">
                <h2 className="text-2xl font-bold mb-6">פרטי האירוע</h2>
                <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                  {event.description}
                </div>
              </div>

              {/* Event Details Grid */}
              <div className="mt-12">
                <h3 className="text-xl font-bold mb-6">מידע נוסף</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="text-blue-400" size={24} />
                      <h4 className="font-semibold">תאריך ושעה</h4>
                    </div>
                    <p className="text-gray-300">{formatFullEventDate(event.startAt)}</p>
                  </div>

                  <div className="card">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="text-green-400" size={24} />
                      <h4 className="font-semibold">מיקום</h4>
                    </div>
                    <p className="text-gray-300 mb-3">{event.locationName}</p>
                    <div className="flex gap-2">
                      <button onClick={openInWaze} className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
                        <Navigation size={14} />Waze
                      </button>
                      <button onClick={openInGoogleMaps} className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors">
                        <MapPin size={14} />Google Maps
                      </button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="text-orange-400" size={24} />
                      <h4 className="font-semibold">זמינות</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-300">
                        <strong>{registrationCount}</strong> מתוך <strong>{event.capacity}</strong> נרשמו
                      </p>
                      {availableSpots > 0 ? (
                        <p className={`text-sm font-medium ${isAlmostFull ? 'text-yellow-400' : 'text-green-400'}`}>
                          ✅ {availableSpots} מקומות נותרו
                        </p>
                      ) : (
                        <p className="text-red-400 text-sm font-medium">🚫 האירוע מלא</p>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isFull ? 'bg-red-500' : 
                            isAlmostFull ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, (registrationCount / event.capacity) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center gap-3 mb-3">
                      <DollarSign className="text-purple-400" size={24} />
                      <h4 className="font-semibold">מחיר</h4>
                    </div>
                    <p className="text-gray-300">
                      {event.priceNis === 0 ? 'חינם!' : `₪${event.priceNis}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* What to Bring / Prepare */}
              <div className="mt-12">
                <h3 className="text-xl font-bold mb-6">הכנות לאירוע</h3>
                <div className="card">
                  <ul className="space-y-2 text-gray-300">
                    <li>• בגדי ספורט נוחים ונעלי ספורט</li>
                    <li>• בקבוק מים (מומלץ 1.5 ליטר)</li>
                    <li>• מגבת אישית</li>
                    <li>• אנרגיה חיובית ומוטיבציה</li>
                    <li>• הגעה 15 דקות לפני תחילת האירוע</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Registration Sidebar */}
            <div>
              <div className="card sticky top-6">
                <h3 className="text-xl font-bold mb-4">
                  {isRegistered ? 'רשום לאירוע ✅' : 'הרשמה לאירוע'}
                </h3>
                
                {/* WhatsApp Group Links */}
                {showWhatsAppLinks && userProfile?.groups && (
                  <div className="mb-4">
                    <WhatsAppGroupLinks
                      userGroups={userProfile.groups}
                      onClose={() => setShowWhatsAppLinks(false)}
                    />
                  </div>
                )}

                {/* Registration Status Messages */}
                {isRegistered && !needsPayment && (
                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-300 mb-2">
                      <CheckCircle size={20} />
                      <span className="font-semibold">כבר נרשמת!</span>
                    </div>
                    <p className="text-sm text-green-200">רשום בהצלחה לאירוע זה. פרטים נוספים נישלחו למייל.</p>
                    
                    {/* WhatsApp Group Links within registration status */}
                    {userProfile?.groups && userProfile.groups.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-500/20">
                        <WhatsAppGroupLinks
                          userGroups={userProfile.groups}
                          onClose={() => {}} // Don't allow closing in this context
                        />
                      </div>
                    )}
                  </div>
                )}

                {needsPayment && (
                  <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-orange-300 mb-2">
                      <CreditCard size={20} />
                      <span className="font-semibold">נדרש תשלום</span>
                    </div>
                    <p className="text-sm text-orange-200">ההרשמה התקבלה! יש לבצע תשלום כדי לאשר את המקום.</p>
                  </div>
                )}

                {isFull && !isRegistered && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-red-300 mb-2">
                      <AlertCircle size={20} />
                      <span className="font-semibold">האירוע מלא</span>
                    </div>
                    <p className="text-sm text-red-200">כל המקומות תפוסים. נסה להירשם לאירועים אחרים.</p>
                  </div>
                )}

                {isAlmostFull && !isRegistered && !isFull && (
                  <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-yellow-300 mb-2">
                      <AlertCircle size={20} />
                      <span className="font-semibold">מעט מקומות נותרו!</span>
                    </div>
                    <p className="text-sm text-yellow-200">רק {availableSpots} מקומות זמינים. הירשם מהר!</p>
                  </div>
                )}
                
                {/* Event Info */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">מחיר:</span>
                    <span className="text-xl font-bold text-green-400">
                      {event.priceNis === 0 ? 'חינם' : `₪${event.priceNis}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">מקומות זמינים:</span>
                    <span className={`font-semibold ${availableSpots <= 5 ? 'text-red-400' : 'text-white'}`}>
                      {availableSpots}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">נרשמו:</span>
                    <span className="font-semibold">{registrationCount}/{event.capacity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">תאריך:</span>
                    <span className="font-semibold">{formatShortDate(event.startAt)}</span>
                  </div>
                </div>

                {/* Payment Button */}
                {needsPayment && (
                  <button
                    onClick={handlePayNow}
                    className="btn w-full text-center mb-4 bg-orange-600 hover:bg-orange-700 border-orange-600"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CreditCard size={18} />
                      שלם עכשיו ₪{event.priceNis}
                    </div>
                  </button>
                )}

                {/* Registration Button */}
                {!isRegistered && (
                  <button
                    onClick={handleRegistration}
                    disabled={registering || isFull || !currentUser || checkingRegistration}
                    className={`btn w-full text-center mb-4 ${
                      isFull ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {!currentUser ? 'יש להתחבר' : 
                     checkingRegistration ? 'בודק סטטוס...' :
                     registering ? 'מעבד הרשמה...' : 
                     isFull ? 'האירוע מלא' : 
                     'הרשם עכשיו'}
                  </button>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button onClick={addToCalendar} className="btn-outline w-full flex items-center justify-center gap-2">
                    <Plus size={16} />הוסף ליומן
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={openInWaze} className="btn-outline flex items-center justify-center gap-2">
                      <Navigation size={16} />Waze
                    </button>
                    <button onClick={openInGoogleMaps} className="btn-outline flex items-center justify-center gap-2">
                      <MapPin size={16} />Maps
                    </button>
                  </div>
                </div>

                {/* Login Prompt */}
                {!currentUser && (
                  <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                    <p className="text-sm text-gray-400 mb-3">יש להתחבר כדי להירשם לאירוע</p>
                    <Link href="/login" className="btn-outline w-full">התחבר</Link>
                  </div>
                )}

                {/* Contact Info */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400 text-center">יש שאלות? צור קשר</p>
                  <div className="flex justify-center gap-4 mt-2">
                    <a href="tel:0501234567" className="text-blue-400 hover:text-blue-300">
                      <Phone size={18} />
                    </a>
                    <a href="mailto:info@example.com" className="text-blue-400 hover:text-blue-300">
                      <Mail size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Helper functions for date formatting
function formatEventDate(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

function formatFullEventDate(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short'
  });
}