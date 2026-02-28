require('dotenv').config();
const snippePaymentService = require('./src/services/snippePaymentService');

async function testPaymentPush() {
  console.log('📱 Testing Snippe Payment Push Notification\n');
  console.log('='.repeat(60));
  
  const testPhone = '+255683859574';
  
  console.log('Configuration:');
  console.log(`API Key: ${process.env.SNIPPE_API_KEY ? '✅ Set' : '❌ Not Set'}`);
  console.log(`API URL: ${process.env.SNIPPE_API_URL}`);
  console.log(`Test Phone: ${testPhone}`);
  console.log('\n' + '='.repeat(60));
  
  const paymentData = {
    amount: 500, // Minimum amount
    currency: 'TZS',
    phoneNumber: testPhone,
    reference: `TEST-${Date.now()}`,
    description: 'Test Car Rental Payment',
    customerName: 'Ibn-Asad Test',
    customerEmail: `${testPhone}@carrentalpro.com`
  };

  console.log('\n📤 Creating payment request...');
  console.log('Payment Data:', JSON.stringify(paymentData, null, 2));
  console.log('\n' + '='.repeat(60));

  try {
    const result = await snippePaymentService.createPayment(paymentData);
    
    if (result.success) {
      console.log('\n✅ PAYMENT REQUEST CREATED!\n');
      console.log('Payment Details:');
      console.log(`   Payment ID: ${result.paymentId}`);
      console.log(`   Reference: ${result.reference}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Amount: ${result.amount} ${result.currency}`);
      console.log(`   Phone: ${result.phoneNumber}`);
      console.log(`   Expires: ${result.expiresAt}`);
      
      console.log('\n' + '='.repeat(60));
      console.log('📱 CHECK YOUR PHONE: ' + testPhone);
      console.log('='.repeat(60));
      console.log('\nYou should receive:');
      console.log('✅ M-Pesa/Airtel Money/Halotel push notification');
      console.log('✅ Enter your PIN to complete payment');
      console.log('✅ Amount: TZS 500');
      
      console.log('\n⏳ Waiting 10 seconds for you to check...\n');
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      console.log('🔍 Checking payment status...\n');
      const statusResult = await snippePaymentService.checkPaymentStatus(result.paymentId);
      
      if (statusResult.success) {
        console.log('Payment Status:', statusResult.status);
        console.log('Amount:', statusResult.amount, statusResult.currency);
        
        if (statusResult.status === 'pending') {
          console.log('\n⏳ Payment is pending - waiting for you to complete it');
        } else if (statusResult.status === 'completed') {
          console.log('\n✅ Payment completed!');
        } else if (statusResult.status === 'failed') {
          console.log('\n❌ Payment failed');
        }
      }
      
      return true;
    } else {
      console.log('\n❌ PAYMENT REQUEST FAILED!\n');
      console.log('Error:', result.error);
      console.log('Error Code:', result.errorCode);
      
      if (result.error?.includes('minimum')) {
        console.log('\n💡 TIP: Amount might be below minimum (500 TZS)');
      }
      
      if (result.error?.includes('phone')) {
        console.log('\n💡 TIP: Check phone number format (+255...)');
      }
      
      return false;
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    return false;
  }
}

testPaymentPush()
  .then((success) => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ Test complete! Did you receive the push notification?');
    } else {
      console.log('❌ Test failed. Check the error above.');
    }
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
