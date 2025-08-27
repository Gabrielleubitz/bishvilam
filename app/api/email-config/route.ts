import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if all required Mailjet environment variables are configured
    const isConfigured = Boolean(
      process.env.MAILJET_API_KEY && 
      process.env.MAILJET_API_SECRET
    );

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      message: isConfigured 
        ? 'Mailjet is properly configured'
        : 'Mailjet API keys are missing'
    });
  } catch (error) {
    console.error('Error checking email configuration:', error);
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: 'Failed to check email configuration'
      },
      { status: 500 }
    );
  }
}