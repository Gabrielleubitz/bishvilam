'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase.client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Event } from '@/types';
import { Shield, Users, Target, Award, Calendar } from 'lucide-react';
import { useMedia } from '@/hooks/useMedia';

export default function HomePage() {
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [pastEventsLoading, setPastEventsLoading] = useState(true);
  const { getHeroImage } = useMedia();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    loadRecentEvents();
    loadPastEvents();
    return () => unsubscribe();
  }, []);

  const loadRecentEvents = async () => {
    try {
      console.log('Loading recent events for homepage...');
      
      // Get active/published events only
      const eventsQuery = query(
        collection(db, 'events'),
        where('publish', '==', true),
        limit(3)
      );
      
      const eventsSnapshot = await getDocs(eventsQuery);
      console.log('Events found:', eventsSnapshot.docs.length);
      
      const eventsData = eventsSnapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('Event data:', data.title, data.date);
          
          return {
            id: doc.id,
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
            status: data.status || 'active',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          } as Event;
        })
        .filter(event => event.status === 'active'); // Only show active events in recent section
      
      // Sort by date manually (most recent first for now)
      eventsData.sort((a, b) => b.startAt.getTime() - a.startAt.getTime());
      
      console.log('Processed active events for homepage:', eventsData.length);
      setRecentEvents(eventsData);
    } catch (error) {
      console.error('Error loading recent events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadPastEvents = async () => {
    try {
      console.log('Loading past events for homepage...');
      
      // Get completed events - no group filtering for past events
      const eventsQuery = query(
        collection(db, 'events'),
        where('publish', '==', true),
        limit(6) // Show more past events
      );
      
      const eventsSnapshot = await getDocs(eventsQuery);
      console.log('All events found for past events check:', eventsSnapshot.docs.length);
      
      const pastEventsData = eventsSnapshot.docs
        .map(doc => {
          const data = doc.data();
          
          return {
            id: doc.id,
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
            status: data.status || 'active',
            groups: data.groups || ['ALL'],
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            completedAt: data.completedAt
          } as Event;
        })
        .filter(event => event.status === 'completed'); // Only completed events
      
      // Sort by completion date (most recent first)
      pastEventsData.sort((a, b) => {
        const aDate = a.completedAt ? new Date(a.completedAt.toDate ? a.completedAt.toDate() : a.completedAt) : new Date(a.createdAt);
        const bDate = b.completedAt ? new Date(b.completedAt.toDate ? b.completedAt.toDate() : b.completedAt) : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      });
      
      console.log('Processed completed events for homepage:', pastEventsData.length);
      setPastEvents(pastEventsData);
    } catch (error) {
      console.error('Error loading past events:', error);
    } finally {
      setPastEventsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Debug Info */}
      <div className="bg-gray-800/50 text-xs p-2 text-center">
        🏠 Homepage Debug: Loading: {eventsLoading ? 'Yes' : 'No'} | Active Events: {recentEvents.length} | Past Events: {pastEvents.length}
      </div>
      
      {/* Hero Section */}
      <section className="relative py-20 bg-cover bg-center bg-no-repeat" style={{backgroundImage: `url(${getHeroImage()})`}}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="section-container text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            כושר קרבי
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-gray-200">הכנה לצה״ל בגוש עציון, נס הרים והסביבה!</p>
          <p className="text-lg mb-2 text-gray-300 max-w-2xl mx-auto">
            כושר קרבי, אימונים אישיים, ערכים של לוחם, פיתוח יכולות, וחוסן מנטלי לזכר:
          </p>
          <p className="text-lg font-bold mb-8 text-gray-300 max-w-2xl mx-auto">
            • דותן שמעון ז&quot;ל • נטע כהנא ז&quot;ל • נווה לשם ז&quot;ל
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events" className="btn text-lg px-8 py-4">
              צפייה באירועים
            </Link>
            <Link href="/about" className="btn-outline text-lg px-8 py-4">
              למידע נוסף
            </Link>
            <Link href="/lizchram" className="btn-outline border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black text-lg px-8 py-4">
              לזכרם
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-900/50">
        <div className="section-container">
          <h2 className="text-3xl font-bold text-center mb-12">מה אנחנו מציעים</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-brand-green" size={32} />
              </div>
              <h3 className="font-semibold mb-2">בטיחות מלאה</h3>
              <p className="text-gray-400 text-sm">אימון מקצועי תחת השגחת מדריכים מוסמכים</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-brand-green" size={32} />
              </div>
              <h3 className="font-semibold mb-2">עבודת צוות</h3>
              <p className="text-gray-400 text-sm">פיתוח מיומנויות חברתיות ועבודה בקבוצה</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="text-brand-green" size={32} />
              </div>
              <h3 className="font-semibold mb-2">הכנה ממוקדת</h3>
              <p className="text-gray-400 text-sm">תכנית אימון המותאמת לדרישות הצבא</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-brand-green" size={32} />
              </div>
              <h3 className="font-semibold mb-2">מדריכים מנוסים</h3>
              <p className="text-gray-400 text-sm">לוחמי עבר עם ניסיון עשיר בהדרכה</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Events */}
      <section className="py-16">
        <div className="section-container">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">אירועים אחרונים</h2>
            <Link href="/events" className="btn-outline">
              כל האירועים
            </Link>
          </div>
          
          {eventsLoading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-400">טוען אירועים...</div>
            </div>
          ) : recentEvents.length > 0 ? (
            <>
              <div className="text-center mb-8 text-gray-400 text-sm">
                מציג {recentEvents.length} אירועים מתוך האירועים הפורסמו
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentEvents.map((event) => (
                  <div key={event.id} className="card group hover:scale-105 transition-transform duration-300">
                    <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
                      <img 
                        src={event.cover} 
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    <h3 className="text-xl font-bold mb-2 group-hover:text-brand-green transition-colors">
                      {event.title}
                    </h3>
                    
                    <p className="text-gray-400 mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar size={16} />
                        <span>{event.startAt.toLocaleDateString('he-IL', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Users size={16} />
                        <span>{event.locationName}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          {event.capacity} מקומות
                        </span>
                        <span className="text-brand-green font-bold">
                          {event.priceNis === 0 ? 'חינם' : `₪${event.priceNis}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link 
                        href={`/events/${encodeURIComponent(event.slug)}`}
                        className="btn flex-1 text-center"
                      >
                        פרטים והרשמה
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-300">אין אירועים פורסמו עדיין</h3>
              <p className="text-gray-400 mb-6">אירועים חדשים יתפרסמו בקרוב</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Debug: Loading = {eventsLoading ? 'true' : 'false'}</p>
                <p>Debug: Events found = {recentEvents.length}</p>
              </div>
              <Link href="/events" className="btn-outline mt-4">
                עיין בכל האירועים
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      <section className="py-16 bg-gray-900/50">
        <div className="section-container">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold">אירועי עבר</h2>
              <p className="text-gray-400 mt-2">אירועים שהושלמו בהצלחה - פתוח לכולם</p>
            </div>
            <Link href="/events" className="btn-outline">
              כל האירועים
            </Link>
          </div>
          
          {pastEventsLoading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-400">טוען אירועי עבר...</div>
            </div>
          ) : pastEvents.length > 0 ? (
            <>
              <div className="text-center mb-8 text-gray-400 text-sm">
                מציג {pastEvents.length} אירועים שהושלמו - ללא הגבלות קבוצה
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pastEvents.map((event) => (
                  <div key={event.id} className="card group hover:scale-105 transition-transform duration-300 border border-blue-500/20">
                    <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
                      <img 
                        src={event.cover} 
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-90"
                      />
                      {/* Completed Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium">
                          ✅ הושלם
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                      {event.title}
                    </h3>
                    
                    <p className="text-gray-400 mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar size={16} />
                        <span>{event.startAt.toLocaleDateString('he-IL', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Users size={16} />
                        <span>{event.locationName}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          {event.capacity} מקומות
                        </span>
                        <span className="text-blue-400 font-bold">
                          {event.priceNis === 0 ? 'חינם' : `₪${event.priceNis}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link 
                        href={`/events/${encodeURIComponent(event.slug)}`}
                        className="btn-outline border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black flex-1 text-center"
                      >
                        צפה בפרטים
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-300">אין אירועי עבר עדיין</h3>
              <p className="text-gray-400 mb-6">אירועים שיושלמו יופיעו כאן</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Debug: Past Events Loading = {pastEventsLoading ? 'true' : 'false'}</p>
                <p>Debug: Past Events found = {pastEvents.length}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-900/50">
        <div className="section-container">
          <h2 className="text-3xl font-bold text-center mb-12">למה לבחור בנו</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>מדריכים מקצועיים עם ניסיון בצה״ל ויחידות מובחרות</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>תכנית אימון מותאמת אישית לכל משתתף</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>דגש על בטיחות ומניעת פציעות</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>סיוע בהכנה נפשית ומנטלית לשירות הצבא</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>מיקום נוח בלב גוש עציון</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">תנאי השתתפות</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• גיל: 16+</li>
                <li>• חתימת הורה נדרשת</li>
                <li>• הצהרת בריאות</li>
                <li>• ביטוח תקף</li>
                <li>• ציוד אישי בסיסי</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-black border-t border-brand-green/20 py-8">
        <div className="section-container text-center text-gray-400">
          <p>&copy; 2025 בשבילם. כל הזכויות שמורות.</p>
          <p className="mt-2">גוש עציון | טל: 050-297-3229 | דוא״ל: info@bishvilam.com</p>
        </div>
      </footer>

      {/* WhatsApp Float */}
      <WhatsAppFloat message="שלום! אני מעוניין לקבל מידע נוסף על אימוני הכושר הקרבי" />
    </div>
  );
}