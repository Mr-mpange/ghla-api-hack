require('dotenv').config();
const axios = require('axios');

async function testBriqAPIKey() {
  console.log('🔑 Testing Briq API Key...\n');
  
  const apiKey = process.env.BRIQ_API_KEY;
  console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : '❌ Not Set'}`);
  console.log(`Testing endpoint: https://karibu.briq.tz/karibu/x-api-key\n`);

  try {
    const response = await axios.get('https://karibu.briq.tz/karibu/x-api-key', {
      headers: {
        'X-API-Key': apiKey
      }
    });

    console.log('✅ API Key is VALID!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\nStatus:', response.status);
    
    return true;
  } catch (error) {
    console.log('❌ API Key Test Failed');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

testBriqAPIKey()
  .then((success) => {
    if (success) {
      console.log('\n✅ Ready to send messages!');
    } else {
      console.log('\n❌ Fix API key before sending messages');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
