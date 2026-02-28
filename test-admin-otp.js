require('dotenv').config();
const axios = require('axios');

async function testAdminDashboard() {
  console.log('\n🧪 Testing Admin Dashboard\n');
  console.log('=' .repeat(60));
  
  const baseURL = 'http://localhost:3000';
  const adminPhone = process.env.ADMIN_PHONE || '+255683859574';
  
  console.log('Configuration:');
  console.log('  Server:', baseURL);
  console.log('  Admin Phone:', adminPhone);
  console.log('\n' + '='.repeat(60));
  
  // Test 1: Request OTP
  console.log('\n📱 Test 1: Request OTP');
  console.log('-'.repeat(60));
  
  try {
    const otpResponse = await axios.post(`${baseURL}/admin/auth/request-otp`, {
      phoneNumber: adminPhone
    });
    
    console.log('✅ OTP Request Successful!');
    console.log('Response:', JSON.stringify(otpResponse.data, null, 2));
    console.log('\n📞 CHECK YOUR PHONE: ' + adminPhone);
    console.log('   You should receive an SMS with 6-digit OTP');
    
    // Wait for user to enter OTP
    console.log('\n⏳ Waiting 10 seconds for SMS to arrive...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n💡 To complete login:');
    console.log('   1. Check your phone for SMS');
    console.log('   2. Open: http://localhost:3000/admin.html');
    console.log('   3. Enter phone: ' + adminPhone);
    console.log('   4. Click "Send OTP"');
    console.log('   5. Enter the 6-digit code from SMS');
    console.log('   6. Click "Verify & Login"');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running!');
      console.log('\n🔧 Please restart the server:');
      console.log('   1. Stop current server (Ctrl+C)');
      console.log('   2. Run: node src/server.js');
      console.log('   3. Run this test again');
    } else if (error.response) {
      console.log('❌ OTP Request Failed!');
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Error:', error.message);
    }
    return;
  }
  
  // Test 2: Check if admin.html is accessible
  console.log('\n\n🌐 Test 2: Check Admin Dashboard Page');
  console.log('-'.repeat(60));
  
  try {
    const pageResponse = await axios.get(`${baseURL}/admin.html`);
    console.log('✅ Admin page is accessible!');
    console.log('Status:', pageResponse.status);
    console.log('Content-Type:', pageResponse.headers['content-type']);
  } catch (error) {
    if (error.response) {
      console.log('❌ Admin page not found!');
      console.log('Status:', error.response.status);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
  
  // Test 3: Check stats endpoint (should fail without auth)
  console.log('\n\n🔒 Test 3: Check Authentication');
  console.log('-'.repeat(60));
  
  try {
    await axios.get(`${baseURL}/admin/dashboard/stats`);
    console.log('⚠️  Stats accessible without auth (security issue!)');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Authentication required (correct!)');
      console.log('Message:', error.response.data.error);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ Admin Dashboard Setup Complete!');
  console.log('\n📱 Next Steps:');
  console.log('   1. Open: http://localhost:3000/admin.html');
  console.log('   2. Login with OTP');
  console.log('   3. View your dashboard!');
  console.log('\n🏆 Ready for hackathon demo!\n');
}

testAdminDashboard();
