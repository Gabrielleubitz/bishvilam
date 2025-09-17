'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ImageWithCacheBuster from '@/components/ImageWithCacheBuster';
import { Heart, Shield, Calendar, MapPin } from 'lucide-react';
import { useMedia } from '@/hooks/useMedia';
import Link from 'next/link';

// Custom Candle SVG Component
const CandleIcon = ({ className, size = 64 }: { className?: string; size?: number }) => (
  <svg 
    xmlns='http://www.w3.org/2000/svg' 
    viewBox='0 0 128 128' 
    width={size} 
    height={size} 
    fill='none' 
    stroke='#FFC107' 
    strokeWidth='8' 
    strokeLinecap='round' 
    strokeLinejoin='round'
    className={className}
  >
    <path d='M64 18c9 12 9 21 0 26c-9-5-9-14 0-26z' fill='#FFC107' />
    <line x1='64' y1='44' x2='64' y2='54' />
    <rect x='44' y='54' width='40' height='56' rx='6' />
    <path d='M64 54v14c0 6-6 6-6 12v8' />
    <rect x='24' y='112' width='80' height='8' rx='4' />
  </svg>
);

interface FallenSoldier {
  id: string;
  name: string;
  hebrewName: string;
  age?: number;
  unit?: string;
  rank?: string;
  dateOfFalling: string;
  imageUrl?: string;
  shortDescription: string;
  slug: string;
  order: number;
}

export default function MemorialPage() {
  const { getMemorialImages } = useMedia();
  const memorialImages = getMemorialImages();
  const [fallenSoldiers, setFallenSoldiers] = useState<FallenSoldier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSoldiers();
  }, []);

  const loadSoldiers = async () => {
    try {
      setLoading(true);
      
      // Dynamically import Firebase to avoid SSR issues
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase.client');
      
      
      const soldiersQuery = query(
        collection(db, 'fallenSoldiers'),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(soldiersQuery);
      
      
      console.log('Fallen soldiers loaded:', { count: snapshot.size, empty: snapshot.empty });
      
      if (!snapshot.empty) {
        const soldiersData = snapshot.docs.map(doc => {
          const data = doc.data();
          const imageUrl = data.imageUrl || '';
          
          return {
            id: doc.id,
            name: data.name || '',
            hebrewName: data.hebrewName || '',
            age: data.age,
            unit: data.unit || '',
            rank: data.rank || '',
            dateOfFalling: data.dateOfFalling || '',
            imageUrl: imageUrl,
            shortDescription: data.shortDescription || '',
            slug: data.slug || '',
            order: data.order || 0
          } as FallenSoldier;
        });
        setFallenSoldiers(soldiersData);
      }
    } catch (error) {
      console.error('Error loading soldiers:', error);
      // Use fallback data on error
      setFallenSoldiers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="section-container relative z-10 text-center">
          <div className="mb-8">
            <CandleIcon className="mx-auto mb-4" size={64} />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">לזכרם</h1>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mb-6"></div>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8">
              לזכר החברים היקרים שנפלו במילוי שליחותם הקדושה
            </p>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
              בזכותם ובשבילם אנו ממשיכים להכין את הדור הבא של הלוחמים. 
              הערכים שהם גילמו - מסירות, אחווה, אומץ ואהבת המולדת - ילוו אותנו תמיד בדרכנו.
            </p>
          </div>

          {/* Memorial Flame */}
          <div className="relative inline-block">
            <div className="w-2 h-8 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full animate-pulse mx-auto"></div>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-400/50 rounded-full animate-ping"></div>
          </div>
        </div>
      </section>

      {/* Memorial Cards */}
      <section className="py-20 bg-gray-900">
        <div className="section-container">
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
              <span className="ml-3 text-white">טוען נתונים...</span>
            </div>
          ) : fallenSoldiers.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md mx-auto">
                <Heart className="mx-auto mb-4 text-gray-500" size={48} />
                <div className="text-gray-300 mb-2 font-semibold">אין חללים רשומים במערכת</div>
                <div className="text-sm text-gray-500 mb-4">ניתן להוסיף חללים דרך עמוד הניהול</div>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {fallenSoldiers.map((soldier) => (
                <Link 
                  key={soldier.id} 
                  href={`/lizchram/${soldier.slug}`}
                  className="group block"
                >
                  <div className="relative bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden hover:border-yellow-400/50 transition-all duration-500 cursor-pointer">
                    {/* Corner Decorations */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Image Section */}
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {soldier.imageUrl ? (
                        <ImageWithCacheBuster
                          key={soldier.imageUrl} // Force remount when URL changes
                          src={soldier.imageUrl}
                          alt={soldier.hebrewName}
                          className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700"
                          cacheBustOnMount={true}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <Heart className="text-gray-400" size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      
                      {/* Memorial Candle */}
                      <div className="absolute top-4 right-4">
                        <CandleIcon size={32} className="opacity-80" />
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 relative">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors duration-300">
                          {soldier.hebrewName}
                        </h3>
                        <div className="w-16 h-0.5 bg-yellow-400 mx-auto mb-4"></div>
                        
                        <div className="space-y-2 text-gray-300 mb-4">
                          <div className="flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm">{soldier.unit}</span>
                          </div>
                          <div className="flex items-center justify-center gap-4 text-sm">
                            <span>גיל: {soldier.age}</span>
                            <span>•</span>
                            <span>{soldier.dateOfFalling}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm leading-relaxed text-center mb-6">
                        {soldier.shortDescription}
                      </p>

                      {/* Memorial Footer */}
                      <div className="text-center pt-4 border-t border-gray-700">
                        <div className="flex items-center justify-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-gray-500 font-hebrew">זיכרונו לברכה</span>
                          <Heart className="w-4 h-4 text-red-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Legacy Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-black to-gray-900"></div>
        <div className="section-container relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-white">המורשת שהם השאירו</h2>
            <div className="w-24 h-1 bg-yellow-400 mx-auto mb-8"></div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-400/30">
                  <Shield className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">מסירות</h3>
                <p className="text-gray-400 text-sm">מסירות מוחלטת למדינה ולעם</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-400/30">
                  <Heart className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">אחווה</h3>
                <p className="text-gray-400 text-sm">דאגה לחבר ועבודת צוות</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-400/30">
                  <Calendar className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">מנהיגות</h3>
                <p className="text-gray-400 text-sm">מנהיגות אישית והובלת דוגמה</p>
              </div>
            </div>

            <blockquote className="text-xl md:text-2xl text-gray-200 italic mb-8">
              &quot;הם לא נפלו לשווא - הם נפלו כדי שאחרים יחיו&quot;
            </blockquote>
            
            <p className="text-gray-300 leading-relaxed">
              בכל אימון, בכל פעילות, בכל רגע של הכנה לשירות צבאי - אנו זוכרים אותם. 
              המטרה שלנו היא לא רק להכין לוחמים טובים יותר, אלא לגדל דור שימשיך להוביל 
              את הערכים שהם השאירו אחריהם.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}