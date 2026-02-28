require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '+255683859574';

/**
 * Test button click with actual button title
 */
async function testButtonClick() {
  console.log('\n🧪 TESTING BUTTON CLICK WITH TITLE\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Send greeting
    console.log('\n📱 Step 1: Send Greeting');
    console.log('-'.repeat(60));
    await sendMessage('Hello');
    await wait(2000);

    // Step 2: Click Browse Cars
    console.log('\n🚗 Step 2: Click Browse Cars');
    console.log('-'.repeat(60));
    await sendMessage('browse_cars');
    await wait(2000);

    // Step 3: Click Economy with TITLE (as WhatsApp sends it)
    console.log('\n💰 Step 3: Click Economy Button (with emoji title)');
    console.log('-'.repeat(60));
    await sendMessage('🚗 Economy');
    await wait(2000);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\nIf you see car catalog, the button click worked!');
    console.log('If you see "I understand you said..." message, button click failed.');

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
              name: 'Test Customer'
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
testButtonClick()
  .then(() => {
    console.log('\n✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
