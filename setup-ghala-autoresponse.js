#!/usr/bin/env node

/**
 * Setup Ghala Auto-Response System
 * This will help you configure automatic responses in Ghala Rails
 */

require('dotenv').config();
const axios = require('axios');

async function setupGhalaAutoResponse() {
  console.log('🔧 Setting up Ghala Auto-Response System\n');
  
  const ghalaApiUrl = process.env.GHALA_API_URL || 'https://api.ghala.io/v1';
  const ghalaApiKey = process.env.GHALA_API_KEY;
  
  if (!ghalaApiKey) {
    console.log('⚠️  GHALA_API_KEY not found in .env file');
    console.log('Please add your Ghala API key to enable auto-responses\n');
  }
  
  console.log('📋 Auto-Response Configuration for CarRental Pro:\n');
  
  // Define auto-response rules
  const autoResponses = [
    {
      trigger: ['hi', 'hello', 'hey', 'start'],
      response: `👋 Hello! Welcome to CarRental Pro!

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
• "Book a car for tomorrow"`
    },
    {
      trigger: ['rent', 'car', 'vehicle'],
      response: `🚗 Great! Here are our available vehicles:

💰 **ECONOMY CARS** - From KES 2,500/day
• Toyota Vitz • Nissan March • Suzuki Swift

🚙 **SUVs** - From KES 4,500/day  
• Toyota RAV4 • Honda CR-V • Mazda CX-5

🏎️ **LUXURY CARS** - From KES 8,000/day
• Mercedes C-Class • BMW 3 Series • Audi A4

🚐 **VANS** - From KES 6,000/day
• Toyota Hiace • Nissan Caravan

Which type interests you? Just reply with the car type!`
    },
    {
      trigger: ['price', 'cost', 'pricing'],
      response: `💰 CarRental Pro Pricing:

🚗 **Economy**: KES 2,500 - 3,000/day
🚙 **SUV**: KES 4,500 - 5,500/day  
🏎️ **Luxury**: KES 8,000 - 10,000/day
🚐 **Van**: KES 6,000 - 7,000/day

✅ **All prices include:**
• Comprehensive insurance
• 24/7 roadside assistance  
• Free delivery in Nairobi/Dar es Salaam
• Unlimited mileage

💳 **Payment**: M-Pesa, Bank transfer, Cash

What type of car are you interested in?`
    },
    {
      trigger: ['suv', 'rav4', 'crv', 'cx5'],
      response: `🚙 SUVs Available:

• **Toyota RAV4** - KES 4,500/day
  ✅ 5 seats, automatic, fuel efficient
  
• **Honda CR-V** - KES 5,000/day  
  ✅ Spacious, reliable, great for families
  
• **Mazda CX-5** - KES 5,500/day
  ✅ Premium features, smooth drive

Perfect for family trips and rough roads!

When do you need it? Please provide:
• Pickup date and time
• Return date and time  
• Pickup location

Example: "Jan 20 9am to Jan 22 6pm, pickup at JKIA"`
    },
    {
      trigger: ['economy', 'cheap', 'budget'],
      response: `🚗 Economy Cars Available:

• **Toyota Vitz** - KES 2,500/day
  ✅ Fuel efficient, easy to park
  
• **Nissan March** - KES 2,800/day
  ✅ Reliable, comfortable for city driving
  
• **Suzuki Swift** - KES 3,000/day
  ✅ Sporty, modern features

All include insurance & 24/7 support!

When do you need the car?
• Pickup date and time
• Return date and time
• Pickup location`
    },
    {
      trigger: ['luxury', 'mercedes', 'bmw', 'audi'],
      response: `🏎️ Luxury Cars Available:

• **Mercedes C-Class** - KES 8,000/day
  ✅ Premium comfort, leather seats
  
• **BMW 3 Series** - KES 9,000/day
  ✅ Sport mode, premium sound system
  
• **Audi A4** - KES 10,000/day
  ✅ Latest tech, GPS navigation

Perfect for special occasions!

Ready to book? Share your preferred dates:
• Pickup date and time
• Return date and time
• Special requirements`
    },
    {
      trigger: ['book', 'booking', 'reserve'],
      response: `📅 Let's get your booking started!

Please provide these details:
1️⃣ **Car type** (Economy/SUV/Luxury/Van)
2️⃣ **Pickup date and time**
3️⃣ **Return date and time**  
4️⃣ **Pickup location**
5️⃣ **Your name and ID number**

**Example:**
"I want a Toyota RAV4 from Jan 20 9am to Jan 22 6pm, pickup at JKIA. Name: John Doe, ID: 12345678"

💳 **Payment options:**
• M-Pesa: Pay 50% to confirm
• Bank transfer: Full payment
• Cash on delivery: Available in Nairobi`
    },
    {
      trigger: ['help', 'support', 'assistance'],
      response: `🆘 CarRental Pro Support

I can help you with:
• 🚗 Car rentals and availability
• 💰 Pricing and packages  
• 📅 Booking and reservations
• 📍 Pickup and delivery arrangements
• 💳 Payment options
• 📞 Emergency roadside assistance

**Contact Info:**
📱 WhatsApp: +255683859574
📧 Email: support@carrentalpro.com
🕒 Available: 24/7

What do you need help with?`
    }
  ];
  
  console.log('🤖 Recommended Auto-Response Rules:\n');
  
  autoResponses.forEach((rule, index) => {
    console.log(`${index + 1}. **Triggers**: ${rule.trigger.join(', ')}`);
    console.log(`   **Response**: ${rule.response.substring(0, 100)}...`);
    console.log('');
  });
  
  console.log('📝 How to Set Up in Ghala Rails:\n');
  console.log('1. Go to your Ghala Rails dashboard');
  console.log('2. Navigate to "Automation" or "Auto-Response" section');
  console.log('3. Create new auto-response rules using the triggers above');
  console.log('4. Copy and paste the responses for each trigger');
  console.log('5. Enable the auto-response system');
  console.log('6. Test by sending messages to your WhatsApp number');
  
  console.log('\n🧪 Test Messages to Try:');
  console.log('• Send "Hi" → Should get welcome message');
  console.log('• Send "I want to rent a car" → Should get vehicle options');
  console.log('• Send "SUV prices" → Should get SUV details');
  console.log('• Send "Book a car" → Should get booking form');
  
  console.log('\n✅ This will make Triple Jay and other customers get instant responses!');
}

// Run the setup
if (require.main === module) {
  setupGhalaAutoResponse()
    .then(() => {
      console.log('\n🎉 Auto-response setup guide completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { setupGhalaAutoResponse };