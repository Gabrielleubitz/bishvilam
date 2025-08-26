const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64 || 'ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiYmlzaHZpbGFtLWQ5MzgwIiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiN2Y4YTk2ZWJjOTJhN2UyZjMzNTMwOTQzMjdlMzhlNzlkNjE3ZTdlYiIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZRSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2N3Z2dTakFnRUFBb0lCQVFDelQzOHRhMFN2cElBN1xuc2RKZTdwMFI1Vlpqb1pJb3gyN1NaVjAzYkE1MmtoaVlXdGY2VDZHSUUzU2dNbVlsckRObVZvV3RMYmY3VFhWMFxuQ3FHMEFQVFRpY214dzV5L0trTnRBc2RjUldIY2NnWXhjZno3dTVsSVVESWNWajZKSFIwOFg3ZnZoUmJmR3BvQ1xuRFAwNmk1dFRoTzdPcENDYlFvNFRqTFhDSk5wZURjRTBVSXNGYzI4YTVWalNQNzVtUkNMeEVwWmQvT0t6eERQWlxuSTdhc21zSVhDVTRwOU5ob0VyS3pDNG1wa3dvelgzSlJQd1RmN01PN2l1TlBhTHFkekJzeTlSU29NNE12RE1mRVxuaUtTaHpLMnJOaDdwQU9ES1dTWHAycTUrejdkTjNUc3lDUmU1ZmR4d0h3SmRpMnEzSmFobU55U0NKYXJOUlR6alxuMWxBTXorNXJBZ01CQUFFQ2dnRUFUb1ZpZ09ZM2R0OEhsSnlETGpVNXJTdUwwQ2RoMU4rNHBRUGtkUytwaWJ6aVxuYmwxaHRPaUlLUW0wQ2E3b1VsajlUVFJZWjRUY3kzeVpFWTdTVHZ3WU9rWmRmNjNVaDFZZm5xNFgxVTFBMUlOT1xuT1ByY3VQUG01T2JSZXQwOWwxZWJoT081clhiUGxEV1crWXpzbTJXbFNFYXZPT2hncXZ6VE1MWnVwYXp6dnpsMFxuSzQyUlRGYWVHNkZaVnBkT2s0TXk1ZXFMVmdpYjFsTjVGaGxUTlFXWXk3VEdwQjFpL3hBbnE2TTh3L0kzRE51QlxudEl6MmREcXpNSkZUWllvaHZZcVB2SWxFQnNReUp4VFNyT3o0dE9FMjlrN2RuUnhoUHQvNFlrNFk5SE5jZXl2eVxuemsxekQwdXRIOFFiREM2R2xxZXZabEtkUzdIZzNTNjE3bmlBQnBXVkNRS0JnUURzd2NTNGN2MmJnNlhnckFSR1xuRDZVVmtBV1RRcDlpemZvOW5WSk5JMDFJUHFqdkc1Y2gxbjFEUGlzOWkrUjVjRUdBZmV3VW9GamR0YXpWRnNIVFxudUlIWVYydTZVSzhnREU1Vy8rQmlIcnhWL0VycktzTmdROGpvZmRVVkhwZW8zb1M0TkN6WjViTGNjWnpFMVdLc1xubFl2ZEpHa3M1YWIybGNlRUsrTmpvQXpFOVFLQmdRREI0bThwMGphbVgwdnB5dmtqWUJadFlJQzBXcjVZMkg2K1xuUi8vU09HcVE5cTZkcjRTRDBWeVNXRjQ4MVlTVUNRVDJqOFA3MThXMnhUZmtFeDY5NytsTDRrZTQ0S2RrQm5lWlxuUWxQcCtMK1VxQ3J2L0Zld1FWVUI5M0NhYWlUdzZkRGM0d3REOHVaajNFZXVYRTF1OUVaaGhyUXVzeFJLVHBrZlxua1FhL3Axekozd0tCZ0hhYXIzRHpjaWE0OFowMnIwRmx6djZaVXFHdDYyaTA1UnArdUY4YVF6bmc0Z0krb1J4N1xuZGU3OHN1NjNLUExKRUpkTS9icHJoWGt6N093bTVWeXAvcW9oU1Q5aDhna3RBUVhHVTJMMElNYzJoMVY5NjdoS1xuM05mVFNhNjF6Nlh5S3l5WVBxdTl6VGR2MXVnb09iRlpqV0p3UGh3V3craWRxZ0NGZC9sTmtYZ05Bb0dBQk5pSlxuK3J1Y1RoQTNyNEk1TTk4azhGcm5ISnJnQXd4MkxuOVNMNGpsY1BZWmF5dUYzbDJQT01Fb3FkQ1VYYmJUL3UyY1xuOG1CME9wczNTR1lKOEtsY1pWOGtkOFIxcXBSV3pPZlJmUm1RZ0VDcndnL0dpVXM0dXJIYWlLRjZodUx4SzNRcFxuUmV0K1FxU3d6ZlRVb3A5TVd3ZW8zVG53bWVMWkJPYjFDamsrb25VQ2dZRUFqYjVvQlZ2OVdVMXIycEl2V3hZQlxueGp0cDFJcVVRQ09sRGZBUmlRQzVacmZTUXFqaGszaWV6QncvOHZveUJkT1lGKzlITXBKMmc1c0tuYVhQblhxL1xuMFZsb1VpZ1hCazlnaHYrM3BVUW5KeTkzR0hCMGVocUM3UVJEeWtYYVBkWGtxN2kwbjJoaTFCN3A4TDFqOVNaN1xuQ2ppZjdvQmw2VnI3Z2ZxaW5XUElvQmc9XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAYmlzaHZpbGFtLWQ5MzgwLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjEwMjQ4MzI0MzcxNzQzNDEwMDQyOCIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstZmJzdmMlNDBiaXNodmlsYW0tZDkzODAuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K';
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function testAnnouncementFlow() {
  console.log('🧪 Testing Complete Announcement Flow...\n');

  try {
    // Step 1: Create test users with different groups
    console.log('1. Creating test users...');
    
    const testUsers = [
      {
        uid: 'test-user-aleph',
        email: 'user-aleph@test.com',
        firstName: 'משה',
        lastName: 'כהן',
        groups: ['א'],
        role: 'student',
        createdAt: new Date()
      },
      {
        uid: 'test-user-bet',
        email: 'user-bet@test.com',
        firstName: 'דוד',
        lastName: 'לוי',
        groups: ['ב'],
        role: 'student',
        createdAt: new Date()
      },
      {
        uid: 'test-admin',
        email: 'admin-test@test.com',
        firstName: 'אדמין',
        lastName: 'מנהל',
        groups: ['א', 'ב'],
        role: 'admin',
        createdAt: new Date()
      }
    ];

    for (const user of testUsers) {
      await db.collection('profiles').doc(user.uid).set(user);
      console.log(`✅ Created test user: ${user.firstName} ${user.lastName} (${user.groups.join(', ')})`);
    }

    // Step 2: Create test announcements
    console.log('\n2. Creating test announcements...');
    
    const testAnnouncements = [
      {
        title: 'הודעה לקבוצה א בלבד',
        content: 'זו הודעה שמיועדת רק למשתמשים בקבוצה א.\nאם אתה רואה את זה, המערכת עובדת נכון!',
        targetGroups: ['א'],
        type: 'info',
        active: true,
        emailSent: false,
        createdAt: new Date(),
        createdBy: 'test-admin'
      },
      {
        title: 'הודעה לכל המשתמשים',
        content: 'זו הודעה שמיועדת לכל המשתמשים.\nכל המשתמשים צריכים לראות את ההודעה הזו.',
        targetGroups: ['ALL'],
        type: 'success',
        active: true,
        emailSent: false,
        createdAt: new Date(),
        createdBy: 'test-admin'
      },
      {
        title: 'הודעה דחופה לקבוצות א+ב',
        content: 'זו הודעה דחופה שמיועדת לקבוצות א ו-ב.\nיש לפעול בהתאם להוראות.',
        targetGroups: ['א', 'ב'],
        type: 'urgent',
        active: true,
        emailSent: false,
        createdAt: new Date(),
        createdBy: 'test-admin'
      }
    ];

    for (const announcement of testAnnouncements) {
      const docRef = await db.collection('announcements').add(announcement);
      console.log(`✅ Created announcement: "${announcement.title}" (ID: ${docRef.id})`);
    }

    // Step 3: Test announcement filtering logic
    console.log('\n3. Testing announcement filtering...');
    
    // Simulate what each user should see
    for (const user of testUsers) {
      console.log(`\n🔍 Testing announcements for ${user.firstName} ${user.lastName} (groups: ${user.groups.join(', ')}):`);
      
      const announcementsQuery = await db.collection('announcements')
        .where('active', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      const allAnnouncements = announcementsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const relevantAnnouncements = allAnnouncements.filter(announcement => {
        const targetGroups = announcement.targetGroups || [];
        
        // If targeting all groups
        if (targetGroups.includes('ALL')) {
          return true;
        }
        
        // Check if user has any of the target groups
        return targetGroups.some(targetGroup => user.groups.includes(targetGroup));
      });

      console.log(`   Should see ${relevantAnnouncements.length} announcements:`);
      relevantAnnouncements.forEach(ann => {
        console.log(`   - "${ann.title}" (targets: ${ann.targetGroups.join(', ')})`);
      });
    }

    // Step 4: Test email sending API
    console.log('\n4. Testing email sending API...');
    
    const emailTestData = {
      announcementId: 'test-announcement',
      title: 'בדיקת מערכת מייל',
      content: 'זו בדיקה של מערכת המייל.',
      targetGroups: ['א'],
      type: 'info'
    };

    try {
      const response = await fetch('http://localhost:3001/api/send-announcement-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailTestData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email API test successful:', result.message);
      } else {
        const error = await response.text();
        console.log('⚠️ Email API test failed:', response.status, error);
      }
    } catch (error) {
      console.log('⚠️ Email API test error:', error.message);
    }

    console.log('\n✅ Test flow completed! Now check manually:');
    console.log('1. Go to http://localhost:3001/admin');
    console.log('2. Login and go to "ניהול הודעות" tab');
    console.log('3. You should see the test announcements created');
    console.log('4. Try sending email for one of them');
    console.log('5. Go to http://localhost:3001/account');
    console.log('6. Login as different test users to see filtered announcements');
    
    console.log('\n📧 Test user logins:');
    testUsers.forEach(user => {
      console.log(`- ${user.email} (${user.groups.join(', ')}) - should see relevant announcements`);
    });

  } catch (error) {
    console.error('❌ Test flow error:', error);
  }
}

testAnnouncementFlow();