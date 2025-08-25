'use client';

import Navbar from '@/components/Navbar';
import { Heart, Shield, Calendar, MapPin } from 'lucide-react';
import { useMedia } from '@/hooks/useMedia';

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

export default function MemorialPage() {
  const { getMemorialImages } = useMedia();
  const memorialImages = getMemorialImages();

  // Map memorial images to soldier data
  const fallenSoldiers = [
    {
      name: "דותן שמעון ז\"ל",
      imageUrl: memorialImages.find(img => img.id === 'memorial-dotan')?.url || memorialImages[0]?.url,
      unit: "גדוד שקד בחטיבת גבעתי",
      dateOfFall: "י״ד אלול התשפ״ד",
      age: "21",
      description: "לוחם אמיץ ומסור, מנהיג טבעי שהיה אהוב על כל מי שהכיר אותו. דותן השאיר אחריו מורשת של אחווה, מסירות וערכי לוחם."
    },
    {
      name: "נטע כהנא ז\"ל", 
      imageUrl: memorialImages.find(img => img.id === 'memorial-neta')?.url || memorialImages[1]?.url,
      unit: " לוחם ימ״ס",
      dateOfFall: "כ״ז ניסן התשפ״ה",
      age: "20", 
      description: "חייל מופתי ובן אדם נפלא, נטע היה דוגמה אישית לכל מי שסביבו. זכרו ילווה אותנו תמיד בדרך להגשמת חלומותיו."
    },
    {
      name: "נווה לשם ז\"ל",
      imageUrl: memorialImages.find(img => img.id === 'memorial-nave')?.url || memorialImages[2]?.url,
      unit: " גדוד 12 בחטיבת גולני",
      dateOfFall: "כ׳ סיון התשפ״ה",
      age: "21",
      description: "לוחם אמיץ ונחוש, נווה היה מקור השראה לחבריו. הוא נפל במילוי תפקידו בהגנה על עם ישראל וארץ ישראל."
    }
  ];

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
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {fallenSoldiers.map((soldier, index) => (
              <div key={index} className="group">
                <div className="relative bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden hover:border-yellow-400/50 transition-all duration-500">
                  {/* Corner Decorations */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Image Section */}
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={soldier.imageUrl}
                      alt={soldier.name}
                      className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
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
                        {soldier.name}
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
                          <span>{soldier.dateOfFall}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm leading-relaxed text-center mb-6">
                      {soldier.description}
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
              </div>
            ))}
          </div>
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
                <p className="text-gray-400 text-sm">אחוות לוחמים שאין עליה</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-400/30">
                  <CandleIcon size={32} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">מצוינות</h3>
                <p className="text-gray-400 text-sm">שאיפה תמידית למצוינות</p>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-yellow-400/30 rounded-lg p-8">
              <blockquote className="text-xl text-gray-200 italic mb-6 leading-relaxed">
                &quot;הם נפלו בשדה הכבוד, אבל רוחם תמיד תלווה אותנו. 
                בכל אימון, בכל אתגר, בכל הישג - הם איתנו.&quot;
              </blockquote>
              <div className="text-yellow-400 font-semibold">— צוות בשבילם</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-black">
        <div className="section-container text-center">
          <h2 className="text-2xl font-bold text-white mb-6">הצטרפו אלינו להנצחת זכרם</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            כל משתתף באימונים שלנו הוא חלק מהמורשת שהם השאירו. 
            הצטרפו אלינו להמשך המסע בדרך שהם סללו.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/events" className="btn bg-yellow-600 hover:bg-yellow-700 border-yellow-600">
              הירשמו לאימונים
            </a>
            <a href="/about" className="btn-outline border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">
              קראו עלינו
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}