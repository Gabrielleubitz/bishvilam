import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, registrationData } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const { adminAuth, adminDb } = await import('@/lib/firebase.admin');
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Check event capacity
    const eventDoc = await adminDb.collection('events').doc(registrationData.eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const event = eventDoc.data();
    const registrationsSnapshot = await adminDb
      .collection('registrations')
      .where('eventId', '==', registrationData.eventId)
      .where('status', 'in', ['pending', 'paid'])
      .get();
    
    const currentRegistrations = registrationsSnapshot.size;
    
    const newRegistration = {
      ...registrationData,
      uid,
      status: currentRegistrations >= event!.capacity ? 'waitlist' : 'pending',
      createdAt: new Date()
    };
    
    const regRef = await adminDb.collection('registrations').add(newRegistration);
    
    // Create Stripe PaymentIntent if keys exist and not waitlisted
    if (process.env.STRIPE_SECRET_KEY && newRegistration.status === 'pending') {
      try {
        const stripe = await import('stripe');
        const stripeInstance = new stripe.default(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-07-30.basil'
        });
        
        const paymentIntent = await stripeInstance.paymentIntents.create({
          amount: event!.priceNis * 100, // Convert to agorot
          currency: 'ils',
          metadata: {
            registrationId: regRef.id,
            eventId: registrationData.eventId,
            uid
          }
        });
        
        await regRef.update({ paymentIntentId: paymentIntent.id });
        
        return NextResponse.json({
          registrationId: regRef.id,
          status: newRegistration.status,
          clientSecret: paymentIntent.client_secret
        });
        
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        // Continue without payment if Stripe fails
      }
    }
    
    return NextResponse.json({
      registrationId: regRef.id,
      status: newRegistration.status
    });
    
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 });
  }
}