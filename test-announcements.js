const { spawn } = require('child_process');

async function testAnnouncementFlow() {
  console.log('🧪 Testing Announcement System Flow...\n');

  // Test 1: Check if we can connect to the dev server
  console.log('1. Testing server connection...');
  try {
    const response = await fetch('http://localhost:3001/api/admin/check-admins');
    if (response.ok) {
      console.log('✅ Server is running and API is accessible\n');
    } else {
      console.log('❌ Server API not responding correctly\n');
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    console.log('Make sure the dev server is running on port 3001\n');
    return;
  }

  // Test 2: Create a test announcement via API
  console.log('2. Testing announcement creation...');
  const testAnnouncement = {
    title: 'Test Announcement - System Check',
    content: 'This is a test announcement to verify the system is working correctly.\n\nIf you see this, the announcement system is functioning!',
    targetGroups: ['ALL'], // Send to all users
    type: 'info',
    active: true
  };

  try {
    const createResponse = await fetch('http://localhost:3001/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAnnouncement),
    });

    if (createResponse.ok) {
      console.log('✅ Test announcement created successfully\n');
    } else {
      const error = await createResponse.text();
      console.log('⚠️ Announcement creation response:', createResponse.status, error);
      console.log('Note: This might be expected if the API endpoint requires authentication\n');
    }
  } catch (error) {
    console.log('⚠️ Could not create test announcement:', error.message);
    console.log('This might be expected if the API requires authentication\n');
  }

  // Test 3: Check email service configuration
  console.log('3. Testing email service configuration...');
  try {
    const emailTest = await fetch('http://localhost:3001/api/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com'
      }),
    });

    if (emailTest.ok) {
      const emailResult = await emailTest.json();
      console.log('✅ Email service response:', emailResult.success ? 'Working' : 'Not configured');
    } else {
      console.log('⚠️ Email service might not be configured');
    }
  } catch (error) {
    console.log('⚠️ Could not test email service:', error.message);
  }

  console.log('\n📋 Manual Testing Checklist:');
  console.log('1. Go to http://localhost:3001/admin');
  console.log('2. Navigate to "ניהול הודעות" tab');
  console.log('3. Create a test announcement targeting specific groups');
  console.log('4. Send email notification');
  console.log('5. Go to http://localhost:3001/account');
  console.log('6. Check that announcement appears in "הודעות" tab');
  console.log('7. Verify users in targeted groups receive emails');
  
  console.log('\n🔧 System URLs:');
  console.log('- Admin Panel: http://localhost:3001/admin');
  console.log('- User Account: http://localhost:3001/account');
  console.log('- Login: http://localhost:3001/login');
  
  console.log('\n📧 Email Testing:');
  console.log('- Use the Email Tester in admin panel');
  console.log('- Check admin emails in database');
  console.log('- Verify Mailjet configuration');
}

testAnnouncementFlow().catch(console.error);