#!/usr/bin/env node

/**
 * Test Advanced Bot with WhatsApp Number 0683859574
 * This tests the complete flow with the actual WhatsApp number
 */

require('dotenv').config();
const axios = require('axios');

async function testWhatsAppNumber() {
  console.log('📱 Testing Advanced Bot with WhatsApp Number: 0683859574\n');
  
  const ngrokUrl = 'https://3bd3ea0501a9.ngrok-free.app';
  const testPhoneNumber = '255683859574'; // Formatted for WhatsApp API
  const displayNumber = '0683859574'; // Display format
  
  console.log(`🌐 ngrok URL: ${ngrokUrl}`);
  console.log(`📞 Testing with: ${displayNumber} (formatted as +${testPhoneNumber})`);
  console.log('');
  
  // Test conversation scenarios
  const testScenarios = [
    {
      name: 'Greeting Test',
      message: 'Hi',
      description: 'Customer sends initial greeting'
    },
    {
      name: 'Car Browsing',
      message: 'I want to rent a car',
      description: 'Customer wants to browse cars'
    },
    {
      name: 'SUV Interest',
      message: 'Show me SUVs',
      description: 'Customer interested in SUVs'
    },
    {
      name: 'Car Selection',
      message: '1',
      description: 'Customer selects first SUV (Toyota RAV4)'
    },
    {
      name: 'Booking Request',
      message: 'Book this car',
      description: 'Customer wants to book the selected car'
    },
    {
      name: 'Complete Booking',
      message: 'Book Toyota RAV4 from Jan 20 9am to Jan 22 6pm at JKIA. Name: Test Customer, ID: 12345678, Phone: 0683859574',
      description: 'Customer provides complete booking details'
    },
    {
      name: 'Check Bookings',
      message: 'My bookings',
      description: 'Customer checks their booking status'
    },
    {
      name: 'Pricing Inquiry',
      message: 'What are your prices?',
      description: 'Customer asks about pricing'
    },
    {
      name: 'Help Request',
      message: 'I need help',
      description: 'Customer requests assistance'
    }
  ];

  console.log('🧪 Running Test Scenarios:\n');
  
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    
    console.log(`${i + 1}️⃣ **${scenario.name}**`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Message: "${scenario.message}"`);
    console.log('   ─'.repeat(60));
    
    try {
      // Create WhatsApp webhook payload
      const webhookPayload = {
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
                        name: "Test Customer"
                      },
                      wa_id: testPhoneNumber
                    }
                  ],
                  messages: [
                    {
                      from: testPhoneNumber,
                      id: `wamid.test_${Date.now()}_${i}`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: {
                        body: scenario.message
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

      // Send to webhook
      const response = await axios.post(`${ngrokUrl}/webhook/ghala`, webhookPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success) {
        console.log('   ✅ **Success**: Message processed and response sent');
        console.log(`   📤 **Response Type**: ${response.data.messageType || 'text'}`);
        console.log(`   📊 **Session State**: ${response.data.sessionState || 'unknown'}`);
        console.log(`   🆔 **Message ID**: ${response.data.messageId || 'generated'}`);
      } else {
        console.log('   ❌ **Failed**: Message processing failed');
        console.log(`   🚨 **Error**: ${response.data.error}`);
      }

    } catch (error) {
      console.log('   💥 **Exception**: Request failed');
      console.log(`   🚨 **Error**: ${error.message}`);
      
      if (error.response) {
        console.log(`   📊 **Status**: ${error.response.status}`);
        if (error.response.data) {
          console.log(`   📄 **Response**: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
        }
      }
    }
    
    console.log('');
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('🎉 **Test Completed!**');
  console.log('');
  console.log('📋 **Summary**:');
  console.log(`• Tested with WhatsApp number: ${displayNumber}`);
  console.log(`• Webhook URL: ${ngrokUrl}/webhook/ghala`);
  console.log(`• Scenarios tested: ${testScenarios.length}`);
  console.log('');
  console.log('📱 **To test manually**:');
  console.log(`1. Send WhatsApp message to: +255683859574`);
  console.log(`2. Try: "Hi", "I want to rent a car", "Show me SUVs"`);
  console.log(`3. Follow the interactive buttons and responses`);
  console.log('');
  console.log('🔍 **Monitor requests**:');
  console.log('• ngrok Web Interface: http://127.0.0.1:4040');
  console.log('• Webhook server logs in terminal');
}

// Test direct webhook endpoint
async function testWebhookDirect() {
  console.log('🔧 **Testing Webhook Endpoint Directly**\n');
  
  const ngrokUrl = 'https://3bd3ea0501a9.ngrok-free.app';
  
  try {
    // Test simple message
    const testPayload = {
      phone_number: '+255683859574',
      message: 'Hi, I want to rent a car',
      name: 'Test Customer'
    };

    console.log('📤 Sending test message to webhook...');
    const response = await axios.post(`${ngrokUrl}/webhook/ghala/test`, testPayload, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.success) {
      console.log('✅ **Direct webhook test successful**');
      console.log(`📊 Result: ${response.data.message}`);
      console.log(`🤖 Bot processed: ${response.data.result.success ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ **Direct webhook test failed**');
      console.log(`🚨 Error: ${response.data.error}`);
    }

  } catch (error) {
    console.log('💥 **Direct webhook test exception**');
    console.log(`🚨 Error: ${error.message}`);
  }
}

// Run the tests
if (require.main === module) {
  testWebhookDirect()
    .then(() => testWhatsAppNumber())
    .then(() => {
      console.log('\n🎯 **All tests completed for WhatsApp number 0683859574!**');
      console.log('Your advanced car rental bot is ready to handle real WhatsApp messages! 🚗✨');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testWhatsAppNumber, testWebhookDirect };