#!/usr/bin/env node

/**
 * Ghala Message Processor
 * This processes the WhatsApp messages received by Ghala Rails
 * and generates appropriate car rental responses
 */

require('dotenv').config();

// Process the Ghala webhook payload you showed
function processGhalaMessage(ghalaPayload) {
  console.log('📨 Processing Ghala WhatsApp message...\n');
  
  try {
    // Extract message data from Ghala webhook format
    const entry = ghalaPayload.entry[0];
    const change = entry.changes[0];
    const value = change.value;
    const message = value.messages[0];
    const contact = value.contacts[0];
    
    const messageData = {
      from: message.from,
      name: contact.profile.name,
      message: message.text.body,
      messageId: message.id,
      timestamp: message.timestamp,
      phoneNumberId: value.metadata.phone_number_id,
      displayPhoneNumber: value.metadata.display_phone_number
    };
    
    console.log('📱 Message Details:');
    console.log(`   From: +${messageData.from} (${messageData.name})`);
    console.log(`   Message: "${messageData.message}"`);
    console.log(`   To: ${messageData.displayPhoneNumber}`);
    console.log(`   Message ID: ${messageData.messageId}`);
    console.log('');
    
    // Generate car rental response
    const response = generateCarRentalResponse(messageData.message, messageData.name);
    
    console.log('🤖 Generated Response:');
    console.log('─'.repeat(60));
    console.log(response);
    console.log('─'.repeat(60));
    console.log('');
    
    // Show how to send response back via WhatsApp Business API
    const whatsappResponse = {
      messaging_product: "whatsapp",
      to: messageData.from,
      type: "text",
      text: {
        body: response
      }
    };
    
    console.log('📤 WhatsApp API Response Payload:');
    console.log(JSON.stringify(whatsappResponse, null, 2));
    console.log('');
    
    return {
      success: true,
      messageData: messageData,
      response: response,
      whatsappPayload: whatsappResponse
    };
    
  } catch (error) {
    console.error('❌ Error processing Ghala message:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Generate car rental response based on message
function generateCarRentalResponse(message, customerName) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return `👋 Hello ${customerName}! Welcome to CarRental Pro!

I'm your car rental assistant. I can help you:

🚗 Rent a car
💰 Check prices  
📅 Make bookings
📍 Arrange pickup/delivery
🆘 Get support

What would you like to do today?

Popular options:
• "I want to rent a car"
• "Show me prices"
• "I need an SUV"
• "Book a car for tomorrow"`;
  }
  
  if (lowerMessage.includes('rent') || lowerMessage.includes('car')) {
    return `🚗 Great choice, ${customerName}! Here are our available vehicles:

💰 **ECONOMY CARS** - From KES 2,500/day
• Toyota Vitz
• Nissan March  
• Suzuki Swift

🚙 **SUVs** - From KES 4,500/day
• Toyota RAV4
• Honda CR-V
• Mazda CX-5

🏎️ **LUXURY CARS** - From KES 8,000/day
• Mercedes C-Class
• BMW 3 Series
• Audi A4

🚐 **VANS** - From KES 6,000/day
• Toyota Hiace
• Nissan Caravan

Which type interests you? Just reply with the car type!`;
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return `💰 CarRental Pro Pricing for ${customerName}:

🚗 **Economy**: KES 2,500 - 3,000/day
🚙 **SUV**: KES 4,500 - 5,500/day  
🏎️ **Luxury**: KES 8,000 - 10,000/day
🚐 **Van**: KES 6,000 - 7,000/day

✅ **All prices include:**
• Comprehensive insurance
• 24/7 roadside assistance  
• Free delivery in Nairobi/Dar es Salaam
• Unlimited mileage
• Full tank of fuel

💳 **Payment options:**
• M-Pesa, Airtel Money
• Bank transfer
• Cash on delivery

What type of car are you interested in?`;
  }
  
  // Default response for any other message
  return `Hi ${customerName}! 👋

I received your message: "${message}"

I'm CarRental Pro's assistant. I can help you with:

🚗 **Car Rentals**
• Economy cars from KES 2,500/day
• SUVs from KES 4,500/day
• Luxury cars from KES 8,000/day

📅 **Quick Booking**
Just tell me:
• What car type you need
• When you need it
• Where to pick it up

💬 **Try saying:**
• "I want to rent a car"
• "Show me SUV prices"  
• "Book a Toyota RAV4"
• "I need help"

What can I help you with today?`;
}

// Test with the actual message you received
async function testWithActualMessage() {
  console.log('🧪 Testing with your actual WhatsApp message\n');
  console.log('This is the exact message you received from Triple Jay\n');
  console.log('═'.repeat(80));
  console.log('');
  
  // Your actual Ghala webhook payload
  const actualPayload = {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "1783010772397699",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "255683859574",
                "phone_number_id": "910852788786740"
              },
              "contacts": [
                {
                  "profile": {
                    "name": "Triple Jay"
                  },
                  "wa_id": "255756645935"
                }
              ],
              "messages": [
                {
                  "from": "255756645935",
                  "id": "wamid.HBgMMjU1NzU2NjQ1OTM1FQIAEhggQUNBRUFDMUQ4M0JBMDU1MzI5REUzMkIzMzM5MEZBQUMA",
                  "timestamp": "1768645557",
                  "text": {
                    "body": "Hi"
                  },
                  "type": "text"
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  };
  
  // Process the message
  const result = processGhalaMessage(actualPayload);
  
  if (result.success) {
    console.log('✅ Message processed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`• Customer: ${result.messageData.name} (+${result.messageData.from})`);
    console.log(`• Message: "${result.messageData.message}"`);
    console.log(`• Response generated: ✅`);
    console.log(`• Ready to send back: ✅`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Send this response back via WhatsApp Business API');
    console.log('2. Or configure Ghala to forward messages to your backend');
    console.log('3. Or set up automatic response system');
  } else {
    console.log('❌ Failed to process message:', result.error);
  }
}

// Run the test
if (require.main === module) {
  testWithActualMessage()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { processGhalaMessage, generateCarRentalResponse };