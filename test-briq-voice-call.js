require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.BRIQ_API_KEY;
const baseUrl = 'https://karibu.briq.tz';
const testPhone = '+255683859574';

async function testVoiceCall() {
  console.log('📞 Testing Briq Voice Call...\n');
  console.log(`Phone: ${testPhone}`);
  console.log(`API: ${baseUrl}/v1/otp/request\n`);

  const voiceMessage = 'Hello! Congratulations on your car booking with CarRental Pro. Your car will arrive soon. Thank you!';

  const payload = {
    phone_number: testPhone,
    app_key: 'carrentalpro_voice',
    delivery_method: 'call',
    sender_id: 'BRIQ',
    message_template: voiceMessage,
    otp_length: 4,
    minutes_to_expire: 5
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('\nSending voice call...\n');

  try {
    const response = await axios.post(
      `${baseUrl}/v1/otp/request`,
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
    
    console.log('\n📞 You should receive a voice call on', testPhone);
    console.log('The call will say:', voiceMessage);
    
    return true;
  } catch (error) {
    console.log('❌ VOICE CALL FAILED\n');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

testVoiceCall()
  .then((success) => {
    if (success) {
      console.log('\n✅ Check your phone for the voice call!');
    } else {
      console.log('\n❌ Voice call failed. Check the error above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
