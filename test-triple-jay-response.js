#!/usr/bin/env node

/**
 * Test Response for Triple Jay
 * This shows exactly what response Triple Jay should have received
 */

require('dotenv').config();

// Simulate the exact message Triple Jay sent
function testTripleJayResponse() {
  console.log('📱 Testing Response for Triple Jay\n');
  console.log('This shows what Triple Jay should have received when they sent "Hi"\n');
  console.log('═'.repeat(80));
  console.log('');
  
  // Triple Jay's actual message
  const customerName = 'Triple Jay';
  const phoneNumber = '+255756645935';
  const message = 'Hi';
  
  console.log('📨 Original Message:');
  console.log(`   From: ${customerName} (${phoneNumber})`);
  console.log(`   Message: "${message}"`);
  console.log(`   To: +255683859574 (Your WhatsApp)`);
  console.log('');
  
  // Generate the response Triple Jay should get
  const response = `👋 Hello ${customerName}! Welcome to CarRental Pro!

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

  console.log('🤖 Response Triple Jay Should Receive:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  response.split('\n').forEach(line => {
    console.log(`│ ${line.padEnd(59)} │`);
  });
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('');
  
  // Show WhatsApp API payload
  const whatsappPayload = {
    messaging_product: "whatsapp",
    to: "255756645935",
    type: "text",
    text: {
      body: response
    }
  };
  
  console.log('📤 WhatsApp API Payload to Send:');
  console.log(JSON.stringify(whatsappPayload, null, 2));
  console.log('');
  
  console.log('🔧 How to Send This Response:');
  console.log('');
  console.log('**Option 1: Via Ghala Rails Auto-Response**');
  console.log('1. Set up auto-response rule in Ghala dashboard');
  console.log('2. Trigger: "hi, hello, hey"');
  console.log('3. Response: Copy the message above');
  console.log('');
  console.log('**Option 2: Via WhatsApp Business API**');
  console.log(`curl -X POST "https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages" \\`);
  console.log(`  -H "Authorization: Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}" \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'', JSON.stringify(whatsappPayload, null, 2), '\'');
  console.log('');
  console.log('**Option 3: Via Your Backend**');
  console.log('1. Deploy backend to https://carrentalpro.com');
  console.log('2. Configure webhook: https://carrentalpro.com/webhook/ghala');
  console.log('3. Backend automatically responds to all messages');
  console.log('');
  
  console.log('✅ Triple Jay will receive instant responses once any option is set up!');
  console.log('');
  console.log('🧪 Test Messages Triple Jay Can Try:');
  console.log('• "I want to rent a car" → Gets vehicle options');
  console.log('• "SUV prices" → Gets SUV details and pricing');
  console.log('• "Book a Toyota RAV4" → Gets booking form');
  console.log('• "Help" → Gets support information');
}

// Run the test
if (require.main === module) {
  testTripleJayResponse();
  console.log('\n🎉 Test completed - Triple Jay response ready!');
  process.exit(0);
}

module.exports = { testTripleJayResponse };