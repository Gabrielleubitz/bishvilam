const admin = require('firebase-admin');

// Initialize Firebase Admin (using existing connection if already initialized)
if (!admin.apps.length) {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64 || 'ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiYmlzaHZpbGFtLWQ5MzgwIiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiN2Y4YTk2ZWJjOTJhN2UyZjMzNTMwOTQzMjdlMzhlNzlkNjE3ZTdlYiIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZRSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2N3Z2dTakFnRUFBb0lCQVFDelQzOHRhMFN2cElBN1xuc2RKZTdwMFI1Vlpqb1pJb3gyN1NaVjAzYkE1MmtoaVlXdGY2VDZHSUUzU2dNbVlsckRObVZvV3RMYmY3VFhWMFxuQ3FHMEFQVFRpY214dzV5L0trTnRBc2RjUldIY2NnWXhjZno3dTVsSVVESWNWajZKSFIwOFg3ZnZoUmJmR3BvQ1xuRFAwNmk1dFRoTzdPcENDYlFvNFRqTFhDSk5wZURjRTBVSXNGYzI4YTVWalNQNzVtUkNMeEVwWmQvT0t6eERQWlxuSTdhc21zSVhDVTRwOU5ob0VyS3pDNG1wa3dvelgzSlJQd1RmN01PN2l1TlBhTHFkekJzeTlSU29NNE12RE1mRVxuaUtTaHpLMnJOaDdwQU9ES1dTWHAycTUrejdkTjNUc3lDUmU1ZmR4d0h3SmRpMnEzSmFobU55U0NKYXJOUlR6alxuMWxBTXorNXJBZ01CQUFFQ2dnRUFUb1ZpZ09ZM2R0OEhsSnlETGpVNXJTdUwwQ2RoMU4rNHBRUGtkUytwaWJ6aVxuYmwxaHRPaUlLUW0wQ2E3b1VsajlUVFJZWjRUY3kzeVpFWTdTVHZ3WU9rWmRmNjNVaDFZZm5xNFgxVTFBMUlOT1xuT1ByY3VQUG01T2JSZXQwOWwxZWJoT081clhiUGxEV1crWXpzbTJXbFNFYXZPT2hncXZ6VE1MWnVwYXp6dnpsMFxuSzQyUlRGYWVHNkZaVnBkT2s0TXk1ZXFMVmdpYjFsTjVGaGxUTlFXWXk3VEdwQjFpL3hBbnE2TTh3L0kzRE51QlxudEl6MmREcXpNSkZUWllvaHZZcVB2SWxFQnNReUp4VFNyT3o0dE9FMjlrN2RuUnhoUHQvNFlrNFk5SE5jZXl2eVxuemsxekQwdXRIOFFiREM2R2xxZXZabEtkUzdIZzNTNjE3bmlBQnBXVkNRS0JnUURzd2NTNGN2MmJnNlhnckFSR1xuRDZVVmtBV1RRcDlpemZvOW5WSk5JMDFJUHFqdkc1Y2gxbjFEUGlzOWkrUjVjRUdBZmV3VW9GamR0YXpWRnNIVFxudUlIWVYydTZVSzhnREU1Vy8rQmlIcnhWL0VycktzTmdROGpvZmRVVkhwZW8zb1M0TkN6WjViTGNjWnpFMVdLc1xubFl2ZEpHa3M1YWIybGNlRUsrTmpvQXpFOVFLQmdRREI0bThwMGphbVgwdnB5dmtqWUJadFlJQzBXcjVZMkg2K1xuUi8vU09HcVE5cTZkcjRTRDBWeVNXRjQ4MVlTVUNRVDJqOFA3MThXMnhUZmtFeDY5NytsTDRrZTQ0S2RrQm5lWlxuUWxQcCtMK1VxQ3J2L0Zld1FWVUI5M0NhYWlUdzZkRGM0d3REOHVaajNFZXVYRTF1OUVaaGhyUXVzeFJLVHBrZlxua1FhL3Axekozd0tCZ0hhYXIzRHpjaWE0OFowMnIwRmx6djZaVXFHdDYyaTA1UnArdUY4YVF6bmc0Z0krb1J4N1xuZGU3OHN1NjNLUExKRUpkTS9icHJoWGt6N093bTVWeXAvcW9oU1Q5aDhna3RBUVhHVTJMMElNYzJoMVY5NjdoS1xuM05mVFNhNjF6Nlh5S3l5WVBxdTl6VGR2MXVnb09iRlpqV0p3UGh3V3craWRxZ0NGZC9sTmtYZ05Bb0dBQk5pSlxuK3J1Y1RoQTNyNEk1TTk4azhGcm5ISnJnQXd4MkxuOVNMNGpsY1BZWmF5dUYzbDJQT01Fb3FkQ1VYYmJUL3UyY1xuOG1CME9wczNTR1lKOEtsY1pWOGtkOFIxcXBSV3pPZlJmUm1RZ0VDcndnL0dpVXM0dXJIYWlLRjZodUx4SzNRcFxuUmV0K1FxU3d6ZlRVb3A5TVd3ZW8zVG53bWVMWkJPYjFDamsrb25VQ2dZRUFqYjVvQlZ2OVdVMXIycEl2V3hZQlxueGp0cDFJcVVRQ09sRGZBUmlRQzVacmZTUXFqaGszaWV6QncvOHZveUJkT1lGKzlITXBKMmc1c0tuYVhQblhxL1xuMFZsb1VpZ1hCazlnaHYrM3BVUW5KeTkzR0hCMGVocUM3UVJEeWtYYVBkWGtxN2kwbjJoaTFCN3A4TDFqOVNaN1xuQ2ppZjdvQmw2VnI3Z2ZxaW5XUElvQmc9XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAYmlzaHZpbGFtLWQ5MzgwLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjEwMjQ4MzI0MzcxNzQzNDEwMDQyOCIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstZmJzdmMlNDBiaXNodmlsYW0tZDkzODAuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K';
  const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testUserAnnouncementFiltering() {
  console.log('🧪 Testing User Announcement Filtering Logic\n');

  try {
    // Get all announcements and users
    const announcements = await db.collection('announcements').where('active', '==', true).get();
    const profiles = await db.collection('profiles').get();
    
    const allAnnouncements = announcements.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const allUsers = profiles.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📢 Found ${allAnnouncements.length} active announcements`);
    console.log(`👤 Found ${allUsers.length} users\n`);

    // Test filtering logic for each user
    console.log('🔍 Testing announcement visibility for each user:\n');
    
    for (const user of allUsers) {
      console.log(`👤 User: ${user.firstName || 'Unknown'} ${user.lastName || ''} (${user.email})`);
      console.log(`   Groups: ${user.groups?.join(', ') || 'No groups'}`);
      
      const userGroups = user.groups || [];
      const currentDate = new Date();
      
      const relevantAnnouncements = allAnnouncements.filter(announcement => {
        // Check if announcement is expired
        if (announcement.expiresAt) {
          const expiryDate = announcement.expiresAt.toDate ? announcement.expiresAt.toDate() : new Date(announcement.expiresAt);
          if (currentDate > expiryDate) {
            return false;
          }
        }

        // Check if user is in target groups
        const targetGroups = announcement.targetGroups || [];
        
        // If targeting all groups
        if (targetGroups.includes('ALL')) {
          return true;
        }
        
        // Check if user has any of the target groups
        return targetGroups.some(targetGroup => userGroups.includes(targetGroup));
      });

      console.log(`   📄 Should see ${relevantAnnouncements.length} announcements:`);
      relevantAnnouncements.forEach((ann, index) => {
        const typeEmoji = {
          'info': 'ℹ️',
          'warning': '⚠️', 
          'success': '✅',
          'urgent': '🚨'
        }[ann.type] || 'ℹ️';
        
        console.log(`      ${index + 1}. ${typeEmoji} "${ann.title}" (targets: ${ann.targetGroups?.join(', ') || 'None'})`);
      });
      console.log('');
    }

    // Summary of targeting
    console.log('📊 Announcement Targeting Summary:');
    allAnnouncements.forEach((ann, index) => {
      const usersWhoShouldSee = allUsers.filter(user => {
        const userGroups = user.groups || [];
        const targetGroups = ann.targetGroups || [];
        
        if (targetGroups.includes('ALL')) {
          return true;
        }
        
        return targetGroups.some(targetGroup => userGroups.includes(targetGroup));
      });
      
      console.log(`${index + 1}. "${ann.title}" (${ann.targetGroups?.join(', ') || 'None'})`);
      console.log(`   👥 Should be visible to ${usersWhoShouldSee.length} users:`);
      usersWhoShouldSee.forEach(user => {
        console.log(`      - ${user.firstName || 'Unknown'} ${user.lastName || ''} (${user.groups?.join(', ') || 'No groups'})`);
      });
      console.log('');
    });

    console.log('✅ User announcement filtering test completed!');
    
    console.log('\n🎯 Key Verification Points:');
    console.log('1. Users with group "א" should see announcements targeting "א" and "ALL"');
    console.log('2. Users with group "ב" should see announcements targeting "ב" and "ALL"');  
    console.log('3. Users with multiple groups see all relevant announcements');
    console.log('4. Users with no groups only see "ALL" announcements');
    console.log('5. All users see "ALL" targeted announcements');

  } catch (error) {
    console.error('❌ Error testing user announcement filtering:', error.message);
  }
}

testUserAnnouncementFiltering();