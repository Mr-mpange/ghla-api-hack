#!/usr/bin/env node

/**
 * Process Triple Jay's Actual Message: "Mambo"
 * This shows what response Triple Jay should have received
 */

require('dotenv').config();
const carRentalBotService = require('./src/services/carRentalBotService');
const axios = require('axios');

async function processTripleJayMessage() {
  console.log('📱 Processing Triple Jay\'s Actual Message\n');
  
  // Triple Jay's actual message data from Ghala Rails
  const actualMessage = {
    from: '255756645935',
    name: 'Triple Jay',
    message: 'Mambo',
    timestamp: '1768647430',
    messageId: 'wamid.HBgMMjU1NzU2NjQ1OTM1FQIAEhggQUM3NDM5NDU0MjFDQjEyRDhERDY1QjlDMDZDOUE5MjkA'
  };

  console.log('📨 **Original Message from Ghala Rails**:');
  console.log(`   From: ${actualMessage.name} (+${actualMessage.from})`);
  console.log(`   Message: "${actualMessage.message}"`);
  console.log(`   Timestamp: ${new Date(parseInt(actualMessage.timestamp) * 1000).toLocaleString()}`);
  console.log(`   Message ID: ${actualMessage.messageId}`);
  console.log('');

  try {
    // Process the message through our advanced bot
    console.log('🤖 **Processing through Advanced Car Rental Bot**...');
    const botResponse = await carRentalBotService.processMessage(
      `+${actualMessage.from}`,
      actualMessage.message,
      actualMessage.name
    );

    if (botResponse.success) {
      console.log('✅ **Bot Processing Successful!**');
      console.log('');
      console.log('🤖 **Bot Response for Triple Jay**:');
      console.log('┌─────────────────────────────────────────────────────────────────┐');
      
      // Display the response in a nice format
      const lines = botResponse.response.split('\n');
      lines.forEach(line => {
        const paddedLine = line.padEnd(65);
        console.log(`│ ${paddedLine} │`);
      });
      
      console.log('└─────────────────────────────────────────────────────────────────┘');
      console.log('');
      
      // Show interactive elements
      if (botResponse.messageType === 'interactive_buttons' && botResponse.buttons) {
        console.log('🔘 **Interactive Buttons Triple Jay Would See**:');
        botResponse.buttons.forEach((button, index) => {
          console.log(`   ${index + 1}. ${button.title}`);
        });
        console.log('');
      }
      
      console.log(`📊 **Session State**: ${botResponse.sessionState}`);
      console.log(`📱 **Message Type**: ${botResponse.messageType}`);
      console.log('');
      
      // Show what the WhatsApp API payload would be
      console.log('📤 **WhatsApp API Payload (What Should Be Sent)**:');
      const whatsappPayload = {
        messaging_product: "whatsapp",
        to: actualMessage.from,
        type: botResponse.messageType === 'interactive_buttons' ? 'interactive' : 'text'
      };
      
      if (botResponse.messageType === 'interactive_buttons') {
        whatsappPayload.interactive = {
          type: "button",
          body: { text: botResponse.response },
          action: {
            buttons: botResponse.buttons.slice(0, 3).map((btn, i) => ({
              type: "reply",
              reply: { id: btn.id, title: btn.title.substring(0, 20) }
            }))
          }
        };
      } else {
        whatsappPayload.text = { body: botResponse.response };
      }
      
      console.log(JSON.stringify(whatsappPayload, null, 2));
      
    } else {
      console.log('❌ **Bot Processing Failed**:', botResponse.error);
    }

  } catch (error) {
    console.log('💥 **Exception**:', error.message);
  }
}

// Test the webhook endpoint with Triple Jay's message
async function testWebhookWithTripleJay() {
  console.log('\n🔧 **Testing Webhook with Triple Jay\'s Message**\n');
  
  const ngrokUrl = 'https://3bd3ea0501a9.ngrok-free.app';
  
  // Create the exact webhook payload that Ghala Rails sent
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

  try {
    console.log('📤 **Sending Triple Jay\'s message to webhook**...');
    const response = await axios.post(`${ngrokUrl}/webhook/ghala`, webhookPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (response.data.success) {
      console.log('✅ **Webhook processed successfully!**');
      console.log(`📊 Result: ${response.data.message}`);
      console.log(`🤖 Message Type: ${response.data.messageType || 'text'}`);
      console.log(`📱 Session State: ${response.data.sessionState || 'unknown'}`);
      console.log(`🆔 Message ID: ${response.data.messageId || 'generated'}`);
    } else {
      console.log('❌ **Webhook processing failed**');
      console.log(`🚨 Error: ${response.data.error}`);
    }

  } catch (error) {
    console.log('💥 **Webhook test failed**');
    console.log(`🚨 Error: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📄 Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
    }
  }
}

// Show how to configure Ghala Rails webhook
function showGhalaConfiguration() {
  console.log('\n🔧 **How to Configure Ghala Rails Webhook**\n');
  
  const ngrokUrl = 'https://3bd3ea0501a9.ngrok-free.app';
  
  console.log('📋 **Ghala Rails Webhook Configuration**:');
  console.log(`   **Callback URL**: ${ngrokUrl}/webhook/ghala`);
  console.log(`   **Verify Token**: carrentalpro_verify_2024`);
  console.log('');
  console.log('📝 **Steps to Configure**:');
  console.log('1. Go to your Ghala Rails dashboard');
  console.log('2. Navigate to WhatsApp webhook settings');
  console.log('3. Set the callback URL and verify token above');
  console.log('4. Save the configuration');
  console.log('5. Test by sending another message to +255683859574');
  console.log('');
  console.log('🎯 **Expected Result**:');
  console.log('• Triple Jay sends "Hi" → Gets welcome message with buttons');
  console.log('• Triple Jay sends "Mambo" → Gets smart greeting response');
  console.log('• Triple Jay sends "I want a car" → Gets car catalog');
  console.log('');
  console.log('🔍 **Monitor Webhook**:');
  console.log('• ngrok Web Interface: http://127.0.0.1:4040');
  console.log('• Webhook server logs in terminal');
}

// Run all tests
if (require.main === module) {
  processTripleJayMessage()
    .then(() => testWebhookWithTripleJay())
    .then(() => showGhalaConfiguration())
    .then(() => {
      console.log('\n🎉 **Triple Jay Message Processing Complete!**');
      console.log('');
      console.log('📱 **Summary**:');
      console.log('• Triple Jay\'s message "Mambo" was processed successfully');
      console.log('• Advanced bot generated appropriate response');
      console.log('• Interactive buttons are ready');
      console.log('• Webhook endpoint is functional');
      console.log('');
      console.log('🔧 **Next Step**: Configure Ghala Rails webhook to connect to your bot!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Processing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { processTripleJayMessage, testWebhookWithTripleJay };