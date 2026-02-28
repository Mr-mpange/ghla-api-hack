require('dotenv').config();
const axios = require('axios');

/**
 * Test if we can use Ghala's API directly
 */
async function testGhalaAPI() {
  console.log('\n🔍 TESTING GHALA API ACCESS\n');
  console.log('='.repeat(60));

  const ghalaApiKey = process.env.GHALA_API_KEY;
  const ghalaPhoneId = process.env.GHALA_PHONE_NUMBER_ID;
  const testPhone = process.env.TEST_PHONE_NUMBER || '+255683859574';

  console.log('\n📋 Configuration:');
  console.log('-'.repeat(60));
  console.log(`Ghala API Key: ${ghalaApiKey ? ghalaApiKey.substring(0, 15) + '...' : '❌ Missing'}`);
  console.log(`Phone Number ID: ${ghalaPhoneId || '❌ Missing'}`);
  console.log(`Test Phone: ${testPhone}`);

  if (!ghalaApiKey || ghalaApiKey.includes('test_your_api_key')) {
    console.log('\n❌ GHALA_API_KEY not configured in .env');
    console.log('\n📝 Where to find your Ghala API Key:');
    console.log('   1. Login to Ghala Dashboard');
    console.log('   2. Go to Settings → API Keys (or similar)');
    console.log('   3. Copy your API Key');
    console.log('   4. Update .env:');
    console.log('      GHALA_API_KEY=your_actual_api_key_here');
    console.log('\n💡 Alternative: Check if Ghala provides WhatsApp access token');
    console.log('   Look for "WhatsApp Access Token" in your dashboard');
    console.log('   Update WHATSAPP_ACCESS_TOKEN in .env with that token');
    return;
  }

  // Try Ghala's API endpoint (common patterns)
  const possibleEndpoints = [
    'https://api.ghala.io/v1/messages',
    'https://api.ghala.io/v1/messages/send',
    'https://api.ghala.io/v1/whatsapp/messages',
    'https://api.ghala.io/messages/send'
  ];

  console.log('\n🔍 Testing Ghala API Endpoints:');
  console.log('-'.repeat(60));

  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`\nTrying: ${endpoint}`);
      
      const response = await axios.post(
        endpoint,
        {
          phone_number_id: ghalaPhoneId,
          to: testPhone,
          type: 'text',
          text: {
            body: '🧪 Test message from CarRental Pro via Ghala API'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${ghalaApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log('✅ SUCCESS! This endpoint works!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      console.log('\n🎉 Found working Ghala API endpoint!');
      console.log(`   Use this endpoint: ${endpoint}`);
      return;

    } catch (error) {
      if (error.response) {
        console.log(`   ❌ ${error.response.status}: ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`   Error:`, JSON.stringify(error.response.data, null, 2));
        }
      } else if (error.code === 'ECONNABORTED') {
        console.log('   ⏱️  Timeout');
      } else {
        console.log(`   ❌ ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('\n❌ Could not find working Ghala API endpoint');
  console.log('\n💡 Solutions:');
  console.log('\n1. Check Ghala Documentation:');
  console.log('   • Login to Ghala dashboard');
  console.log('   • Look for "API Documentation" or "Developer Docs"');
  console.log('   • Find the correct endpoint for sending messages');
  console.log('\n2. Get WhatsApp Access Token from Ghala:');
  console.log('   • In Ghala dashboard, look for "WhatsApp Access Token"');
  console.log('   • This is different from Ghala API Key');
  console.log('   • Copy and update WHATSAPP_ACCESS_TOKEN in .env');
  console.log('\n3. Contact Ghala Support:');
  console.log('   • Email: support@ghala.io');
  console.log('   • Ask: "How do I send WhatsApp messages via API?"');
  console.log('   • Ask: "Where can I find my WhatsApp access token?"');
  console.log('');
}

// Run test
testGhalaAPI()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
