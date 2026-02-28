require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '+255683859574';

/**
 * Test browse button specifically
 */
async function testBrowseButton() {
  console.log('\n🧪 TESTING BROWSE BUTTON\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Send greeting to get main menu
    console.log('\n📱 Step 1: Send Greeting');
    console.log('-'.repeat(60));
    await sendMessage('hello');
    console.log('Expected: Welcome message with Browse Cars button');
    await wait(2000);

    // Step 2: Click Browse Cars button
    console.log('\n🚗 Step 2: Click Browse Cars Button');
    console.log('-'.repeat(60));
    await sendMessage('browse_cars');
    console.log('Expected: Category selection (Economy, SUVs, Luxury, Vans)');
    await wait(2000);

    // Step 3: Click Browse Cars with emoji title (as WhatsApp sends it)
    console.log('\n🚗 Step 3: Click Browse Cars (with emoji title)');
    console.log('-'.repeat(60));
    await sendMessage('🚗 Browse Cars');
    console.log('Expected: Category selection (Economy, SUVs, Luxury, Vans)');
    await wait(2000);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📋 What to check:');
    console.log('1. After "hello" → Should show welcome with buttons');
    console.log('2. After "browse_cars" → Should show category selection');
    console.log('3. After "🚗 Browse Cars" → Should show category selection');
    console.log('\n❌ If you see welcome message again, there\'s a bug');
    console.log('✅ If you see category selection, it\'s working!');

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
testBrowseButton()
  .then(() => {
    console.log('\n✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
