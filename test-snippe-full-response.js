require('dotenv').config();
const axios = require('axios');

async function testFullSnippeResponse() {
  console.log('🔍 Testing Full Snippe API Response\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.SNIPPE_API_KEY;
  const baseUrl = 'https://api.snippe.sh';
  const testPhone = '+255683859574';
  
  const payload = {
    details: {
      amount: 500,
      currency: 'TZS',
      description: 'Test Car Rental Payment'
    },
    type: 'mobile',
    phone_number: testPhone,
    reference: `TEST-${Date.now()}`,
    customer: {
      firstname: 'Ibn',
      lastname: 'Asad',
      email: `${testPhone}@carrentalpro.com`,
      phone: testPhone
    },
    callback_url: `${process.env.APP_URL}/webhook/snippe/payment`,
    metadata: {
      booking_id: 'TEST-001',
      service: 'car_rental'
    }
  };

  console.log('📤 Request Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n' + '='.repeat(60));

  try {
    const response = await axios.post(
      `${baseUrl}/v1/payments`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `test-${Date.now()}`
        }
      }
    );

    console.log('\n✅ FULL API RESPONSE:\n');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\nResponse Body:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const data = response.data.data;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 PAYMENT DETAILS:\n');
    console.log(`Payment ID: ${data.reference}`);
    console.log(`Status: ${data.status}`);
    console.log(`Amount: ${data.amount.value} ${data.amount.currency}`);
    console.log(`Type: ${data.payment_type}`);
    console.log(`Expires: ${data.expires_at}`);
    
    // Check if there's any push-related information
    if (data.push_sent) {
      console.log(`\n✅ Push Sent: ${data.push_sent}`);
    } else {
      console.log(`\n❌ No push_sent field in response`);
    }
    
    if (data.ussd_code) {
      console.log(`\n📱 USSD Code: ${data.ussd_code}`);
    }
    
    if (data.payment_url) {
      console.log(`\n🔗 Payment URL: ${data.payment_url}`);
    }
    
    if (data.instructions) {
      console.log(`\n📝 Instructions: ${data.instructions}`);
    }
    
    // Check all fields
    console.log('\n' + '='.repeat(60));
    console.log('🔍 ALL RESPONSE FIELDS:\n');
    Object.keys(data).forEach(key => {
      console.log(`${key}: ${JSON.stringify(data[key])}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📱 CHECK YOUR PHONE: ' + testPhone);
    console.log('='.repeat(60));
    console.log('\nDid you receive a push notification?');
    console.log('[ ] Yes - Push received');
    console.log('[ ] No - No push received');
    
  } catch (error) {
    console.error('\n❌ ERROR:\n');
    console.error('Message:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFullSnippeResponse()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
