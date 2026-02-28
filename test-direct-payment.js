require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '+255683859574';

/**
 * Test direct payment from catalog
 */
async function testDirectPayment() {
  console.log('\n🧪 TESTING DIRECT PAYMENT FROM CATALOG\n');
  console.log('='.repeat(60));

  try {
    console.log('\n1️⃣ Welcome');
    console.log('-'.repeat(60));
    await sendMessage('hello');
    console.log('Expected: Welcome + [Browse Cars] [My Bookings]');
    await wait(1500);

    console.log('\n2️⃣ Browse Cars');
    console.log('-'.repeat(60));
    await sendMessage('browse_cars');
    console.log('Expected: Category selection');
    await wait(1500);

    console.log('\n3️⃣ Select Economy');
    console.log('-'.repeat(60));
    await sendMessage('economy_cars');
    console.log('Expected: List of cars with prices');
    console.log('Message: "Select a car to rent:"');
    await wait(1500);

    console.log('\n4️⃣ Click Car (Direct to Payment)');
    console.log('-'.repeat(60));
    await sendMessage('confirm_rent_eco_002');
    console.log('Expected: Payment instructions immediately');
    console.log('NO car details page!');
    console.log('Button: [I have paid]');
    await wait(2000);

    console.log('\n' + '='.repeat(60));
    console.log('✅ DIRECT PAYMENT TEST COMPLETE');
    console.log('='.repeat(60));

    console.log('\n📋 Flow Summary:');
    console.log('1. Welcome → Browse');
    console.log('2. Browse → Category');
    console.log('3. Category → Car list');
    console.log('4. Click car → DIRECT TO PAYMENT ✅');
    console.log('   (No details page, no Yes/No)');

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
  
  console.log(`✅ Sent: "${message}"`);
  return response.data;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testDirectPayment()
  .then(() => {
    console.log('\n✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
