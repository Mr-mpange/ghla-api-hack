require('dotenv').config();
const axios = require('axios');

/**
 * Test sending message - try different recipient formats
 */
async function testSendToSelf() {
  console.log('\n📱 TESTING DIFFERENT RECIPIENT FORMATS\n');
  console.log('='.repeat(60));

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  const testNumbers = [
    '+255683859574',      // With + and spaces
    '255683859574',       // Without +
    '255 683 859 574',    // With spaces
    '255683859574'        // Clean format
  ];

  for (const testPhone of testNumbers) {
    console.log(`\n📤 Testing with: "${testPhone}"`);
    console.log('-'.repeat(60));

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: testPhone,
          type: 'text',
          text: {
            body: `Test message to ${testPhone}`
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ SUCCESS!');
      console.log(`   Message ID: ${response.data.messages[0].id}`);
      console.log(`   Status: ${response.data.messages[0].message_status || 'sent'}`);
      console.log('\n🎉 Found working format!');
      console.log(`   Use this format: "${testPhone}"`);
      break;

    } catch (error) {
      if (error.response) {
        const errorData = error.response.data.error;
        console.log(`❌ Failed: ${errorData.message}`);
        
        if (errorData.error_subcode) {
          console.log(`   Subcode: ${errorData.error_subcode}`);
        }
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('\n💡 If all formats failed, the issue might be:');
  console.log('   1. Phone number not verified in Meta');
  console.log('   2. 24-hour messaging window expired (need template)');
  console.log('   3. Account restrictions');
  console.log('   4. Need to send from Meta test number first');
  console.log('\n📝 Try this:');
  console.log('   1. Go to Meta Developer Console');
  console.log('   2. WhatsApp → API Setup');
  console.log('   3. Use "Send test message" feature');
  console.log('   4. If that works, copy the exact format they use');
  console.log('');
}

// Run
testSendToSelf()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
