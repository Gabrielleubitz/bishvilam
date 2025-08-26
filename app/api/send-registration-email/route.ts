import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates, formatEventDateForEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      userEmail, 
      userName, 
      eventTitle, 
      eventDate, 
      eventLocation 
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
      console.warn('📧 Mailjet not configured - skipping registration email');
      return NextResponse.json({
        success: false,
        error: 'Email service not configured'
      });
    }

    console.log('📧 Sending registration confirmation email to:', userEmail);

    // Format the event date for email
    const formattedDate = formatEventDateForEmail(eventDate);

    // Get email template
    const template = emailTemplates.eventRegistration(
      eventTitle,
      formattedDate,
      eventLocation
    );

    // Send email
    const success = await sendEmail(
      { email: userEmail, name: userName },
      template
    );

    if (success) {
      console.log('✅ Registration email sent successfully to:', userEmail);
      return NextResponse.json({
        success: true,
        message: 'Registration email sent successfully'
      });
    } else {
      console.error('❌ Failed to send registration email to:', userEmail);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
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