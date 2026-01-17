#!/usr/bin/env node

require('dotenv').config();
const whatsappService = require('./src/services/whatsappService');

async function testWhatsAppIntegration() {
  console.log('🧪 Testing WhatsApp Integration...\n');

  // Check configuration
  console.log('📋 Configuration Check:');
  const status = whatsappService.getStatus();
  console.log('- Configured:', status.configured ? '✅' : '❌');
  console.log('- Phone Number ID:', status.phoneNumberId || 'Not set');
  console.log('- Access Token:', status.hasAccessToken ? '✅ Present' : '❌ Missing');
  console.log();

  if (!status.configured) {
    console.log('❌ WhatsApp service is not properly configured.');
    console.log('Please check your .env file and ensure:');
    console.log('- WHATSAPP_ACCESS_TOKEN is set');
    console.log('- WHATSAPP_PHONE_NUMBER_ID is set');
    return;
  }

  // Test phone number (you can change this to your own number for testing)
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '+254700000000';
  
  console.log(`📱 Testing with phone number: ${testPhoneNumber}`);
  console.log();

  try {
    // Test 1: Send simple text message
    console.log('🧪 Test 1: Sending simple text message...');
    const textResult = await whatsappService.sendMessage(
      testPhoneNumber,
      '🚗 Hello from CarRental Pro! This is a test message from your car rental system.'
    );
    
    if (textResult.success) {
      console.log('✅ Text message sent successfully');
      console.log('   Message ID:', textResult.messageId);
    } else {
      console.log('❌ Failed to send text message');
      console.log('   Error:', textResult.error);
    }
    console.log();

    // Test 2: Send interactive buttons
    console.log('🧪 Test 2: Sending interactive buttons...');
    const buttonsResult = await whatsappService.sendInteractiveButtons(
      testPhoneNumber,
      'Welcome to CarRental Pro! What would you like to do?',
      [
        { id: 'rent_vehicle', title: '🚗 Rent Vehicle' },
        { id: 'my_bookings', title: '📋 My Bookings' },
        { id: 'support', title: '💬 Support' }
      ]
    );
    
    if (buttonsResult.success) {
      console.log('✅ Interactive buttons sent successfully');
      console.log('   Message ID:', buttonsResult.messageId);
    } else {
      console.log('❌ Failed to send interactive buttons');
      console.log('   Error:', buttonsResult.error);
    }
    console.log();

    // Test 3: Send interactive list
    console.log('🧪 Test 3: Sending interactive list...');
    const listResult = await whatsappService.sendInteractiveList(
      testPhoneNumber,
      'Choose your preferred pickup location:',
      'Select Location',
      [{
        title: 'Available Locations',
        rows: [
          { id: 'nairobi_cbd', title: 'Nairobi CBD', description: 'Kenyatta Avenue' },
          { id: 'westlands', title: 'Westlands', description: 'Sarit Centre' },
          { id: 'karen', title: 'Karen', description: 'Karen Shopping Centre' }
        ]
      }]
    );
    
    if (listResult.success) {
      console.log('✅ Interactive list sent successfully');
      console.log('   Message ID:', listResult.messageId);
    } else {
      console.log('❌ Failed to send interactive list');
      console.log('   Error:', listResult.error);
    }
    console.log();

    // Test 4: Send location
    console.log('🧪 Test 4: Sending location...');
    const locationResult = await whatsappService.sendLocation(
      testPhoneNumber,
      -1.2864, // Nairobi CBD latitude
      36.8172, // Nairobi CBD longitude
      'CarRental Pro - Nairobi CBD',
      'Kenyatta Avenue, Nairobi CBD'
    );
    
    if (locationResult.success) {
      console.log('✅ Location sent successfully');
      console.log('   Message ID:', locationResult.messageId);
    } else {
      console.log('❌ Failed to send location');
      console.log('   Error:', locationResult.error);
    }
    console.log();

    console.log('🎉 WhatsApp integration test completed!');
    console.log();
    console.log('📝 Next Steps:');
    console.log('1. Check your WhatsApp to see the test messages');
    console.log('2. Set up webhook URL in Meta Developer Console');
    console.log('3. Configure WHATSAPP_WEBHOOK_VERIFY_TOKEN in .env');
    console.log('4. Start the server and test the full car rental flow');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testWhatsAppIntegration()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testWhatsAppIntegration };