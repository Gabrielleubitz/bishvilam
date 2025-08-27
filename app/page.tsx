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
import { Shield, Users, Target, Award, Calendar, Phone, Mail, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react';
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
      
      
    {/* Hero Section */}
<section className="relative py-20 bg-cover bg-center bg-no-repeat" style={{backgroundImage: `url(${getHeroImage()})`}}>
  <div className="absolute inset-0 bg-black/60"></div>
  <div className="section-container text-center relative z-10">
    <h1 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-wider" 
        style={{textShadow: '3px 3px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000'}}>
      כושר קרבי
    </h1>
    
    <p className="text-xl md:text-2xl mb-4 text-gray-200 font-bold uppercase tracking-wide">
      הכנה לצה״ל בגוש עציון, נס הרים והסביבה!
    </p>
    
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
      <footer className="bg-gray-900 border-t border-brand-green/30">
        <div className="section-container py-12">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            
  
            {/* Brand Section */}
<div className="lg:col-span-1">
  <div className="flex justify-center lg:justify-start mb-4">
    <img 
      src="https://ik.imagekit.io/cjenfmnqf/Screenshot%202025-08-24%20at%201.14.27.png"
      alt="בשבילם לוגו"
      className="w-32 h-32 object-contain"
    />
  </div>
              
              {/* Social Media */}
              <div className="flex gap-3 justify-center lg:justify-start">
                <a 
                  href="https://www.instagram.com/bishvilam_kosher_kravi/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors group"
                  title="Instagram"
                >
                  <Instagram size={20} className="text-gray-400 group-hover:text-white" />
                </a>
                <a 
                  href="https://wa.me/972502973229" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors group"
                  title="WhatsApp"
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    className="text-gray-400 group-hover:text-white"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                  </svg>
                </a>
                <a 
                  href="https://facebook.com/bishvilam" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors group"
                  title="Facebook"
                >
                  <Facebook size={20} className="text-gray-400 group-hover:text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">קישורים מהירים</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/events" className="text-gray-400 hover:text-brand-green transition-colors text-sm flex items-center gap-2">
                    <Calendar size={16} />
                    אירועים והכשרות
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-brand-green transition-colors text-sm flex items-center gap-2">
                    <Users size={16} />
                    אודותינו
                  </Link>
                </li>
                <li>
                  <Link href="/lizchram" className="text-gray-400 hover:text-yellow-400 transition-colors text-sm flex items-center gap-2">
                    <Award size={16} />
                    לזכרם
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-gray-400 hover:text-brand-green transition-colors text-sm flex items-center gap-2">
                    <Users size={16} />
                    התחברות
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-semibold mb-4">צור קשר</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="tel:+972502973229" 
                    className="text-gray-400 hover:text-brand-green transition-colors text-sm flex items-center gap-3"
                  >
                    <Phone size={16} />
                    050-297-3229
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:bishvilamdnn@gmail.com" 
                    className="text-gray-400 hover:text-brand-green transition-colors text-sm flex items-center gap-3"
                  >
                    <Mail size={16} />
                    info@bishvilam.com
                  </a>
                </li>
                <li>
                  <div className="text-gray-400 text-sm flex items-center gap-3">
                    <MapPin size={16} />
                    גוש עציון ונס הרים
                  </div>
                </li>
                <li className="pt-2">
                  <a 
                    href="https://wa.me/972502973229?text=שלום! אני מעוניין לקבל מידע נוסף על האימונים" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    title="צור קשר בווטסאפ"
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      className="text-white"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                    </svg>
                  </a>
                </li>
              </ul>
            </div>

            {/* Training Info */}
            <div>
              <h4 className="text-white font-semibold mb-4">מה אנחנו מציעים</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Shield size={14} className="text-brand-green flex-shrink-0" />
                  כושר קרבי מתקדם
                </li>
                <li className="flex items-center gap-2">
                  <Target size={14} className="text-brand-green flex-shrink-0" />
                  הכנה לצה״ל
                </li>
                <li className="flex items-center gap-2">
                  <Users size={14} className="text-brand-green flex-shrink-0" />
                  אימונים אישיים וקבוצתיים
                </li>
                <li className="flex items-center gap-2">
                  <Award size={14} className="text-brand-green flex-shrink-0" />
                  חוסן מנטלי ופיזי
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <h5 className="text-white text-sm font-medium mb-2">זכרון לוחמים</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  דותן שמעון ז״ל • נטע כהנא ז״ל • נווה לשם ז״ל
                </p>
              </div>
            </div>

          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm">
                <p>&copy; 2025 בשבילם - מרכז הכשרה לצה״ל. כל הזכויות שמורות.</p>
              </div>
              <div className="flex items-center gap-6 text-xs text-gray-500">
                <Link href="/privacy" className="hover:text-gray-400 transition-colors">
                  מדיניות פרטיות
                </Link>
                <Link href="/terms" className="hover:text-gray-400 transition-colors">
                  תנאי שימוש
                </Link>
                <span> עוצב ופותח בישראל על ידי גבריאל לוביץ 🇮🇱</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float */}
      <WhatsAppFloat message=".שלום! אני מעוניין לקבל מידע נוסף על אימוני הכושר הקרבי" />
    </div>
  );
}