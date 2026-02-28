require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.BRIQ_API_KEY;
const baseUrl = 'https://karibu.briq.tz';

async function testDeveloperApps() {
  console.log('🔍 Checking Briq Developer Apps...\n');
  console.log(`API Key: ${apiKey.substring(0, 10)}...\n`);

  // Test 1: List developer apps
  console.log('1️⃣ Trying to list developer apps...');
  try {
    const response = await axios.get(
      `${baseUrl}/v1/developer-apps`,
      {
        headers: {
          'X-API-Key': apiKey
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('Developer Apps:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n---\n');

  // Test 2: Try to create a developer app
  console.log('2️⃣ Trying to create a developer app...');
  try {
    const response = await axios.post(
      `${baseUrl}/v1/developer-apps`,
      {
        name: 'CarRental Pro Voice',
        description: 'Voice notifications for car rental bookings'
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Developer app created!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.app_key) {
      console.log('\n🎉 Your app_key:', response.data.app_key);
      console.log('\nAdd this to your .env file:');
      console.log(`BRIQ_DEVELOPER_APP_KEY=${response.data.app_key}`);
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n---\n');

  // Test 3: Check workspace info
  console.log('3️⃣ Checking workspace info...');
  try {
    const response = await axios.get(
      `${baseUrl}/v1/workspace`,
      {
        headers: {
          'X-API-Key': apiKey
        }
      }
    );
    
    console.log('✅ Workspace info:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
    }
  }

  console.log('\n---\n');

  // Test 4: Try alternative endpoints
  const endpoints = [
    '/v1/apps',
    '/v1/developer/apps',
    '/karibu/developer-apps',
    '/karibu/apps'
  ];

  console.log('4️⃣ Trying alternative endpoints...');
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(
        `${baseUrl}${endpoint}`,
        {
          headers: {
            'X-API-Key': apiKey
          }
        }
      );
      
      console.log(`✅ ${endpoint} works!`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      break;
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`);
    }
  }
}

testDeveloperApps()
  .then(() => {
    console.log('\n---\n');
    console.log('📝 INSTRUCTIONS:');
    console.log('If no developer app was found or created via API,');
    console.log('you need to create one manually in the Briq dashboard:');
    console.log('\n1. Go to: https://briq.tz/dashboard');
    console.log('2. Navigate to: Developer Apps or Settings');
    console.log('3. Create a new app: "CarRental Pro Voice"');
    console.log('4. Copy the app_key');
    console.log('5. Add to .env: BRIQ_DEVELOPER_APP_KEY=your_app_key');
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
