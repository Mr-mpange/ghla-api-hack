require('dotenv').config();
const carRentalBotService = require('./src/services/carRentalBotService');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMyBookings() {
  const testPhone = '+255683859574';
  const testName = 'Ibn-Asad';

  console.log('='.repeat(70));
  console.log('TESTING "MY BOOKINGS" WITH ACTUAL DETAILS');
  console.log('='.repeat(70));

  try {
    // Step 1: Create a booking
    console.log('\n1️⃣ Creating a booking');
    console.log('-'.repeat(70));
    
    await carRentalBotService.processMessage(testPhone, 'hello', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Browse Cars', testName);
    await carRentalBotService.processMessage(testPhone, '🚗 Economy', testName);
    let result = await carRentalBotService.processMessage(testPhone, '1. Toyota Vitz', testName);
    
    console.log('✅ Booking created');
    
    // Extract booking details from response
    const responseLines = result.response.split('\n');
    console.log('\n📋 Booking Details from Response:');
    responseLines.forEach(line => {
      if (line.includes('Booking ID:') || 
          line.includes('Car:') || 
          line.includes('Pickup:') || 
          line.includes('Return:') || 
          line.includes('Location:') ||
          line.includes('Total:')) {
        console.log(line);
      }
    });

    await wait(2000);

    // Step 2: Check "My Bookings"
    console.log('\n2️⃣ Checking "My Bookings"');
    console.log('-'.repeat(70));
    
    // Start fresh conversation
    await carRentalBotService.processMessage(testPhone, 'hello', testName);
    result = await carRentalBotService.processMessage(testPhone, '📋 My Bookings', testName);
    
    console.log('\n📨 My Bookings Response:');
    console.log(result.response);

    // Verify booking details
    const hasBookingId = result.response.includes('Booking #BK');
    const hasCarName = result.response.includes('Toyota Vitz');
    const hasPickupDate = result.response.includes('Pickup:');
    const hasReturnDate = result.response.includes('Return:');
    const hasLocation = result.response.includes('Location:');
    const hasTotalAmount = result.response.includes('TZS');
    const hasStatus = result.response.includes('Status:');
    const hasActualDate = !result.response.includes('Tomorrow'); // Should have actual date, not "Tomorrow"

    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION:');
    console.log('='.repeat(70));
    console.log(hasBookingId ? '✅' : '❌', 'Has Booking ID');
    console.log(hasCarName ? '✅' : '❌', 'Has Car Name (Toyota Vitz)');
    console.log(hasPickupDate ? '✅' : '❌', 'Has Pickup Date');
    console.log(hasReturnDate ? '✅' : '❌', 'Has Return Date');
    console.log(hasLocation ? '✅' : '❌', 'Has Location');
    console.log(hasTotalAmount ? '✅' : '❌', 'Has Total Amount (TZS)');
    console.log(hasStatus ? '✅' : '❌', 'Has Status');
    console.log(hasActualDate ? '✅' : '❌', 'Has Actual Date (not "Tomorrow")');

    const allPassed = hasBookingId && hasCarName && hasPickupDate && 
                     hasReturnDate && hasLocation && hasTotalAmount && 
                     hasStatus && hasActualDate;

    console.log('='.repeat(70));
    if (allPassed) {
      console.log('🎉 SUCCESS: My Bookings shows actual booking details!');
    } else {
      console.log('❌ FAILED: Some booking details are missing or incorrect');
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testMyBookings();
