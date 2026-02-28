require('dotenv').config();
const axios = require('axios');

async function testVoicePrerelease() {
  console.log('📞 Testing Voice with Pre-Release URL\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.BRIQ_API_KEY;
  const voiceUrl = 'https://pre-release.karibu.briq.tz';
  
  console.log(`Voice API URL: ${voiceUrl}/v1/voice/calls/tts`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`Phone: 255683859574`);
  console.log('\n' + '='.repeat(60));
  
  const payload = {
    receiver_number: '255683859574',
    text: 'Hello Ibn-Asad! Congratulations! Your booking for Toyota Vitz has been confirmed successfully. Your car will arrive soon. Thank you for choosing CarRental Pro.'
  };

  console.log('\n📤 Request:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n📞 Initiating voice call...\n');

  try {
    const response = await axios.post(
      `${voiceUrl}/v1/voice/calls/tts`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      }
    );

    console.log('✅ VOICE CALL INITIATED!\n');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      console.log('\n📋 Call Details:');
      console.log(`   Call ID: ${response.data.data.call_id || response.data.data.id}`);
      console.log(`   Status: ${response.data.data.status}`);
      console.log(`   Receiver: ${response.data.data.receiver_number}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📱 CHECK YOUR PHONE: +255683859574');
    console.log('='.repeat(60));
    console.log('\nYou should receive:');
    console.log('✅ Incoming call');
    console.log('✅ Voice message with booking confirmation');
    
    return true;
  } catch (error) {
    console.log('❌ VOICE CALL FAILED\n');
    console.log('Error:', error.message);
    
    if (error.code) {
      console.log('Error Code:', error.code);
    }
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

testVoicePrerelease()
  .then((success) => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ Voice call test passed!');
    } else {
      console.log('❌ Voice call test failed');
    }
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
