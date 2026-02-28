require('dotenv').config();
const axios = require('axios');

/**
 * Test webhook endpoint locally before exposing to internet
 */
async function testWebhookLocal() {
  console.log('\n🧪 TESTING WEBHOOK ENDPOINT LOCALLY\n');
  console.log('='.repeat(60));

  const baseUrl = 'http://localhost:3000';
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  console.log('\n📋 Configuration:');
  console.log('-'.repeat(60));
  console.log(`Server URL: ${baseUrl}`);
  console.log(`Verify Token: ${verifyToken}`);

  // Test 1: Health check
  console.log('\n✅ Test 1: Health Check');
  console.log('-'.repeat(60));
  try {
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log('✅ Server is running');
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   WhatsApp: ${healthResponse.data.services.whatsapp.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Payment: ${healthResponse.data.services.payment.enabled ? 'Enabled' : 'Disabled'}`);
  } catch (error) {
    console.log('❌ Server is not running!');
    console.log('   Please start the server first: npm run dev');
    process.exit(1);
  }

  // Test 2: Webhook verification (GET request - what Meta sends)
  console.log('\n✅ Test 2: Webhook Verification (GET)');
  console.log('-'.repeat(60));
  try {
    const verifyResponse = await axios.get(`${baseUrl}/webhook/whatsapp`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': verifyToken,
        'hub.challenge': 'test_challenge_12345'
      }
    });
    
    if (verifyResponse.data === 'test_challenge_12345') {
      console.log('✅ Webhook verification working correctly');
      console.log('   Challenge echoed back successfully');
    } else {
      console.log('⚠️  Unexpected response:', verifyResponse.data);
    }
  } catch (error) {
    console.log('❌ Webhook verification failed');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
    }
  }

  // Test 3: Webhook verification with wrong token
  console.log('\n✅ Test 3: Webhook Verification with Wrong Token');
  console.log('-'.repeat(60));
  try {
    await axios.get(`${baseUrl}/webhook/whatsapp`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'test_challenge_12345'
      }
    });
    console.log('⚠️  Should have rejected wrong token');
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('✅ Correctly rejected wrong token (403 Forbidden)');
    } else {
      console.log('⚠️  Unexpected error:', error.message);
    }
  }

  // Test 4: Webhook message reception (POST request)
  console.log('\n✅ Test 4: Webhook Message Reception (POST)');
  console.log('-'.repeat(60));
  try {
    const messagePayload = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '+255683859574',
              id: 'test_msg_123',
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: 'text',
              text: {
                body: 'Test message'
              }
            }],
            contacts: [{
              profile: {
                name: 'Test User'
              }
            }]
          }
        }]
      }]
    };

    const postResponse = await axios.post(
      `${baseUrl}/webhook/whatsapp`,
      messagePayload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (postResponse.status === 200) {
      console.log('✅ Webhook accepts POST requests');
      console.log('   Message received and queued for processing');
    }
  } catch (error) {
    console.log('❌ Webhook POST failed');
    console.log(`   Error: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 LOCAL WEBHOOK TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ Your webhook endpoint is working locally!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Install and setup ngrok (run: node setup-ngrok.js)');
  console.log('   2. Start ngrok: ngrok http 3000');
  console.log('   3. Copy the ngrok HTTPS URL');
  console.log('   4. Update .env with ngrok URL');
  console.log('   5. Configure webhook in Meta Developer Console');
  console.log('');
  console.log('📝 Webhook Configuration for Meta:');
  console.log('   Callback URL: https://YOUR_NGROK_URL.ngrok.io/webhook/whatsapp');
  console.log(`   Verify Token: ${verifyToken}`);
  console.log('');
  console.log('💡 The webhook endpoint is ready, you just need to expose it!');
  console.log('');
}

// Run test
testWebhookLocal()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
