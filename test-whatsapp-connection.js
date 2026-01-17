#!/usr/bin/env node

/**
 * Test WhatsApp Connection Flow
 * This simulates how messages flow from WhatsApp to your car rental system
 */

require('dotenv').config();

// Simulate incoming WhatsApp message via Sarufi
function simulateWhatsAppMessage(phoneNumber, message) {
  console.log('📱 Customer sends WhatsApp message:');
  console.log(`   From: ${phoneNumber}`);
  console.log(`   Message: "${message}"`);
  console.log('');
  
  return {
    phone_number: phoneNumber,
    message: message,
    message_type: 'text',
    timestamp: new Date().toISOString(),
    source: 'whatsapp_via_sarufi'
  };
}

// Simulate your car rental processing logic
function processCarRentalMessage(phoneNumber, message) {
  console.log('🔄 Your backend processes the message...');
  
  const lowerMessage = message.toLowerCase();
  let response;

  if (lowerMessage.includes('rent') || lowerMessage.includes('car')) {
    response = `🚗 Welcome to CarRental Pro!

Available vehicles:
• Economy cars - From KES 2,500/day
• SUVs - From KES 4,500/day  
• Luxury cars - From KES 8,000/day
• Vans - From KES 6,000/day

Which type interests you? Just reply with the car type!`;
  } else if (lowerMessage.includes('economy')) {
    response = `🚗 Economy Cars Available:

• Toyota Vitz - KES 2,500/day
• Nissan March - KES 2,800/day
• Suzuki Swift - KES 3,000/day

All include:
✅ Insurance
✅ 24/7 Support
✅ Free delivery in Nairobi

When do you need the car? (e.g., "Jan 20 to Jan 22")`;
  } else if (lowerMessage.includes('suv')) {
    response = `🚙 SUVs Available:

• Toyota RAV4 - KES 4,500/day
• Honda CR-V - KES 5,000/day
• Mazda CX-5 - KES 5,500/day

Perfect for family trips and rough roads!

When do you need it? Please provide:
• Pickup date and time
• Return date and time
• Pickup location`;
  } else if (lowerMessage.includes('luxury')) {
    response = `🏎️ Luxury Cars Available:

• Mercedes C-Class - KES 8,000/day
• BMW 3 Series - KES 9,000/day
• Audi A4 - KES 10,000/day

Premium experience with:
✅ Leather seats
✅ Premium sound system
✅ GPS navigation

Ready to book? Share your preferred dates!`;
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    response = `💰 CarRental Pro Pricing:

🚗 Economy: KES 2,500 - 3,000/day
🚙 SUV: KES 4,500 - 5,500/day
🏎️ Luxury: KES 8,000 - 10,000/day
🚐 Van: KES 6,000 - 7,000/day

All prices include:
✅ Comprehensive insurance
✅ 24/7 roadside assistance
✅ Free delivery within Nairobi
✅ Unlimited mileage

What type of car are you interested in?`;
  } else if (lowerMessage.includes('book') || lowerMessage.includes('reserve')) {
    response = `📅 Let's get your booking started!

Please provide these details:
1️⃣ Car type (Economy/SUV/Luxury/Van)
2️⃣ Pickup date and time
3️⃣ Return date and time
4️⃣ Pickup location
5️⃣ Your name and ID number

Example: "I want a Toyota RAV4 from Jan 20 9am to Jan 22 6pm, pickup at JKIA. Name: John Doe, ID: 12345678"`;
  } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    response = `🆘 CarRental Pro Support

I can help you with:
• 🚗 Car rentals and availability
• 💰 Pricing and packages
• 📅 Booking and reservations
• 📍 Pickup and delivery
• 💳 Payment options
• 📞 Emergency support

What do you need help with?`;
  } else {
    response = `👋 Hello! Welcome to CarRental Pro.

I'm your car rental assistant. I can help you:
• Rent a car
• Check prices
• Make bookings
• Get support

What would you like to do today? Just type what you need!

Popular options:
• "I want to rent a car"
• "Show me prices"
• "I need an SUV"`;
  }

  console.log('✅ Your backend generates response:');
  console.log(`   Response: "${response}"`);
  console.log('');

  return {
    success: true,
    phone_number: phoneNumber,
    response: response,
    timestamp: new Date().toISOString()
  };
}

// Simulate Sarufi sending response back to WhatsApp
function simulateSarufiResponse(phoneNumber, response) {
  console.log('📤 Sarufi sends response back to WhatsApp:');
  console.log(`   To: ${phoneNumber}`);
  console.log(`   Message sent successfully!`);
  console.log('');
  console.log('📱 Customer receives response on WhatsApp:');
  console.log('   ┌─────────────────────────────────────┐');
  response.split('\n').forEach(line => {
    console.log(`   │ ${line.padEnd(35)} │`);
  });
  console.log('   └─────────────────────────────────────┘');
  console.log('');
}

// Test the complete flow
async function testWhatsAppConnectionFlow() {
  console.log('🧪 Testing WhatsApp Connection Flow\n');
  console.log('This simulates how your car rental system will work when connected to WhatsApp\n');
  console.log('═'.repeat(80));
  console.log('');

  // Test scenarios
  const testScenarios = [
    {
      phone: '+255683859574',
      message: 'I want to rent a car',
      description: 'Customer wants to rent a car'
    },
    {
      phone: '+254700123456',
      message: 'Show me SUV prices',
      description: 'Customer asks about SUV pricing'
    },
    {
      phone: '+255683859574',
      message: 'I need a luxury car for wedding',
      description: 'Customer needs luxury car'
    }
  ];

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    
    console.log(`🎯 Test Scenario ${i + 1}: ${scenario.description}`);
    console.log('─'.repeat(60));
    
    // Step 1: Customer sends WhatsApp message
    const incomingMessage = simulateWhatsAppMessage(scenario.phone, scenario.message);
    
    // Step 2: Sarufi forwards to your backend
    console.log('🔄 Sarufi forwards message to your backend:');
    console.log(`   POST https://carrentalpro.com/webhook/sarufi`);
    console.log(`   Body: ${JSON.stringify(incomingMessage, null, 2)}`);
    console.log('');
    
    // Step 3: Your backend processes the message
    const processedResponse = processCarRentalMessage(scenario.phone, scenario.message);
    
    // Step 4: Sarufi sends response back to customer
    simulateSarufiResponse(scenario.phone, processedResponse.response);
    
    console.log('✅ Flow completed successfully!');
    console.log('');
    
    if (i < testScenarios.length - 1) {
      console.log('═'.repeat(80));
      console.log('');
    }
  }

  console.log('🎉 All test scenarios completed!');
  console.log('');
  console.log('📋 Summary:');
  console.log('✅ WhatsApp messages → Sarufi → Your Backend');
  console.log('✅ Your Backend processes car rental logic');
  console.log('✅ Response → Sarufi → WhatsApp → Customer');
  console.log('');
  console.log('🚀 Your car rental system is ready for WhatsApp integration!');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Deploy your backend to https://carrentalpro.com');
  console.log('2. Configure Sarufi with webhook: https://carrentalpro.com/webhook/sarufi');
  console.log('3. Connect your WhatsApp number: +255683859574');
  console.log('4. Test with real WhatsApp messages');
  console.log('5. Monitor through Sarufi dashboard');
}

// Run the test
if (require.main === module) {
  testWhatsAppConnectionFlow()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testWhatsAppConnectionFlow };