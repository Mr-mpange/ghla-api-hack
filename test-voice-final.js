require('dotenv').config();
const briqNotificationService = require('./src/services/briqNotificationService');

async function testVoiceFinal() {
  console.log('📞 FINAL VOICE CALL TEST\n');
  console.log('='.repeat(70));
  console.log('Testing if voice call REALLY works! 😄\n');
  console.log('='.repeat(70));
  
  const testPhone = '+255683859574';
  const voiceMessage = 'Hello Ibn-Asad! This is a test voice call from CarRental Pro. Congratulations! Your booking has been confirmed successfully. Your car will arrive soon. Thank you for choosing CarRental Pro!';
  
  console.log('\n📱 Calling:', testPhone);
  console.log('📝 Message:', voiceMessage.substring(0, 50) + '...');
  console.log('\n🔊 Initiating voice call...\n');
  
  try {
    const result = await briqNotificationService.sendVoiceCall(testPhone, voiceMessage);
    
    console.log('='.repeat(70));
    
    if (result.success) {
      console.log('✅ VOICE CALL INITIATED SUCCESSFULLY!\n');
      console.log('📋 Call Details:');
      console.log(`   Call ID: ${result.messageId}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Infobip Call ID: ${result.data.infobip_call_id}`);
      console.log(`   Error Details: ${result.data.error_details || 'None'}`);
      
      console.log('\n' + '='.repeat(70));
      console.log('📱 CHECK YOUR PHONE NOW: ' + testPhone);
      console.log('='.repeat(70));
      console.log('\n🔔 You should receive:');
      console.log('   ✅ Incoming call');
      console.log('   ✅ Voice message playing');
      console.log('   ✅ Text-to-speech audio');
      
      console.log('\n💡 If you receive the call, VOICE IS WORKING! 🎉');
      console.log('💡 If you receive SMS instead, voice failed and fell back to SMS');
      
      return true;
    } else {
      console.log('❌ VOICE CALL FAILED\n');
      console.log('Error:', result.error);
      console.log('\nVoice call failed and fell back to SMS');
      return false;
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

testVoiceFinal()
  .then((success) => {
    console.log('\n' + '='.repeat(70));
    if (success) {
      console.log('🎉 VOICE CALL TEST PASSED!');
      console.log('The system is ready to make voice calls to customers!');
    } else {
      console.log('❌ Voice call test failed');
    }
    console.log('='.repeat(70));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }