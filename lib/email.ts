import Mailjet from 'node-mailjet';

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
  fromName?: string
): Promise<boolean> {
  try {
    const client = getMailjetClient();
    
    if (!client) {
      console.warn('📧 Mailjet not configured - email notifications disabled');
      return false;
    }

    const recipients = Array.isArray(to) ? to : [to];
    const from = fromEmail || process.env.MAIL_FROM || 'noreply@bishvilam.com';
    
    const request = await client
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: from,
              Name: fromName || 'בישבילם - מרכז ההכשרה'
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
      subject: template.subject,
      messageId: request.body.Messages[0]?.MessageID
    });

    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

// Email templates for common scenarios
export const emailTemplates = {
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
  })
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