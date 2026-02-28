require('dotenv').config();
const carRentalBotService = require('./src/services/carRentalBotService');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCheckAgainButton() {
  const testPhone = '+255683859574';
  const testName = 'Ibn-Asad';

  console.log('='.repeat(70));
  console.log('TESTING "CHECK AGAIN" BUTTON (Should NOT loop to welcome)');
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
    console.log('Button shown:', result.buttons?.[0]?.title);
    
    const session = carRentalBotService.customerSessions.get(testPhone);
    console.log('Session state:', session.state);
    console.log('Current booking:', session.currentBooking);

    await wait(2000);

    // Step 2: Click "I have paid" (payment still pending)
    console.log('\n2️⃣ User clicks "I have paid" (payment still pending)');
    console.log('-'.repeat(70));
    
    result = await carRentalBotService.processMessage(testPhone, 'I have paid', testName);
    
    console.log('Response preview:', result.response.substring(0, 50) + '...');
    console.log('Session state:', result.sessionState);
    console.log('Button shown:', result.buttons?.[0]?.title);

    await wait(2000);

    // Step 3: Click "Check Again" (should check payment, NOT go to welcome)
    console.log('\n3️⃣ User clicks "Check Again" (CRITICAL TEST)');
    console.log('-'.repeat(70));
    
    result = await carRentalBotService.processMessage(testPhone, 'Check Again', testName);
    
    console.log('\n📨 Response:');
    console.log(result.response.substring(0, 150));
    console.log('\n📊 State:');
    console.log('Session state:', result.sessionState);
    console.log('Message type:', result.messageType);
    console.log('Button shown:', result.buttons?.[0]?.title);

    // Verify it's NOT the welcome message
    const isWelcomeMessage = result.response.includes('Welcome to CarRental Pro');
    const isPaymentMessage = result.response.includes('Payment') || result.response.includes('payment');
    
    console.log('\n' + '='.repeat(70));
    if (!isWelcomeMessage && isPaymentMessage && result.sessionState === 'payment_pending') {
      console.log('✅ SUCCESS: "Check Again" button works correctly!');
      console.log('✅ Does NOT loop to welcome message');
      console.log('✅ Continues checking payment status');
    } else {
      console.log('❌ FAILED: "Check Again" button not working properly');
      if (isWelcomeMessage) {
        console.log('❌ ERROR: Looped back to welcome message!');
      }
      console.log('Expected: Payment status check message');
      console.log('Got:', result.response.substring(0, 100));
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testCheckAgainButton();
