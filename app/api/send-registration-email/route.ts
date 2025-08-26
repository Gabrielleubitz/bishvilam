import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendAdminNotification, emailTemplates, formatEventDateForEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      userEmail, 
      userName, 
      userPhone,
      eventTitle, 
      eventDate, 
      eventLocation,
      registrationStatus 
    } = await request.json();

    // Validate required fields
    if (!userEmail || !eventTitle || !eventDate || !eventLocation) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email service is configured
    if (!process.env.MAILJET_API_KEY) {
      console.warn('📧 Mailjet not configured - skipping registration emails');
      return NextResponse.json({
        success: false,
        error: 'Email service not configured'
      });
    }

    console.log('📧 Starting registration email process for:', userEmail, 'event:', eventTitle);
    console.log('📧 Registration details:', { userName, userPhone, eventLocation, registrationStatus });
    
    // Check if email service is properly configured
    console.log('📧 Environment check:', {
      hasApiKey: !!process.env.MAILJET_API_KEY,
      hasSecret: !!process.env.MAILJET_API_SECRET,
      fromEmail: process.env.MAIL_FROM,
      adminEmails: process.env.ADMIN_EMAILS
    });

    // Format the event date for email
    const formattedDate = formatEventDateForEmail(eventDate);

    // Send confirmation email to user
    const userTemplate = emailTemplates.eventRegistration(
      eventTitle,
      formattedDate,
      eventLocation
    );
    const userEmailSuccess = await sendEmail(
      { email: userEmail, name: userName },
      userTemplate
    );

    // Send admin notification
    const adminTemplate = emailTemplates.adminEventRegistration(
      userName || userEmail.split('@')[0],
      userEmail,
      userPhone || '',
      eventTitle,
      formattedDate,
      eventLocation,
      registrationStatus || 'רשום'
    );
    const adminEmailSuccess = await sendAdminNotification(adminTemplate);

    if (userEmailSuccess || adminEmailSuccess) {
      console.log('✅ Registration emails sent:', { 
        userEmail: userEmailSuccess, 
        adminNotification: adminEmailSuccess 
      });
      return NextResponse.json({
        success: true,
        message: 'Registration emails sent successfully',
        details: {
          userEmail: userEmailSuccess,
          adminNotification: adminEmailSuccess
        }
      });
    } else {
      console.error('❌ All registration emails failed');
      return NextResponse.json(
        { success: false, error: 'Failed to send registration emails' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in registration email API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}