import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { toEmail, subject, html, adminSms, eventTitle, userName } = await request.json();
    
    // Send email with Mailjet
    if (process.env.MAILJET_API_KEY) {
      try {
        const mailjet = await import('node-mailjet');
        const mailjetClient = mailjet.default.apiConnect(
          process.env.MAILJET_API_KEY!,
          process.env.MAILJET_API_SECRET!
        );
        
        await mailjetClient.post('send', { version: 'v3.1' }).request({
          Messages: [{
            From: { 
              Email: process.env.MAIL_FROM!, 
              Name: "כושר קרבי" 
            },
            To: [{ Email: toEmail }],
            Subject: subject,
            HTMLPart: html
          }]
        });
        
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }
    
    // Send SMS to admin
    if (process.env.TWILIO_ACCOUNT_SID && adminSms) {
      try {
        const twilio = await import('twilio');
        const twilioClient = twilio.default(
          process.env.TWILIO_ACCOUNT_SID!,
          process.env.TWILIO_AUTH_TOKEN!
        );
        
        await twilioClient.messages.create({
          to: process.env.ADMIN_SMS_TO!,
          from: process.env.TWILIO_FROM!,
          body: adminSms
        });
        
      } catch (smsError) {
        console.error('SMS error:', smsError);
      }
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}