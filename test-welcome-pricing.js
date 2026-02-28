require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '+255683859574';

/**
 * Test welcome and pricing messages
 */
async function testMessages() {
  console.log('\n🧪 TESTING WELCOME & PRICING MESSAGES\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Welcome with random text
    console.log('\n📱 Test 1: Welcome Message (user types "kaka")');
    console.log('-'.repeat(60));
    await sendMessage('kaka');
    await wait(2000);

    // Test 2: Welcome with hello
    console.log('\n👋 Test 2: Welcome Message (user types "hello")');
    console.log('-'.repeat(60));
    await sendMessage('hello');
    await wait(2000);

    // Test 3: Check prices
    console.log('\n💰 Test 3: Check Prices');
    console.log('-'.repeat(60));
    await sendMessage('check_prices');
    await wait(2000);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\nCheck the responses:');
    console.log('1. Welcome should NOT repeat what you typed');
    console.log('2. Pricing should be short and simple');

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
  
  console.log(`✅ Message sent: "${message}"`);
  return response.data;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testMessages()
  .then(() => {
    console.log('\n✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
