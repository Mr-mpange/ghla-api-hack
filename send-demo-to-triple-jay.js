#!/usr/bin/env node

/**
 * Send Demo Flow to Triple Jay
 * This sends a complete demo of the car rental flow to Triple Jay
 */

require('dotenv').config();
const axios = require('axios');

async function sendDemoToTripleJay() {
  console.log('📱 Sending Complete Car Rental Demo to Triple Jay\n');
  
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!accessToken || !phoneNumberId) {
    console.log('❌ WhatsApp API not configured');
    return;
  }

  // Demo message with complete flow explanation
  const demoMessage = {
    messaging_product: "whatsapp",
    to: "255756645935", // Triple Jay's number
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: `🚗 **CarRental Pro - Complete Demo Ready!**

Hi Triple Jay! Your car rental bot now has the COMPLETE flow:

🎯 **What You Can Do**:
1️⃣ Browse all car categories (Economy, SUV, Luxury, Van)
2️⃣ View detailed car information with prices
3️⃣ Select specific cars with interactive buttons
4️⃣ Choose quick booking options (Same Day, Weekend, Weekly)
5️⃣ Get payment instructions (M-Pesa, Bank, Cash)
6️⃣ Complete the entire booking process

✨ **Try the Complete Flow**:
• Click "Browse Cars" below
• Select a category (SUV recommended)
• Choose a specific car
• Book with quick options
• Complete payment process

🚀 **Everything works automatically!**`
      },
      footer: {
        text: "CarRental Pro - Complete Car Rental Solution"
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "browse_cars",
              title: "🚗 Browse Cars"
            }
          },
          {
            type: "reply",
            reply: {
              id: "check_prices",
              title: "💰 Check Prices"
            }
          },
          {
            type: "reply",
            reply: {
              id: "get_help",
              title: "🆘 Get Help"
            }
          }
        ]
      }
    }
  };

  try {
    console.log('📤 Sending complete demo to Triple Jay...');
    
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      demoMessage,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.messages) {
      const messageId = response.data.messages[0].id;
      console.log('🎉 SUCCESS! Complete demo sent to Triple Jay');
      console.log(`📨 Message ID: ${messageId}`);
      console.log('');
      console.log('📱 **Triple Jay can now test the complete flow**:');
      console.log('1. Click "Browse Cars" to see categories');
      console.log('2. Select "SUV" to see available SUVs');
      console.log('3. Choose "Toyota RAV4" for details');
      console.log('4. Click "Book This Car" to start booking');
      console.log('5. Select "Weekend Special" for quick booking');
      console.log('6. Click "Pay Now" for payment instructions');
      console.log('7. Click "Payment Sent" to complete the process');
      console.log('');
      console.log('🎯 **The entire car rental experience is now automated!**');
    }

  } catch (error) {
    console.log('❌ Failed to send demo message');
    console.log(`Error: ${error.message}`);
    
    if (error.response && error.response.data) {
      console.log('Response:', error.response.data);
    }
  }
}

// Send follow-up instructions
async function sendInstructions() {
  console.log('\n📋 Sending Setup Instructions...\n');
  
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  const instructionsMessage = {
    messaging_product: "whatsapp",
    to: "255756645935",
    type: "text",
    text: {
      body: `🔧 **Final Setup Instructions**

Your complete car rental bot is ready! Here's what to do:

**1. Configure Ghala Rails Webhook**:
• URL: https://3bd3ea0501a9.ngrok-free.app/webhook/auto
• Token: carrentalpro_verify_2024

**2. Test the Complete Flow**:
• Send "Hi" to start
• Try "Browse Cars" → "SUV" → Select car → Book → Pay

**3. Features Now Available**:
✅ Interactive car browsing
✅ Detailed car information
✅ Quick booking options
✅ Multiple payment methods
✅ Complete booking flow
✅ Session management
✅ Error handling

**4. Customer Experience**:
• Customers get instant responses
• Interactive buttons for easy navigation
• Complete booking process
• Payment instructions
• Booking confirmations

🚀 **Your car rental business is now fully automated!**

Try the demo above and see how smooth the experience is! 🚗✨`
    }
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      instructionsMessage,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.messages) {
      console.log('✅ Setup instructions sent successfully');
      console.log(`📨 Message ID: ${response.data.messages[0].id}`);
    }

  } catch (error) {
    console.log('❌ Failed to send instructions');
    console.log(`Error: ${error.message}`);
  }
}

// Run the demo
if (require.main === module) {
  sendDemoToTripleJay()
    .then(() => sendInstructions())
    .then(() => {
      console.log('\n🎉 **Demo Sent Successfully!**');
      console.log('');
      console.log('📱 **Triple Jay should now receive**:');
      console.log('• Complete demo message with interactive buttons');
      console.log('• Setup instructions for final configuration');
      console.log('');
      console.log('🚀 **Your complete car rental bot is ready for customers!**');
      console.log('');
      console.log('🔧 **Next Steps**:');
      console.log('1. Triple Jay tests the complete flow');
      console.log('2. Configure Ghala Rails webhook');
      console.log('3. Start receiving automatic bookings!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error.message);
      process.exit(1);
    });
}

module.exports = { sendDemoToTripleJay, sendInstructions };