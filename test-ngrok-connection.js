#!/usr/bin/env node

/**
 * Test ngrok Connection
 * This tests your ngrok webhook connection with the actual URL
 */

require('dotenv').config();
const axios = require('axios');

async function testNgrokConnection() {
  console.log('🧪 Testing ngrok Webhook Connection\n');
  
  const ngrokUrl = 'https://3bd3ea0501a9.ngrok-free.app';
  console.log(`🌐 ngrok URL: ${ngrokUrl}`);
  console.log(`📡 Web Interface: http://127.0.0.1:4040`);
  console.log('');
  
  console.log('📋 Webhook Configuration for Ghala Rails:');
  console.log('─'.repeat(60));
  console.log(`**Callback URL**: ${ngrokUrl}/webhook/ghala`);
  console.log(`**Verify Token**: carrentalpro_verify_2024`);
  console.log('');
  
  console.log('🧪 Testing Webhook Endpoints:\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${ngrokUrl}/health`);
    console.log('✅ Health Check: OK');
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   WhatsApp Configured: ${healthResponse.data.env.whatsapp_configured}`);
    console.log('');
    
    // Test 2: Webhook Verification
    console.log('2️⃣ Testing Webhook Verification...');
    const verifyResponse = await axios.get(`${ngrokUrl}/webhook/ghala`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'carrentalpro_verify_2024',
        'hub.challenge': 'test_challenge_123'
      }
    });
    console.log('✅ Webhook Verification: OK');
    console.log(`   Challenge Response: ${verifyResponse.data}`);
    console.log('');
    
    // Test 3: Test Message Processing
    console.log('3️⃣ Testing Message Processing...');
    const testMessage = {
      phone_number: '+255756645935',
      message: 'Hi',
      name: 'Triple Jay'
    };
    
    const messageResponse = await axios.post(`${ngrokUrl}/webhook/ghala/test`, testMessage, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Message Processing: OK');
    console.log(`   Success: ${messageResponse.data.success}`);
    console.log(`   Customer: ${messageResponse.data.test_data.name}`);
    console.log(`   Phone: +${messageResponse.data.test_data.from}`);
    console.log('');
    
    // Test 4: Simulate WhatsApp Webhook
    console.log('4️⃣ Testing WhatsApp Webhook Format...');
    const whatsappWebhook = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "1783010772397699",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "255683859574",
                  phone_number_id: "910852788786740"
                },
                contacts: [
                  {
                    profile: {
                      name: "Triple Jay"
                    },
                    wa_id: "255756645935"
                  }
                ],
                messages: [
                  {
                    from: "255756645935",
                    id: "wamid.test123",
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: {
                      body: "I want to rent a car"
                    },
                    type: "text"
                  }
                ]
              },
              field: "messages"
            }
          ]
        }
      ]
    };
    
    const webhookResponse = await axios.post(`${ngrokUrl}/webhook/ghala`, whatsappWebhook, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ WhatsApp Webhook Format: OK');
    console.log(`   Success: ${webhookResponse.data.success}`);
    console.log(`   Customer: ${webhookResponse.data.customer}`);
    console.log(`   Message ID: ${webhookResponse.data.messageId || 'Generated'}`);
    console.log('');
    
    console.log('🎉 All Tests Passed!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Go to your Ghala Rails dashboard');
    console.log('2. Set webhook configuration:');
    console.log(`   • Callback URL: ${ngrokUrl}/webhook/ghala`);
    console.log('   • Verify Token: carrentalpro_verify_2024');
    console.log('3. Save the webhook settings');
    console.log('4. Send "Hi" to your WhatsApp: +255683859574');
    console.log('5. Triple Jay should get an automatic response!');
    console.log('');
    console.log('🔍 Monitor Requests:');
    console.log('• ngrok Web Interface: http://127.0.0.1:4040');
    console.log('• Check your webhook server terminal for logs');
    console.log('');
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure your webhook server is running');
    console.log('2. Check if ngrok tunnel is active');
    console.log('3. Verify the ngrok URL is correct');
    console.log('4. Check your .env file configuration');
  }
}

// Run the test
if (require.main === module) {
  testNgrokConnection()
    .then(() => {
      console.log('\n✅ ngrok connection test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testNgrokConnection };