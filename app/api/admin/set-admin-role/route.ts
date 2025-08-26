import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, makeAdmin } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email is required' },
        { status: 400 }
      );
    }

    console.log(`🔧 ${makeAdmin ? 'Setting' : 'Removing'} admin role for:`, userEmail);
    
    // Find user by email
    const usersQuery = adminDb.collection('profiles').where('email', '==', userEmail);
    const usersSnapshot = await usersQuery.get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('👤 Found user:', userData.email, 'Current role:', userData.role);
    
    // Update role
    const newRole = makeAdmin ? 'admin' : 'student';
    await userDoc.ref.update({
      role: newRole,
      updatedAt: new Date()
    });
    
    console.log('✅ Updated user role to:', newRole);
    
    return NextResponse.json({
      success: true,
      message: `User ${userEmail} ${makeAdmin ? 'is now an admin' : 'is no longer an admin'}`,
      user: {
        uid: userDoc.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        oldRole: userData.role,
        newRole
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating admin role:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update admin role',
        details: (error as any).message 
      },
      { status: 500 }
    );
  }
}