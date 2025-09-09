import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 GET request to bundle register endpoint');
  return NextResponse.json({ message: 'Bundle register endpoint is working', timestamp: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  console.log('🚀 Bundle registration API called - STEP 1');
  
  try {
    console.log('🚀 Parsing request body - STEP 2');
    const body = await request.json();
    console.log('📨 Request body parsed successfully - STEP 3:', body);
    
    const { token, bundleId, registrationData } = body;
    
    if (!token || !bundleId) {
      console.error('❌ Missing required fields:', { token: !!token, bundleId: !!bundleId });
      return NextResponse.json({ error: 'Token and bundleId required' }, { status: 400 });
    }

    console.log('🔧 Importing Firebase admin - STEP 4');
    const { adminAuth, adminDb } = await import('@/lib/firebase.admin');
    
    console.log('🔐 Verifying token - STEP 5');
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log('✅ Token verified for user:', uid);
    
    // Get user profile for registration data
    console.log('👤 Fetching user profile - STEP 6');
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
    console.log('📦 Fetching bundle - STEP 7:', bundleId);
    const bundleDoc = await adminDb.collection('bundles').doc(bundleId).get();
    if (!bundleDoc.exists) {
      console.error('❌ Bundle not found:', bundleId);
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }
    
    const bundle = bundleDoc.data()!;
    console.log('📦 Bundle found:', bundle.title);
    
    // Check if user already has an active registration for this bundle
    console.log('🔍 Checking for existing registration - STEP 8');
    const existingRegistrationSnapshot = await adminDb
      .collection('bundleRegistrations')
      .where('bundleId', '==', bundleId)
      .where('uid', '==', uid)
      .where('status', 'in', ['pending', 'paid'])
      .get();
    
    if (!existingRegistrationSnapshot.empty) {
      console.log('❌ User already registered for this bundle');
      return NextResponse.json({ error: 'User already registered for this bundle' }, { status: 400 });
    }
    
    // Get events in the bundle
    console.log('📅 Fetching bundle events - STEP 9');
    const eventIds = bundle.eventIds || [];
    console.log('Event IDs in bundle:', eventIds);
    
    if (eventIds.length === 0) {
      console.log('❌ No events in bundle');
      return NextResponse.json({ error: 'No events found in bundle' }, { status: 400 });
    }
    
    // Query for bundle events
    const bundleEventsSnapshot = await adminDb
      .collection('events')
      .where('__name__', 'in', eventIds)
      .get();
    
    console.log('Found bundle events:', bundleEventsSnapshot.size);
    const bundleEvents = bundleEventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    
    // Register user to each event in the bundle
    console.log('🎟️ Registering user to individual events - STEP 10');
    const eventRegistrations = [];
    const skippedEvents = [];
    
    for (const event of bundleEvents) {
      console.log('Processing event:', event.id, event.title);
      
      // Basic event eligibility check
      let canRegister = true;
      let skipReason = '';
      
      // Check if event is in the past
      if (event.date) {
        const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
        if (eventDate < new Date()) {
          canRegister = false;
          skipReason = 'Event has already passed';
          console.log('⚠️ Skipping past event:', event.title);
        }
      }
      
      // Check if event is cancelled
      if (event.status === 'cancelled') {
        canRegister = false;
        skipReason = 'Event is cancelled';
        console.log('⚠️ Skipping cancelled event:', event.title);
      }
      
      // Check if user is already registered for this event
      const existingEventRegSnapshot = await adminDb
        .collection('registrations')
        .where('eventId', '==', event.id)
        .where('uid', '==', uid)
        .where('status', 'in', ['pending', 'paid'])
        .get();
      
      if (!existingEventRegSnapshot.empty) {
        canRegister = false;
        skipReason = 'Already registered for this event';
        console.log('⚠️ User already registered for event:', event.title);
      }
      
      if (!canRegister) {
        skippedEvents.push({
          originalEventId: event.id,
          reason: skipReason,
          eventTitle: event.title
        });
        continue;
      }
      
      // Create individual event registration (matching the existing event registration format)
      const eventRegistration = {
        eventId: event.id,
        uid,
        status: 'pending', // Admin will approve
        paymentStatus: 'pending', // Admin will approve
        userName,
        userEmail,
        userPhone,
        registeredAt: new Date(),
        createdAt: new Date(),
        pickup: registrationData.pickup || '',
        medical: registrationData.medical || '',
        notes: registrationData.notes || '',
        bundleId: bundleId, // Mark this as a bundle registration
        bundleRegistration: true
      };
      
      const eventRegRef = await adminDb.collection('registrations').add(eventRegistration);
      console.log('✅ Event registration created:', eventRegRef.id, 'for event:', event.title);
      
      eventRegistrations.push({
        eventId: event.id,
        registrationId: eventRegRef.id,
        status: 'registered',
        eventTitle: event.title
      });
    }
    
    // Create bundle registration record
    console.log('💾 Creating bundle registration record - STEP 11');
    const bundleRegistration = {
      bundleId,
      uid,
      status: 'pending',
      paymentStatus: 'pending',
      eventRegistrations,
      skippedEvents,
      createdAt: new Date(),
      userName,
      userEmail,
      userPhone,
      bundleTitle: bundle.title,
      bundlePrice: bundle.priceNis,
      registrationData
    };
    
    const bundleRegRef = await adminDb.collection('bundleRegistrations').add(bundleRegistration);
    console.log('✅ Bundle registration created:', bundleRegRef.id);
    
    const response = {
      bundleRegistrationId: bundleRegRef.id,
      eventRegistrations,
      skippedEvents,
      status: 'pending',
      message: `Successfully registered for ${eventRegistrations.length} events in bundle "${bundle.title}"${skippedEvents.length > 0 ? ` (${skippedEvents.length} events skipped)` : ''}`
    };
    
    console.log('🎉 Bundle registration completed successfully:', response);
    
    // Send email notifications
    console.log('📧 Sending email notifications - STEP 12');
    try {
      const { sendEmail, sendAdminNotification, emailTemplates, formatEventDateForEmail } = await import('@/lib/email');
      
      // Prepare event data for email
      const emailEventData = eventRegistrations.map(eventReg => {
        const event = bundleEvents.find(e => e.id === eventReg.eventId);
        return {
          eventTitle: event?.title || eventReg.eventTitle || 'אירוע',
          eventDate: event?.date ? formatEventDateForEmail(event.date.toDate ? event.date.toDate() : event.date) : 'תאריך לא זמין',
          eventLocation: event?.locationName || event?.location || 'מיקום לא זמין',
          status: eventReg.status || 'registered'
        };
      });
      
      // Send user confirmation email
      console.log('📧 Sending user confirmation email...');
      const userEmailSent = await sendEmail(
        { email: userEmail, name: userName },
        emailTemplates.bundleRegistration(
          bundle.title,
          emailEventData,
          skippedEvents,
          bundle.priceNis,
          'pending'
        )
      );
      
      if (userEmailSent) {
        console.log('✅ User confirmation email sent successfully');
      } else {
        console.warn('⚠️ Failed to send user confirmation email');
      }
      
      // Send admin notification email
      console.log('📧 Sending admin notification email...');
      const adminEmailSent = await sendAdminNotification(
        emailTemplates.adminBundleRegistration(
          userName,
          userEmail,
          userPhone,
          bundle.title,
          bundle.priceNis,
          eventRegistrations.map(eventReg => ({
            eventTitle: bundleEvents.find(e => e.id === eventReg.eventId)?.title || eventReg.eventTitle || 'אירוע',
            eventId: eventReg.eventId
          })),
          skippedEvents,
          bundleRegRef.id
        )
      );
      
      if (adminEmailSent) {
        console.log('✅ Admin notification email sent successfully');
      } else {
        console.warn('⚠️ Failed to send admin notification email');
      }
      
    } catch (emailError) {
      console.error('❌ Error sending email notifications:', emailError);
      // Don't fail the registration if email fails, just log the error
    }
    
    console.log('🎉 Bundle registration completed successfully with email notifications:', response);
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