require('dotenv').config();
const briqNotificationService = require('./src/services/briqNotificationService');

async function testVoiceCall() {
  console.log('\n📞 Testing Voice Call to Your Number\n');
  console.log('=' .repeat(60));
  
  const phoneNumber = '+255683859574';
  const testMessage = 'Hello! This is a test voice call from CarRental Pro. Your booking for Toyota Vitz has been confirmed successfully. Pickup date is March 15, 2024. Total amount is 1000 Tanzanian Shillings. Thank you for choosing CarRental Pro.';
  
  console.log('Configuration:');
  console.log('  Phone Number:', phoneNumber);
  console.log('  Briq API URL:', 'https://karibu.briq.tz');
  console.log('  Endpoint:', '/v1/voice/calls/tts');
  console.log('  API Key:', process.env.BRIQ_API_KEY ? '✅ Configured' : '❌ Missing');
  
  console.log('\n📝 Voice Message:');
  console.log('  "' + testMessage + '"');
  
  console.log('\n🚀 Initiating voice call...\n');
  
  try {
    const result = await briqNotificationService.sendVoiceCall(phoneNumber, testMessage);
    
    console.log('=' .repeat(60));
    console.log('✅ VOICE CALL INITIATED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    
    console.log('\n📊 Response Details:');
    console.log('  Success:', result.success);
    console.log('  Status:', result.status);
    console.log('  Call Log ID:', result.messageId);
    
    if (result.data) {
      console.log('\n📋 Full Response:');
      console.log(JSON.stringify(result.data, null, 2));
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📱 CHECK YOUR PHONE NOW!');
    console.log('=' .repeat(60));
    console.log('\nYou should receive a call on +255683859574 within:');
    console.log('  • 10-30 seconds (normal)');
    console.log('  • Up to 60 seconds (if network is busy)');
    
    console.log('\n💡 If you don\'t receive the call:');
    console.log('  1. Check phone is on and has signal');
    console.log('  2. Disable Do Not Disturb mode');
    console.log('  3. Check call blocking/spam filters');
    console.log('  4. Try calling from another phone to verify it works');
    console.log('  5. Contact Briq support:');
    console.log('     • Email: [email protected]');
    console.log('     • Phone: +255 788 344 348');
    console.log('     • Ask: "Is voice TTS enabled for my API key?"');
    
    console.log('\n✅ System sent the request successfully!');
    console.log('   Briq accepted it with status: "' + result.status + '"');
    console.log('\n');
    
  } catch (error) {
    console.log('=' .repeat(60));
    console.log('❌ VOICE CALL FAILED');
    console.log('=' .repeat(60));
    
    console.error('\n📛 Error Details:');
    console.error('  Message:', error.message);
    
    if (error.response) {
      console.error('\n📋 API Response:');
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('\n📚 Stack Trace:');
    console.error(error.stack);
    
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Verify Briq API key is correct');
    console.log('  2. Check Briq account has voice service enabled');
    console.log('  3. Verify account has sufficient balance');
    console.log('  4. Contact Briq support for assistance');
    console.log('\n');
  }
}

testVoiceCall();
