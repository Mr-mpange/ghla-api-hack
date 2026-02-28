require('dotenv').config();
const axios = require('axios');

/**
 * Manually send a webhook to test if server receives it
 */
async function manualWebhookTest() {
  console.log('\n🧪 MANUAL WEBHOOK TEST\n');
  console.log('='.repeat(60));
  console.log('\nThis will send a fake WhatsApp message to your server');
  console.log('to verify it can receive and process webhooks.\n');

  const serverUrl = 'http://localhost:3000';
  
  // Realistic WhatsApp webhook payload
  const webhookPayload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: '1959698131618622',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '255683859574',
            phone_number_id: '994495747086170'
          },
          contacts: [{
            profile: {
              name: 'Test User'
            },
            wa_id: '255683859574'
          }],
          messages: [{
            from: '255683859574',
            id: 'wamid.test_' + Date.now(),
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

  console.log('📤 Sending webhook to:', serverUrl + '/webhook/whatsapp');
  console.log('📝 Message: "Hello, I want to rent a car"');
  console.log('-'.repeat(60));

  try {
    const response = await axios.post(
      serverUrl + '/webhook/whatsapp',
      webhookPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ SUCCESS! Server received webhook');
    console.log(`   Status: ${response.status}`);
    console.log('\n📊 What this means:');
    console.log('   ✅ Your server CAN receive webhooks');
    console.log('   ✅ Webhook endpoint is working');
    console.log('   ✅ Bot will process messages');
    console.log('\n⚠️  The problem is:');
    console.log('   ❌ Ghala is NOT sending webhooks to your server');
    console.log('   ❌ Webhook override is not active in Ghala');
    console.log('\n🔧 Solution:');
    console.log('   1. Check Ghala dashboard webhook configuration');
    console.log('   2. Ensure "Save Override" was clicked');
    console.log('   3. Verify webhook override toggle is ON');
    console.log('   4. Check http://localhost:4040 for incoming requests');
    console.log('   5. Contact Ghala support if needed');

  } catch (error) {
    console.log('\n❌ FAILED! Server did not receive webhook');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Server is not running!');
      console.log('   Start server: npm run dev');
    } else {
      console.log(`\n   Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 NEXT STEPS');
  console.log('='.repeat(60));
  console.log('\n1. Open ngrok web interface: http://localhost:4040');
  console.log('2. Send a real WhatsApp message to: +255 683 859 574');
  console.log('3. Check if POST request appears in ngrok interface');
  console.log('\n   ✅ If you see POST request: Ghala is sending webhooks');
  console.log('   ❌ If no POST request: Ghala webhook override not active');
  console.log('\n4. If no requests in ngrok:');
  console.log('   • Go to Ghala dashboard');
  console.log('   • Webhook Configuration → Advanced Settings');
  console.log('   • Make sure override is SAVED and ENABLED');
  console.log('   • Click "Save Override" button again');
  console.log('   • Try sending WhatsApp message again');
  console.log('');
}

// Run
manualWebhookTest()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
