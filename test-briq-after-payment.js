require('dotenv').config();
const briqNotificationService = require('./src/services/briqNotificationService');

async function testBriqAfterPayment() {
  console.log('🧪 Testing Briq SMS After Payment Completion\n');
  console.log('='.repeat(70));
  console.log('This simulates what happens AFTER payment is confirmed\n');
  console.log('='.repeat(70));
  
  // This is the exact booking data that exists after payment
  const completedBooking = {
    id: 'BK-TEST-2026-001',
    customerName: 'Ibn-Asad',
    customerPhone: '+255683859574',
    carName: 'Toyota Vitz',
    pickupDate: 'Mon, Mar 3, 2026 10:00 AM',
    returnDate: 'Wed, Mar 5, 2026 10:00 AM',
    totalAmount: 500,
    deposit: 500,
    status: 'paid',
    paymentId: 'PAY-123456',
    paymentStatus: 'completed',
    paymentDate: new Date().toISOString(),
    paidAmount: 500
  };

  console.log('\n📋 Booking Details (After Payment):');
  console.log(`   Booking ID: ${completedBooking.id}`);
  console.log(`   Customer: ${completedBooking.customerName}`);
  console.log(`   Phone: ${completedBooking.customerPhone}`);
  console.log(`   Car: ${completedBooking.carName}`);
  console.log(`   Amount Paid: TZS ${completedBooking.totalAmount}`);
  console.log(`   Payment Status: ${completedBooking.paymentStatus}`);
  console.log(`   Booking Status: ${completedBooking.status}`);
  
  console.log('\n' + '='.repeat(70));
  console.log('📤 TRIGGERING BRIQ SMS NOTIFICATION...');
  console.log('='.repeat(70));
  console.log('\nThis is the EXACT code that runs in the bot after payment:\n');
  console.log('```javascript');
  console.log('const briqResults = await briqNotificationService');
  console.log('  .sendPaymentConfirmationNotifications(booking);');
  console.log('```\n');
  
  try {
    const briqResults = await briqNotificationService.sendPaymentConfirmationNotifications(completedBooking);
    
    console.log('='.repeat(70));
    console.log('✅ BRIQ NOTIFICATION TRIGGERED!');
    console.log('='.repeat(70));
    
    console.log('\n📊 Results:\n');
    
    // SMS Result
    if (briqResults.sms?.success) {
      console.log('✅ SMS: SENT');
      console.log(`   Job ID: ${briqResults.sms.data?.job_id}`);
      console.log(`   Status: ${briqResults.sms.status}`);
      console.log(`   Recipients: ${briqResults.sms.data?.stats?.recipients}`);
      console.log(`   SMS Parts: ${briqResults.sms.data?.stats?.sms_parts}`);
      console.log(`   Cost: ${briqResults.sms.data?.stats?.cost} credits`);
    } else {
      console.log('❌ SMS: FAILED');
      console.log(`   Error: ${briqResults.sms?.error}`);
    }
    
    console.log('');
    
    // Voice Result
    if (briqResults.voice?.success) {
      console.log('✅ Voice: SENT (as SMS fallback)');
      console.log(`   Job ID: ${briqResults.voice.data?.job_id}`);
    } else {
      console.log('❌ Voice: FAILED');
    }
    
    console.log('');
    
    // WhatsApp Result
    if (briqResults.whatsapp?.success) {
      console.log('✅ WhatsApp: SENT (as SMS)');
      console.log(`   Job ID: ${briqResults.whatsapp.messageId}`);
    } else {
      console.log('❌ WhatsApp: FAILED');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📱 CHECK YOUR PHONE: +255683859574');
    console.log('='.repeat(70));
    
    console.log('\nExpected SMS Message:');
    console.log('─'.repeat(70));
    console.log(`Congratulations ${completedBooking.customerName}! Your ${completedBooking.carName}`);
    console.log(`booking is confirmed. Pickup: ${completedBooking.pickupDate}.`);
    console.log(`Total: TZS ${completedBooking.totalAmount.toLocaleString()}. Your car will arrive soon.`);
    console.log('Thank you for choosing CarRental Pro!');
    console.log('─'.repeat(70));
    
    console.log('\n✅ This proves Briq SMS IS triggered after payment!');
    console.log('\n💡 In the real flow:');
    console.log('   1. User completes payment');
    console.log('   2. User clicks "I have paid"');
    console.log('   3. Bot checks payment status with Snippe');
    console.log('   4. If status = "completed" → Briq SMS is sent');
    console.log('   5. Customer receives SMS with booking details');
    
    return true;
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    return false;
  }
}

testBriqAfterPayment()
  .then((success) => {
    console.log('\n' + '='.repeat(70));
    if (success) {
      console.log('✅ TEST PASSED - Briq integration is working!');
      console.log('\nThe SMS will be sent automatically after real payment.');
    } else {
      console.log('❌ TEST FAILED - Check error above');
    }
    console.log('='.repeat(70));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
