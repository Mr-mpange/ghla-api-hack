require('dotenv').config();
const carRentalBotService = require('./src/services/carRentalBotService');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFullPaymentFlow() {
  const testPhone = '+255683859574';
  const testName = 'Ibn-Asad';

  console.log('='.repeat(70));
  console.log('FULL PAYMENT FLOW TEST (With Webhook Simulation)');
  console.log('='.repeat(70));

  try {
    // Step 1: Complete booking flow to payment
    console.log('\n1️⃣ User selects car and initiates payment');
    console.log('-'.repeat(70));
    
    await carRentalBotService.processMessage(testPhone, 'hello', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Browse Cars', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Economy', testName);
    let result = await carRentalBotService.processMessage(testPhone, '1. Toyota Vitz', testName);
    
    console.log('✅ Payment initiated');
    console.log('Response preview:', result.response.substring(0, 150) + '...');
    console.log('Button shown:', result.buttons?.[0]?.title);
    
    const session = carRentalBotService.customerSessions.get(testPhone);
    const booking = carRentalBotService.bookings.get(session.currentBooking);
    
    console.log('\n📋 Booking Created:');
    console.log('Booking ID:', booking.id);
    console.log('Payment ID:', booking.paymentId);
    console.log('Car:', booking.carName);
    console.log('Amount:', 'TZS', booking.totalAmount.toLocaleString());

    await wait(2000);

    // Step 2: User clicks "I have paid" (payment still pending)
    console.log('\n2️⃣ User clicks "I have paid" (payment still processing)');
    console.log('-'.repeat(70));
    
    result = await carRentalBotService.processMessage(testPhone, 'I have paid', testName);
    
    console.log('Response:', result.response.substring(0, 100) + '...');
    console.log('State:', result.sessionState);
    console.log('Button shown:', result.buttons?.[0]?.title);

    await wait(2000);

    // Step 3: Simulate Snippe webhook (payment completed)
    console.log('\n3️⃣ Simulating Snippe webhook (payment completed)');
    console.log('-'.repeat(70));
    console.log('💰 User completes M-Pesa/Airtel/Halotel payment');
    console.log('📡 Snippe sends webhook notification');
    
    const webhookPayload = {
      event: 'payment.completed',
      data: {
        reference: booking.paymentId,
        status: 'completed',
        amount: {
          value: booking.totalAmount,
          currency: 'TZS'
        },
        metadata: {
          booking_id: booking.id
        }
      }
    };
    
    const webhookResult = await carRentalBotService.handlePaymentWebhook(webhookPayload);
    console.log('✅ Webhook processed:', webhookResult.success);
    console.log('✅ Booking status updated to:', webhookResult.booking?.status);

    await wait(1000);

    // Step 4: User clicks "Check Again" or "I have paid" again
    console.log('\n4️⃣ User clicks "Check Again" (payment now confirmed)');
    console.log('-'.repeat(70));
    
    // Manually update Snippe payment status for testing
    // In real scenario, Snippe API would return 'completed'
    const snippePaymentService = require('./src/services/snippePaymentService');
    const originalCheck = snippePaymentService.checkPaymentStatus;
    snippePaymentService.checkPaymentStatus = async (paymentId) => {
      return {
        success: true,
        status: 'completed',
        paymentId: paymentId
      };
    };
    
    result = await carRentalBotService.processMessage(testPhone, 'I have paid', testName);
    
    console.log('\n📨 Final Response:');
    console.log(result.response);
    console.log('\n📊 Final State:');
    console.log('State:', result.sessionState);
    console.log('Message Type:', result.messageType);
    console.log('Has Buttons:', result.buttons !== null);

    // Restore original function
    snippePaymentService.checkPaymentStatus = originalCheck;

    // Verify conversation terminated
    console.log('\n' + '='.repeat(70));
    if (result.sessionState === 'completed' && result.buttons === null && result.messageType === 'text') {
      console.log('✅ SUCCESS: Payment confirmed and conversation terminated!');
      console.log('✅ User receives success message with NO buttons');
      console.log('✅ System terminates - user cannot continue conversation');
    } else {
      console.log('❌ FAILED: Conversation did not terminate properly');
      console.log('Expected: state="completed", buttons=null, messageType="text"');
      console.log('Got: state="' + result.sessionState + '", buttons=' + result.buttons + ', messageType="' + result.messageType + '"');
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testFullPaymentFlow();
