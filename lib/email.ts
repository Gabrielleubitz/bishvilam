import Mailjet from 'node-mailjet';
import { adminDb } from '@/lib/firebase.admin';

// Initialize Mailjet client
let mailjet: any = null;

function getMailjetClient() {
  if (!mailjet && process.env.MAILJET_API_KEY) {
    mailjet = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_API_SECRET || ''
    });
  }
  return mailjet;
}

// Get admin emails from database (prioritize) or environment fallback
async function getAdminEmails(): Promise<string[]> {
  console.log('🔍 Fetching admin emails from Firebase...');
  
  // Primary: Query Firebase for admin users
  try {
    const adminQuery = adminDb.collection('profiles').where('role', '==', 'admin');
    const adminSnapshot = await adminQuery.get();
    const adminEmails: string[] = [];
    
    console.log(`📊 Found ${adminSnapshot.docs.length} admin profile(s) in database`);
    
    adminSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`👤 Admin profile: ${data.email} (${data.firstName} ${data.lastName})`);
      if (data.email) {
        adminEmails.push(data.email);
      }
    });
    
    if (adminEmails.length > 0) {
      console.log('✅ Using admin emails from Firebase:', adminEmails);
      return adminEmails;
    }
    
    console.log('⚠️ No admin emails found in Firebase, checking environment fallback...');
  } catch (error) {
    console.error('❌ Error fetching admin emails from Firebase:', error);
    console.log('⚠️ Falling back to environment variables...');
  }

  // Fallback: Environment variable
  const envEmails = process.env.ADMIN_EMAILS;
  if (envEmails) {
    const emails = envEmails.split(',').map(email => email.trim()).filter(Boolean);
    console.log('📧 Using admin emails from environment:', emails);
    return emails;
  }
  
  console.error('❌ No admin emails found in Firebase or environment variables!');
  return [];
}

