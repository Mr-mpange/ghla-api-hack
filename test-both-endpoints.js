require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.BRIQ_API_KEY;
const baseUrl = 'https://briq.tz';
const testPhone = '+255683859574';
const testMessage = 'Test from CarRental Pro! 🚗';

async function testEndpoint(endpoint, payload) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${endpoint}`);
  console.log(`${'='.repeat(60)}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
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

    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response Type:', typeof response.data);
    
    if (typeof response.data === 'string') {
      console.log('Response (first 200 chars):', response.data.substring(0, 200));
      if (response.data.includes('<!doctype html>')) {
        console.log('⚠️  WARNING: Received HTML instead of JSON!');
        return false;
      }
    } else {
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
    
    return true;
  } catch (error) {
    console.log('\n❌ FAILED');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response Type:', typeof error.response.data);
      
      if (typeof error.response.data === 'string') {
        console.log('Response (first 200 chars):', error.response.data.substring(0, 200));
      } else {
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Briq API Endpoints\n');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`Test Phone: ${testPhone}\n`);

  // Test 1: /v1/sms/send (from TypeScript code)
  const smsPayload = {
    recipients: [testPhone],
    message: testMessage,
    sender_id: 'BRIQ',
    message_type: 'text',
    priority: 'normal'
  };
  
  const test1 = await testEndpoint('/v1/sms/send', smsPayload);

  // Test 2: /v1/message/send-instant (from quickstart docs)
  const instantPayload = {
    content: testMessage,
    recipients: [testPhone],
    sender_id: 'BRIQ'
  };
  
  const test2 = await testEndpoint('/v1/message/send-instant', instantPayload);

  // Test 3: Try with karibu.briq.tz base URL
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing with karibu.briq.tz base URL');
  console.log(`${'='.repeat(60)}`);
  
  try {
    const response = await axios.post(
      'https://karibu.briq.tz/v1/message/send-instant',
      instantPayload,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ SUCCESS with karibu.briq.tz!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Failed with karibu.briq.tz');
    console.log('Status:', error.response?.status);
    if (error.response?.data) {
      console.log('Response:', typeof error.response.data === 'string' 
        ? error.response.data.substring(0, 200) 
        : JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`/v1/sms/send: ${test1 ? '✅' : '❌'}`);
  console.log(`/v1/message/send-instant: ${test2 ? '✅' : '❌'}`);
}

runTests()
  .then(() => {
    console.log('\n✅ Tests complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
