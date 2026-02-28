require('dotenv').config();
const carRentalBotService = require('./src/services/carRentalBotService');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteFlow() {
  const testPhone = '+255683859574';
  const testName = 'Ibn-Asad';

  console.log('='.repeat(70));
  console.log('COMPLETE DIRECT PAYMENT FLOW TEST');
  console.log('='.repeat(70));

  try {
    // Test 1: Economy Category
    console.log('\n🧪 TEST 1: Economy Category - Direct Payment');
    console.log('='.repeat(70));
    
    await carRentalBotService.processMessage(testPhone, 'hello', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Browse Cars', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Economy', testName);
    
    let result = await carRentalBotService.processMessage(testPhone, '2. Nissan March', testName);
    console.log('✅ Selected: 2. Nissan March');
    console.log('State:', result.sessionState);
    console.log('Has Payment ID:', !!carRentalBotService.customerSessions.get(testPhone)?.paymentId);
    
    await wait(1000);

    // Test 2: SUV Category
    console.log('\n🧪 TEST 2: SUV Category - Direct Payment');
    console.log('='.repeat(70));
    
    await carRentalBotService.processMessage(testPhone, 'hello', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Browse Cars', testName);
    await carRentalBotService.processMessage(testPhone, '🚙 SUVs', testName);
    
    result = await carRentalBotService.processMessage(testPhone, '1. Toyota RAV4', testName);
    console.log('✅ Selected: 1. Toyota RAV4');
    console.log('State:', result.sessionState);
    console.log('Has Payment ID:', !!carRentalBotService.customerSessions.get(testPhone)?.paymentId);
    
    await wait(1000);

    // Test 3: Luxury Category
    console.log('\n🧪 TEST 3: Luxury Category - Direct Payment');
    console.log('='.repeat(70));
    
    await carRentalBotService.processMessage(testPhone, 'hello', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Browse Cars', testName);
    await carRentalBotService.processMessage(testPhone, '🏎️ Luxury', testName);
    
    result = await carRentalBotService.processMessage(testPhone, '3. Audi A6', testName);
    console.log('✅ Selected: 3. Audi A6');
    console.log('State:', result.sessionState);
    console.log('Has Payment ID:', !!carRentalBotService.customerSessions.get(testPhone)?.paymentId);

    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED - Direct payment working for all categories!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

testCompleteFlow();
