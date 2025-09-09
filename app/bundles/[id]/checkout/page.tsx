'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase.client';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Bundle, Event } from '@/types';
import { 
  Package, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  CreditCard, 
  Shield, 
  Lock, 
  CheckCircle, 
  ArrowRight,
  AlertCircle,
  Gift,
  Clock,
  X
} from 'lucide-react';
import Link from 'next/link';

interface BundleWithEvents extends Bundle {
  events: Event[];
  originalPrice: number;
  savings: number;
}

interface CheckoutForm {
  pickup: string;
  medical: string;
  notes: string;
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

export default function BundleCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bundleId = params?.id as string;
  
  const [bundle, setBundle] = useState<BundleWithEvents | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    pickup: '',
    medical: '',
    notes: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 Auth state changed:', !!user, 'bundleId:', bundleId);
      setCurrentUser(user);
      if (user && bundleId) {
        loadBundle();
      } else if (!user) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [bundleId]);

  // Separate effect to check registration status when user and bundle are both loaded
  useEffect(() => {
    if (currentUser && bundle && bundleId) {
      checkRegistrationStatus();
    }
  }, [currentUser, bundle, bundleId]);

  const checkRegistrationStatus = async () => {
    console.log('🔍 Checking for existing bundle registration for user:', currentUser?.uid, 'bundle:', bundleId);
    
    try {
      // First test if we can access the collection at all
      console.log('🧪 Testing collection access...');
      const testQuery = query(collection(db, 'bundleRegistrations'), where('uid', '==', currentUser!.uid));
      const testSnapshot = await getDocs(testQuery);
      console.log('🧪 Collection test - found', testSnapshot.size, 'total registrations for user');
      
      const existingRegistrationQuery = query(
        collection(db, 'bundleRegistrations'),
        where('bundleId', '==', bundleId),
        where('uid', '==', currentUser!.uid),
        where('status', 'in', ['pending', 'paid'])
      );
      
      console.log('📋 Executing Firestore query...');
      const existingRegistrationSnapshot = await getDocs(existingRegistrationQuery);
      
      console.log('📊 Found', existingRegistrationSnapshot.size, 'existing registrations');
      existingRegistrationSnapshot.docs.forEach((doc, index) => {
        console.log(`📄 Registration ${index + 1}:`, doc.id, doc.data());
      });
      
      if (!existingRegistrationSnapshot.empty) {
        // User is already registered - show their registration details instead
        const registrationData = existingRegistrationSnapshot.docs[0].data();
        console.log('✅ User is already registered, registration data:', registrationData);
        setIsAlreadyRegistered(true);
        setExistingRegistration({
          id: existingRegistrationSnapshot.docs[0].id,
          ...registrationData
        });
      } else {
        console.log('ℹ️ User is not yet registered for this bundle');
        setIsAlreadyRegistered(false);
        setExistingRegistration(null);
      }
    } catch (queryError) {
      console.error('❌ Error querying bundle registrations:', queryError);
      setIsAlreadyRegistered(false);
      setExistingRegistration(null);
    }
  };

  const loadBundle = async () => {
    if (!bundleId) {
      router.push('/bundles');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading bundle data for ID:', bundleId, 'with user:', currentUser?.uid);

      // Load bundle
      console.log('📦 Loading bundle document...');
      const bundleDoc = await getDoc(doc(db, 'bundles', bundleId));
      if (!bundleDoc.exists()) {
        console.log('❌ Bundle document not found');
        alert('חבילה לא נמצאה');
        router.push('/bundles');
        return;
      }

      const bundleData = { id: bundleDoc.id, ...bundleDoc.data() } as Bundle;
      console.log('✅ Bundle loaded:', bundleData.title, 'Status:', bundleData.status, 'Published:', bundleData.publish);

      // Check if bundle is available
      if (!bundleData.publish || (bundleData.status && bundleData.status !== 'active')) {
        console.log('❌ Bundle not available for purchase');
        alert('חבילה זו אינה זמינה לרכישה');
        router.push('/bundles');
        return;
      }

      // Check if bundle has expired
      if (bundleData.validUntil) {
        try {
          const expiryDate = bundleData.validUntil.toDate ? bundleData.validUntil.toDate() : new Date(bundleData.validUntil);
          if (expiryDate < new Date()) {
            console.log('❌ Bundle has expired');
            alert('תוקף החבילה פג');
            router.push('/bundles');
            return;
          }
        } catch (error) {
          console.warn('⚠️ Could not parse bundle expiry date:', bundleData.validUntil);
        }
      }

      console.log('✅ Bundle is available for purchase, registration check will run separately');

      // Load all events
      console.log('📅 Loading events...');
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const allEvents = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      console.log('📅 Loaded', allEvents.length, 'total events');

      // Get events for this bundle
      console.log('🔗 Bundle event IDs:', bundleData.eventIds);
      const bundleEvents = allEvents.filter(event => 
        bundleData.eventIds.includes(event.id)
      );
      console.log('📋 Found', bundleEvents.length, 'events for this bundle');

      if (bundleEvents.length === 0) {
        console.log('❌ No events found for bundle');
        alert('לא נמצאו אירועים בחבילה זו');
        router.push('/bundles');
        return;
      }

      // Calculate pricing
      const originalPrice = bundleEvents.reduce((sum, event) => sum + event.priceNis, 0);
      const savings = originalPrice - bundleData.priceNis;

      console.log('💾 Setting bundle state...');
      setBundle({
        ...bundleData,
        events: bundleEvents,
        originalPrice,
        savings
      });

      console.log('✅ Bundle loading completed successfully');

    } catch (error) {
      console.error('❌ Error loading bundle:', error);
      alert('שגיאה בטעינת נתוני החבילה');
      router.push('/bundles');
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  const processPurchase = async () => {
    if (!bundle || !currentUser) return;

    setProcessing(true);

    try {
      console.log('🔑 Getting ID token...');
      const idToken = await currentUser.getIdToken();
      
      const requestBody = {
        token: idToken,
        bundleId: bundle.id,
        registrationData: checkoutForm
      };
      
      console.log('📤 Making bundle registration request:', {
        bundleId: bundle.id,
        registrationData: checkoutForm,
        tokenExists: !!idToken
      });
      
      const response = await fetch('/api/bundles/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'שגיאה ברכישת החבילה');
      }

      // Show success message with details
      const successMessage = result.message || `נרשמת בהצלחה לחבילת "${bundle.title}"!`;
      const eventCount = result.eventRegistrations?.length || 0;
      const skippedCount = result.skippedEvents?.length || 0;
      
      let detailsMessage = `📋 פרטי הרשמה:\n• נרשמת ל-${eventCount} אירועים\n• סטטוס: ממתין לאישור תשלום\n• מנהל המערכת יאשר את התשלום בקרוב`;
      
      if (skippedCount > 0) {
        detailsMessage += `\n\n⚠️ ${skippedCount} אירועים דולגו:\n${result.skippedEvents.map(se => `• ${se.eventTitle} - ${se.reason}`).join('\n')}`;
      }
      
      alert(`🎉 ${successMessage}\n\n${detailsMessage}\n\n✉️ נשלח לך מייל אישור עם כל פרטי האירועים בחבילה!`);

      // Redirect to receipt page
      router.push(`/bundles/${bundle.id}/receipt?registrationId=${result.bundleRegistrationId}`);

    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(error.message || 'שגיאה ברכישת החבילה. נסה שוב.');
    } finally {
      setProcessing(false);
    }
  };

  // Debug logging
  console.log('🐛 Debug state:', { 
    loading, 
    bundleExists: !!bundle, 
    isAlreadyRegistered, 
    hasExistingRegistration: !!existingRegistration,
    currentUser: !!currentUser 
  });

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <div className="text-lg">טוען נתוני החבילה...</div>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">חבילה לא נמצאה</h1>
          <p className="text-gray-400 mb-6">לא ניתן למצוא את החבילה המבוקשת</p>
          <Link href="/bundles" className="btn">חזור לחבילות</Link>
        </div>
      </div>
    );
  }

  const serviceFee = Math.round(bundle.priceNis * 0.03); // 3% service fee
  const totalAmount = bundle.priceNis + serviceFee;
  
  let isExpiringSoon = false;
  if (bundle.validUntil) {
    try {
      const expiryDate = bundle.validUntil.toDate ? bundle.validUntil.toDate() : new Date(bundle.validUntil);
      isExpiringSoon = expiryDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
    } catch (error) {
      console.warn('⚠️ Could not parse bundle expiry date for expiration check:', bundle.validUntil);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="section-container py-4 border-b border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/bundles" className="hover:text-white transition-colors">חבילות</Link>
          <ArrowRight size={16} className="rotate-180" />
          <span className="text-white">רכישת {bundle.title}</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-8 border-b border-gray-700">
        <div className="section-container">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">רכישת חבילת אירועים</h1>
              <p className="text-gray-400">השלמת רכישה עבור {bundle.title}</p>
            </div>
          </div>

          {/* Already Registered Notice */}
          {isAlreadyRegistered && existingRegistration && (
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={20} />
                <div>
                  <h3 className="font-semibold text-green-300">כבר רכשת את החבילה הזו!</h3>
                  <p className="text-green-400 text-sm">
                    נרשמת בתאריך: {formatDate(existingRegistration.createdAt)}
                  </p>
                  <p className="text-green-400 text-sm">
                    סטטוס: {existingRegistration.status === 'pending' ? 'ממתין לאישור' : 
                             existingRegistration.status === 'paid' ? 'אושר' : existingRegistration.status}
                  </p>
                  {existingRegistration.eventRegistrations && (
                    <p className="text-green-400 text-sm">
                      נרשמת ל-{existingRegistration.eventRegistrations.length} אירועים בחבילה
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Expiry Warning */}
          {isExpiringSoon && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-400" size={20} />
                <div>
                  <h3 className="font-semibold text-red-300">החבילה תפוג בקרוב!</h3>
                  <p className="text-red-400 text-sm">
                    החבילה תפוג בתאריך: {formatDate(bundle.validUntil)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="section-container">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Checkout Form or Registration Status */}
            <div className="lg:col-span-2">
              <div className="card">
                {isAlreadyRegistered ? (
                  <>
                    <h2 className="text-2xl font-bold mb-6">פרטי הרשמה שלך</h2>
                    
                    {/* Registration Details */}
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="text-green-400" size={24} />
                        <h3 className="text-xl font-semibold text-green-300">נרשמת בהצלחה!</h3>
                      </div>
                      
                      <div className="grid gap-4">
                        <div>
                          <span className="text-gray-400">תאריך הרשמה: </span>
                          <span className="text-white">
                            {formatDate(existingRegistration.createdAt)}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-gray-400">סטטוס תשלום: </span>
                          <span className={`font-medium ${
                            existingRegistration.paymentStatus === 'paid' ? 'text-green-400' :
                            existingRegistration.paymentStatus === 'pending' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {existingRegistration.paymentStatus === 'pending' ? 'ממתין לאישור' :
                             existingRegistration.paymentStatus === 'paid' ? 'אושר' :
                             existingRegistration.paymentStatus}
                          </span>
                        </div>
                        
                        {existingRegistration.eventRegistrations && (
                          <div>
                            <span className="text-gray-400">אירועים רשומים: </span>
                            <span className="text-white font-medium">
                              {existingRegistration.eventRegistrations.length} אירועים
                            </span>
                          </div>
                        )}
                        
                        {existingRegistration.skippedEvents && existingRegistration.skippedEvents.length > 0 && (
                          <div>
                            <span className="text-gray-400">אירועים שדולגו: </span>
                            <span className="text-orange-400 font-medium">
                              {existingRegistration.skippedEvents.length} אירועים
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Event Registration Details */}
                    {existingRegistration.eventRegistrations && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-4">האירועים שנרשמת אליהם:</h4>
                        <div className="space-y-3">
                          {existingRegistration.eventRegistrations.map((eventReg: any, index: number) => {
                            const event = bundle.events.find(e => e.id === eventReg.eventId);
                            return event?.slug ? (
                              <Link
                                key={index}
                                href={`/events/${encodeURIComponent(event.slug)}`}
                                className="block bg-gray-800/50 rounded-lg p-4 hover:bg-gray-700/50 transition-colors group"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium group-hover:text-purple-300 transition-colors">
                                      {event?.title || eventReg.eventTitle || 'אירוע'}
                                    </h5>
                                    {event && (
                                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                        <span className="flex items-center gap-1">
                                          <Calendar size={14} />
                                          {formatDate(event.date || event.startAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <MapPin size={14} />
                                          {event.locationName}
                                        </span>
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      לחץ לצפייה בפרטי האירוע ←
                                    </div>
                                  </div>
                                  <div className="text-green-400 font-medium">
                                    {eventReg.status === 'replaced' ? 'הוחלף' : 'רשום'}
                                  </div>
                                </div>
                              </Link>
                            ) : (
                              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium">
                                      {event?.title || eventReg.eventTitle || 'אירוע'}
                                    </h5>
                                    {event && (
                                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                        <span className="flex items-center gap-1">
                                          <Calendar size={14} />
                                          {formatDate(event.date || event.startAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <MapPin size={14} />
                                          {event.locationName}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-green-400 font-medium">
                                    {eventReg.status === 'replaced' ? 'הוחלף' : 'רשום'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Skipped Events */}
                    {existingRegistration.skippedEvents && existingRegistration.skippedEvents.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-4">אירועים שדולגו:</h4>
                        <div className="space-y-3">
                          {existingRegistration.skippedEvents.map((skipped: any, index: number) => (
                            <div key={index} className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-orange-300">{skipped.eventTitle}</h5>
                                  <p className="text-sm text-orange-400 mt-1">
                                    סיבה: {skipped.reason === 'completed' ? 'האירוע הסתיים' :
                                          skipped.reason === 'cancelled' ? 'האירוע בוטל' :
                                          skipped.reason === 'full' ? 'אין מקום' :
                                          skipped.reason}
                                  </p>
                                </div>
                                <div className="text-orange-400 font-medium">דולג</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <Link 
                        href={`/bundles/${bundle.id}/receipt?registrationId=${existingRegistration.id}`}
                        className="btn bg-blue-600 hover:bg-blue-700 border-blue-600"
                      >
                        הצג קבלה
                      </Link>
                      <Link 
                        href="/bundles"
                        className="btn bg-gray-600 hover:bg-gray-700 border-gray-600"
                      >
                        חזור לחבילות
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-6">פרטי הרשמה</h2>

                <form onSubmit={(e) => { e.preventDefault(); processPurchase(); }} className="space-y-6">
                  
                  {/* Registration Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">פרטים נוספים</h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">פרטי איסוף (אופציונלי)</label>
                      <textarea
                        value={checkoutForm.pickup}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, pickup: e.target.value }))}
                        rows={2}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none"
                        placeholder="פרטים על איסוף או הגעה לאירועים..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">פרטים רפואיים (אופציונלי)</label>
                      <textarea
                        value={checkoutForm.medical}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, medical: e.target.value }))}
                        rows={2}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none"
                        placeholder="אלרגיות, תרופות, מגבלות רפואיות..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">הערות נוספות (אופציונלי)</label>
                      <textarea
                        value={checkoutForm.notes}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none"
                        placeholder="הערות או בקשות מיוחדות..."
                      />
                    </div>
                  </div>

                  {/* Important Notice */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-blue-400 mt-1" size={20} />
                      <div>
                        <h4 className="font-semibold text-blue-300 mb-2">חשוב לדעת:</h4>
                        <ul className="text-sm text-blue-200 space-y-1">
                          <li>• תירשם אוטומטית לכל האירועים בחבילה</li>
                          <li>• אירועים שלא זמינים יוחלפו באירועי חלופה אם קיימים</li>
                          <li>• אירועים ללא חלופה יוצגו בקבלה ולא יחויבו</li>
                          <li>• המחיר קבוע ללא תלות במספר האירועים הפעילים</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full btn bg-purple-600 hover:bg-purple-700 border-purple-600 text-lg py-4"
                  >
                    {processing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        מעבד רכישה...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CreditCard size={20} />
                        רכוש חבילה - ₪{totalAmount}
                      </div>
                    )}
                  </button>
                </form>
                  </>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="card sticky top-6">
                <h3 className="text-xl font-bold mb-4">סיכום חבילה</h3>
                
                {/* Bundle Details */}
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-2">{bundle.title}</h4>
                  <p className="text-gray-300 text-sm mb-4">{bundle.description}</p>
                  
                  {/* Savings Highlight */}
                  {bundle.savings > 0 && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Gift className="text-green-400" size={16} />
                        <span className="text-green-400 font-medium">
                          חיסכון: ₪{bundle.savings} ({Math.round((bundle.savings / bundle.originalPrice) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Events List */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">אירועים בחבילה:</h4>
                  <div className="space-y-2">
                    {bundle.events.map((event) => (
                      event.slug ? (
                        <Link 
                          key={event.id} 
                          href={`/events/${encodeURIComponent(event.slug)}`}
                          className="block bg-gray-800/50 rounded p-3 hover:bg-gray-700/50 transition-colors group"
                        >
                          <div className="font-medium text-sm mb-1 group-hover:text-purple-300 transition-colors">
                            {event.title}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>{formatDate(event.date || event.startAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              <span>{event.locationName}</span>
                            </div>
                            <div className="text-gray-300">₪{event.priceNis}</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            לחץ לצפייה בפרטי האירוע ←
                          </div>
                        </Link>
                      ) : (
                        <div key={event.id} className="bg-gray-800/50 rounded p-3">
                          <div className="font-medium text-sm mb-1">{event.title}</div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>{formatDate(event.date || event.startAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              <span>{event.locationName}</span>
                            </div>
                            <div className="text-gray-300">₪{event.priceNis}</div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pt-4 border-t border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-400">מחיר מקורי:</span>
                    <span className="line-through text-gray-500">₪{bundle.originalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">מחיר חבילה:</span>
                    <span>₪{bundle.priceNis}</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span>חיסכון:</span>
                    <span>₪{bundle.savings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">עמלת שירות:</span>
                    <span>₪{serviceFee}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>סה&quot;כ לתשלום:</span>
                      <span className="text-purple-400">₪{totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <Shield size={16} />
                    <span className="text-sm font-medium">רכישה מאובטחת</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    כל הנתונים מוצפנים ומאובטחים. תקבל אישור במייל לאחר הרכישה.
                  </p>
                </div>

                {/* Expiry Notice */}
                {bundle.validUntil && (
                  <div className="text-center text-xs text-gray-400">
                    תוקף החבילה: עד {formatDate(bundle.validUntil)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}