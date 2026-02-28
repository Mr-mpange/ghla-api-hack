/**
 * Test Admin Dashboard Flow
 * This script tests the complete admin authentication flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const ADMIN_PHONE = '+255683859574';

async function testAdminFlow() {
  console.log('🧪 Testing Admin Dashboard Flow\n');

  try {
    // Step 1: Request OTP
    console.log('📱 Step 1: Requesting OTP...');
    const otpResponse = await axios.post(`${BASE_URL}/admin/auth/request-otp`, {
      phoneNumber: ADMIN_PHONE
    });

    console.log('✅ OTP Response:', JSON.stringify(otpResponse.data, null, 2));

    if (otpResponse.data.success) {
      console.log('\n⏳ Waiting for OTP SMS...');
      console.log('📲 Check your phone for the 6-digit code\n');

      // Prompt for OTP
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Enter the OTP code: ', async (otp) => {
        try {
          // Step 2: Verify OTP
          console.log('\n🔐 Step 2: Verifying OTP...');
          const verifyResponse = await axios.post(`${BASE_URL}/admin/auth/verify-otp`, {
            phoneNumber: ADMIN_PHONE,
            otp: otp.trim()
          });

          console.log('✅ Verify Response:', JSON.stringify(verifyResponse.data, null, 2));

          if (verifyResponse.data.success) {
            const sessionToken = verifyResponse.data.sessionToken;
            console.log('\n🎉 Login Successful!');
            console.log('🔑 Session Token:', sessionToken);

            // Step 3: Test Dashboard Stats
            console.log('\n📊 Step 3: Fetching Dashboard Stats...');
            const statsResponse = await axios.get(`${BASE_URL}/admin/dashboard/stats`, {
              headers: {
                'X-Session-Token': sessionToken
              }
            });

            console.log('✅ Stats:', JSON.stringify(statsResponse.data, null, 2));

            // Step 4: Test Bookings
            console.log('\n📋 Step 4: Fetching Bookings...');
            const bookingsResponse = await axios.get(`${BASE_URL}/admin/bookings?limit=5`, {
              headers: {
                'X-Session-Token': sessionToken
              }
            });

            console.log('✅ Bookings:', JSON.stringify(bookingsResponse.data, null, 2));

            console.log('\n✅ All tests passed! Admin dashboard is working perfectly! 🎉');
          } else {
            console.log('\n❌ OTP verification failed:', verifyResponse.data.error);
          }
        } catch (error) {
          console.error('\n❌ Error during verification:', error.response?.data || error.message);
        } finally {
          readline.close();
        }
      });
    } else {
      console.log('\n❌ Failed to send OTP:', otpResponse.data.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Server is not running!');
      console.log('Start the server with: node src/server.js');
    }
  }
}

// Run the test
testAdminFlow();
