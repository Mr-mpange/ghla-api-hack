require('dotenv').config();
const axios = require('axios');

async function testVoiceTTS() {
  console.log('📞 Testing Briq Voice Call (TTS)\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.BRIQ_API_KEY;
  const baseUrl = 'https://karibu.briq.tz';
  const testPhone = '+255683859574';
  
  console.log(`API URL: ${baseUrl}/v1/voice/calls/tts`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`Phone: ${testPhone}`);
  console.log('\n' + '='.repeat(60));
  
  // Format phone number (remove + for Briq)
  const formattedPhone = testPhone.substring(1); // Remove +
  
  const voiceMessage = 'Hello Ibn-Asad! Congratulations! Your booking for Toyota Vitz has been confirmed successfully. Your car will arrive soon as possible. Thank you for choosing CarRental Pro.';
  
  const payload = {
    receiver_number: formattedPhone,
    text: voiceMessage
  };

  console.log('\n📤 Request:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n' + '='.repeat(60));
  console.log('\n📞 Initiating voice call...\n');

  try {
    const response = await axios.post(
      `${baseUrl}/v1/voice/calls/tts`,
      payload,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
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
    console.log('📱 CHECK YOUR PHONE: ' + testPhone);
    console.log('='.repeat(60));
    console.log('\nYou should receive:');
    console.log('✅ Incoming call');
    console.log('✅ Voice message with booking confirmation');
    console.log('✅ Text-to-speech audio');
    
    return true;
  } catch (error) {
    console.log('\n❌ VOICE CALL FAILED\n');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

testVoiceTTS()
  .then((success) => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ Voice call test complete!');
      console.log('Check your phone for the incoming call.');
    } else {
      console.log('❌ Voice call failed. Check error above.');
    }
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
