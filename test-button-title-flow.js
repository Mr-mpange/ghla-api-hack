require('dotenv').config();
const carRentalBotService = require('./src/services/carRentalBotService');

async function testButtonTitleFlow() {
  const testPhone = '+255683859574';
  const testName = 'Test User';

  console.log('='.repeat(60));
  console.log('TESTING BUTTON TITLE FLOW (Direct Payment)');
  console.log('='.repeat(60));

  try {
    // Step 1: Start conversation
    console.log('\n1️⃣ Start Conversation');
    console.log('-'.repeat(60));
    let result = await carRentalBotService.processMessage(testPhone, 'hello', testName);
    console.log('Response:', result.response.substring(0, 100) + '...');
    console.log('Session State:', result.sessionState);
    console.log('Buttons:', result.buttons?.map(b => b.title));

    // Step 2: Click Browse Cars
    console.log('\n2️⃣ Click Browse Cars');
    console.log('-'.repeat(60));
    result = await carRentalBotService.processMessage(testPhone, '🚗 Browse Cars', testName);
    console.log('Response:', result.response.substring(0, 100) + '...');
    console.log('Session State:', result.sessionState);
    console.log('Buttons:', result.buttons?.map(b => b.title));

    // Step 3: Select Economy Category
    console.log('\n3️⃣ Select Economy Category');
    console.log('-'.repeat(60));
    result = await carRentalBotService.processMessage(testPhone, '🚗 Economy', testName);
    console.log('Response:', result.response.substring(0, 200) + '...');
    console.log('Session State:', result.sessionState);
    console.log('Selected Category:', carRentalBotService.customerSessions.get(testPhone)?.selectedCategory);
    console.log('Buttons:', result.buttons?.map(b => b.title));

    // Step 4: Click car button title (simulating WhatsApp sending title instead of ID)
    console.log('\n4️⃣ Click Car Button Title: "1. Toyota Vitz"');
    console.log('-'.repeat(60));
    result = await carRentalBotService.processMessage(testPhone, '1. Toyota Vitz', testName);
    console.log('Response:', result.response.substring(0, 300) + '...');
    console.log('Session State:', result.sessionState);
    console.log('Buttons:', result.buttons?.map(b => b.title));

    // Check if payment was initiated
    const session = carRentalBotService.customerSessions.get(testPhone);
    console.log('\n📊 Final Session State:');
    console.log('State:', session.state);
    console.log('Payment ID:', session.paymentId);
    console.log('Current Booking:', session.currentBooking);

    if (session.state === 'payment_pending') {
      console.log('\n✅ SUCCESS: Direct payment flow working!');
    } else {
      console.log('\n❌ FAILED: Expected state "payment_pending", got:', session.state);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testButtonTitleFlow();
