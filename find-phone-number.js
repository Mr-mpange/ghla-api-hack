require('dotenv').config();
const axios = require('axios');

/**
 * Find the correct phone number ID for the access token
 */
async function findPhoneNumber() {
  console.log('\n🔍 FINDING CORRECT PHONE NUMBER ID\n');
  console.log('='.repeat(60));

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  console.log('\n📋 Current Configuration:');
  console.log('-'.repeat(60));
  console.log(`Access Token: ${accessToken.substring(0, 20)}...`);
  console.log(`WABA ID: ${wabaId}`);
  console.log(`Current Phone Number ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID}`);

  // Try to get phone numbers from WABA
  console.log('\n🔍 Fetching phone numbers from WABA...');
  console.log('-'.repeat(60));

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    console.log('✅ Successfully retrieved phone numbers!');
    console.log('\n📱 Available Phone Numbers:');
    console.log('-'.repeat(60));

    if (response.data.data && response.data.data.length > 0) {
      response.data.data.forEach((phone, index) => {
        console.log(`\n${index + 1}. Phone Number: ${phone.display_phone_number}`);
        console.log(`   ID: ${phone.id}`);
        console.log(`   Verified Name: ${phone.verified_name || 'N/A'}`);
        console.log(`   Quality Rating: ${phone.quality_rating || 'N/A'}`);
        console.log(`   Status: ${phone.code_verification_status || 'N/A'}`);
      });

      console.log('\n' + '='.repeat(60));
      console.log('✅ SOLUTION FOUND!');
      console.log('='.repeat(60));
      console.log('\nUpdate your .env file with the correct Phone Number ID:');
      console.log(`\nWHATSAPP_PHONE_NUMBER_ID=${response.data.data[0].id}`);
      console.log('\nThen restart the server and test again:');
      console.log('  npm run dev');
      console.log('  npm run test:send');
    } else {
      console.log('\n⚠️  No phone numbers found for this WABA');
    }

  } catch (error) {
    console.log('❌ Failed to retrieve phone numbers');
    
    if (error.response) {
      const errorData = error.response.data.error;
      console.log(`\n❌ Error Code: ${errorData.code}`);
      console.log(`❌ Error Type: ${errorData.type}`);
      console.log(`❌ Error Message: ${errorData.message}`);

      if (errorData.code === 100) {
        console.log('\n💡 This means:');
        console.log('   • Access token doesn\'t have permission for this WABA');
        console.log('   • Or WABA ID is incorrect');
        console.log('   • Or token is from a different app');
      }
    } else {
      console.log(`\n❌ Error: ${error.message}`);
    }

    // Try to debug the token
    console.log('\n🔍 Debugging Access Token...');
    console.log('-'.repeat(60));

    try {
      const debugResponse = await axios.get(
        `https://graph.facebook.com/v18.0/debug_token`,
        {
          params: {
            input_token: accessToken,
            access_token: accessToken
          }
        }
      );

      const tokenData = debugResponse.data.data;
      console.log('✅ Token Information:');
      console.log(`   App ID: ${tokenData.app_id}`);
      console.log(`   Type: ${tokenData.type}`);
      console.log(`   Valid: ${tokenData.is_valid}`);
      console.log(`   User ID: ${tokenData.user_id || 'N/A'}`);
      
      if (tokenData.scopes) {
        console.log(`   Scopes: ${tokenData.scopes.join(', ')}`);
      }

      if (tokenData.granular_scopes) {
        console.log('\n   Granular Scopes:');
        tokenData.granular_scopes.forEach(scope => {
          console.log(`     • ${scope.scope}`);
        });
      }

      console.log('\n💡 Next Steps:');
      console.log('   1. Check if App ID matches your WhatsApp app');
      console.log('   2. Verify token has whatsapp_business_messaging scope');
      console.log('   3. Try generating a new token from the correct app');

    } catch (debugError) {
      console.log('❌ Could not debug token');
      console.log(`   Error: ${debugError.response?.data?.error?.message || debugError.message}`);
    }
  }

  console.log('\n');
}

// Run
findPhoneNumber()
  .then(() => {
    console.log('✅ Search completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Search failed:', error.message);
    process.exit(1);
  });
