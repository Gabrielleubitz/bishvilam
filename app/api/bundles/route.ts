import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { adminDb } = await import('@/lib/firebase.admin');
    
    const bundlesRef = adminDb.collection('bundles');
    const snapshot = await bundlesRef.where('publish', '==', true).orderBy('createdAt', 'desc').get();
    
    const bundles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      validUntil: doc.data().validUntil?.toDate() || null,
      updatedAt: doc.data().updatedAt?.toDate() || null
    }));
    
    return NextResponse.json(bundles);
    
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, bundleData } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const { adminAuth, adminDb } = await import('@/lib/firebase.admin');
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Check if user is admin
    const profileDoc = await adminDb.collection('profiles').doc(uid).get();
    if (!profileDoc.exists || profileDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const newBundle = {
      ...bundleData,
      replacementEventIds: bundleData.replacementEventIds && bundleData.replacementEventIds.length > 0 ? bundleData.replacementEventIds : [],
      createdAt: new Date(),
      createdBy: uid,
      validUntil: bundleData.validUntil ? new Date(bundleData.validUntil) : null
    };
    
    const bundleRef = await adminDb.collection('bundles').add(newBundle);
    
    return NextResponse.json({ id: bundleRef.id, ...newBundle });
    
  } catch (error) {
    console.error('Error creating bundle:', error);
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { token, bundleId, bundleData } = await request.json();
    
    if (!token || !bundleId) {
      return NextResponse.json({ error: 'Token and bundleId required' }, { status: 400 });
    }

    const { adminAuth, adminDb } = await import('@/lib/firebase.admin');
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Check if user is admin
    const profileDoc = await adminDb.collection('profiles').doc(uid).get();
    if (!profileDoc.exists || profileDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const updateData = {
      ...bundleData,
      replacementEventIds: bundleData.replacementEventIds && bundleData.replacementEventIds.length > 0 ? bundleData.replacementEventIds : [],
      updatedAt: new Date(),
      validUntil: bundleData.validUntil ? new Date(bundleData.validUntil) : null
    };
    
    await adminDb.collection('bundles').doc(bundleId).update(updateData);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating bundle:', error);
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { token, bundleId } = await request.json();
    
    if (!token || !bundleId) {
      return NextResponse.json({ error: 'Token and bundleId required' }, { status: 400 });
    }

    const { adminAuth, adminDb } = await import('@/lib/firebase.admin');
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Check if user is admin
    const profileDoc = await adminDb.collection('profiles').doc(uid).get();
    if (!profileDoc.exists || profileDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Delete all bundle registrations first
    const bundleRegistrationsSnapshot = await adminDb
      .collection('bundleRegistrations')
      .where('bundleId', '==', bundleId)
      .get();
    
    const batch = adminDb.batch();
    
    // Delete bundle registrations
    bundleRegistrationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the bundle
    batch.delete(adminDb.collection('bundles').doc(bundleId));
    
    await batch.commit();
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting bundle:', error);
    return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 });
  }
}