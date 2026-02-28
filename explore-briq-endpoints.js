require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.BRIQ_API_KEY;
const baseUrl = 'https://karibu.briq.tz';

// Common endpoint patterns to try
const endpoints = [
  '/karibu/messages/send',
  '/karibu/messages/send-instant',
  '/karibu/message/send',
  '/karibu/message/send-instant',
  '/karibu/sms/send',
  '/karibu/sms/send-instant',
  '/messages/send',
  '/message/send',
  '/sms/send',
  '/v1/messages/send',
  '/v1/message/send',
  '/v1/sms/send'
];

async function testEndpoint(endpoint) {
  try {
    const response = await axios.post(
      `${baseUrl}${endpoint}`,
      {
        content: 'Test message',
        recipients: ['+255683859574'],
        sender_id: 'BRIQ'
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    return {
      endpoint,
      status: response.status,
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      endpoint,
      status: error.response?.status || 'timeout',
      success: false,
      error: error.response?.data || error.message
    };
  }
}

async function exploreEndpoints() {
  console.log('🔍 Exploring Briq API Endpoints...\n');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...\n`);
  console.log('Testing endpoints:\n');

  const results = [];
  
  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint}... `);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else if (result.status === 404) {
      console.log('❌ Not Found');
    } else if (result.status === 400) {
      console.log('⚠️  Bad Request (endpoint exists but wrong params)');
      console.log('Error:', JSON.stringify(result.error, null, 2));
    } else if (result.status === 401 || result.status === 403) {
      console.log('🔒 Auth Error');
    } else {
      console.log(`❌ ${result.status}`);
    }
  }

  console.log('\n\n📊 Summary:\n');
  
  const successful = results.filter(r => r.success);
  const badRequest = results.filter(r => r.status === 400);
  const notFound = results.filter(r => r.status === 404);
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`⚠️  Bad Request (endpoint exists): ${badRequest.length}`);
  console.log(`❌ Not Found: ${notFound.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Working endpoints:');
    successful.forEach(r => console.log(`  - ${r.endpoint}`));
  }
  
  if (badRequest.length > 0) {
    console.log('\n⚠️  Endpoints that exist but need correct params:');
    badRequest.forEach(r => console.log(`  - ${r.endpoint}`));
  }
}

exploreEndpoints()
  .then(() => {
    console.log('\n✅ Exploration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
