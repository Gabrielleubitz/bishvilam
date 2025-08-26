import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendAdminNotification, emailTemplates, formatEventDateForEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      userEmail, 
      userName,
      userPhone,
      userGroups,
      createdAt
    } = await request.json();

    // Validate required fields
    if (!userEmail || !userName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userEmail, userName' },
        { status: 400 }
      );
    }

    // Check if email service is configured
    if (!process.env.MAILJET_API_KEY) {
      console.warn('📧 Mailjet not configured - skipping welcome emails');
      return NextResponse.json({
        success: false,
        error: 'Email service not configured'
      });
    }

    console.log('📧 Starting welcome email process for:', userEmail);
    console.log('📧 User details:', { userName, userPhone, userGroups, createdAt });
    
    // Check if email service is properly configured
    console.log('📧 Environment check:', {
      hasApiKey: !!process.env.MAILJET_API_KEY,
      hasSecret: !!process.env.MAILJET_API_SECRET,
      fromEmail: process.env.MAIL_FROM,
      adminEmails: process.env.ADMIN_EMAILS
    });

    // Send welcome email to user
    const welcomeTemplate = emailTemplates.welcomeUser(userName);
    const userEmailSuccess = await sendEmail(
      { email: userEmail, name: userName },
      welcomeTemplate
    );

    // Send admin notification
    const adminTemplate = emailTemplates.adminNewUser(
      userName,
      userEmail,
      userPhone || '',
      userGroups || [],
      createdAt || new Date().toLocaleDateString('he-IL')
    );
    const adminEmailSuccess = await sendAdminNotification(adminTemplate);

    if (userEmailSuccess || adminEmailSuccess) {
      console.log('✅ Welcome emails sent:', { 
        userEmail: userEmailSuccess, 
        adminNotification: adminEmailSuccess 
      });
      return NextResponse.json({
        success: true,
        message: 'Welcome emails sent successfully',
        details: {
          userEmail: userEmailSuccess,
          adminNotification: adminEmailSuccess
        }
      });
    } else {
      console.error('❌ All welcome emails failed');
      return NextResponse.json(
        { success: false, error: 'Failed to send welcome emails' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in welcome email API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}