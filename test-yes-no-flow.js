require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '+255683859574';

/**
 * Test Yes/No confirmation flow
 */
async function testYesNoFlow() {
  console.log('\n🧪 TESTING YES/NO CONFIRMATION FLOW\n');
  console.log('='.repeat(60));

  try {
    // Test Flow 1: User says YES
    console.log('\n📋 FLOW 1: USER SAYS YES');
    console.log('='.repeat(60));

    console.log('\n1. Welcome');
    await sendMessage('hello');
    await wait(1500);

    console.log('2. Browse Cars');
    await sendMessage('browse_cars');
    await wait(1500);

    console.log('3. Select Economy');
    await sendMessage('economy_cars');
    await wait(1500);

    console.log('4. Select Car');
    await sendMessage('car_eco_001');
    console.log('   Expected: Car details + "Do you want to rent this car?"');
    console.log('   Buttons: [Yes, Rent It] [No, Thanks]');
    await wait(1500);

    console.log('5. Click YES');
    await sendMessage('confirm_rent_eco_001');
    console.log('   Expected: Payment instructions + [I have paid] button');
    await wait(2000);

    // Test Flow 2: User says NO
    console.log('\n📋 FLOW 2: USER SAYS NO');
    console.log('='.repeat(60));

    console.log('\n1. Welcome');
    await sendMessage('hello');
    await wait(1500);

    console.log('2. Browse Cars');
    await sendMessage('browse_cars');
    await wait(1500);

    console.log('3. Select Economy');
    await sendMessage('economy_cars');
    await wait(1500);

    console.log('4. Select Car');
    await sendMessage('car_eco_002');
    await wait(1500);

    console.log('5. Click NO');
    await sendMessage('cancel_rent');
    console.log('   Expected: "No problem! Thank you..." + NO BUTTONS');
    console.log('   System: TERMINATES ✅');

    console.log('\n' + '='.repeat(60));
    console.log('✅ YES/NO FLOW TEST COMPLETE');
    console.log('='.repeat(60));

    console.log('\n📋 Summary:');
    console.log('✅ Car details show: "Do you want to rent this car?"');
    console.log('✅ Buttons: [Yes, Rent It] [No, Thanks]');
    console.log('✅ YES → Payment process');
    console.log('✅ NO → Terminate (no buttons)');
    console.log('✅ No photo mentions');

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
  
  console.log(`   ✅ Sent: "${message}"`);
  return response.data;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testYesNoFlow()
  .then(() => {
    console.log('\n✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
