require('dotenv').config();
const axios = require('axios');

async function testBriqSMS() {
  console.log('📱 Testing Briq SMS with Correct Endpoint...\n');
  
  const apiKey = process.env.BRIQ_API_KEY;
  const baseUrl = 'https://briq.tz';
  const endpoint = '/v1/message/send-instant';
  
  console.log(`API URL: ${baseUrl}${endpoint}`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`Sender ID: BRIQ`);
  console.log(`Recipient: +255683859574\n`);

  const payload = {
    content: 'Test message from CarRental Pro! Your booking system is working perfectly. 🎉',
    recipients: ['+255683859574'],
    sender_id: 'BRIQ'
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('\nSending...\n');

  try {
    const response = await axios.post(
      `${baseUrl}${endpoint}`,
      payload,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ SMS SENT SUCCESSFULLY!\n');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ SMS FAILED\n');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

testBriqSMS()
  .then((success) => {
    if (success) {
      console.log('\n✅ Check your phone (+255683859574) for the SMS!');
    } else {
      console.log('\n❌ SMS sending failed. Check the error above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
