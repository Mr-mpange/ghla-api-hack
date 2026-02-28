require('dotenv').config();
const carRentalBotService = require('./src/services/carRentalBotService');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompletePaymentCycle() {
  const testPhone = '+255683859574';
  const testName = 'Ibn-Asad';

  console.log('='.repeat(70));
  console.log('COMPLETE PAYMENT CYCLE TEST');
  console.log('Testing: Select Car → Payment → Check Again (multiple) → Success');
  console.log('='.repeat(70));

  try {
    // Step 1: Select car and initiate payment
    console.log('\n1️⃣ User selects car');
    console.log('-'.repeat(70));
    
    await carRentalBotService.processMessage(testPhone, 'hello', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Browse Cars', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Economy', testName);
    let result = await carRentalBotService.processMessage(testPhone, '2. Nissan March', testName);
    
    console.log('✅ Car selected: Nissan March');
    console.log('✅ Payment initiated');
    console.log('Button:', result.buttons?.[0]?.title);

    await wait(1500);

    // Step 2: Click "I have paid" (payment pending)
    console.log('\n2️⃣ User clicks "I have paid" (payment still pending)');
    console.log('-'.repeat(70));
    
    result = await carRentalBotService.processMessage(testPhone, 'I have paid', testName);
    console.log('Response:', result.response.includes('processing') ? '⏳ Processing...' : result.response.substring(0, 50));
    console.log('Button:', result.buttons?.[0]?.title);
    console.log('State:', result.sessionState);

    await wait(1500);

    // Step 3: Click "Check Again" #1 (still pending)
    console.log('\n3️⃣ User clicks "Check Again" #1 (still pending)');
    console.log('-'.repeat(70));
    
    result = await carRentalBotService.processMessage(testPhone, 'Check Again', testName);
    console.log('Response:', result.response.includes('processing') ? '⏳ Still processing...' : result.response.substring(0, 50));
    console.log('Button:', result.buttons?.[0]?.title);
    console.log('State:', result.sessionState);
    
    const isWelcome1 = result.response.includes('Welcome to CarRental Pro');
    console.log('Is Welcome?', isWelcome1 ? '❌ YES (BUG!)' : '✅ NO');

    await wait(1500);

    // Step 4: Click "Check Again" #2 (still pending)
    console.log('\n4️⃣ User clicks "Check Again" #2 (still pending)');
    console.log('-'.repeat(70));
    
    result = await carRentalBotService.processMessage(testPhone, 'Check Again', testName);
    console.log('Response:', result.response.includes('processing') ? '⏳ Still processing...' : result.response.substring(0, 50));
    console.log('Button:', result.buttons?.[0]?.title);
    console.log('State:', result.sessionState);
    
    const isWelcome2 = result.response.includes('Welcome to CarRental Pro');
    console.log('Is Welcome?', isWelcome2 ? '❌ YES (BUG!)' : '✅ NO');

    await wait(1500);

    // Step 5: Simulate payment completion and check again
    console.log('\n5️⃣ Payment completes, user clicks "Check Again"');
    console.log('-'.repeat(70));
    console.log('💰 Simulating payment completion...');
    
    // Mock Snippe API to return completed status
    const snippePaymentService = require('./src/services/snippePaymentService');
    const originalCheck = snippePaymentService.checkPaymentStatus;
    snippePaymentService.checkPaymentStatus = async (paymentId) => {
      return {
        success: true,
        status: 'completed',
        paymentId: paymentId
      };
    };
    
    result = await carRentalBotService.processMessage(testPhone, 'Check Again', testName);
    
    console.log('\n📨 Final Response:');
    console.log(result.response);
    console.log('\n📊 Final State:');
    console.log('State:', result.sessionState);
    console.log('Has Buttons:', result.buttons !== null);
    console.log('Message Type:', result.messageType);
    
    // Restore original function
    snippePaymentService.checkPaymentStatus = originalCheck;

    // Verify results
    console.log('\n' + '='.repeat(70));
    console.log('TEST RESULTS:');
    console.log('='.repeat(70));
    
    const allChecks = [
      { name: 'Check Again #1 did not loop to welcome', passed: !isWelcome1 },
      { name: 'Check Again #2 did not loop to welcome', passed: !isWelcome2 },
      { name: 'Final state is completed', passed: result.sessionState === 'completed' },
      { name: 'No buttons shown after success', passed: result.buttons === null },
      { name: 'Message type is text', passed: result.messageType === 'text' },
      { name: 'Success message shown', passed: result.response.includes('Payment Successful') }
    ];
    
    const allPassed = allChecks.every(check => check.passed);
    
    allChecks.forEach(check => {
      console.log(check.passed ? '✅' : '❌', check.name);
    });
    
    console.log('='.repeat(70));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ "Check Again" button works correctly');
      console.log('✅ No looping to welcome message');
      console.log('✅ Conversation terminates after payment success');
    } else {
      console.log('❌ SOME TESTS FAILED');
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testCompletePaymentCycle();
