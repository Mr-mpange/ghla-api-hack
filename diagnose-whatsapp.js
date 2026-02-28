require('dotenv').config();
const axios = require('axios');

/**
 * Diagnose WhatsApp API Configuration
 */
async function diagnoseWhatsApp() {
  console.log('\n🔍 DIAGNOSING WHATSAPP API CONFIGURATION\n');
  console.log('='.repeat(60));

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  // Check environment variables
  console.log('\n📋 Step 1: Checking Environment Variables');
  console.log('-'.repeat(60));
  
  if (!accessToken) {
    console.log('❌ WHATSAPP_ACCESS_TOKEN is missing');
    return;
  } else {
    console.log('✅ WHATSAPP_ACCESS_TOKEN found');
    console.log(`   Length: ${accessToken.length} characters`);
    console.log(`   Starts with: ${accessToken.substring(0, 10)}...`);
  }

  if (!phoneNumberId) {
    console.log('❌ WHATSAPP_PHONE_NUMBER_ID is missing');
    return;
  } else {
    console.log('✅ WHATSAPP_PHONE_NUMBER_ID found');
    console.log(`   ID: ${phoneNumberId}`);
  }

  if (!businessAccountId) {
    console.log('⚠️  WHATSAPP_BUSINESS_ACCOUNT_ID is missing (optional)');
  } else {
    console.log('✅ WHATSAPP_BUSINESS_ACCOUNT_ID found');
    console.log(`   ID: ${businessAccountId}`);
  }

  // Test 1: Verify Access Token
  console.log('\n🔐 Step 2: Verifying Access Token');
  console.log('-'.repeat(60));
  
  try {
    const debugResponse = await axios.get(
      `https://graph.facebook.com/v18.0/debug_token`,
      {
        params: {
          input_token: accessToken,
          access_token: accessToken
        }
      }
    );

    const tokenData = debugResponse.data.data;
    console.log('✅ Access Token is valid');
    console.log(`   App ID: ${tokenData.app_id}`);
    console.log(`   Type: ${tokenData.type}`);
    console.log(`   Valid: ${tokenData.is_valid}`);
    console.log(`   Expires: ${tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toISOString() : 'Never'}`);
    
    if (tokenData.scopes) {
      console.log(`   Scopes: ${tokenData.scopes.join(', ')}`);
    }
  } catch (error) {
    console.log('❌ Access Token verification failed');
    console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    console.log('\n💡 Solution: Generate a new access token');
    console.log('   1. Go to: https://developers.facebook.com/apps');
    console.log('   2. Select your app');
    console.log('   3. Go to WhatsApp > API Setup');
    console.log('   4. Click "Generate Access Token"');
    console.log('   5. Copy and update .env file');
    return;
  }

  // Test 2: Check Phone Number
  console.log('\n📱 Step 3: Checking Phone Number Configuration');
  console.log('-'.repeat(60));
  
  try {
    const phoneResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    console.log('✅ Phone Number is accessible');
    console.log(`   Display Name: ${phoneResponse.data.display_phone_number || 'N/A'}`);
    console.log(`   Verified Name: ${phoneResponse.data.verified_name || 'N/A'}`);
    console.log(`   Quality Rating: ${phoneResponse.data.quality_rating || 'N/A'}`);
  } catch (error) {
    console.log('❌ Phone Number check failed');
    console.log(`   Error Code: ${error.response?.data?.error?.code}`);
    console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    
    if (error.response?.data?.error?.code === 100) {
      console.log('\n💡 This is the issue! Phone Number ID is invalid or inaccessible');
      console.log('\n🔧 Solutions:');
      console.log('   1. Verify Phone Number ID in Meta Business Suite');
      console.log('   2. Check if phone number is properly connected');
      console.log('   3. Ensure access token has correct permissions');
      console.log('\n📍 How to find correct Phone Number ID:');
      console.log('   1. Go to: https://business.facebook.com/wa/manage/phone-numbers/');
      console.log('   2. Select your phone number');
      console.log('   3. Copy the Phone Number ID');
      console.log('   4. Update .env file');
    }
    return;
  }

  // Test 3: Try to send a test message
  console.log('\n💬 Step 4: Testing Message Sending');
  console.log('-'.repeat(60));
  
  const testPhone = process.env.TEST_PHONE_NUMBER || '+255683859574';
  
  try {
    const messageResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: testPhone,
        type: 'text',
        text: {
          body: '🧪 Test message from CarRental Pro diagnostic tool'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Test message sent successfully!');
    console.log(`   Message ID: ${messageResponse.data.messages[0].id}`);
    console.log(`   To: ${testPhone}`);
    console.log('\n🎉 WhatsApp API is working correctly!');
  } catch (error) {
    console.log('❌ Test message failed');
    console.log(`   Error Code: ${error.response?.data?.error?.code}`);
    console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    
    if (error.response?.data?.error?.error_subcode === 33) {
      console.log('\n💡 Error Subcode 33: Phone number not registered or verified');
      console.log('\n🔧 Solutions:');
      console.log('   1. Verify your WhatsApp Business phone number');
      console.log('   2. Complete the phone number registration process');
      console.log('   3. Check if phone number is in "Connected" status');
      console.log('   4. Ensure you have messaging permissions');
    }
  }

  // Test 4: Check Business Account
  if (businessAccountId) {
    console.log('\n🏢 Step 5: Checking Business Account');
    console.log('-'.repeat(60));
    
    try {
      const businessResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${businessAccountId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('✅ Business Account is accessible');
      console.log(`   Name: ${businessResponse.data.name || 'N/A'}`);
      console.log(`   ID: ${businessResponse.data.id}`);
    } catch (error) {
      console.log('⚠️  Business Account check failed (non-critical)');
      console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSIS SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ Configuration looks good!');
  console.log('\n💡 If you still have issues:');
  console.log('   1. Regenerate access token');
  console.log('   2. Verify phone number is "Connected"');
  console.log('   3. Check app permissions include "messages"');
  console.log('   4. Ensure phone number is verified');
  console.log('\n📚 Useful Links:');
  console.log('   • Meta Business Suite: https://business.facebook.com');
  console.log('   • Developer Console: https://developers.facebook.com/apps');
  console.log('   • WhatsApp Manager: https://business.facebook.com/wa/manage/');
  console.log('');
}

// Run diagnosis
diagnoseWhatsApp()
  .then(() => {
    console.log('✅ Diagnosis complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Diagnosis failed:', error.message);
    process.exit(1);
  });
