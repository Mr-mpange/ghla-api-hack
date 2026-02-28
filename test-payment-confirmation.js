require('dotenv').config();
const carRentalBotService = require('./src/services/carRentalBotService');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPaymentConfirmation() {
  const testPhone = '+255683859574';
  const testName = 'Ibn-Asad';

  console.log('='.repeat(70));
  console.log('TESTING PAYMENT CONFIRMATION FLOW');
  console.log('='.repeat(70));

  try {
    // Step 1: Complete flow to payment
    console.log('\n1️⃣ Complete booking flow to payment');
    console.log('-'.repeat(70));
    
    await carRentalBotService.processMessage(testPhone, 'hello', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Browse Cars', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Economy', testName);
    let result = await carRentalBotService.processMessage(testPhone, '1. Toyota Vitz', testName);
    
    console.log('✅ Payment initiated');
    console.log('State:', result.sessionState);
    console.log('Buttons:', result.buttons?.map(b => b.title));
    
    const session = carRentalBotService.customerSessions.get(testPhone);
    const booking = carRentalBotService.bookings.get(session.currentBooking);
    
    console.log('\n📋 Booking Details:');
    console.log('Booking ID:', booking.id);
    console.log('Payment ID:', booking.paymentId);
    console.log('Status:', booking.status);

    await wait(2000);

    // Step 2: Simulate payment completion (manually update booking)
    console.log('\n2️⃣ Simulating payment completion...');
    console.log('-'.repeat(70));
    console.log('💰 In real scenario: User completes M-Pesa/Airtel/Halotel payment');
    console.log('📡 Snippe webhook receives payment confirmation');
    console.log('✅ Booking status updated to "paid"');
    
    // Manually mark as paid for testing
    booking.status = 'paid';
    booking.paymentDate = new Date().toISOString();
    booking.paidAmount = booking.totalAmount;
    
    await wait(1000);

    // Step 3: User clicks "I have paid"
    console.log('\n3️⃣ User clicks "I have paid" button');
    console.log('-'.repeat(70));
    
    result = await carRentalBotService.processMessage(testPhone, 'I have paid', testName);
    
    console.log('\n📨 Response Message:');
    console.log(result.response);
    console.log('\n📊 Final State:');
    console.log('State:', result.sessionState);
    console.log('Message Type:', result.messageType);
    console.log('Has Buttons:', result.buttons !== null);
    console.log('Buttons:', result.buttons);

    // Verify conversation terminated
    console.log('\n' + '='.repeat(70));
    if (result.sessionState === 'completed' && result.buttons === null) {
      console.log('✅ SUCCESS: Payment confirmed and conversation terminated!');
      console.log('✅ No buttons shown - user cannot continue conversation');
    } else {
      console.log('❌ FAILED: Conversation did not terminate properly');
      console.log('Expected: state="completed", buttons=null');
      console.log('Got: state="' + result.sessionState + '", buttons=' + result.buttons);
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testPaymentConfirmation();
