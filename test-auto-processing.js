#!/usr/bin/env node

/**
 * Test Auto-Processing with Triple Jay's Message
 * This tests the automatic processing system with the actual message
 */

require('dotenv').config();
const axios = require('axios');

async function testAutoProcessing() {
  console.log('🤖 Testing Auto-Processing System\n');
  
  const ngrokUrl = 'https://3bd3ea0501a9.ngrok-free.app';
  console.log(`🌐 ngrok URL: ${ngrokUrl}`);
  console.log('');

  // Triple Jay's actual message from Ghala Rails
  const tripleJayMessage = {
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
                  id: "wamid.HBgMMjU1NzU2NjQ1OTM1FQIAEhggQUM3NDM5NDU0MjFDQjEyRDhERDY1QjlDMDZDOUE5MjkA",
                  timestamp: "1768647430",
                  text: {
                    body: "Mambo"
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

  console.log('📱 **Testing with Triple Jay\'s Actual Message**:');
  console.log('   From: Triple Jay (+255756645935)');
  console.log('   Message: "Mambo"');
  console.log('   To: +255683859574');
  console.log('');

  try {
    // Test auto-processing webhook
    console.log('🔔 **Sending to Auto-Processing Webhook**...');
    const response = await axios.post(`${ngrokUrl}/webhook/auto`, tripleJayMessage, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    if (response.data.success) {
      console.log('🎉 **AUTO-PROCESSING SUCCESSFUL!**');
      console.log(`   ✅ Customer: ${response.data.customer}`);
      console.log(`   ✅ Phone: +${response.data.phone}`);
      console.log(`   ✅ Message Type: ${response.data.messageType}`);
      console.log(`   ✅ Session State: ${response.data.sessionState}`);
      console.log(`   ✅ Auto-Sent: ${response.data.autoSent ? 'Yes' : 'No'}`);
      console.log('');
      console.log('📤 **Triple Jay should have received**:');
      console.log('   • Smart response to "Mambo"');
      console.log('   • Interactive buttons for car rental options');
      console.log('   • Personalized welcome message');
    } else {
      console.log('❌ **AUTO-PROCESSING FAILED**');
      console.log(`   Error: ${response.data.error}`);
    }

  } catch (error) {
    console.log('💥 **AUTO-PROCESSING ERROR**');
    console.log(`   Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
    }
  }

  console.log('');
  console.log('🔧 **Next Steps for Full Auto-Processing**:');
  console.log('');
  console.log('1. **Configure Ghala Rails Webhook**:');
  console.log(`   • Callback URL: ${ngrokUrl}/webhook/auto`);
  console.log('   • Verify Token: carrentalpro_verify_2024');
  console.log('');
  console.log('2. **Test Auto-Processing**:');
  console.log('   • Ask Triple Jay to send another message');
  console.log('   • Message will be automatically processed');
  console.log('   • Response will be automatically sent');
  console.log('');
  console.log('3. **Monitor Auto-Processing**:');
  console.log('   • ngrok Web Interface: http://127.0.0.1:4040');
  console.log('   • Auto-processing server logs');
  console.log('   • Ghala Rails message logs');
}

// Test multiple messages for auto-processing
async function testMultipleAutoMessages() {
  console.log('\n🧪 **Testing Multiple Auto-Messages**\n');
  
  const ngrokUrl = 'https://3bd3ea0501a9.ngrok-free.app';
  
  const testMessages = [
    { from: '255756645935', name: 'Triple Jay', message: 'Hi' },
    { from: '255756645935', name: 'Triple Jay', message: 'I want to rent a car' },
    { from: '255756645935', name: 'Triple Jay', message: 'Show me SUVs' },
    { from: '254700123456', name: 'Customer B', message: 'What are your prices?' },
    { from: '255756645935', name: 'Triple Jay', message: '1' }
  ];

  for (let i = 0; i < testMessages.length; i++) {
    const msg = testMessages[i];
    
    console.log(`${i + 1}️⃣ **Auto-Processing**: ${msg.name} - "${msg.message}"`);
    
    try {
      const testPayload = {
        phone_number: `+${msg.from}`,
        message: msg.message,
        name: msg.name
      };

      const response = await axios.post(`${ngrokUrl}/test/auto`, testPayload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        console.log(`   ✅ Auto-processed successfully`);
        console.log(`   🤖 Bot response generated and sent`);
      } else {
        console.log(`   ❌ Auto-processing failed: ${response.data.error}`);
      }

    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('🎉 **Multi-Message Auto-Processing Test Complete!**');
}

// Run the tests
if (require.main === module) {
  testAutoProcessing()
    .then(() => testMultipleAutoMessages())
    .then(() => {
      console.log('\n🚀 **Auto-Processing System Ready!**');
      console.log('');
      console.log('📱 **What Happens Now**:');
      console.log('• Configure Ghala Rails with the auto-webhook URL');
      console.log('• All WhatsApp messages will be processed automatically');
      console.log('• Customers get instant, intelligent responses');
      console.log('• No manual intervention needed!');
      console.log('');
      console.log('🎯 **Your car rental bot is now fully automated!** 🚗✨');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Auto-processing test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testAutoProcessing, testMultipleAutoMessages };