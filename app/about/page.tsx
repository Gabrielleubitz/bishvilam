'use client';

import Navbar from '@/components/Navbar';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Shield, Users, Target, Award, MapPin, Phone, Mail } from 'lucide-react';
import { useMedia } from '@/hooks/useMedia';

export default function AboutPage() {
  const { getGalleryImages } = useMedia();

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gray-900 py-16">
        <div className="section-container">
          <h1 className="text-4xl font-bold mb-6">עלינו</h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            כושר קרבי הוקם במטרה להכין את בני הנוער בגוש עציון והסביבה לשירות צבאי בצורה הטובה ביותר. 
            אנו מתמחים באימונים המדמים את התנאים הקשים בצה״ל ומכינים אתכם פיזית ומנטלית.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="section-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">הסיפור שלנו</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                בשבילם נולד מתוך רצון להפוך את הכאב להשראה חיה. אנו פועלים כדי להכין את בני הנוער לשירות הצבאי, ולתת להם כלים פיזיים 
                ומנטליים שיסייעו להם להגשים את שאיפתם להגיע ליחידות הקרביות והמובחרות. הפעילות שלנו שמה דגש על כושר גופני,
                חוסן נפשי, עבודת צוות וערכים – הכל לזכר חברינו שנפלו ובשביל הדור הבא.
                </p>
                <p>
                  המטרה שלנו היא לא רק להכין את הגוף לעומסים הפיזיים, אלא גם לפתח את המנטליות הנכונה, 
                  הביטחון העצמי ויכולת העבודה בצוות שכה חשובים בשירות הצבאי.
                </p>
                <p>
                  עד היום עברו דרכנו מאות צעירים שהתקבלו ליחידות איכות ברחבי צה&quot;ל וממשיכים להוות מקור גאווה עבורנו.
                </p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-6">הערכים שלנו</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="text-brand-green mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">בטיחות</h4>
                    <p className="text-gray-400 text-sm">בטיחות המשתתפים היא הערך העליון שלנו</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="text-brand-green mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">אחדות</h4>
                    <p className="text-gray-400 text-sm">יצירת קהילה חזקה של צעירים מכל רחבי גוש עציון</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="text-brand-green mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">מצוינות</h4>
                    <p className="text-gray-400 text-sm">שאיפה למצוינות בכל פעילות ואימון</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="text-brand-green mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">מקצועיות</h4>
                    <p className="text-gray-400 text-sm">גישה מקצועית ומחויבות לתוצאות</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-900/50">
        <div className="section-container">
          <h2 className="text-3xl font-bold text-center mb-12">הצוות שלנו</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-xl mb-2"> יוחאי קיל</h3>
              <p className="text-brand-green mb-3">מנהל ומייסד</p>
              <p className="text-gray-400 text-sm">
                לוחם ומ״כ בגולני לשעבר, מדריך כושר מוסמך עם 8 שנות ניסיון בהדרכת צעירים
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-xl mb-2">דני לוי</h3>
              <p className="text-brand-green mb-3">מדריך ראשי</p>
              <p className="text-gray-400 text-sm">
                קצין לשעבר ביחידה מובחרת, מתמחה באימוני סיבולת ומסלולי מכשולים
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-xl mb-2">רועי אברהם</h3>
              <p className="text-brand-green mb-3">מדריך ניווט</p>
              <p className="text-gray-400 text-sm">
                לוחם יחידת קומנדו לשעבר, מדריך ניווט וכיווניות עם התמחות בשטח הרי יהודה
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 bg-black">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-100">גלריית פעילות</h2>
            <div className="w-20 h-1 bg-brand-green mx-auto mb-4"></div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              צפו ברגעים מהאימונים, התחרויות והפעילויות שלנו. כל תמונה מספרת סיפור של מסירות, אחווה ושאיפה למצוינות.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {getGalleryImages().map((imageUrl, index) => (
              <div key={index} className="group relative aspect-square overflow-hidden bg-gray-900 border border-gray-800">
                <img
                  src={imageUrl}
                  alt={`גלריית פעילות ${index + 1}`}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300"></div>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-brand-green/50 transition-all duration-300"></div>
                
                {/* Military-style corner brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-brand-green opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-brand-green opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-brand-green opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-brand-green opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Military-style overlay text */}
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="bg-black/80 backdrop-blur-sm border-l-2 border-brand-green px-2 py-1">
                    <div className="text-xs text-green-400 font-mono">IMG_{String(index + 1).padStart(3, '0')}</div>
                    <div className="text-xs text-gray-300 font-mono">TRAINING_OPS</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mission Statement Overlay */}
          <div className="mt-12 text-center">
            <div className="relative inline-block">
              <div className="bg-gray-900 border border-brand-green/30 px-8 py-4">
                <div className="text-brand-green text-sm font-mono mb-2">[ MISSION STATEMENT ]</div>
                <p className="text-gray-300 font-semibold max-w-2xl">
                  &quot;כל אימון הוא הזדמנות לגדול, כל אתגר הוא צעד קדימה לעבר המטרה&quot;
                </p>
                <div className="text-brand-green text-sm font-mono mt-2">[ END TRANSMISSION ]</div>
              </div>
              
              {/* Corner decorations */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-brand-green"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-brand-green"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-brand-green"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-brand-green"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="py-16">
        <div className="section-container">
          <h2 className="text-3xl font-bold text-center mb-12">בטיחות ואבטחת איכות</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-4">פרוטוקולי בטיחות</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>כל המדריכים מוסמכים בעזרה ראשונה</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>ציוד בטיחות מקצועי לכל הפעילויות</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>יחס מדריכים למשתתפים - 1:8 מקסימום</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>בדיקת מזג אוויר לפני כל אימון חוץ</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>אמבולנס זמין במקום לכל אימון</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">הסמכות ואישורים</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>רשיון עסק תקף מהמועצה האזורית</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>ביטוח צד ג&apos; מקיף</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>אישור משרד הבריאות לפעילות ספורט</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>מדריכים מוסמכים ממכון וינגייט</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>בדיקות רקע מלאות לכל הצוות</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-900/50">
        <div className="section-container">
          <h2 className="text-3xl font-bold text-center mb-12">שאלות נפוצות</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="card">
              <h3 className="font-semibold mb-2">באיזה גיל מומלץ להתחיל?</h3>
              <p className="text-gray-300">
                מומלץ להתחיל בגיל 16-17, כשנה-שנתיים לפני הגיוס. זה נותן זמן מספיק להכנה יסודית 
                ולהתפתחות הדרגתית של הכושר הפיזי והמנטלי.
              </p>
            </div>
            
            <div className="card">
              <h3 className="font-semibold mb-2">האם יש צורך בניסיון קודם?</h3>
              <p className="text-gray-300">
                לא! כל האימונים מתחילים מהבסיס ומותאמים לרמת הכושר של כל משתתף. 
                המדריכים יעזרו לכל אחד להגיע למקסימום שלו.
              </p>
            </div>
            
            <div className="card">
              <h3 className="font-semibold mb-2">מה צריך להביא לאימון?</h3>
              <p className="text-gray-300">
                בגדי ספורט נוחים, נעלי ספורט טובות, כובע, בקבוק מים גדול, 
                וחטיף אנרגיה. רשימה מפורטת נשלחת לכל נרשם לפני האימון הראשון.
              </p>
            </div>
            
            <div className="card">
              <h3 className="font-semibold mb-2">מה קורה במזג אוויר קשה?</h3>
              <p className="text-gray-300">
                בגשם חזק או חום קיצוני האימון יועבר למקום מוגן או ידחה. 
                כל המשתתפים יקבלו הודעה מראש ב-SMS ובדוא&quot;ל.
              </p>
            </div>
            
            <div className="card">
              <h3 className="font-semibold mb-2">איך מתבצע התשלום?</h3>
              <p className="text-gray-300">
                ניתן לשלם בכרטיס אשראי דרך האתר, בהעברה בנקאית, או במזומן ביום האימון. 
                ההרשמה מתאשרת רק לאחר קבלת התשלום.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="section-container">
          <h2 className="text-3xl font-bold text-center mb-12">צור קשר</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="card">
              <MapPin className="mx-auto mb-4 text-brand-green" size={32} />
              <h3 className="font-semibold mb-2">כתובת</h3>
              <p className="text-gray-300">
                מרכז הספורט גוש עציון<br />
                אפרת, גוש עציון<br />
                מיקוד: 90435
              </p>
            </div>
            
            <div className="card">
              <Phone className="mx-auto mb-4 text-brand-green" size={32} />
              <h3 className="font-semibold mb-2">טלפון</h3>
              <p className="text-gray-300">
                052-1234567<br />
                זמין: א&apos;-ה&apos; 08:00-20:00<br />
                שישי: 08:00-14:00
              </p>
            </div>
            
            <div className="card">
              <Mail className="mx-auto mb-4 text-brand-green" size={32} />
              <h3 className="font-semibold mb-2">דוא&quot;ל</h3>
              <p className="text-gray-300">
                info@kosherkravi.co.il<br />
                registrations@kosherkravi.co.il<br />
                מענה תוך 24 שעות
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Float */}
      <WhatsAppFloat message="שלום! אני מעוניין לקבל מידע נוסף על הפעילות שלכם" />
    </div>
  );
}