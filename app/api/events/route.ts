import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { adminDb } = await import('@/lib/firebase.admin');
    
    const eventsRef = adminDb.collection('events');
    const snapshot = await eventsRef.where('publish', '==', true).orderBy('startAt').get();
    
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startAt: doc.data().startAt.toDate(),
      endAt: doc.data().endAt.toDate(),
      createdAt: doc.data().createdAt.toDate()
    }));
    
    return NextResponse.json(events);
    
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, eventData } = await request.json();
    
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
    
    const newEvent = {
      ...eventData,
      createdAt: new Date(),
      startAt: new Date(eventData.startAt),
      endAt: new Date(eventData.endAt)
    };
    
    const eventRef = await adminDb.collection('events').add(newEvent);
    
    return NextResponse.json({ id: eventRef.id, ...newEvent });
    
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}