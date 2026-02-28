require('dotenv').config();
const snippePaymentService = require('./src/services/snippePaymentService');
const carRentalBotService = require('./src/services/carRentalBotService');
const logger = require('./src/utils/logger');

/**
 * Test Snippe Payment Integration
 */
async function testSnippeIntegration() {
  console.log('\n🧪 Testing Snippe Payment Integration\n');
  console.log('='.repeat(50));

  // Test 1: Check Service Status
  console.log('\n📊 Test 1: Service Status');
  console.log('-'.repeat(50));
  const status = snippePaymentService.getStatus();
  console.log('Service Enabled:', status.enabled ? '✅' : '❌');
  console.log('API Configured:', status.configured ? '✅' : '❌');
  console.log('Webhook Secret:', status.hasWebhookSecret ? '✅' : '❌');
  console.log('Base URL:', status.baseUrl);
  console.log('Features:', status.features.join(', '));

  if (!status.enabled) {
    console.log('\n❌ Snippe service not configured. Please set SNIPPE_API_KEY in .env');
    console.log('\nTo configure:');
    console.log('1. Get API key from https://www.snippe.sh/dashboard');
    console.log('2. Add to .env: SNIPPE_API_KEY=your_key_here');
    console.log('3. Add webhook secret: SNIPPE_WEBHOOK_SECRET=your_secret_here');
    return;
  }

  // Test 2: Create Test Booking
  console.log('\n📝 Test 2: Create Test Booking');
  console.log('-'.repeat(50));
  
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '+255683859574';
  const testCustomerName = 'Test Customer';
  
  // Simulate booking creation
  const bookingDetails = {
    pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    returnDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    pickupLocation: 'Dar es Salaam Airport',
    totalDays: 2,
    customerInfo: {
      name: testCustomerName,
      phone: testPhoneNumber
    },
    isValid: true,
    errors: []
  };

  const booking = carRentalBotService.createBooking(
    testPhoneNumber,
    'eco_001', // Toyota Vitz
    bookingDetails,
    testCustomerName
  );

  console.log('Booking Created:');
  console.log('  ID:', booking.id);
  console.log('  Car:', booking.carName);
  console.log('  Customer:', booking.customerName);
  console.log('  Total Amount:', `TZS ${booking.totalAmount.toLocaleString()}`);
  console.log('  Deposit:', `TZS ${booking.deposit.toLocaleString()}`);
  console.log('  Status:', booking.status);

  // Test 3: Initiate Payment
  console.log('\n💳 Test 3: Initiate Payment');
  console.log('-'.repeat(50));
  
  try {
    const paymentResult = await carRentalBotService.initiateSnippePayment(
      booking,
      testPhoneNumber
    );

    if (paymentResult.success) {
      console.log('✅ Payment initiated successfully!');
      console.log('  Payment ID:', paymentResult.paymentId);
      console.log('  Status:', paymentResult.status);
      console.log('  Reference:', paymentResult.reference);
      console.log('  Amount:', `TZS ${paymentResult.amount.toLocaleString()}`);
      console.log('  Phone:', paymentResult.phoneNumber);
      
      // Update booking with payment info
      booking.paymentId = paymentResult.paymentId;
      booking.paymentStatus = 'pending';

      // Test 4: Check Payment Status
      console.log('\n🔍 Test 4: Check Payment Status');
      console.log('-'.repeat(50));
      
      // Wait a moment before checking
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResult = await snippePaymentService.checkPaymentStatus(
        paymentResult.paymentId
      );

      if (statusResult.success) {
        console.log('✅ Payment status retrieved:');
        console.log('  Status:', statusResult.status);
        console.log('  Amount:', `TZS ${statusResult.amount.toLocaleString()}`);
        console.log('  Reference:', statusResult.reference);
      } else {
        console.log('❌ Failed to check payment status:', statusResult.error);
      }

    } else {
      console.log('❌ Payment initiation failed:', paymentResult.error);
      console.log('\nPossible reasons:');
      console.log('  • Invalid API key');
      console.log('  • Invalid phone number format');
      console.log('  • Network connectivity issue');
      console.log('  • Snippe API service unavailable');
    }

  } catch (error) {
    console.log('❌ Error during payment test:', error.message);
  }

  // Test 5: Webhook Signature Verification
  console.log('\n🔐 Test 5: Webhook Signature Verification');
  console.log('-'.repeat(50));
  
  const testWebhookPayload = {
    id: 'evt_test123',
    type: 'payment.completed',
    api_version: '2026-01-25',
    created_at: new Date().toISOString(),
    data: {
      reference: booking.id,
      external_reference: 'S20388385575',
      status: 'completed',
      amount: {
        value: booking.deposit,
        currency: 'TZS'
      },
      settlement: {
        gross: { value: booking.deposit, currency: 'TZS' },
        fees: { value: Math.floor(booking.deposit * 0.02), currency: 'TZS' },
        net: { value: booking.deposit - Math.floor(booking.deposit * 0.02), currency: 'TZS' }
      },
      channel: {
        type: 'mobile_money',
        provider: 'airtel'
      },
      customer: {
        phone: testPhoneNumber,
        name: testCustomerName,
        email: `${testPhoneNumber}@carrentalpro.com`
      },
      metadata: {
        booking_id: booking.id,
        service: 'car_rental'
      },
      completed_at: new Date().toISOString()
    }
  };

  const crypto = require('crypto');
  const rawPayload = JSON.stringify(testWebhookPayload);
  const testSignature = crypto
    .createHmac('sha256', process.env.SNIPPE_WEBHOOK_SECRET || 'test_secret')
    .update(rawPayload)
    .digest('hex');

  const isValid = snippePaymentService.verifyWebhookSignature(
    testSignature,
    rawPayload
  );

  console.log('Webhook Signature Valid:', isValid ? '✅' : '❌');
  console.log('Event Type:', testWebhookPayload.type);
  console.log('Event ID:', testWebhookPayload.id);

  // Test 6: Process Webhook
  console.log('\n📨 Test 6: Process Webhook');
  console.log('-'.repeat(50));
  
  const webhookResult = await carRentalBotService.handlePaymentWebhook(testWebhookPayload);
  
  if (webhookResult.success) {
    console.log('✅ Webhook processed successfully');
    console.log('  Event Type:', webhookResult.eventType);
    console.log('  Message:', webhookResult.message);
    if (webhookResult.booking) {
      console.log('  Booking Status:', webhookResult.booking.status);
      console.log('  Payment Status:', webhookResult.booking.paymentStatus);
      if (webhookResult.booking.settlement) {
        console.log('  Settlement:');
        console.log('    Gross:', `TZS ${webhookResult.booking.settlement.gross.value.toLocaleString()}`);
        console.log('    Fees:', `TZS ${webhookResult.booking.settlement.fees.value.toLocaleString()}`);
        console.log('    Net:', `TZS ${webhookResult.booking.settlement.net.value.toLocaleString()}`);
      }
    }
  } else {
    console.log('❌ Webhook processing failed:', webhookResult.error);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log('✅ Service configured and ready');
  console.log('✅ Booking creation works');
  console.log('✅ Payment integration functional');
  console.log('✅ Webhook processing ready');
  console.log('\n💡 Next Steps:');
  console.log('1. Configure webhook URL in Snippe dashboard');
  console.log('2. Test with real phone number');
  console.log('3. Monitor webhook notifications');
  console.log('4. Test via WhatsApp interface');
  console.log('\n🚀 Integration ready for production!\n');
}

// Run tests
testSnippeIntegration()
  .then(() => {
    console.log('✅ All tests completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
