require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.BRIQ_API_KEY;
const baseUrl = 'https://karibu.briq.tz';
const testPhone = '+255683859574';
const testMessage = '🎉 WhatsApp Test from CarRental Pro!';

async function testWhatsAppChannels() {
  console.log('📱 Testing Briq WhatsApp Channels...\n');

  // Test 1: Try with channel parameter
  console.log('1️⃣ Testing with channel: "whatsapp"');
  try {
    const response = await axios.post(
      `${baseUrl}/v1/message/send-instant`,
      {
        content: testMessage,
        recipients: [testPhone],
        sender_id: 'BRIQ',
        channel: 'whatsapp'
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n---\n');

  // Test 2: Try with delivery_method parameter
  console.log('2️⃣ Testing with delivery_method: "whatsapp"');
  try {
    const response = await axios.post(
      `${baseUrl}/v1/message/send-instant`,
      {
        content: testMessage,
        recipients: [testPhone],
        sender_id: 'BRIQ',
        delivery_method: 'whatsapp'
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n---\n');

  // Test 3: Try dedicated WhatsApp endpoint
  console.log('3️⃣ Testing /v1/whatsapp/send endpoint');
  try {
    const response = await axios.post(
      `${baseUrl}/v1/whatsapp/send`,
      {
        content: testMessage,
        recipients: [testPhone],
        sender_id: 'BRIQ'
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n---\n');

  // Test 4: Check if Briq supports WhatsApp at all
  console.log('4️⃣ Checking Briq capabilities');
  try {
    const response = await axios.get(
      `${baseUrl}/v1/account/balance`,
      {
        headers: {
          'X-API-Key': apiKey
        }
      }
    );
    
    console.log('Account info:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('Could not fetch account info');
  }
}

testWhatsAppChannels()
  .then(() => {
    console.log('\n✅ Tests complete!');
    console.log('\nNote: Briq may only support SMS and Voice calls.');
    console.log('WhatsApp messages might be sent as SMS by default.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
