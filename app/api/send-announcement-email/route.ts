import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { sendEmail, emailTemplates } from '@/lib/email';
import { getVisibleKeys } from '@/utils/groups';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      announcementId,
      title,
      content,
      targetGroups,
      type
    } = await request.json();

    // Validate required fields
    if (!title || !content || !targetGroups) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email service is configured
    if (!process.env.MAILJET_API_KEY) {
      console.warn('📧 Mailjet not configured - skipping announcement emails');
      return NextResponse.json({
        success: false,
        error: 'Email service not configured'
      });
    }

    console.log('📧 Starting announcement email process');
    console.log('📧 Announcement details:', { title, targetGroups, type });

    // Get target users based on groups
    let targetUsers: any[] = [];
    
    if (targetGroups.includes('ALL')) {
      // Send to all users
      console.log('📧 Sending to ALL users');
      const allUsersSnapshot = await adminDb.collection('profiles').get();
      targetUsers = allUsersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as any));
    } else {
      // Send to users in specific groups
      console.log('📧 Sending to specific groups:', targetGroups);
      
      // Query users whose groups array contains any of the target groups
      const usersSnapshot = await adminDb.collection('profiles').get();
      targetUsers = usersSnapshot.docs
        .map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as any))
        .filter(user => {
          const userGroups = user.groups || [];
          // Check if user has any of the target groups
          return targetGroups.some((targetGroup: string) => userGroups.includes(targetGroup));
        });
    }

    console.log(`📧 Found ${targetUsers.length} target users for announcement`);
    
    // Filter users who have email addresses
    const usersWithEmails = targetUsers.filter(user => user.email);
    console.log(`📧 ${usersWithEmails.length} users have email addresses`);

    if (usersWithEmails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users with email addresses found for target groups' },
        { status: 400 }
      );
    }

    // Create email template
    const emailTemplate = emailTemplates.announcement(title, content, type);
    
    // Send emails in batches to avoid overwhelming Mailjet
    const batchSize = 10;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < usersWithEmails.length; i += batchSize) {
      const batch = usersWithEmails.slice(i, i + batchSize);
      console.log(`📧 Sending batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(usersWithEmails.length/batchSize)}`);
      
      // Create recipients for this batch
      const recipients = batch.map(user => ({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim() || user.email.split('@')[0]
      }));

      try {
        const success = await sendEmail(recipients, emailTemplate);
        if (success) {
          successCount += recipients.length;
        } else {
          failCount += recipients.length;
        }
      } catch (error) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
        failCount += recipients.length;
      }

      // Wait between batches to avoid rate limiting
      if (i + batchSize < usersWithEmails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📧 Announcement email results: ${successCount} success, ${failCount} failed`);

    // Log the announcement email send
    if (announcementId) {
      try {
        await adminDb.collection('announcements').doc(announcementId).update({
          emailSent: true,
          emailSentAt: new Date(),
          emailStats: {
            targetUsers: usersWithEmails.length,
            successCount,
            failCount
          }
        });
      } catch (error) {
        console.error('Error updating announcement:', error);
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      message: `Announcement sent to ${successCount}/${usersWithEmails.length} users`,
      details: {
        totalTargetUsers: targetUsers.length,
        usersWithEmails: usersWithEmails.length,
        successCount,
        failCount
      }
    });

  } catch (error) {
    console.error('❌ Error in announcement email API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}