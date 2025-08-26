import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('📧 Testing email service with recipient:', email);

    // Check if Mailjet is configured
    if (!process.env.MAILJET_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email service not configured. Please set MAILJET_API_KEY environment variable.' 
        },
        { status: 500 }
      );
    }

    const success = await sendTestEmail(email);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully! Check your inbox.'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send test email. Check server logs for details.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in test email API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}