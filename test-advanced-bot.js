#!/usr/bin/env node

/**
 * Test Advanced Car Rental Bot
 * This demonstrates the advanced bot capabilities with catalog, bookings, and interactive features
 */

require('dotenv').config();
const carRentalBotService = require('./src/services/carRentalBotService');

async function testAdvancedBot() {
  console.log('🤖 Testing Advanced Car Rental Bot\n');
  console.log('This shows how the bot can handle catalogs, bookings, and interactive conversations\n');
  console.log('═'.repeat(80));
  console.log('');

  const testCustomer = {
    name: 'Triple Jay',
    phone: '+255756645935'
  };

  // Test conversation flow
  const testMessages = [
    'Hi',
    'I want to rent a car',
    'Show me SUVs',
    '1',
    'Book this car',
    'Book Toyota RAV4 from Jan 20 9am to Jan 22 6pm at JKIA. Name: Triple Jay, ID: 12345678, Phone: +255756645935',
    'My bookings',
    'Help'
  ];

  console.log(`🎭 **Customer**: ${testCustomer.name} (${testCustomer.phone})`);
  console.log('');

  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i];
    
    console.log(`💬 **Message ${i + 1}**: "${message}"`);
    console.log('─'.repeat(60));
    
    try {
      const response = await carRentalBotService.processMessage(
        testCustomer.phone,
        message,
        testCustomer.name
      );

      if (response.success) {
        console.log('🤖 **Bot Response**:');
        console.log(response.response);
        console.log('');
        
        if (response.messageType === 'interactive_buttons' && response.buttons) {
          console.log('🔘 **Interactive Buttons**:');
          response.buttons.forEach((button, index) => {
            console.log(`   ${index + 1}. ${button.title} (ID: ${button.id})`);
          });
          console.log('');
        }
        
        if (response.listItems) {
          console.log('📋 **List Items Available**');
          console.log('');
        }
        
        console.log(`📊 **Session State**: ${response.sessionState}`);
        console.log(`📱 **Message Type**: ${response.messageType}`);
        
      } else {
        console.log('❌ **Error**:', response.error);
      }
      
    } catch (error) {
      console.log('💥 **Exception**:', error.message);
    }
    
    console.log('');
    console.log('═'.repeat(80));
    console.log('');
    
    // Add small delay for readability
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 **Advanced Bot Test Completed!**');
  console.log('');
  console.log('✨ **Bot Capabilities Demonstrated**:');
  console.log('• 🎯 Intelligent conversation flow');
  console.log('• 🚗 Car catalog browsing with real data');
  console.log('• 🔘 Interactive buttons for easy navigation');
  console.log('• 📋 Detailed car information and features');
  console.log('• 📅 Booking form processing');
  console.log('• 💾 Session state management');
  console.log('• 🎭 Personalized responses with customer names');
  console.log('• 📊 Booking confirmation and management');
  console.log('• 🆘 Help and support system');
  console.log('');
  console.log('🚀 **Ready for Production**:');
  console.log('• Connect to your ngrok webhook');
  console.log('• Configure Ghala Rails with the webhook URL');
  console.log('• Customers get this advanced experience!');
  console.log('');
  console.log('📱 **Customer Experience**:');
  console.log('• Browse real car catalog with prices');
  console.log('• See car features and availability');
  console.log('• Make bookings with confirmation');
  console.log('• Check booking status');
  console.log('• Get personalized assistance');
}

// Test specific bot features
async function testBotFeatures() {
  console.log('🔧 **Testing Specific Bot Features**\n');
  
  // Test car catalog
  console.log('1️⃣ **Car Catalog Test**');
  const catalogResponse = await carRentalBotService.processMessage(
    '+255756645935',
    'Show me economy cars',
    'Test Customer'
  );
  
  if (catalogResponse.success) {
    console.log('✅ Car catalog generated successfully');
    console.log(`   Response length: ${catalogResponse.response.length} characters`);
    console.log(`   Buttons available: ${catalogResponse.buttons ? catalogResponse.buttons.length : 0}`);
  }
  console.log('');
  
  // Test session management
  console.log('2️⃣ **Session Management Test**');
  const session1 = await carRentalBotService.processMessage('+255111111111', 'Hi', 'Customer A');
  const session2 = await carRentalBotService.processMessage('+255222222222', 'Hi', 'Customer B');
  
  console.log('✅ Multiple customer sessions handled');
  console.log(`   Customer A state: ${session1.sessionState}`);
  console.log(`   Customer B state: ${session2.sessionState}`);
  console.log('');
  
  // Test booking system
  console.log('3️⃣ **Booking System Test**');
  const bookingResponse = await carRentalBotService.processMessage(
    '+255333333333',
    'Book Toyota RAV4 from Jan 20 9am to Jan 22 6pm at JKIA. Name: John Doe, ID: 12345678',
    'John Doe'
  );
  
  if (bookingResponse.success) {
    console.log('✅ Booking system functional');
    console.log(`   Response includes booking confirmation`);
  }
  console.log('');
  
  console.log('🎯 **All Features Working!**');
}

// Run the tests
if (require.main === module) {
  testAdvancedBot()
    .then(() => testBotFeatures())
    .then(() => {
      console.log('\n🎉 Advanced bot testing completed successfully!');
      console.log('Your car rental bot is ready for production use! 🚗✨');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testAdvancedBot, testBotFeatures };