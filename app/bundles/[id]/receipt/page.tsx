'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase.client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import WhatsAppGroupLinks from '@/components/WhatsAppGroupLinks';
import { Bundle, BundleRegistration, Event } from '@/types';
import { 
  Package, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  CheckCircle, 
  ArrowRight,
  AlertCircle,
  Gift,
  Download,
  Mail,
  X,
  RefreshCcw,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface BundleReceiptData {
  bundle: Bundle;
  registration: BundleRegistration;
  registeredEvents: Event[];
  skippedEvents: Event[];
  replacedEvents: { original: Event; replacement: Event }[];
}

// Helper function to safely format dates
const formatDate = (date: any): string => {
  try {
    if (!date) return 'תאריך לא זמין';
    
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Handle Firestore Timestamp seconds/nanoseconds object
    else if (date && typeof date.seconds === 'number') {
      dateObj = new Date(date.seconds * 1000);
    }
    // Handle string dates
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Handle timestamp numbers
    else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    else {
      console.warn('Unknown date format:', date);
      return 'תאריך לא זמין';
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date created from:', date);
      return 'תאריך לא תקין';
    }
    
    return dateObj.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'for value:', date);
    return 'שגיאה בתאריך';
  }
};

const formatDateTime = (date: any): string => {
  try {
    if (!date) return 'תאריך לא זמין';
    
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Handle Firestore Timestamp seconds/nanoseconds object
    else if (date && typeof date.seconds === 'number') {
      dateObj = new Date(date.seconds * 1000);
    }
    // Handle string dates
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Handle timestamp numbers
    else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    else {
      console.warn('Unknown date format:', date);
      return 'תאריך לא זמין';
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date created from:', date);
      return 'תאריך לא תקין';
    }
    
    return dateObj.toLocaleString('he-IL');
  } catch (error) {
    console.error('Error formatting datetime:', error, 'for value:', date);
    return 'שגיאה בתאריך';
  }
};

const formatTime = (date: any): string => {
  try {
    if (!date) return 'שעה לא זמינה';
    
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Handle Firestore Timestamp seconds/nanoseconds object
    else if (date && typeof date.seconds === 'number') {
      dateObj = new Date(date.seconds * 1000);
    }
    // Handle string dates
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Handle timestamp numbers
    else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    else {
      return 'שעה לא זמינה';
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'שעה לא תקינה';
    }
    
    return dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return 'שגיאה בשעה';
  }
};

