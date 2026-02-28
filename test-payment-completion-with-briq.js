require('dotenv').config();
const carRentalBotService = require('./src/services/carRentalBotService');
const snippePaymentService = require('./src/services/snippePaymentService');

async function testPaymentCompletionFlow() {
  console.log('🧪 Testing Complete Payment Flow with Briq SMS\n');
  console.log('='.repeat(70));
  
  const testPhone = '+255683859574';
  const customerName = 'Ibn-Asad';
  
  console.log('📱 Test Phone:', testPhone);
  console.log('👤 Customer:', customerName);
  console.log('\n' + '='.repeat(70));
  
  try {
    // Step 1: Simulate user selecting a car and initiating payment
    console.log('\n1️⃣ User selects car and clicks "Pay Now"...');
    
    // Manually create car data since getCarById might not be accessible
    const car = {
      id: 'car_eco_001',
      name: 'Toyota Vitz',
      price: 500,
      category: 'economy'
    };
    
    console.log(`   Car: ${car.name}`);
    console.log(`   Price: TZS ${car.price}/day`);
    
    // Create booking
    const bookingDetails = {
      isValid: true,
      pickupDate: 'Tomorrow 9:00 AM',
      returnDate: 'Tomorrow 6:00 PM',
      pickupLocation: 'Main Office',
      totalDays: 1,
      bookingType: 'same_day',
      customerInfo: {}
    };
    
    const booking = carRentalBotService.createBooking(testPhone, car.id, bookingDetails, customerName);
    console.log(`   ✅ Booking created: ${booking.id}`);
    console.log(`   Amount: TZS ${booking.totalAmount}`);
    
    // Step 2: Create payment
    console.log('\n2️⃣ Creating Snippe payment...');
    
    const paymentResult = await carRentalBotService.initiateSnippePayment(booking, testPhone);
    
    if (!paymentResult.success) {
      console.log('   ❌ Payment creation failed:', paymentResult.error);
      return false;
    }
    
    console.log(`   ✅ Payment created: ${paymentResult.paymentId}`);
    console.log(`   Status: ${paymentResult.status}`);
    
    // Update booking with payment info
    booking.paymentId = paymentResult.paymentId;
    booking.paymentStatus = 'pending';
    
    console.log('\n📱 Push notification should be sent to your phone now!');
    console.log('   Complete the payment with your PIN...');
    console.log('\n⏳ Waiting 15 seconds for you to complete payment...\n');
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Step 3: Check payment status (simulating "I have paid" button click)
    console.log('3️⃣ Checking payment status (simulating "I have paid" click)...');
    
    const statusResult = await snippePaymentService.checkPaymentStatus(paymentResult.paymentId);
    
    console.log(`   Payment Status: ${statusResult.status}`);
    
    if (statusResult.status === 'completed') {
      console.log('   ✅ Payment completed!\n');
      
      // Step 4: This is where Briq SMS should be triggered
      console.log('4️⃣ Triggering Briq SMS notification...\n');
      console.log('   ' + '='.repeat(66));
      
      // Update booking status
      booking.status = 'paid';
      booking.paymentDate = new Date().toISOString();
      booking.paidAmount = booking.totalAmount;
      
      // This is the exact code that runs in the bot
      const briqNotificationService = require('./src/services/briqNotificationService');
      
      console.log(`   📤 Sending to: ${booking.customerPhone}`);
      console.log(`   Customer: ${booking.customerName}`);
      console.log(`   Car: ${booking.carName}`);
      console.log(`   Amount: TZS ${booking.totalAmount}`);
      console.log(`   Pickup: ${booking.pickupDate}`);
      console.log(`   Return: ${booking.returnDate}`);
      console.log('');
      
      const briqResults = await briqNotificationService.sendPaymentConfirmationNotifications(booking);
      
      console.log('   ' + '='.repeat(66));
      console.log('\n✅ BRIQ NOTIFICATION SENT!\n');
      
      console.log('📊 Results:');
      console.log(`   SMS: ${briqResults.sms?.success ? '✅ Sent' : '❌ Failed'}`);
      if (briqResults.sms?.success) {
        console.log(`      Job ID: ${briqResults.sms.data?.job_id}`);
        console.log(`      Status: ${briqResults.sms.status}`);
      }
      
      console.log(`   Voice: ${briqResults.voice?.success ? '✅ Sent' : '❌ Failed'}`);
      console.log(`   WhatsApp: ${briqResults.whatsapp?.success ? '✅ Sent' : '❌ Failed'}`);
      
      console.log('\n' + '='.repeat(70));
      console.log('📱 CHECK YOUR PHONE: ' + testPhone);
      console.log('='.repeat(70));
      console.log('\nYou should receive SMS with:');
      console.log(`✅ "Congratulations ${customerName}!"`);
      console.log(`✅ "Your ${booking.carName} booking is confirmed"`);
      console.log(`✅ "Pickup: ${booking.pickupDate}"`);
      console.log(`✅ "Total: TZS ${booking.totalAmount.toLocaleString()}"`);
      
      return true;
    } else if (statusResult.status === 'pending') {
      console.log('   ⏳ Payment still pending');
      console.log('   You need to complete the payment first!');
      console.log('\n💡 To complete payment:');
      console.log('   1. Check your phone for M-Pesa/Airtel Money push');
      console.log('   2. Enter your PIN');
      console.log('   3. Wait for confirmation');
      console.log('   4. Run this test again');
      return false;
    } else {
      console.log('   ❌ Payment failed or cancelled');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    return false;
  }
}

testPaymentCompletionFlow()
  .then((success) => {
    console.log('\n' + '='.repeat(70));
    if (success) {
      console.log('✅ TEST PASSED - Briq SMS triggered after payment!');
    } else {
      console.log('❌ TEST INCOMPLETE - Complete payment and try again');
    }
    console.log('='.repeat(70));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
