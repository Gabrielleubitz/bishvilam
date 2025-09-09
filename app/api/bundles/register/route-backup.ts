// Backup of the original route
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 GET request to bundle register endpoint');
  return NextResponse.json({ message: 'Bundle register endpoint is working', timestamp: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  console.log('🚀 Bundle registration API called');
  console.log('🚀 This log should appear in your terminal!');
  
  try {
    const body = await request.json();
    console.log('📨 Request body:', body);
    
    const { token, bundleId, registrationData } = body;
    
    if (!token || !bundleId) {
      console.error('❌ Missing required fields:', { token: !!token, bundleId: !!bundleId });
      return NextResponse.json({ error: 'Token and bundleId required' }, { status: 400 });
    }

    console.log('🔧 Importing Firebase admin...');
    const { adminAuth, adminDb } = await import('@/lib/firebase.admin');
    
    console.log('🔐 Verifying token...');
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log('✅ Token verified for user:', uid);
    
    // Get user profile for registration data
    console.log('👤 Fetching user profile...');
    const userProfileDoc = await adminDb.collection('profiles').doc(uid).get();
    const userProfile = userProfileDoc.exists ? userProfileDoc.data() : null;
    console.log('👤 User profile found:', userProfile ? true : false);
    
    const userName = userProfile ? 
      `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || decodedToken.email?.split('@')[0] :
      decodedToken.email?.split('@')[0] || 'Bundle User';
    const userEmail = decodedToken.email || userProfile?.email || '';
    const userPhone = userProfile?.phone || '';
    
    console.log('User info:', { uid, userName, userEmail, userPhone });
    
    // Get bundle
    console.log('📦 Fetching bundle:', bundleId);
    const bundleDoc = await adminDb.collection('bundles').doc(bundleId).get();
    if (!bundleDoc.exists) {
      console.error('❌ Bundle not found:', bundleId);
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }
    
    const bundle = bundleDoc.data()!;
    console.log('📦 Bundle found:', bundle.title);
    
    // Check if bundle is active and published
    if (!bundle.publish || (bundle.status && bundle.status !== 'active')) {
      return NextResponse.json({ error: 'Bundle not available' }, { status: 400 });
    }
    
    // Check if bundle has expired
    if (bundle.validUntil && new Date(bundle.validUntil.toDate()) < new Date()) {
      return NextResponse.json({ error: 'Bundle has expired' }, { status: 400 });
    }
    
    // Check if user already has an active registration for this bundle
    const existingRegistrationSnapshot = await adminDb
      .collection('bundleRegistrations')
      .where('bundleId', '==', bundleId)
      .where('uid', '==', uid)
      .where('status', 'in', ['pending', 'paid'])
      .get();
    
    if (!existingRegistrationSnapshot.empty) {
      return NextResponse.json({ error: 'User already registered for this bundle' }, { status: 400 });
    }
    
    // Get all events in the bundle
    const eventIds = bundle.eventIds || [];
    const replacementEventIds = bundle.replacementEventIds || [];
    
    console.log('Bundle event IDs:', eventIds);
    console.log('Replacement event IDs:', replacementEventIds);
    
    if (eventIds.length === 0) {
      return NextResponse.json({ error: 'No events found in bundle' }, { status: 400 });
    }
    
    // Query for bundle events
    console.log('🔍 Querying bundle events with IDs:', eventIds);
    const bundleEventsSnapshot = await adminDb
      .collection('events')
      .where('__name__', 'in', eventIds)
      .get();
    console.log('✅ Bundle events query completed, found:', bundleEventsSnapshot.size);
    
    let replacementEventsSnapshot: any = { docs: [] };
    if (replacementEventIds.length > 0) {
      console.log('🔍 Querying replacement events with IDs:', replacementEventIds);
      replacementEventsSnapshot = await adminDb
        .collection('events')
        .where('__name__', 'in', replacementEventIds)
        .get();
      console.log('✅ Replacement events query completed, found:', replacementEventsSnapshot.docs.length);
    }
    
    console.log('Found bundle events:', bundleEventsSnapshot.size);
    console.log('Found replacement events:', replacementEventsSnapshot.docs.length);
    
    const bundleEvents = bundleEventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    const replacementEvents = replacementEventsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() as any }));
    
    console.log('Bundle events:', bundleEvents.length);
    console.log('Replacement events:', replacementEvents.length);
    
    const eventRegistrations = [];
    const skippedEvents = [];
    
    // Process each event in the bundle
    for (const event of bundleEvents) {
      let targetEvent = event;
      let isReplacement = false;
      
      // Check if event is eligible (active, not completed, not cancelled, has capacity)
      console.log('Checking eligibility for event:', event.id, event.title);
      const isEligible = await checkEventEligibility(adminDb, event);
      console.log('Event eligibility result:', isEligible);
      
      if (!isEligible.eligible) {
        // Try to find a replacement
        let replacementFound = false;
        
        for (const replacementEvent of replacementEvents) {
          const replacementEligibility = await checkEventEligibility(adminDb, replacementEvent);
          if (replacementEligibility.eligible) {
            targetEvent = replacementEvent;
            isReplacement = true;
            replacementFound = true;
            break;
          }
        }
        
        if (!replacementFound) {
          // Skip this event - no replacement available
          skippedEvents.push({
            originalEventId: event.id,
            reason: isEligible.reason,
            eventTitle: event.title
          });
          continue;
        }
      }
      
      // Create registration for the target event (matching existing event registration format)
      const eventRegistration = {
        eventId: targetEvent.id,
        uid,
        status: 'pending',
        paymentStatus: 'pending',
        userName,
        userEmail,
        userPhone,
        registeredAt: new Date(),
        createdAt: new Date(),
        pickup: registrationData.pickup || '',
        medical: registrationData.medical || '',
        notes: registrationData.notes || '',
        bundleId: bundleId,
        bundleRegistration: true
      };
      
      const eventRegRef = await adminDb.collection('registrations').add(eventRegistration);
      
      eventRegistrations.push({
        eventId: targetEvent.id,
        registrationId: eventRegRef.id,
        status: isReplacement ? 'replaced' : 'registered',
        replacementEventId: isReplacement ? targetEvent.id : undefined
      });
    }
    
    // Create bundle registration
    const bundleRegistration = {
      bundleId,
      uid,
      status: 'pending',
      paymentStatus: 'pending',
      eventRegistrations,
      skippedEvents: skippedEvents.length > 0 ? skippedEvents : undefined,
      createdAt: new Date()
    };
    
    console.log('💾 Creating bundle registration...');
    const bundleRegRef = await adminDb.collection('bundleRegistrations').add(bundleRegistration);
    console.log('✅ Bundle registration created:', bundleRegRef.id);
    
    // Create Stripe PaymentIntent only if keys exist and not in development
    let clientSecret = null;
    if (process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
      try {
        const stripe = await import('stripe');
        const stripeInstance = new stripe.default(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-07-30.basil'
        });
        
        const paymentIntent = await stripeInstance.paymentIntents.create({
          amount: bundle.priceNis * 100, // Convert to agorot
          currency: 'ils',
          metadata: {
            bundleRegistrationId: bundleRegRef.id,
            bundleId: bundleId,
            uid
          }
        });
        
        await bundleRegRef.update({ paymentIntentId: paymentIntent.id });
        clientSecret = paymentIntent.client_secret;
        
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        // Continue without payment if Stripe fails
      }
    }
    
    const response = {
      bundleRegistrationId: bundleRegRef.id,
      eventRegistrations,
      skippedEvents,
      clientSecret,
      status: 'pending'
    };
    
    console.log('🎉 Bundle registration completed successfully:', response);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ BUNDLE REGISTRATION ERROR:');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Full error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      error: 'Failed to create bundle registration',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function checkEventEligibility(adminDb: any, event: any) {
  try {
    console.log('Checking event:', event.id, 'status:', event.status, 'date:', event.date);
    
    // Check if event is completed or cancelled
    if (event.status === 'completed') {
      return { eligible: false, reason: 'completed' };
    }
    
    if (event.status === 'cancelled') {
      return { eligible: false, reason: 'cancelled' };
    }
    
    // Check if event is in the past - use 'date' field, not 'startAt'
    let eventDate;
    if (event.date) {
      if (event.date.toDate) {
        eventDate = event.date.toDate();
      } else {
        eventDate = new Date(event.date);
      }
    } else {
      console.warn('Event has no date field:', event.id);
      return { eligible: false, reason: 'no_date' };
    }
    
    console.log('Event date:', eventDate, 'Current date:', new Date());
    
    if (eventDate < new Date()) {
      return { eligible: false, reason: 'completed' };
    }
    
    // Check capacity - use 'maxParticipants' field, not 'capacity'
    const registrationsSnapshot = await adminDb
      .collection('registrations')
      .where('eventId', '==', event.id)
      .where('status', 'in', ['pending', 'paid'])
      .get();
    
    const currentRegistrations = registrationsSnapshot.size;
    const maxParticipants = event.maxParticipants || event.capacity || 0;
    
    console.log('Registrations:', currentRegistrations, 'Max:', maxParticipants);
    
    if (currentRegistrations >= maxParticipants) {
      return { eligible: false, reason: 'full' };
    }
    
    return { eligible: true };
  } catch (error) {
    console.error('Error in checkEventEligibility:', error);
    return { eligible: false, reason: 'error' };
  }
}