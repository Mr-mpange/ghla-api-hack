require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '+255683859574';

/**
 * Test simplified flow as per user requirements
 */
async function testSimplifiedFlow() {
  console.log('\n🧪 TESTING SIMPLIFIED FLOW\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Welcome
    console.log('\n1️⃣ WELCOME');
    console.log('-'.repeat(60));
    await sendMessage('hello');
    console.log('✅ Expected: Simple welcome + 2 buttons (Browse Cars, My Bookings)');
    await wait(2000);

    // Step 2: Browse Cars
    console.log('\n2️⃣ BROWSE CARS');
    console.log('-'.repeat(60));
    await sendMessage('browse_cars');
    console.log('✅ Expected: Category selection (Economy, SUVs, Luxury, Vans)');
    await wait(2000);

    // Step 3: Select Category (Economy)
    console.log('\n3️⃣ SELECT CATEGORY');
    console.log('-'.repeat(60));
    await sendMessage('economy_cars');
    console.log('✅ Expected: List of economy cars with prices');
    await wait(2000);

    // Step 4: Select Car
    console.log('\n4️⃣ SELECT CAR');
    console.log('-'.repeat(60));
    await sendMessage('car_eco_001');
    console.log('✅ Expected: Car details with "Pay Now" button');
    await wait(2000);

    // Step 5: Click Pay Now
    console.log('\n5️⃣ CLICK PAY NOW');
    console.log('-'.repeat(60));
    await sendMessage('pay_now_eco_001');
    console.log('✅ Expected: Payment instructions + "I have paid" button');
    await wait(2000);

    // Step 6: Payment Success (simulated)
    console.log('\n6️⃣ PAYMENT SUCCESS');
    console.log('-'.repeat(60));
    console.log('✅ Expected: Success message + NO BUTTONS (system terminates)');
    console.log('   Message should say: "Payment Successful! Car will be delivered"');

    console.log('\n' + '='.repeat(60));
    console.log('✅ SIMPLIFIED FLOW TEST COMPLETE');
    console.log('='.repeat(60));

    console.log('\n📋 Flow Summary:');
    console.log('1. Welcome → 2 buttons only');
    console.log('2. Browse → Category selection');
    console.log('3. Category → Cars with prices');
    console.log('4. Car → Details + Pay Now');
    console.log('5. Pay → Payment instructions');
    console.log('6. Success → Final message (NO buttons)');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

async function sendMessage(message) {
  const webhookPayload = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: TEST_PHONE.replace(/\+/g, ''),
            id: `msg_${Date.now()}`,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: 'text',
            text: {
              body: message
            }
          }],
          contacts: [{
            profile: {
              name: 'Ibn-Asad'
            }
          }]
        }
      }]
    }]
  };

  const response = await axios.post(
    `${BASE_URL}/webhook/whatsapp`,
    webhookPayload,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  console.log(`   Sent: "${message}"`);
  return response.data;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testSimplifiedFlow()
  .then(() => {
    console.log('\n✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