export interface EmailTemplate {
  subject: string;
  textContent: string;
  htmlContent?: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export async function sendEmail(
  to: EmailRecipient | EmailRecipient[],
  template: EmailTemplate,
  fromEmail?: string,
  fromName?: string,
  retries: number = 3
): Promise<boolean> {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      const client = getMailjetClient();
      
      if (!client) {
        console.warn('📧 Mailjet not configured - email notifications disabled');
        return false;
      }

      const recipients = Array.isArray(to) ? to : [to];
      const from = fromEmail || process.env.MAIL_FROM || 'noreply@bishvilam.com';
      const senderName = fromName || process.env.MAIL_FROM_NAME || 'בישבילם - מרכז ההכשרה';
      
      const request = await client
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: from,
                Name: senderName
              },
              To: recipients.map(recipient => ({
                Email: recipient.email,
                Name: recipient.name || recipient.email.split('@')[0]
              })),
              Subject: template.subject,
              TextPart: template.textContent,
              HTMLPart: template.htmlContent || template.textContent.replace(/\n/g, '<br>')
            }
          ]
        });

      console.log('📧 Email sent successfully:', {
        recipients: recipients.length,
        recipientEmails: recipients.map(r => r.email),
        subject: template.subject,
        messageId: request.body.Messages[0]?.MessageID,
        status: request.body.Messages[0]?.Status,
        attempt: attempt + 1
      });

      return true;
    } catch (error) {
      attempt++;
      console.error(`❌ Email send attempt ${attempt} failed:`, error);
      
      if (attempt >= retries) {
        console.error('❌ All email send attempts failed');
        return false;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
}

// Send emails to admins
export async function sendAdminNotification(template: EmailTemplate): Promise<boolean> {
  try {
    console.log('📧 Getting admin emails...');
    const adminEmails = await getAdminEmails();
    
    console.log('📧 Admin emails found:', adminEmails);
    
    if (adminEmails.length === 0) {
      console.warn('⚠️ No admin emails configured - skipping admin notification');
      return false;
    }

    const adminRecipients = adminEmails.map(email => ({ email, name: 'Admin' }));
    console.log('📧 Sending admin notification to:', adminRecipients.map(r => r.email));
    return await sendEmail(adminRecipients, template);
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    return false;
  }
}

// Email templates for common scenarios
export const emailTemplates = {
  // User welcome email
  welcomeUser: (userName: string): EmailTemplate => ({
    subject: `ברוך הבא לבישבילם, ${userName}!`,
    textContent: `שלום ${userName},

ברוך הבא למרכז ההכשרה בישבילם!

אנחנו שמחים שהצטרפת אלינו. במרכז שלנו תמצא אימונים מקצועיים שיכינו אותך לשירות הצבאי בצורה הטובה ביותר.

השלבים הבאים:
• בדוק את האימונים הזמינים באתר
• הירשם לאימונים המתאימים לך
• הגע עם ציוד ספורט ומוטיבציה!

למידע נוסף או שאלות, אתה מוזמן ליצור קשר איתנו.

בברכה,
צוות בישבילם`,
    htmlContent: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2563eb;">🎉 ברוך הבא לבישבילם!</h2>
        
        <p>שלום <strong>${userName}</strong>,</p>
        
        <p>ברוך הבא למרכז ההכשרה בישבילם!</p>
        
        <p>אנחנו שמחים שהצטרפת אלינו. במרכז שלנו תמצא אימונים מקצועיים שיכינו אותך לשירות הצבאי בצורה הטובה ביותר.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">השלבים הבאים:</h3>
          <ul>
            <li>בדוק את האימונים הזמינים באתר</li>
            <li>הירשם לאימונים המתאימים לך</li>
            <li>הגע עם ציוד ספורט ומוטיבציה!</li>
          </ul>
        </div>
        
        <p>למידע נוסף או שאלות, אתה מוזמן ליצור קשר איתנו.</p>
        
        <p style="margin-top: 30px;">
          בברכה,<br>
          <strong>צוות בישבילם</strong>
        </p>
      </div>
    `
  }),

  // Admin notification for new user
  adminNewUser: (userName: string, userEmail: string, userPhone: string, userGroups: string[], createdAt: string): EmailTemplate => ({
    subject: `🆕 משתמש חדש נרשם - ${userName}`,
    textContent: `התקבל משתמש חדש במערכת:

פרטי המשתמש:
• שם: ${userName}
• אימייל: ${userEmail}
• טלפון: ${userPhone || 'לא צוין'}
• קבוצות: ${userGroups.length > 0 ? userGroups.join(', ') : 'לא שויך לקבוצה'}
• תאריך הרשמה: ${createdAt}

ניתן לצפות ולנהל את המשתמש בפאנל הניהול.

מערכת בישבילם`,
    htmlContent: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #10b981;">🆕 משתמש חדש נרשם</h2>
        
        <p>התקבל משתמש חדש במערכת:</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #065f46;">פרטי המשתמש:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 8px;"><strong>שם:</strong> ${userName}</li>
            <li style="margin-bottom: 8px;"><strong>אימייל:</strong> ${userEmail}</li>
            <li style="margin-bottom: 8px;"><strong>טלפון:</strong> ${userPhone || 'לא צוין'}</li>
            <li style="margin-bottom: 8px;"><strong>קבוצות:</strong> ${userGroups.length > 0 ? userGroups.join(', ') : 'לא שויך לקבוצה'}</li>
            <li style="margin-bottom: 8px;"><strong>תאריך הרשמה:</strong> ${createdAt}</li>
          </ul>
        </div>
        
        <p>ניתן לצפות ולנהל את המשתמש בפאנל הניהול.</p>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          מערכת בישבילם
        </p>
      </div>
    `
  }),

  // Admin notification for new event registration
  adminEventRegistration: (
    userName: string,
    userEmail: string,
    userPhone: string,
    eventTitle: string,
    eventDate: string,
    eventLocation: string,
    registrationStatus: string
  ): EmailTemplate => ({
    subject: `📝 הרשמה חדשה לאירוע - ${eventTitle}`,
    textContent: `התקבלה הרשמה חדשה לאירוע:

פרטי המשתמש:
• שם: ${userName}
• אימייל: ${userEmail}
• טלפון: ${userPhone || 'לא צוין'}

פרטי האירוע:
• שם האירוע: ${eventTitle}
• תאריך: ${eventDate}
• מיקום: ${eventLocation}
• סטטוס הרשמה: ${registrationStatus}

ניתן לצפות ולנהל את ההרשמות בפאנל הניהול.

מערכת בישבילם`,
    htmlContent: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #3b82f6;">📝 הרשמה חדשה לאירוע</h2>
        
        <p>התקבלה הרשמה חדשה לאירוע:</p>
        
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e40af;">פרטי המשתמש:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 8px;"><strong>שם:</strong> ${userName}</li>
            <li style="margin-bottom: 8px;"><strong>אימייל:</strong> ${userEmail}</li>
            <li style="margin-bottom: 8px;"><strong>טלפון:</strong> ${userPhone || 'לא צוין'}</li>
          </ul>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">פרטי האירוע:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 8px;"><strong>שם האירוע:</strong> ${eventTitle}</li>
            <li style="margin-bottom: 8px;"><strong>תאריך:</strong> ${eventDate}</li>
            <li style="margin-bottom: 8px;"><strong>מיקום:</strong> ${eventLocation}</li>
            <li style="margin-bottom: 8px;"><strong>סטטוס הרשמה:</strong> ${registrationStatus}</li>
          </ul>
        </div>
        
        <p>ניתן לצפות ולנהל את ההרשמות בפאנל הניהול.</p>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          מערכת בישבילם
        </p>
      </div>
    `
  }),

  eventRegistration: (eventTitle: string, eventDate: string, eventLocation: string): EmailTemplate => ({
    subject: `אישור הרשמה - ${eventTitle}`,
    textContent: `שלום,

הרשמתך לאירוע "${eventTitle}" התקבלה בהצלחה!

פרטי האירוע:
📅 תאריך ושעה: ${eventDate}
📍 מיקום: ${eventLocation}

נתראה באימון!

בברכה,
צוות בישבילם`,
    htmlContent: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2563eb;">✅ הרשמה התקבלה בהצלחה!</h2>
        
        <p>שלום,</p>
        
        <p>הרשמתך לאירוע "<strong>${eventTitle}</strong>" התקבלה בהצלחה!</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">פרטי האירוע:</h3>
          <p><strong>📅 תאריך ושעה:</strong> ${eventDate}</p>
          <p><strong>📍 מיקום:</strong> ${eventLocation}</p>
        </div>
        
        <p>נתראה באימון!</p>
        
        <p style="margin-top: 30px;">
          בברכה,<br>
          <strong>צוות בישבילם</strong>
        </p>
      </div>
    `
  }),

  eventReminder: (eventTitle: string, eventDate: string, eventLocation: string): EmailTemplate => ({
    subject: `תזכורת - ${eventTitle} מחר!`,
    textContent: `שלום,

זוהי תזכורת שמחר מתקיים האירוע "${eventTitle}".

פרטי האירוע:
📅 תאריך ושעה: ${eventDate}
📍 מיקום: ${eventLocation}

נא להגיע 15 דקות לפני תחילת האירוע.

בהצלחה!

בברכה,
צוות בישבילם`,
    htmlContent: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #f59e0b;">⏰ תזכורת - האירוע מחר!</h2>
        
        <p>שלום,</p>
        
        <p>זוהי תזכורת שמחר מתקיים האירוע "<strong>${eventTitle}</strong>".</p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">פרטי האירוע:</h3>
          <p><strong>📅 תאריך ושעה:</strong> ${eventDate}</p>
          <p><strong>📍 מיקום:</strong> ${eventLocation}</p>
        </div>
        
        <p style="color: #dc2626; font-weight: bold;">נא להגיע 15 דקות לפני תחילת האירוע.</p>
        
        <p>בהצלחה!</p>
        
        <p style="margin-top: 30px;">
          בברכה,<br>
          <strong>צוות בישבילם</strong>
        </p>
      </div>
    `
  }),

  eventCancellation: (eventTitle: string, eventDate: string, reason?: string): EmailTemplate => ({
    subject: `ביטול אירוע - ${eventTitle}`,
    textContent: `שלום,

מצטערים להודיע שהאירוע "${eventTitle}" שהיה אמור להתקיים ב${eventDate} בוטל.

${reason ? `סיבת הביטול: ${reason}` : ''}

נעדכן אותך על אירועים חלופיים בהקדם.

מתנצלים על אי הנוחות,

בברכה,
צוות בישבילם`,
    htmlContent: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #dc2626;">❌ ביטול אירוע</h2>
        
        <p>שלום,</p>
        
        <p>מצטערים להודיע שהאירוע "<strong>${eventTitle}</strong>" שהיה אמור להתקיים ב<strong>${eventDate}</strong> בוטל.</p>
        
        ${reason ? `
        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #dc2626;">
          <p><strong>סיבת הביטול:</strong> ${reason}</p>
        </div>
        ` : ''}
        
        <p>נעדכן אותך על אירועים חלופיים בהקדם.</p>
        
        <p style="color: #dc2626;">מתנצלים על אי הנוחות,</p>
        
        <p style="margin-top: 30px;">
          בברכה,<br>
          <strong>צוות בישבילם</strong>
        </p>
      </div>
    `
  }),

  // Bundle registration confirmation email for users
  bundleRegistration: (
    bundleTitle: string, 
    registeredEvents: Array<{ eventTitle: string; eventDate: string; eventLocation: string; status: string }>,
    skippedEvents: Array<{ eventTitle: string; reason: string }>,
    bundlePrice: number,
    paymentStatus: string
  ): EmailTemplate => ({
    subject: `אישור רכישת חבילה - ${bundleTitle}`,
    textContent: `שלום,

רכישת החבילה "${bundleTitle}" התקבלה בהצלחה!

פרטי החבילה:
💰 מחיר: ₪${bundlePrice}
📊 סטטוס תשלום: ${paymentStatus === 'pending' ? 'ממתין לאישור' : paymentStatus === 'paid' ? 'אושר' : paymentStatus}

האירועים שנרשמת אליהם:
${registeredEvents.map(event => `✅ ${event.eventTitle}
   📅 ${event.eventDate}
   📍 ${event.eventLocation}
   ${event.status === 'replaced' ? '🔄 (הוחלף באירוע זה)' : ''}`).join('\n\n')}

${skippedEvents.length > 0 ? `
אירועים שדולגו:
${skippedEvents.map(skipped => `❌ ${skipped.eventTitle}
   סיבה: ${skipped.reason === 'completed' ? 'האירוע הסתיים' : 
           skipped.reason === 'cancelled' ? 'האירוע בוטל' : 
           skipped.reason === 'full' ? 'אין מקום' : skipped.reason}`).join('\n\n')}
` : ''}

${paymentStatus === 'pending' ? 'מנהל המערכת יאשר את התשלום בקרוב ויעדכן אותך.' : ''}

נתראה באימונים!

בברכה,
צוות בישבילם`,
    htmlContent: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2563eb;">🎉 רכישת חבילה אושרה!</h2>
        
        <p>שלום,</p>
        
        <p>רכישת החבילה "<strong>${bundleTitle}</strong>" התקבלה בהצלחה!</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #1e40af;">פרטי החבילה:</h3>
          <p><strong>💰 מחיר:</strong> ₪${bundlePrice}</p>
          <p><strong>📊 סטטוס תשלום:</strong> <span style="color: ${paymentStatus === 'paid' ? '#10b981' : '#f59e0b'};">${paymentStatus === 'pending' ? 'ממתין לאישור' : paymentStatus === 'paid' ? 'אושר' : paymentStatus}</span></p>
        </div>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #065f46;">האירועים שנרשמת אליהם:</h3>
          ${registeredEvents.map(event => `
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0; border: 1px solid #d1d5db;">
              <h4 style="margin: 0 0 10px 0; color: #1f2937;">✅ ${event.eventTitle}</h4>
              <p style="margin: 5px 0; color: #6b7280;"><strong>📅 תאריך:</strong> ${event.eventDate}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>📍 מיקום:</strong> ${event.eventLocation}</p>
              ${event.status === 'replaced' ? '<p style="margin: 5px 0; color: #f59e0b; font-weight: bold;">🔄 הוחלף באירוע זה</p>' : ''}
            </div>
          `).join('')}
        </div>
        
        ${skippedEvents.length > 0 ? `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">אירועים שדולגו:</h3>
          ${skippedEvents.map(skipped => `
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0; border: 1px solid #e5e7eb;">
              <h4 style="margin: 0 0 5px 0; color: #dc2626;">❌ ${skipped.eventTitle}</h4>
              <p style="margin: 5px 0; color: #6b7280;"><strong>סיבה:</strong> ${skipped.reason === 'completed' ? 'האירוע הסתיים' : 
                                                                                   skipped.reason === 'cancelled' ? 'האירוע בוטל' : 
                                                                                   skipped.reason === 'full' ? 'אין מקום' : skipped.reason}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${paymentStatus === 'pending' ? `
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af;"><strong>ℹ️ מנהל המערכת יאשר את התשלום בקרוב ויעדכן אותך.</strong></p>
        </div>
        ` : ''}
        
        <p>נתראה באימונים!</p>
        
        <p style="margin-top: 30px;">
          בברכה,<br>
          <strong>צוות בישבילם</strong>
        </p>
      </div>
    `
  }),

  // Admin notification for new bundle registration
  adminBundleRegistration: (
    userName: string,
    userEmail: string, 
    userPhone: string,
    bundleTitle: string,
    bundlePrice: number,
    registeredEvents: Array<{ eventTitle: string; eventId: string }>,
    skippedEvents: Array<{ eventTitle: string; reason: string }>,
    registrationId: string
  ): EmailTemplate => ({
    subject: `📦 הרשמה חדשה לחבילה - ${bundleTitle}`,
    textContent: `התקבלה הרשמה חדשה לחבילה:

פרטי המשתמש:
• שם: ${userName}
• אימייל: ${userEmail}
• טלפון: ${userPhone || 'לא צוין'}

פרטי החבילה:
• שם החבילה: ${bundleTitle}
• מחיר: ₪${bundlePrice}
• מספר רשמה: ${registrationId}

האירועים שהמשתמש נרשם אליהם:
${registeredEvents.map(event => `✅ ${event.eventTitle} (${event.eventId})`).join('\n')}

${skippedEvents.length > 0 ? `
אירועים שדולגו:
${skippedEvents.map(skipped => `❌ ${skipped.eventTitle} - ${skipped.reason}`).join('\n')}
` : ''}

ניתן לצפות ולנהל את ההרשמות בפאנל הניהול.

מערכת בישבילם`,
    htmlContent: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #8b5cf6;">📦 הרשמה חדשה לחבילה</h2>
        
        <p>התקבלה הרשמה חדשה לחבילה:</p>
        
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e40af;">פרטי המשתמש:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 8px;"><strong>שם:</strong> ${userName}</li>
            <li style="margin-bottom: 8px;"><strong>אימייל:</strong> ${userEmail}</li>
            <li style="margin-bottom: 8px;"><strong>טלפון:</strong> ${userPhone || 'לא צוין'}</li>
          </ul>
        </div>
        
        <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #8b5cf6;">
          <h3 style="margin-top: 0; color: #6b21a8;">פרטי החבילה:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 8px;"><strong>שם החבילה:</strong> ${bundleTitle}</li>
            <li style="margin-bottom: 8px;"><strong>מחיר:</strong> ₪${bundlePrice}</li>
            <li style="margin-bottom: 8px;"><strong>מספר הרשמה:</strong> ${registrationId}</li>
          </ul>
        </div>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #065f46;">האירועים שהמשתמש נרשם אליהם:</h3>
          <ul style="list-style: none; padding: 0;">
            ${registeredEvents.map(event => `<li style="margin-bottom: 8px;">✅ <strong>${event.eventTitle}</strong> (${event.eventId})</li>`).join('')}
          </ul>
        </div>
        
        ${skippedEvents.length > 0 ? `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">אירועים שדולגו:</h3>
          <ul style="list-style: none; padding: 0;">
            ${skippedEvents.map(skipped => `<li style="margin-bottom: 8px;">❌ <strong>${skipped.eventTitle}</strong> - ${skipped.reason}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        <p>ניתן לצפות ולנהל את ההרשמות בפאנל הניהול.</p>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          מערכת בישבילם
        </p>
      </div>
    `
  }),

  // Announcement email template
  announcement: (title: string, content: string, type: 'info' | 'warning' | 'success' | 'urgent'): EmailTemplate => {
    const getTypeEmoji = (announcementType: string) => {
      switch (announcementType) {
        case 'info': return 'ℹ️';
        case 'warning': return '⚠️';
        case 'success': return '✅';
        case 'urgent': return '🚨';
        default: return 'ℹ️';
      }
    };

    const getTypeColor = (announcementType: string) => {
      switch (announcementType) {
        case 'info': return '#3b82f6';
        case 'warning': return '#f59e0b';
        case 'success': return '#10b981';
        case 'urgent': return '#dc2626';
        default: return '#3b82f6';
      }
    };

    const getTypeBackground = (announcementType: string) => {
      switch (announcementType) {
        case 'info': return '#eff6ff';
        case 'warning': return '#fef3c7';
        case 'success': return '#d1fae5';
        case 'urgent': return '#fee2e2';
        default: return '#eff6ff';
      }
    };

    const emoji = getTypeEmoji(type);
    const color = getTypeColor(type);
    const backgroundColor = getTypeBackground(type);

    return {
      subject: `${emoji} ${title} - בישבילם`,
      textContent: `${emoji} ${title}

${content}

---
הודעה זו נשלחה ממרכז ההכשרה בישבילם.

בברכה,
צוות בישבילם`,
      htmlContent: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: ${color};">${emoji} ${title}</h2>
          
          <div style="background: ${backgroundColor}; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid ${color};">
            <div style="white-space: pre-line; font-size: 16px;">${content}</div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
            הודעה זו נשלחה ממרכז ההכשרה בישבילם.
          </p>
          
          <p style="margin-top: 30px;">
            בברכה,<br>
            <strong>צוות בישבילם</strong>
          </p>
        </div>
      `
    };
  }
};

// Helper function to format event date for emails
export function formatEventDateForEmail(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

// Test email function for development
export async function sendTestEmail(toEmail: string): Promise<boolean> {
  const testTemplate: EmailTemplate = {
    subject: 'בדיקת מערכת המייל - בישבילם',
    textContent: `שלום,

זהו מייל בדיקה ממערכת בישבילם.

אם אתה רואה מייל זה, המערכת עובדת כהלכה!

בברכה,
צוות בישבילם`,
    htmlContent: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #10b981;">✅ בדיקת מערכת המייל</h2>
        
        <p>שלום,</p>
        
        <p>זהו מייל בדיקה ממערכת בישבילם.</p>
        
        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #10b981;">
          <p style="margin: 0; font-weight: bold; color: #065f46;">אם אתה רואה מייל זה, המערכת עובדת כהלכה! 🎉</p>
        </div>
        
        <p style="margin-top: 30px;">
          בברכה,<br>
          <strong>צוות בישבילם</strong>
        </p>
      </div>
    `
  };

  return await sendEmail({ email: toEmail }, testTemplate);
}