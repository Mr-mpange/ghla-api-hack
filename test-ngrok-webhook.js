require('dotenv').config();
const axios = require('axios');

/**
 * Test ngrok webhook with proper headers
 */
async function testNgrokWebhook() {
  console.log('\n🌐 TESTING NGROK WEBHOOK\n');
  console.log('='.repeat(60));

  const ngrokUrl = process.env.APP_URL;
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  console.log(`\n📋 Configuration:`);
  console.log(`   ngrok URL: ${ngrokUrl}`);
  console.log(`   Verify Token: ${verifyToken}`);

  // Test webhook verification
  console.log('\n✅ Testing Webhook Verification');
  console.log('-'.repeat(60));

  try {
    const response = await axios.get(`${ngrokUrl}/webhook/whatsapp`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': verifyToken,
        'hub.challenge': 'test_challenge_12345'
      },
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Meta-WhatsApp/1.0'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response: ${response.data}`);
    
    if (response.data === 'test_challenge_12345') {
      console.log('\n🎉 SUCCESS! Webhook verification working!');
      console.log('\n📝 Use these settings in Meta:');
      console.log(`   Callback URL: ${ngrokUrl}/webhook/whatsapp`);
      console.log(`   Verify Token: ${verifyToken}`);
    } else {
      console.log('\n⚠️  Unexpected response');
    }

  } catch (error) {
    console.log('❌ Test failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }

  // Test health endpoint
  console.log('\n✅ Testing Health Endpoint');
  console.log('-'.repeat(60));

  try {
    const healthResponse = await axios.get(`${ngrokUrl}/health`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    console.log(`✅ Status: ${healthResponse.status}`);
    console.log(`✅ Server: ${healthResponse.data.status}`);
    console.log(`✅ WhatsApp: ${healthResponse.data.services.whatsapp.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`✅ Payment: ${healthResponse.data.services.payment.enabled ? 'Enabled' : 'Disabled'}`);

  } catch (error) {
    console.log('❌ Health check failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ Your ngrok tunnel is working!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Go to: https://developers.facebook.com/apps');
  console.log('   2. Select your app → WhatsApp → Configuration');
  console.log('   3. Click "Edit" next to Webhook');
  console.log('   4. Enter:');
  console.log(`      Callback URL: ${ngrokUrl}/webhook/whatsapp`);
  console.log(`      Verify Token: ${verifyToken}`);
  console.log('   5. Click "Verify and Save"');
  console.log('   6. Subscribe to "messages" field');
  console.log('\n💡 Meta will verify the webhook automatically!');
  console.log('');
}

// Run test
testNgrokWebhook()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