export default function BundleReceiptPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bundleId = params?.id as string;
  const registrationId = searchParams?.get('registrationId');
  
  const [receiptData, setReceiptData] = useState<BundleReceiptData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showWhatsAppLinks, setShowWhatsAppLinks] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && bundleId && registrationId) {
        loadReceiptData();
      } else if (!user) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [bundleId, registrationId]);

  const loadReceiptData = async () => {
    if (!bundleId || !registrationId) {
      router.push('/bundles');
      return;
    }

    try {
      setLoading(true);

      // Load bundle registration
      const registrationDoc = await getDoc(doc(db, 'bundleRegistrations', registrationId));
      if (!registrationDoc.exists()) {
        alert('רשומת רכישה לא נמצאה');
        router.push('/bundles');
        return;
      }

      const registrationData = { id: registrationDoc.id, ...registrationDoc.data() } as BundleRegistration;

      // Verify ownership
      if (currentUser && registrationData.uid !== currentUser.uid) {
        alert('אין לך הרשאה לצפות ברשומה זו');
        router.push('/bundles');
        return;
      }

      // Load bundle
      const bundleDoc = await getDoc(doc(db, 'bundles', bundleId));
      if (!bundleDoc.exists()) {
        alert('חבילה לא נמצאה');
        router.push('/bundles');
        return;
      }

      const bundleData = { id: bundleDoc.id, ...bundleDoc.data() } as Bundle;

      // Load user profile for WhatsApp groups
      if (currentUser) {
        try {
          const userProfileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
          if (userProfileDoc.exists()) {
            setUserProfile({ id: userProfileDoc.id, ...userProfileDoc.data() });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }

      // Load all relevant events
      const allEventIds = [
        ...bundleData.eventIds,
        ...(bundleData.replacementEventIds || []),
        ...registrationData.eventRegistrations.map(er => er.eventId),
        ...(registrationData.skippedEvents?.map(se => se.originalEventId) || [])
      ];

      const uniqueEventIds = Array.from(new Set(allEventIds));
      const eventPromises = uniqueEventIds.map(eventId => getDoc(doc(db, 'events', eventId)));
      const eventDocs = await Promise.all(eventPromises);
      
      const allEvents = eventDocs
        .filter(doc => doc.exists())
        .map(doc => ({ id: doc.id, ...doc.data() } as Event));

      // Categorize events
      const registeredEvents: Event[] = [];
      const replacedEvents: { original: Event; replacement: Event }[] = [];
      const skippedEvents: Event[] = [];

      // Process event registrations
      for (const eventReg of registrationData.eventRegistrations) {
        const event = allEvents.find(e => e.id === eventReg.eventId);
        if (!event) continue;

        if (eventReg.status === 'replaced' && eventReg.replacementEventId) {
          const originalEvent = allEvents.find(e => bundleData.eventIds.includes(e.id));
          if (originalEvent) {
            replacedEvents.push({ original: originalEvent, replacement: event });
          }
        } else {
          registeredEvents.push(event);
        }
      }

      // Process skipped events
      if (registrationData.skippedEvents) {
        for (const skippedEventInfo of registrationData.skippedEvents) {
          const event = allEvents.find(e => e.id === skippedEventInfo.originalEventId);
          if (event) {
            skippedEvents.push(event);
          }
        }
      }

      setReceiptData({
        bundle: bundleData,
        registration: registrationData,
        registeredEvents,
        skippedEvents,
        replacedEvents
      });

    } catch (error) {
      console.error('Error loading receipt data:', error);
      alert('שגיאה בטעינת נתוני הקבלה');
      router.push('/bundles');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (!receiptData) return;

    const { bundle, registration, registeredEvents, skippedEvents, replacedEvents } = receiptData;
    
    const receiptContent = [
      `קבלה לרכישת חבילת אירועים`,
      `תאריך רכישה: ${formatDate(registration.createdAt)}`,
      `מספר הזמנה: ${registration.id}`,
      ``,
      `פרטי החבילה:`,
      `שם החבילה: ${bundle.title}`,
      `תיאור: ${bundle.description}`,
      `מחיר: ₪${bundle.priceNis}`,
      ``,
      `אירועים שנרשמת אליהם:`,
      ...registeredEvents.map(event => 
        `• ${event.title} - ${formatDate((event as any).date || (event as any).startAt)} - ${event.locationName}`
      ),
      ``,
      ...(replacedEvents.length > 0 ? [
        `אירועים שהוחלפו:`,
        ...replacedEvents.map(({ original, replacement }) => 
          `• ${original.title} → ${replacement.title} (החלפה אוטומטית)`
        ),
        ``
      ] : []),
      ...(skippedEvents.length > 0 ? [
        `אירועים שדולגו (ללא תשלום נוסף):`,
        ...skippedEvents.map(event => `• ${event.title} - לא זמין`),
        ``
      ] : []),
      `סטטוס תשלום: ${registration.paymentStatus === 'paid' ? 'שולם' : 'ממתין לתשלום'}`,
      registration.paymentDate ? `תאריך תשלום: ${formatDate(registration.paymentDate)}` : '',
      ``,
      `תודה על רכישתך!`
    ].filter(line => line !== '').join('\n');

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bundle-receipt-${registration.id}.txt`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <div className="text-lg">טוען נתוני הקבלה...</div>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">קבלה לא נמצאה</h1>
          <p className="text-gray-400 mb-6">לא ניתן למצוא את נתוני הקבלה</p>
          <Link href="/bundles" className="btn">חזור לחבילות</Link>
        </div>
      </div>
    );
  }

  const { bundle, registration, registeredEvents, skippedEvents, replacedEvents } = receiptData;
  const totalActiveEvents = registeredEvents.length + replacedEvents.length;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="section-container py-4 border-b border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/bundles" className="hover:text-white transition-colors">חבילות</Link>
          <ArrowRight size={16} className="rotate-180" />
          <Link href={`/bundles/${bundleId}/checkout`} className="hover:text-white transition-colors">{bundle.title}</Link>
          <ArrowRight size={16} className="rotate-180" />
          <span className="text-white">קבלה</span>
        </div>
      </div>

      {/* Success Header */}
      <section className="py-12 border-b border-gray-700">
        <div className="section-container text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-6">
            <CheckCircle size={32} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4">רכישה הושלמה בהצלחה! 🎉</h1>
          <p className="text-xl text-gray-400 mb-6">
            נרשמת לחבילת &ldquo;{bundle.title}&rdquo; בהצלחה
          </p>
          
          <div className="inline-flex items-center gap-6 bg-gray-800/50 rounded-lg px-6 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{totalActiveEvents}</div>
              <div className="text-sm text-gray-400">אירועים פעילים</div>
            </div>
            {skippedEvents.length > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{skippedEvents.length}</div>
                <div className="text-sm text-gray-400">אירועים דולגו</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">₪{bundle.priceNis}</div>
              <div className="text-sm text-gray-400">מחיר קבוע</div>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Groups */}
      {userProfile?.groups && showWhatsAppLinks && (
        <section className="py-6 border-b border-gray-700">
          <div className="section-container max-w-4xl">
            <WhatsAppGroupLinks
              userGroups={userProfile.groups}
              onClose={() => setShowWhatsAppLinks(false)}
            />
          </div>
        </section>
      )}

      {/* Receipt Details */}
      <section className="py-12">
        <div className="section-container max-w-4xl">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Main Receipt */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Purchase Summary */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">קבלת רכישה</h2>
                  <div className="text-sm text-gray-400">
                    מספר הזמנה: {registration.id}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">תאריך רכישה:</span>
                      <div className="font-medium">
                        {formatDateTime(registration.createdAt)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">סטטוס תשלום:</span>
                      <div className={`font-medium ${registration.paymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {registration.paymentStatus === 'paid' ? 'שולם' : 'ממתין לתשלום'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">חבילה:</span>
                      <div className="font-medium">{bundle.title}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">מחיר סופי:</span>
                      <div className="font-medium text-purple-400">₪{bundle.priceNis}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              {registration.paymentStatus === 'pending' && (
                <div className="card bg-orange-900/20 border border-orange-500/30">
                  <div className="flex items-center gap-2 text-orange-300 mb-4">
                    <CreditCard size={20} />
                    <span className="font-semibold text-lg">נדרש תשלום ₪{bundle.priceNis}</span>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-white mb-3">🏧 פרטי תשלום:</h4>
                    
                    <div className="space-y-3 text-sm">
                      {/* Bank Transfer */}
                      <div className="border-b border-gray-600 pb-3">
                        <div className="font-medium text-blue-300 mb-2">💳 העברה בנקאית</div>
                        <div className="text-gray-300 space-y-1">
                          <div><strong>בנק דיסקונט</strong></div>
                          <div><strong>סניף:</strong> 535</div>
                          <div><strong>מספר חשבון:</strong> 250445184</div>
                        </div>
                      </div>
                      
                      {/* Digital Payment */}
                      <div>
                        <div className="font-medium text-green-300 mb-2">📱 תשלום דיגיטלי</div>
                        <div className="text-gray-300 space-y-1">
                          <div><strong>ביט:</strong> 0542289567</div>
                          <div><strong>פייבוקס:</strong> 0542289567</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-200">
                        <p className="font-medium mb-2">חשוב לאחר התשלום:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• שלח צילום מסך של התשלום למייל: <strong>bishvilamdnn@gmail.com</strong></li>
                          <li>• ציין במייל את שם החבילה ומספר ההזמנה: <strong>{registration.id}</strong></li>
                          <li>• לחילופין, שלח לוואטסאפ 0542289567</li>
                          <li>• אישור התשלום יתקבל תוך 24 שעות</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Registered Events */}
              {registeredEvents.length > 0 && (
                <div className="card">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={20} />
                    אירועים שנרשמת אליהם ({registeredEvents.length})
                  </h3>
                  <div className="space-y-3">
                    {registeredEvents.map((event) => (
                      event.slug ? (
                        <Link
                          key={event.id}
                          href={`/events/${encodeURIComponent(event.slug)}`}
                          className="block bg-green-900/20 border border-green-500/30 rounded-lg p-4 hover:bg-green-800/20 transition-colors group"
                        >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold group-hover:text-green-300 transition-colors">
                            {event.title}
                          </h4>
                          <span className="text-green-400 text-sm">✅ רשום</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate((event as any).date || (event as any).startAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formatTime((event as any).date || (event as any).startAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{event.locationName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{event.capacity} מקומות</span>
                          </div>
                        </div>
                          <div className="text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            לחץ לצפייה בפרטי האירוע ←
                          </div>
                        </Link>
                      ) : (
                        <div key={event.id} className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{event.title}</h4>
                            <span className="text-green-400 text-sm">✅ רשום</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{formatDate((event as any).date || (event as any).startAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{formatTime((event as any).date || (event as any).startAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span>{event.locationName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users size={14} />
                              <span>{event.capacity} מקומות</span>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Replaced Events */}
              {replacedEvents.length > 0 && (
                <div className="card">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <RefreshCcw className="text-blue-400" size={20} />
                    אירועים שהוחלפו ({replacedEvents.length})
                  </h3>
                  <div className="space-y-3">
                    {replacedEvents.map(({ original, replacement }, index) => (
                      replacement.slug ? (
                        <Link
                          key={index}
                          href={`/events/${encodeURIComponent(replacement.slug)}`}
                          className="block bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 hover:bg-blue-800/20 transition-colors group"
                        >
                        <div className="mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                            <X size={14} className="text-red-400" />
                            <span className="line-through">{original.title}</span>
                            <span className="text-red-400">(לא זמין)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight size={14} className="text-blue-400 rotate-180" />
                            <span className="font-semibold text-blue-300 group-hover:text-blue-200 transition-colors">
                              {replacement.title}
                            </span>
                            <span className="text-blue-400 text-sm">✅ החלפה אוטומטית</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate((replacement as any).date || (replacement as any).startAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formatTime((replacement as any).date || (replacement as any).startAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{replacement.locationName}</span>
                          </div>
                        </div>
                          <div className="text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            לחץ לצפייה בפרטי האירוע החדש ←
                          </div>
                        </Link>
                      ) : (
                        <div key={index} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                          <div className="mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                              <X size={14} className="text-red-400" />
                              <span className="line-through">{original.title}</span>
                              <span className="text-red-400">(לא זמין)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ArrowRight size={14} className="text-blue-400 rotate-180" />
                              <span className="font-semibold text-blue-300">{replacement.title}</span>
                              <span className="text-blue-400 text-sm">✅ החלפה אוטומטית</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{formatDate((replacement as any).date || (replacement as any).startAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{formatTime((replacement as any).date || (replacement as any).startAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span>{replacement.locationName}</span>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped Events */}
              {skippedEvents.length > 0 && (
                <div className="card">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertCircle className="text-yellow-400" size={20} />
                    אירועים שדולגו ({skippedEvents.length})
                  </h3>
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <p className="text-yellow-300 text-sm">
                      האירועים הבאים לא היו זמינים ולא נמצאו אירועי חלופה. 
                      <strong> לא חויבת עליהם</strong> והמחיר נשאר קבוע.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {skippedEvents.map((event) => (
                      <div key={event.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 opacity-60">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-300">{event.title}</h4>
                          <span className="text-yellow-400 text-sm">⏭️ דולג</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate((event as any).date || (event as any).startAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{event.locationName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} />
                            <span className="line-through">₪{event.priceNis}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-yellow-400">
                          סיבה: {
                            registration.skippedEvents?.find(se => se.originalEventId === event.id)?.reason === 'completed' ? 'האירוע הסתיים' :
                            registration.skippedEvents?.find(se => se.originalEventId === event.id)?.reason === 'cancelled' ? 'האירוע בוטל' :
                            registration.skippedEvents?.find(se => se.originalEventId === event.id)?.reason === 'full' ? 'האירוע מלא' :
                            'אין אירוע חלופה זמין'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="card sticky top-6">
                <h3 className="text-lg font-bold mb-4">פעולות נוספות</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={downloadReceipt}
                    className="w-full btn-outline flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    הורד קבלה
                  </button>
                  
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`קבלה לרכישת ${bundle.title}`)}&body=${encodeURIComponent(`הי,\n\nמצורפת קבלה לרכישת חבילת האירועים "${bundle.title}".\n\nמספר הזמנה: ${registration.id}\nמחיר: ₪${bundle.priceNis}\n\nבברכה`)}`}
                    className="w-full btn-outline flex items-center justify-center gap-2"
                  >
                    <Mail size={16} />
                    שלח במייל
                  </a>
                  
                  <Link href="/events" className="w-full btn flex items-center justify-center gap-2">
                    <Calendar size={16} />
                    צפה באירועים
                  </Link>
                </div>

                {/* Spam Folder Warning */}
                <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-300 mb-1">📧 בדוק את תיבת הספאם!</p>
                      <p className="text-yellow-200 text-xs">
                        מיילי אישור לפעמים מגיעים לתיבת הספאם. חפש מיילים מ-bishvilamdnn@gmail.com
                      </p>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="font-semibold mb-2 text-sm">חשוב לזכור:</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• תקבל אישור במייל לכל אירוע בנפרד</li>
                    <li>• ניתן לראות את כל האירועים בעמוד האירועים</li>
                    <li>• המחיר קבוע גם אם אירועים דולגו</li>
                    <li>• פרטי קשר יישלחו לפני כל אירוע</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}