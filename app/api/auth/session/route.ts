import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Dynamic import to keep Firebase Admin server-only
    const { adminAuth, adminDb } = await import('@/lib/firebase.admin');
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Get user profile from Firestore
    const profileDoc = await adminDb.collection('profiles').doc(uid).get();
    
    if (!profileDoc.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    const profile = profileDoc.data();
    
    return NextResponse.json({
      uid,
      email: decodedToken.email,
      profile
    });
    
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}