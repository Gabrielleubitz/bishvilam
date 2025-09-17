'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import Navbar from '@/components/Navbar';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Shield, Users, Target, Award, MapPin, Phone, Mail, UserCircle } from 'lucide-react';
import { useMedia } from '@/hooks/useMedia';

interface TeamMember {
  id: string;
  name: string;
  title: string;
  description?: string;
  imageUrl?: string;
  order: number;
}

export default function AboutPage() {
  const { getGalleryImages } = useMedia();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoadingTeam(true);
      
      const teamQuery = query(
        collection(db, 'teamMembers'),
        orderBy('order', 'asc')
      );
      const teamSnapshot = await getDocs(teamQuery);
      const teamData = teamSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          title: data.title || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          order: data.order || 0
        } as TeamMember;
      });

      setTeamMembers(teamData);
    } catch (error) {
      console.error('Error loading team members:', error);
      // Fallback to default team members
      setTeamMembers([
        {
          id: '1',
          name: 'יוחאי קיל',
          title: 'מנהל ומייסד',
          description: 'לוחם ומ״כ בגולני לשעבר, מדריך כושר מוסמך עם 8 שנות ניסיון בהדרכת צעירים',
          imageUrl: '',
          order: 1
        },
        {
          id: '2',
          name: 'דני לוי',
          title: 'מדריך ראשי',
          description: 'קצין לשעבר ביחידה מובחרת, מתמחה באימוני סיבולת ומסלולי מכשולים',
          imageUrl: '',
          order: 2
        },
        {
          id: '3',
          name: 'רועי אברהם',
          title: 'מדריך ניווט',
          description: 'לוחם יחידת קומנדו לשעבר, מדריך ניווט וכיווניות עם התמחות בשטח הרי יהודה',
          imageUrl: '',
          order: 3
        }
      ]);
    } finally {
      setLoadingTeam(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gray-900 py-16">
        <div className="section-container">
          <h1 className="text-4xl font-bold mb-6">עלינו</h1>
          <p className="text-xl text-gray-300 max-w-3xl">
          כושר קרבי “בשבילם” הוקם מתוך מטרה להכין את בני הנוער מגוש עציון, נס הרים והסביבה לשירות הצבאי
באימונים אנו משלבים לצד הכושר הגופני והחוסן המנטלי גם למידה על ערכים של לוחמים – עבודת צוות, עזרה הדדית, התמדה ומנהיגות.
בנוסף, אנו מקדישים מקום לסיפורי גבורתם של חברינו שנפלו על הגנת המולדת במלחמת חרבות ברזל, כדי להנחיל לדור הבא את זכרם ואת ההשראה שהם הותירו אחריהם.
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
                <p>לאחר לחימה ממושכת בכל גזרות מלחמת חרבות ברזל, שבה איבדנו חברים קרובים – ילדים טובים שרק רצו לגדול – החלטנו להקים את “בשבילם” כושר קרבי לזכרם של:
                דותן שמעון ז״ל, נטע כהנא ז״ל, ונווה לשם ז״ל.
                </p>
                <p>
המיזם שלנו נולד מתוך הכאב אך מבקש להפוך אותו לעוצמה.
המטרה שלנו היא להכין את בני הנוער בצורה הטובה ביותר לימים המאתגרים שלפניהם – ימי סיירות, גיוס ותקופת השירות הקרבי.
                </p>
                <p>
                אימונים אנו משלבים לא רק כושר גופני וחוסן מנטלי, אלא גם למידה והפנמה של ערכים: עבודת צוות, קבלת האחר, עמידה באתגרים ובניית ביטחון עצמי                </p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-6">הערכים שלנו</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="text-brand-green mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">בטיחות</h4>
                    <p className="text-gray-400 text-sm">שמירה קפדנית על כללי בטיחות באימונים</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="text-brand-green mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">אחדות</h4>
                    <p className="text-gray-400 text-sm"> חיבור בני נוער מכלל ישובי גוש עציון נס הרים והסביבה כהכנה לשירות</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="text-brand-green mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">מצוינות</h4>
                    <p className="text-gray-400 text-sm">חתירה מתמדת למקסימום יכולת וערכים</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="text-brand-green mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">מקצועיות</h4>
                    <p className="text-gray-400 text-sm">יחס מחויב ושיטתי לכל חניך</p>
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
          
          {loadingTeam ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
              <span className="ml-3">טוען נתוני צוות...</span>
            </div>
          ) : (
            <div className={`grid gap-8 ${teamMembers.length <= 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
              {teamMembers.map((member) => (
                <div key={member.id} className="card text-center">
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-brand-green/30"
                      onError={(e) => {
                        // Fallback to gray circle if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling;
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <UserCircle className="text-gray-400" size={48} />
                    </div>
                  )}
                  {member.imageUrl && (
                    <div 
                      className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 items-center justify-center" 
                      style={{ display: 'none' }}
                    >
                      <UserCircle className="text-gray-400" size={48} />
                    </div>
                  )}
                  <h3 className="font-semibold text-xl mb-2">{member.name}</h3>
                  <p className="text-brand-green mb-3">{member.title}</p>
                  {member.description && (
                    <p className="text-gray-400 text-sm">{member.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {!loadingTeam && teamMembers.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p>נתוני הצוות לא זמינים כרגע</p>
            </div>
          )}
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
                  <span>כל האימונים מועברים על ידי מדריך מוסמך להגשת עזרה ראשונה</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>ציוד בטיחות מקצועי לכל הפעילויות</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>העברת שיעורי בטיחות בנושא התייבשות ומכות חום בכל אימון</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>האימונים יתקיימו אך ורק על דשא או חול למטרת בטיחות החניכים</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">הסמכות ואישורים</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>רישיון עסק ברשות המיסים</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>ביטוח צד ג&apos; מקיף</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>לוחמי עבר עם ניסיון בפיקוד ומלחמת חרבות ברזל</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span>תוכנית אימונים בנויה על ידי מאמן כושר מוסמך</span>
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