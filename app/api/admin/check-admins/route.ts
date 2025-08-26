import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Checking admin users in database...');
    
    // Query all profiles to see what we have
    const allProfilesQuery = adminDb.collection('profiles');
    const allProfilesSnapshot = await allProfilesQuery.get();
    
    console.log(`📊 Total profiles in database: ${allProfilesSnapshot.docs.length}`);
    
    const allProfiles = allProfilesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      };
    });
    
    // Query specifically for admin users
    const adminQuery = adminDb.collection('profiles').where('role', '==', 'admin');
    const adminSnapshot = await adminQuery.get();
    
    console.log(`👑 Admin users found: ${adminSnapshot.docs.length}`);
    
    const adminProfiles = adminSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      };
    });
    
    const adminEmails = adminProfiles.map(admin => admin.email).filter(Boolean);
    
    return NextResponse.json({
      success: true,
      data: {
        totalProfiles: allProfiles.length,
        totalAdmins: adminProfiles.length,
        adminEmails,
        adminProfiles,
        allProfiles: allProfiles.slice(0, 10) // Limit to first 10 for debugging
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check admin users',
        details: (error as any).message 
      },
      { status: 500 }
    );
  }
}