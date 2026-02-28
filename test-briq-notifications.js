require('dotenv').config();
const briqNotificationService = require('./src/services/briqNotificationService');
const logger = require('./src/utils/logger');

async function testBriqNotifications() {
  console.log('🧪 Testing Briq Notifications...\n');
  console.log('Configuration:');
  console.log(`API URL: ${process.env.BRIQ_API_URL}`);
  console.log(`Sender ID: ${process.env.BRIQ_SENDER_ID}`);
  console.log(`API Key: ${process.env.BRIQ_API_KEY ? '✅ Set' : '❌ Not Set'}`);
  console.log('\n---\n');

  const testPhone = '+255683859574';
  
  // Create test booking data
  const testBooking = {
    customerName: 'Ibn-Asad',
    customerPhone: testPhone,
    carName: 'Toyota Vitz',
    pickupDate: 'Mon, Mar 3, 2026 10:00 AM',
    returnDate: 'Wed, Mar 5, 2026 10:00 AM',
    totalAmount: 500,
    id: 'TEST-BOOKING-001'
  };

  console.log('📱 Test Phone Number:', testPhone);
  console.log('🚗 Test Booking:', testBooking.carName);
  console.log('\n---\n');

  // Test 1: Send SMS
  console.log('1️⃣ Testing SMS...');
  const smsMessage = `Congratulations ${testBooking.customerName}! Your ${testBooking.carName} booking is confirmed. Pickup: ${testBooking.pickupDate}. Total: TZS ${testBooking.totalAmount.toLocaleString()}. Your car will arrive soon. Thank you for choosing CarRental Pro!`;
  
  try {
    const smsResult = await briqNotificationService.sendSMS(testPhone, smsMessage);
    console.log('SMS Result:', JSON.stringify(smsResult, null, 2));
    if (smsResult.success) {
      console.log('✅ SMS sent successfully!');
    } else {
      console.log('❌ SMS failed:', smsResult.error);
    }
  } catch (error) {
    console.log('❌ SMS error:', error.message);
  }
  
  console.log('\n---\n');

  // Test 2: Send Voice Call
  console.log('2️⃣ Testing Voice Call...');
  const voiceMessage = `Hello ${testBooking.customerName}. Congratulations! Your booking for ${testBooking.carName} has been confirmed successfully. Your car will arrive soon as possible. Thank you for choosing CarRental Pro.`;
  
  try {
    const voiceResult = await briqNotificationService.sendVoiceCall(testPhone, voiceMessage);
    console.log('Voice Result:', JSON.stringify(voiceResult, null, 2));
    if (voiceResult.success) {
      console.log('✅ Voice call initiated successfully!');
    } else {
      console.log('❌ Voice call failed:', voiceResult.error);
    }
  } catch (error) {
    console.log('❌ Voice error:', error.message);
  }
  
  console.log('\n---\n');

  // Test 3: Send WhatsApp
  console.log('3️⃣ Testing WhatsApp...');
  const whatsappMessage = `🎉 Congratulations ${testBooking.customerName}!

✅ Your booking is confirmed!

🚗 Car: ${testBooking.carName}
📅 Pickup: ${testBooking.pickupDate}
📅 Return: ${testBooking.returnDate}
💰 Total Paid: TZS ${testBooking.totalAmount.toLocaleString()}

🚚 Your car will arrive soon as possible!

Thank you for choosing CarRental Pro! 🙏`;
  
  try {
    const whatsappResult = await briqNotificationService.sendWhatsAppMessage(testPhone, whatsappMessage);
    console.log('WhatsApp Result:', JSON.stringify(whatsappResult, null, 2));
    if (whatsappResult.success) {
      console.log('✅ WhatsApp sent successfully!');
    } else {
      console.log('❌ WhatsApp failed:', whatsappResult.error);
    }
  } catch (error) {
    console.log('❌ WhatsApp error:', error.message);
  }
  
  console.log('\n---\n');

  // Test 4: Send All Notifications (Complete Flow)
  console.log('4️⃣ Testing Complete Notification Flow...');
  try {
    const allResults = await briqNotificationService.sendPaymentConfirmationNotifications(testBooking);
    console.log('Complete Flow Results:', JSON.stringify(allResults, null, 2));
    
    console.log('\n📊 Summary:');
    console.log(`SMS: ${allResults.sms?.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Voice: ${allResults.voice?.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`WhatsApp: ${allResults.whatsapp?.success ? '✅ Success' : '❌ Failed'}`);
  } catch (error) {
    console.log('❌ Complete flow error:', error.message);
  }

  console.log('\n---\n');
  console.log('🏁 Test Complete!');
  console.log('\nCheck your phone (+255683859574) for:');
  console.log('📱 SMS message');
  console.log('📞 Voice call');
  console.log('💬 WhatsApp message');
}

// Run the test
testBriqNotifications()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
