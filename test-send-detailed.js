require('dotenv').config();
const axios = require('axios');

/**
 * Detailed test with more error information
 */
async function testSendDetailed() {
  console.log('\n📱 DETAILED WHATSAPP SEND TEST\n');
  console.log('='.repeat(60));

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const testPhone = process.env.TEST_PHONE_NUMBER || '+255683859574';

  console.log('\n📋 Configuration:');
  console.log(`   Phone Number ID: ${phoneNumberId}`);
  console.log(`   Test Phone: ${testPhone}`);

  // Test 1: Simple text message
  console.log('\n📤 Test 1: Sending Simple Text Message');
  console.log('-'.repeat(60));

  const payload = {
    messaging_product: 'whatsapp',
    to: testPhone,
    type: 'text',
    text: {
      body: 'Test message'
    }
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('\n❌ FAILED');
    
    if (error.response) {
      console.log('\nFull Error Response:');
      console.log(JSON.stringify(error.response.data, null, 2));

      const errorData = error.response.data.error;
      
      if (errorData.error_data) {
        console.log('\nError Data Details:');
        console.log(JSON.stringify(errorData.error_data, null, 2));
      }

      if (errorData.error_user_title) {
        console.log(`\nUser Title: ${errorData.error_user_title}`);
      }

      if (errorData.error_user_msg) {
        console.log(`User Message: ${errorData.error_user_msg}`);
      }

      // Check specific error codes
      if (errorData.code === 100 && errorData.error_subcode) {
        console.log(`\n💡 Error Subcode: ${errorData.error_subcode}`);
        
        switch(errorData.error_subcode) {
          case 33:
            console.log('   Meaning: Phone number not registered or permissions issue');
            break;
          case 2388116:
            console.log('   Meaning: Message template required (24-hour window expired)');
            break;
          case 131031:
            console.log('   Meaning: Recipient phone number not valid');
            break;
          default:
            console.log('   Check: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes');
        }
      }
    } else {
      console.log(`\nError: ${error.message}`);
    }
  }

  console.log('\n');
}

// Run
testSendDetailed()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
