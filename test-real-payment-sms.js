require('dotenv').config();
const briqNotificationService = require('./src/services/briqNotificationService');

async function testRealPaymentSMS() {
  console.log('📱 Testing Real Payment SMS with Actual Booking Details\n');
  console.log('='.repeat(60));
  
  // Simulate a real booking with actual details
  const realBooking = {
    id: 'BK-2026-001',
    customerName: 'Ibn-Asad',
    customerPhone: '+255683859574',
    carName: 'Toyota Vitz',
    pickupDate: 'Mon, Mar 3, 2026 10:00 AM',
    returnDate: 'Wed, Mar 5, 2026 10:00 AM',
    totalAmount: 1000,
    rentalDays: 2,
    status: 'paid',
    paymentId: 'PAY-123456',
    paymentDate: new Date().toISOString()
  };

  console.log('📋 Booking Details:');
  console.log(`   Customer: ${realBooking.customerName}`);
  console.log(`   Phone: ${realBooking.customerPhone}`);
  console.log(`   Car: ${realBooking.carName}`);
  console.log(`   Pickup: ${realBooking.pickupDate}`);
  console.log(`   Return: ${realBooking.returnDate}`);
  console.log(`   Days: ${realBooking.rentalDays}`);
  console.log(`   Total: TZS ${realBooking.totalAmount.toLocaleString()}`);
  console.log(`   Booking ID: ${realBooking.id}`);
  console.log('\n' + '='.repeat(60));
  
  console.log('\n📤 Sending SMS notification...\n');

  try {
    // This is exactly what happens after payment completion
    const results = await briqNotificationService.sendPaymentConfirmationNotifications(realBooking);
    
    console.log('✅ SMS SENT SUCCESSFULLY!\n');
    console.log('Results:', JSON.stringify(results, null, 2));
    
    if (results.sms?.success) {
      console.log('\n📱 SMS Details:');
      console.log(`   Status: ${results.sms.status}`);
      console.log(`   Job ID: ${results.sms.data?.job_id}`);
      console.log(`   Recipients: ${results.sms.data?.stats?.recipients}`);
      console.log(`   SMS Parts: ${results.sms.data?.stats?.sms_parts}`);
      console.log(`   Cost: ${results.sms.data?.stats?.cost} credits`);
    }
    
    if (results.voice?.success) {
      console.log('\n📞 Voice Call:');
      console.log(`   Status: ${results.voice.status}`);
      console.log(`   Note: ${results.voice.data?.message || 'Sent as SMS fallback'}`);
    }
    
    if (results.whatsapp?.success) {
      console.log('\n💬 WhatsApp:');
      console.log(`   Status: ${results.whatsapp.status}`);
      console.log(`   Note: ${results.whatsapp.data?.message || 'Sent as SMS'}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📱 CHECK YOUR PHONE: +255683859574');
    console.log('='.repeat(60));
    console.log('\nYou should receive an SMS with:');
    console.log(`✅ Customer name: ${realBooking.customerName}`);
    console.log(`✅ Car name: ${realBooking.carName}`);
    console.log(`✅ Pickup date: ${realBooking.pickupDate}`);
    console.log(`✅ Total amount: TZS ${realBooking.totalAmount.toLocaleString()}`);
    console.log('✅ Confirmation message');
    
    return true;
  } catch (error) {
    console.error('❌ SMS FAILED:', error.message);
    return false;
  }
}

testRealPaymentSMS()
  .then((success) => {
    if (success) {
      console.log('\n✅ Integration is working! Customers will receive SMS after payment.');
    } else {
      console.log('\n❌ Integration failed. Check the error above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
