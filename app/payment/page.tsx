'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase.client';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Event } from '@/types';
import { 
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
  User,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';

interface PaymentForm {
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  idNumber: string;
  email: string;
  phone: string;
  fullName: string;
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams?.get('eventId');
  const registrationId = searchParams?.get('registrationId');
  
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    idNumber: '',
    email: '',
    phone: '',
    fullName: ''
  });
  const [errors, setErrors] = useState<Partial<PaymentForm>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && eventId && registrationId) {
        loadEventAndRegistration();
      }
    });

    return () => unsubscribe();
  }, [eventId, registrationId]);

  const loadEventAndRegistration = async () => {
    if (!eventId || !registrationId) {
      router.push('/events');
      return;
    }

    try {
      setLoading(true);

      // Load event
      const eventsQuery = query(
        collection(db, 'events'),
        where('publish', '==', true)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => {
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
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Event;
      });

      const foundEvent = events.find(e => e.id === eventId);
      if (!foundEvent) {
        alert('האירוע לא נמצא');
        router.push('/events');
        return;
      }

      // Load registration
      const registrationDoc = await getDoc(doc(db, 'registrations', registrationId));
      if (!registrationDoc.exists()) {
        alert('ההרשמה לא נמצאה');
        router.push('/events');
        return;
      }

      const registrationData = { id: registrationDoc.id, ...registrationDoc.data() };
      
      // Verify user owns this registration
      if (currentUser && registrationData.userId !== currentUser.uid) {
        alert('אין לך הרשאה לגשת לעמוד זה');
        router.push('/events');
        return;
      }

      // Check if already paid
      if (registrationData.paymentStatus === 'paid') {
        alert('התשלום כבר בוצע עבור הרשמה זו');
        router.push(`/events/${encodeURIComponent(foundEvent.slug)}`);
        return;
      }

      setEvent(foundEvent);
      setRegistration(registrationData);

      // Pre-fill form with existing data
      setPaymentForm(prev => ({
        ...prev,
        email: registrationData.userEmail || '',
        phone: registrationData.userPhone || '',
        fullName: registrationData.userName || ''
      }));

    } catch (error) {
      console.error('Error loading payment data:', error);
      alert('שגיאה בטעינת נתוני התשלום');
      router.push('/events');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentForm> = {};

    // Card number validation (simplified)
    if (!paymentForm.cardNumber || paymentForm.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'מספר כרטיס לא תקין';
    }

    // Card holder validation
    if (!paymentForm.cardHolder.trim()) {
      newErrors.cardHolder = 'שם בעל הכרטיס חובה';
    }

    // Expiry validation
    if (!paymentForm.expiryMonth || !paymentForm.expiryYear) {
      newErrors.expiryMonth = 'תאריך תפוגה חובה';
    } else {
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      const expYear = parseInt(paymentForm.expiryYear);
      const expMonth = parseInt(paymentForm.expiryMonth);
      
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        newErrors.expiryMonth = 'תאריך תפוגה לא תקין';
      }
    }

    // CVV validation
    if (!paymentForm.cvv || paymentForm.cvv.length !== 3) {
      newErrors.cvv = 'CVV לא תקין';
    }

    // ID number validation (Israeli format)
    if (!paymentForm.idNumber || paymentForm.idNumber.length !== 9) {
      newErrors.idNumber = 'מספר זהות לא תקין';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!paymentForm.email || !emailRegex.test(paymentForm.email)) {
      newErrors.email = 'כתובת מייל לא תקינה';
    }

    // Phone validation
    if (!paymentForm.phone || paymentForm.phone.length < 9) {
      newErrors.phone = 'מספר טלפון לא תקין';
    }

    // Full name validation
    if (!paymentForm.fullName.trim()) {
      newErrors.fullName = 'שם מלא חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PaymentForm, value: string) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const processPayment = async () => {
    if (!validateForm() || !event || !registration) return;

    setProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, you would integrate with a payment provider here
      // For now, we'll simulate a successful payment
      const success = Math.random() > 0.1; // 90% success rate for demo

      if (!success) {
        throw new Error('התשלום נדחה. נסה שוב או השתמש בכרטיס אחר.');
      }

      // Update registration with payment info
      await updateDoc(doc(db, 'registrations', registration.id), {
        paymentStatus: 'paid',
        paidAt: new Date(),
        paymentMethod: 'credit_card',
        paymentDetails: {
          lastFourDigits: paymentForm.cardNumber.slice(-4),
          cardHolder: paymentForm.cardHolder,
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        billingInfo: {
          fullName: paymentForm.fullName,
          email: paymentForm.email,
          phone: paymentForm.phone,
          idNumber: paymentForm.idNumber
        }
      });

      // Redirect to success page
      alert('🎉 התשלום בוצע בהצלחה!\n\nאישור התשלום נשלח למייל שלך.');
      router.push(`/events/${encodeURIComponent(event.slug)}?payment=success`);

    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'שגיאה בעיבוד התשלום. נסה שוב.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <div className="text-lg">טוען נתוני תשלום...</div>
        </div>
      </div>
    );
  }

  if (!event || !registration) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">נתונים לא נמצאו</h1>
          <p className="text-gray-400 mb-6">לא ניתן למצוא את נתוני האירוע או ההרשמה</p>
          <Link href="/events" className="btn">חזור לכל האירועים</Link>
        </div>
      </div>
    );
  }

  const serviceFee = Math.round(event.priceNis * 0.03); // 3% service fee
  const totalAmount = event.priceNis + serviceFee;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="section-container py-4 border-b border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/events" className="hover:text-white transition-colors">אירועים</Link>
          <ArrowRight size={16} className="rotate-180" />
          <Link href={`/events/${encodeURIComponent(event.slug)}`} className="hover:text-white transition-colors">{event.title}</Link>
          <ArrowRight size={16} className="rotate-180" />
          <span className="text-white">תשלום</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-8 border-b border-gray-700">
        <div className="section-container">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-600 rounded-lg">
              <CreditCard size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">תשלום מאובטח</h1>
              <p className="text-gray-400">השלמת התשלום לאירוע</p>
            </div>
          </div>

          {/* Security badges */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <Shield size={16} />
              <span>SSL מוצפן</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Lock size={16} />
              <span>תשלום מאובטח</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <CheckCircle size={16} />
              <span>PCI DSS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="section-container">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-2xl font-bold mb-6">פרטי תשלום</h2>

                <form onSubmit={(e) => { e.preventDefault(); processPayment(); }} className="space-y-6">
                  
                  {/* Card Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">פרטי כרטיס אשראי</h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">מספר כרטיס אשראי</label>
                      <input
                        type="text"
                        value={paymentForm.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={`w-full p-3 bg-gray-800 border rounded-lg text-white ${errors.cardNumber ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`}
                      />
                      {errors.cardNumber && <p className="text-red-400 text-sm mt-1">{errors.cardNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">שם בעל הכרטיס</label>
                      <input
                        type="text"
                        value={paymentForm.cardHolder}
                        onChange={(e) => handleInputChange('cardHolder', e.target.value.toUpperCase())}
                        placeholder="JOHN DOE"
                        className={`w-full p-3 bg-gray-800 border rounded-lg text-white ${errors.cardHolder ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`}
                      />
                      {errors.cardHolder && <p className="text-red-400 text-sm mt-1">{errors.cardHolder}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">חודש</label>
                        <select
                          value={paymentForm.expiryMonth}
                          onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                          className={`w-full p-3 bg-gray-800 border rounded-lg text-white ${errors.expiryMonth ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`}
                        >
                          <option value="">חודש</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                              {(i + 1).toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">שנה</label>
                        <select
                          value={paymentForm.expiryYear}
                          onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                          className={`w-full p-3 bg-gray-800 border rounded-lg text-white ${errors.expiryYear ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`}
                        >
                          <option value="">שנה</option>
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() + i;
                            return (
                              <option key={year} value={(year % 100).toString().padStart(2, '0')}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">CVV</label>
                        <input
                          type="text"
                          value={paymentForm.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                          placeholder="123"
                          maxLength={3}
                          className={`w-full p-3 bg-gray-800 border rounded-lg text-white ${errors.cvv ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`}
                        />
                      </div>
                    </div>
                    {(errors.expiryMonth || errors.cvv) && (
                      <p className="text-red-400 text-sm">
                        {errors.expiryMonth || errors.cvv}
                      </p>
                    )}
                  </div>

                  {/* Billing Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">פרטי חיוב</h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">שם מלא</label>
                      <input
                        type="text"
                        value={paymentForm.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="שם פרטי ושם משפחה"
                        className={`w-full p-3 bg-gray-800 border rounded-lg text-white ${errors.fullName ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`}
                      />
                      {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">מספר זהות</label>
                      <input
                        type="text"
                        value={paymentForm.idNumber}
                        onChange={(e) => handleInputChange('idNumber', e.target.value.replace(/\D/g, ''))}
                        placeholder="123456789"
                        maxLength={9}
                        className={`w-full p-3 bg-gray-800 border rounded-lg text-white ${errors.idNumber ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`}
                      />
                      {errors.idNumber && <p className="text-red-400 text-sm mt-1">{errors.idNumber}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">כתובת מייל</label>
                        <input
                          type="email"
                          value={paymentForm.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="example@email.com"
                          className={`w-full p-3 bg-gray-800 border rounded-lg text-white ${errors.email ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`}
                        />
                        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">מספר טלפון</label>
                        <input
                          type="tel"
                          value={paymentForm.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="050-1234567"
                          className={`w-full p-3 bg-gray-800 border rounded-lg text-white ${errors.phone ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`}
                        />
                        {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full btn bg-green-600 hover:bg-green-700 border-green-600 text-lg py-4"
                  >
                    {processing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        מעבד תשלום...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CreditCard size={20} />
                        שלם ₪{totalAmount}
                      </div>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="card sticky top-6">
                <h3 className="text-xl font-bold mb-4">סיכום הזמנה</h3>
                
                {/* Event Details */}
                <div className="mb-6">
                  <div className="aspect-video bg-gray-800 rounded-lg mb-4 overflow-hidden">
                    {event.cover && (
                      <img src={event.cover} alt={event.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-lg mb-2">{event.title}</h4>
                  
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{formatEventDate(event.startAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{event.locationName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>1 כרטיס</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pt-4 border-t border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-400">מחיר כרטיס:</span>
                    <span>₪{event.priceNis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">עמלת שירות:</span>
                    <span>₪{serviceFee}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>סה&quot;כ לתשלום:</span>
                      <span className="text-green-400">₪{totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <Shield size={16} />
                    <span className="text-sm font-medium">תשלום מאובטח</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    הנתונים שלך מוצפנים ומאובטחים. לא נשמור פרטי כרטיס האשראי במערכת שלנו.
                  </p>
                </div>

                {/* Support */}
                <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                  <p className="text-sm text-gray-400 mb-2">זקוק לעזרה?</p>
                  <div className="flex justify-center gap-4">
                    <a href="tel:0501234567" className="text-blue-400 hover:text-blue-300 text-sm">
                      צור קשר
                    </a>
                    <a href="mailto:support@example.com" className="text-blue-400 hover:text-blue-300 text-sm">
                      שלח מייל
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

// Helper function for date formatting
function formatEventDate(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
}