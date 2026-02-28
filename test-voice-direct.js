require('dotenv').config();
const axios = require('axios');

async function testVoiceDirect() {
  console.log('\n🔥 HACKATHON MODE: Testing Voice Call Direct\n');
  console.log('=' .repeat(60));
  
  const apiKey = process.env.BRIQ_API_KEY;
  const phoneNumber = '255683859574'; // Without +
  
  console.log('Testing different voice call methods...\n');
  
  // Method 1: Standard TTS
  console.log('📞 Method 1: Standard TTS');
  try {
    const response1 = await axios.post(
      'https://karibu.briq.tz/v1/voice/calls/tts',
      {
        receiver_number: phoneNumber,
        text: 'Hello! your payement received succesfully and the product will reach you soon  .Thanks for your support see you again'
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Response:', JSON.stringify(response1.data, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
  
  console.log('\n' + '-'.repeat(60) + '\n');
  
  // Method 2: With language parameter
  console.log('📞 Method 2: With Language Parameter (English)');
  try {
    const response2 = await axios.post(
      'https://karibu.briq.tz/v1/voice/calls/tts',
      {
        receiver_number: phoneNumber,
        text: 'Hello! This is a test call from CarRental Pro.',
        language: 'en'
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Response:', JSON.stringify(response2.data, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
  
  console.log('\n' + '-'.repeat(60) + '\n');
  
  // Method 3: With +255 format
  console.log('📞 Method 3: With +255 Format');
  try {
    const response3 = await axios.post(
      'https://karibu.briq.tz/v1/voice/calls/tts',
      {
        receiver_number: '+255683859574',
        text: 'Hello! This is a test call from CarRental Pro.'
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Response:', JSON.stringify(response3.data, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
  
  console.log('\n' + '-'.repeat(60) + '\n');
  
  // Method 4: Shorter message
  console.log('📞 Method 4: Very Short Message');
  try {
    const response4 = await axios.post(
      'https://karibu.briq.tz/v1/voice/calls/tts',
      {
        receiver_number: phoneNumber,
        text: 'Test call. Your booking is confirmed. Thank you.'
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Response:', JSON.stringify(response4.data, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📱 CHECK YOUR PHONE: +255683859574');
  console.log('   You should receive 4 calls in the next 60 seconds');
  console.log('='.repeat(60) + '\n');
  
  // Check account info
  console.log('🔍 Checking Briq Account Info...\n');
  try {
    const accountInfo = await axios.get(
      'https://karibu.briq.tz/v1/account/balance',
      {
        headers: {
          'X-API-Key': apiKey
        }
      }
    );
    
    console.log('💰 Account Balance:', JSON.stringify(accountInfo.data, null, 2));
  } catch (error) {
    console.log('⚠️  Could not fetch balance:', error.response?.data || error.message);
  }
  
  console.log('\n');
}

testVoiceDirect();
