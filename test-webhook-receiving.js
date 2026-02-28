require('dotenv').config();
const axios = require('axios');

/**
 * Test if webhook is receiving messages
 */
async function testWebhookReceiving() {
  console.log('\n📨 TESTING WEBHOOK MESSAGE RECEPTION\n');
  console.log('='.repeat(60));

  const ngrokUrl = process.env.APP_URL;
  const testPhone = '+255683859574';

  console.log('\n📋 Configuration:');
  console.log(`   Your Webhook: ${ngrokUrl}/webhook/whatsapp`);
  console.log(`   Verify Token: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN}`);

  console.log('\n💡 IMPORTANT: In Ghala Dashboard');
  console.log('-'.repeat(60));
  console.log('Make sure you have configured:');
  console.log('');
  console.log('Advanced Settings → Forward webhooks to your own server');
  console.log(`  Callback URL: ${ngrokUrl}/webhook/whatsapp`);
  console.log(`  Verify Token: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN}`);
  console.log('  [Save Override] ← Click this button!');

  // Simulate incoming message
  console.log('\n📤 Simulating Incoming WhatsApp Message');
  console.log('-'.repeat(60));

  const webhookPayload = {
    entry: [{
      id: 'entry_123',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: testPhone,
            phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID
          },
          contacts: [{
            profile: {
              name: 'Test Customer'
            },
            wa_id: testPhone.replace(/\+/g, '')
          }],
          messages: [{
            from: testPhone.replace(/\+/g, ''),
            id: `wamid.test_${Date.now()}`,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: 'text',
            text: {
              body: 'Hello, I want to rent a car'
            }
          }]
        },
        field: 'messages'
      }]
    }]
  };

  try {
    const response = await axios.post(
      `${ngrokUrl}/webhook/whatsapp`,
      webhookPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      }
    );

    console.log('✅ Webhook received message successfully!');
    console.log(`   Status: ${response.status}`);
    console.log('\n📊 What happens next:');
    console.log('   1. ✅ Your server receives the message');
    console.log('   2. ✅ Bot processes: "Hello, I want to rent a car"');
    console.log('   3. ✅ Bot generates welcome response');
    console.log('   4. ❌ Bot tries to send response (fails due to token issue)');

    console.log('\n💡 To see bot processing:');
    console.log('   • Check your server terminal logs');
    console.log('   • You should see message processing logs');

  } catch (error) {
    console.log('❌ Webhook test failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }

  // Test with real WhatsApp message
  console.log('\n📱 REAL TEST: Send WhatsApp Message');
  console.log('-'.repeat(60));
  console.log('\n📝 Steps to test with real WhatsApp:');
  console.log('   1. Open WhatsApp on your phone');
  console.log(`   2. Send message to: ${testPhone}`);
  console.log('   3. Type: "Hello"');
  console.log('   4. Check your server logs');
  console.log('   5. You should see webhook received');

  console.log('\n🔍 Verify Ghala Configuration:');
  console.log('-'.repeat(60));
  console.log('   1. Login to Ghala Dashboard');
  console.log('   2. Go to Webhook Configuration');
  console.log('   3. Check "Advanced Settings" section');
  console.log('   4. Ensure webhook override is SAVED');
  console.log(`   5. Callback URL should be: ${ngrokUrl}/webhook/whatsapp`);
  console.log(`   6. Verify Token should be: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN}`);

  console.log('\n✅ If webhook override is configured correctly:');
  console.log('   • Messages sent to your WhatsApp will come to your server');
  console.log('   • Your bot will process them');
  console.log('   • You\'ll see logs in your terminal');

  console.log('\n❌ If webhook override is NOT configured:');
  console.log('   • Messages go to Ghala\'s default webhook');
  console.log('   • Your server won\'t receive anything');
  console.log('   • No logs in your terminal');

  console.log('\n');
}

// Run
testWebhookReceiving()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
