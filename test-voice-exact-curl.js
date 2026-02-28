require('dotenv').config();
const axios = require('axios');

async function testExactCurl() {
  console.log('📞 Testing EXACT curl command from Briq docs\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.BRIQ_API_KEY;
  
  console.log('curl -X POST https://karibu.briq.tz/v1/voice/calls/tts \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log(`  -H "X-API-Key: ${apiKey.substring(0, 10)}..." \\`);
  console.log('  -d \'{"receiver_number": "255683859574","text": "Hello, this is a message from Briq. Your order has been confirmed."}\'');
  console.log('\n' + '='.repeat(60));
  
  try {
    const response = await axios.post(
      'https://karibu.briq.tz/v1/voice/calls/tts',
      {
        receiver_number: '255683859574',
        text: 'Hello, this is a message from Briq. Your order has been confirmed.'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      }
    );

    console.log('\n✅ VOICE CALL INITIATED!\n');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📱 CHECK YOUR PHONE: +255683859574');
    console.log('='.repeat(60));
    console.log('\nYou should receive an incoming call!');
    
    return true;
  } catch (error) {
    console.log('\n❌ VOICE CALL FAILED\n');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.log('\n💡 The endpoint returns 404 - Voice API not available yet');
        console.log('   Contact Briq support to enable voice calls');
      }
    }
    
    return false;
  }
}

testExactCurl()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
