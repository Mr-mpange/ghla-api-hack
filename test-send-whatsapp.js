require('dotenv').config();
const axios = require('axios');

/**
 * Test sending actual WhatsApp message
 */
async function testSendWhatsAppMessage() {
  console.log('\n📱 TESTING WHATSAPP MESSAGE SENDING\n');
  console.log('='.repeat(60));

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const testPhone = process.env.TEST_PHONE_NUMBER || '+255683859574';

  // Check configuration
  console.log('\n📋 Configuration Check');
  console.log('-'.repeat(60));
  console.log(`✅ Access Token: ${accessToken ? accessToken.substring(0, 20) + '...' : '❌ Missing'}`);
  console.log(`✅ Phone Number ID: ${phoneNumberId || '❌ Missing'}`);
  console.log(`✅ Test Phone: ${testPhone}`);

  if (!accessToken || !phoneNumberId) {
    console.error('\n❌ Missing required configuration!');
    console.error('Please check your .env file.');
    process.exit(1);
  }

  // Test 1: Send simple text message
  console.log('\n📤 Test 1: Sending Text Message');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: testPhone,
        type: 'text',
        text: {
          body: '🧪 Test message from CarRental Pro!\n\nThis is a test to verify WhatsApp API is working correctly. ✅'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Message sent successfully!');
    console.log(`   Message ID: ${response.data.messages[0].id}`);
    console.log(`   To: ${testPhone}`);
    console.log(`   Status: ${response.data.messages[0].message_status || 'sent'}`);

    // Test 2: Send message with buttons
    console.log('\n📤 Test 2: Sending Interactive Message with Buttons');
    console.log('-'.repeat(60));
    
    const buttonResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: testPhone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: '🚗 Welcome to CarRental Pro!\n\nChoose an option below:'
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'browse_cars',
                  title: '🚗 Browse Cars'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'my_bookings',
                  title: '📋 My Bookings'
                }
              }
            ]
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Interactive message sent successfully!');
    console.log(`   Message ID: ${buttonResponse.data.messages[0].id}`);

    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ WhatsApp API is working correctly!');
    console.log('✅ Messages are being sent successfully');
    console.log('✅ Interactive buttons working');
    console.log('\n💡 Check your WhatsApp at', testPhone);
    console.log('   You should receive 2 test messages');
    console.log('');

  } catch (error) {
    console.log('\n❌ MESSAGE SENDING FAILED');
    console.log('='.repeat(60));
    
    if (error.response) {
      const errorData = error.response.data.error;
      console.log(`\n❌ Error Code: ${errorData.code}`);
      console.log(`❌ Error Type: ${errorData.type}`);
      console.log(`❌ Error Message: ${errorData.message}`);
      
      if (errorData.error_subcode) {
        console.log(`❌ Error Subcode: ${errorData.error_subcode}`);
      }

      // Provide specific solutions
      console.log('\n🔧 SOLUTION:');
      console.log('-'.repeat(60));
      
      if (errorData.code === 100) {
        console.log('This error means your access token is invalid or expired.\n');
        console.log('📝 Steps to fix:');
        console.log('   1. Go to: https://developers.facebook.com/apps');
        console.log('   2. Select your WhatsApp app');
        console.log('   3. Navigate to: WhatsApp → API Setup');
        console.log('   4. Click "Generate Access Token"');
        console.log('   5. Copy the new token');
        console.log('   6. Update WHATSAPP_ACCESS_TOKEN in .env file');
        console.log('   7. Restart the server and run this test again');
        console.log('\n💡 For production: Create a System User for permanent token');
        console.log('   • Go to Meta Business Suite');
        console.log('   • Create System User');
        console.log('   • Generate permanent access token');
      } else if (errorData.code === 190) {
        console.log('Access token has expired.\n');
        console.log('Follow the same steps above to generate a new token.');
      } else {
        console.log('Check the error message above for details.');
        console.log('Visit: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes');
      }
    } else {
      console.log(`\n❌ Network Error: ${error.message}`);
      console.log('\n🔧 Check:');
      console.log('   • Internet connection');
      console.log('   • Firewall settings');
      console.log('   • API endpoint availability');
    }
    
    console.log('');
    process.exit(1);
  }
}

// Run the test
testSendWhatsAppMessage()
  .then(() => {
    console.log('✅ Test completed successfully\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
