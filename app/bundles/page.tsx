'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase.client';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Bundle, Event } from '@/types';
import { 
  Package, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Gift
} from 'lucide-react';
import Link from 'next/link';

interface BundleWithEvents extends Bundle {
  events: Event[];
  originalPrice: number;
  savings: number;
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

export default function BundlesPage() {
  const [bundles, setBundles] = useState<BundleWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    loadBundles();
    return () => unsubscribe();
  }, []);

  const loadBundles = async () => {
    try {
      setLoading(true);
      
      // Load published bundles
      const bundlesQuery = query(
        collection(db, 'bundles'),
        where('publish', '==', true)
      );
      const bundlesSnapshot = await getDocs(bundlesQuery);
      
      // Load all events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const allEvents = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      const bundlesWithEvents: BundleWithEvents[] = [];

      for (const bundleDoc of bundlesSnapshot.docs) {
        const bundleData = { id: bundleDoc.id, ...bundleDoc.data() } as Bundle;
        
        // Skip expired bundles
        if (bundleData.validUntil) {
          try {
            const expiryDate = bundleData.validUntil.toDate ? bundleData.validUntil.toDate() : new Date(bundleData.validUntil);
            if (expiryDate < new Date()) {
              continue;
            }
          } catch (error) {
            console.warn('⚠️ Could not parse bundle expiry date:', bundleData.validUntil);
          }
        }
        
        // Skip non-active bundles
        if (bundleData.status && bundleData.status !== 'active') {
          continue;
        }
        
        // Get events for this bundle
        const bundleEvents = allEvents.filter(event => 
          bundleData.eventIds.includes(event.id) && 
          event.publish && 
          (!event.status || event.status === 'active')
        );
        
        if (bundleEvents.length === 0) continue;
        
        // Calculate original price and savings
        const originalPrice = bundleEvents.reduce((sum, event) => sum + event.priceNis, 0);
        const savings = originalPrice - bundleData.priceNis;
        
        bundlesWithEvents.push({
          ...bundleData,
          events: bundleEvents,
          originalPrice,
          savings
        });
      }
      
      setBundles(bundlesWithEvents.sort((a, b) => {
        try {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          return 0;
        }
      }));
    } catch (error) {
      console.error('Error loading bundles:', error);
      alert('שגיאה בטעינת החבילות');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseBundle = (bundleId: string) => {
    if (!currentUser) {
      alert('יש להתחבר כדי לרכוש חבילה');
      router.push('/login');
      return;
    }
    
    router.push(`/bundles/${bundleId}/checkout`);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <div className="text-lg">טוען חבילות...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Header */}
      <section className="py-16 border-b border-gray-700">
        <div className="section-container">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Package size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">חבילות אירועים</h1>
              <p className="text-xl text-gray-400">חסוך כסף עם חבילות אירועים מיוחדות</p>
            </div>
          </div>
          
          {bundles.length > 0 && (
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Gift className="text-purple-400" size={24} />
                <h2 className="text-xl font-semibold text-purple-300">מבצעים מיוחדים!</h2>
              </div>
              <p className="text-gray-300">
                רכוש חבילת אירועים וחסוך עד ₪{Math.max(...bundles.map(b => b.savings))} לעומת רכישה נפרדת
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Bundles Grid */}
      <section className="py-16">
        <div className="section-container">
          {bundles.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">אין חבילות זמינות כרגע</h2>
              <p className="text-gray-400 mb-6">חזור מאוחר יותר לבדוק חבילות חדשות</p>
              <Link href="/events" className="btn">
                עבור לאירועים בודדים
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {bundles.map((bundle) => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                  onPurchase={() => handlePurchaseBundle(bundle.id)}
                  isLoggedIn={!!currentUser}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function BundleCard({ bundle, onPurchase, isLoggedIn }: {
  bundle: BundleWithEvents;
  onPurchase: () => void;
  isLoggedIn: boolean;
}) {
  const savingsPercentage = Math.round((bundle.savings / bundle.originalPrice) * 100);
  let isExpiringSoon = false;
  if (bundle.validUntil) {
    try {
      const expiryDate = bundle.validUntil.toDate ? bundle.validUntil.toDate() : new Date(bundle.validUntil);
      isExpiringSoon = expiryDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
    } catch (error) {
      console.warn('⚠️ Could not parse bundle expiry date for expiration check:', bundle.validUntil);
    }
  }

  return (
    <div className="card group hover:border-purple-500/50 transition-all duration-300">
      {/* Bundle Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold group-hover:text-purple-300 transition-colors">
            {bundle.title}
          </h3>
          {bundle.savings > 0 && (
            <div className="bg-green-600 text-white px-2 py-1 rounded text-sm font-bold">
              חסוך {savingsPercentage}%
            </div>
          )}
        </div>
        
        <p className="text-gray-300 mb-4">{bundle.description}</p>
        
        {/* Price */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl font-bold text-purple-400">₪{bundle.priceNis}</div>
          {bundle.savings > 0 && (
            <div className="text-sm text-gray-400">
              <div className="line-through">₪{bundle.originalPrice}</div>
              <div className="text-green-400">חיסכון: ₪{bundle.savings}</div>
            </div>
          )}
        </div>
        
        {/* Validity Warning */}
        {isExpiringSoon && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">
                נגמר בתאריך: {formatDate(bundle.validUntil)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar size={16} />
          האירועים בחבילה ({bundle.events.length})
        </h4>
        <div className="space-y-2">
          {bundle.events.map((event, index) => (
            event.slug ? (
              <Link 
                key={event.id} 
                href={`/events/${encodeURIComponent(event.slug)}`}
                className="block bg-gray-800/50 rounded-lg p-3 hover:bg-gray-700/50 transition-colors group"
                onClick={(e) => e.stopPropagation()} // Prevent parent Link navigation
              >
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-sm group-hover:text-purple-300 transition-colors">
                  {event.title}
                </h5>
                <span className="text-xs text-gray-400">₪{event.priceNis}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{formatDate(event.date || event.startAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  <span>{event.locationName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{event.capacity} מקומות</span>
                </div>
              </div>
                <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  לחץ לצפייה בפרטי האירוע ←
                </div>
              </Link>
            ) : (
              <div key={event.id} className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-sm">{event.title}</h5>
                  <span className="text-xs text-gray-400">₪{event.priceNis}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(event.date || event.startAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{event.locationName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{event.capacity} מקומות</span>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={16} />
            <span>רישום אוטומטי</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <CheckCircle size={16} />
            <span>החלפה אוטומטית</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <CheckCircle size={16} />
            <span>מחיר קבוע</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-400">
            <CheckCircle size={16} />
            <span>קבלה מפורטת</span>
          </div>
        </div>
      </div>

      {/* Purchase Button */}
      <button
        onClick={onPurchase}
        className="w-full btn bg-purple-600 hover:bg-purple-700 border-purple-600 flex items-center justify-center gap-2"
      >
        <ShoppingCart size={20} />
        {isLoggedIn ? `רכוש עכשיו - ₪${bundle.priceNis}` : 'התחבר לרכישה'}
      </button>
      
      {!isLoggedIn && (
        <p className="text-center text-xs text-gray-400 mt-2">
          יש להתחבר כדי לרכוש חבילה
        </p>
      )}
    </div>
  );
}