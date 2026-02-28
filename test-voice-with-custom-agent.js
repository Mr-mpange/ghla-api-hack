require('dotenv').config();
const axios = require('axios');
const https = require('https');
const tls = require('tls');

async function testVoiceWithCustomAgent() {
  console.log('📞 Testing Voice with Custom HTTPS Agent\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.BRIQ_API_KEY;
  const voiceUrl = 'https://pre-release.karibu.briq.tz';
  
  console.log(`Voice API URL: ${voiceUrl}/v1/voice/calls/tts`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);
  console.log('\n' + '='.repeat(60));
  
  // Try different TLS/SSL configurations
  const configs = [
    {
      name: 'Config 1: Disable all SSL verification',
      agent: new https.Agent({
        rejectUnauthorized: false,
        requestCert: false,
        agent: false
      })
    },
    {
      name: 'Config 2: Set minimum TLS version',
      agent: new https.Agent({
        rejectUnauthorized: false,
        minVersion: 'TLSv1',
        maxVersion: 'TLSv1.3'
      })
    },
    {
      name: 'Config 3: Allow legacy renegotiation',
      agent: new https.Agent({
        rejectUnauthorized: false,
        secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
      })
    }
  ];

  for (const config of configs) {
    console.log(`\n🔧 Trying: ${config.name}`);
    
    try {
      const response = await axios.post(
        `${voiceUrl}/v1/voice/calls/tts`,
        {
          receiver_number: '255683859574',
          text: 'Test voice call from CarRental Pro'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          httpsAgent: config.agent,
          timeout: 10000
        }
      );

      console.log('✅ SUCCESS!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    } catch (error) {
      console.log('❌ Failed:', error.code || error.message);
    }
  }
  
  // Try with http (non-secure) if https fails
  console.log('\n🔧 Trying: HTTP (non-secure)');
  try {
    const httpUrl = voiceUrl.replace('https://', 'http://');
    const response = await axios.post(
      `${httpUrl}/v1/voice/calls/tts`,
      {
        receiver_number: '255683859574',
        text: 'Test voice call from CarRental Pro'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        timeout: 10000
      }
    );

    console.log('✅ SUCCESS with HTTP!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Failed:', error.code || error.message);
  }

  return false;
}

testVoiceWithCustomAgent()
  .then((success) => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ Found working configuration!');
    } else {
      console.log('❌ All configurations failed');
      console.log('\nThe pre-release server has SSL issues that cannot be bypassed.');
      console.log('Contact Briq support to fix the SSL certificate.');
    }
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
