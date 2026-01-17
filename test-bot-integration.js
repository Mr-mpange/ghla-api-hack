#!/usr/bin/env node

require('dotenv').config();
const whatsappService = require('./src/services/whatsappService');
const sarufiService = require('./src/services/sarufiService');
const botMiddleware = require('./src/middleware/botMiddleware');

async function testBotIntegration() {
  console.log('🤖 Testing Bot Integration (WhatsApp + Sarufi)...\n');

  // Test phone numbers
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '+254700000000';
  const tanzaniaTestNumber = '+255683859574'; // Tanzania number for Sarufi Bot

  console.log('📋 Configuration Check:');
  
  // Check WhatsApp configuration
  const whatsappStatus = whatsappService.getStatus();
  console.log('WhatsApp Business API:');
  console.log('- Configured:', whatsappStatus.configured ? '✅' : '❌');
  console.log('- Phone Number ID:', whatsappStatus.phoneNumberId || 'Not set');
  console.log('- Access Token:', whatsappStatus.hasAccessToken ? '✅ Present' : '❌ Missing');
  
  // Check Sarufi configuration
  const sarufiStatus = sarufiService.getStatus();
  console.log('\nSarufi Bot Service:');
  console.log('- Configured:', sarufiStatus.configured ? '✅' : '❌');
  console.log('- Enabled:', sarufiStatus.enabled ? '✅' : '❌');
  console.log('- Backend URL:', sarufiStatus.backend_url || 'Not set');
  console.log('- Webhook URL:', sarufiStatus.webhook_url || 'Not set');
  console.log('- API Key:', sarufiStatus.has_api_key ? '✅ Present' : '❌ Missing');
  console.log('- Backend API Key:', sarufiStatus.has_backend_api_key ? '✅ Present' : '❌ Missing');
  
  // Check Bot Middleware
  const botStats = botMiddleware.getBotStatistics();
  console.log('\nBot Middleware:');
  console.log('- Primary Bot:', botStats.primaryBot);
  console.log('- Fallback Bot:', botStats.fallbackBot);
  console.log('- Failover Enabled:', botStats.failoverEnabled ? '✅' : '❌');
  console.log('- Load Balancing:', botStats.loadBalancing);
  console.log('- Available Bots:', botStats.availableBots.join(', ') || 'None');
  
  console.log('\n🧪 Running Tests...\n');

  try {
    // Test 1: WhatsApp Direct
    if (whatsappStatus.configured) {
      console.log('🧪 Test 1: WhatsApp Business API Direct');
      const whatsappResult = await whatsappService.sendMessage(
        testPhoneNumber,
        '🚗 Test message from WhatsApp Business API - CarRental Pro'
      );
      
      if (whatsappResult.success) {
        console.log('✅ WhatsApp message sent successfully');
        console.log('   Message ID:', whatsappResult.messageId);
      } else {
        console.log('❌ WhatsApp message failed');
        console.log('   Error:', whatsappResult.error);
      }
    } else {
      console.log('⏭️ Skipping WhatsApp test - not configured');
    }

    console.log();

    // Test 2: Sarufi Configuration Test
    if (sarufiStatus.configured && sarufiStatus.enabled) {
      console.log('🧪 Test 2: Sarufi Service Configuration');
      
      // Test configuration
      const configResult = await sarufiService.configureSarufiBot();
      if (configResult.success) {
        console.log('✅ Sarufi configuration successful');
        console.log('   Webhook URL:', configResult.config.webhook_url);
        console.log('   API Key Configured:', !!configResult.config.api_key);
      } else {
        console.log('❌ Sarufi configuration failed');
        console.log('   Error:', configResult.error);
      }

      // Test backend connection
      const connectionTest = await sarufiService.testConnection();
      if (connectionTest.success) {
        console.log('✅ Backend connection successful');
        console.log('   Status:', connectionTest.status);
      } else {
        console.log('❌ Backend connection failed');
        console.log('   Error:', connectionTest.error);
      }
    } else {
      console.log('⏭️ Skipping Sarufi test - not configured or disabled');
    }

    console.log();

    // Test 3: Bot Middleware (Automatic Selection)
    if (botStats.availableBots.length > 0) {
      console.log('🧪 Test 3: Bot Middleware (Automatic Selection)');
      
      // Test with Kenya number (should prefer WhatsApp)
      const kenyaResult = await botMiddleware.sendMessage(
        testPhoneNumber,
        '🚗 Test message via Bot Middleware - Kenya number'
      );
      
      if (kenyaResult.success) {
        console.log('✅ Kenya number message sent successfully');
        console.log('   Used Bot:', kenyaResult.usedBot);
        console.log('   Message ID:', kenyaResult.messageId);
      } else {
        console.log('❌ Kenya number message failed');
        console.log('   Error:', kenyaResult.error);
      }

      // Test with Tanzania number (should route to Sarufi)
      console.log('\n🧪 Testing Tanzania number routing to Sarufi...');
      const tanzaniaResult = await botMiddleware.sendMessage(
        tanzaniaTestNumber,
        '🤖 Test message via Bot Middleware - Tanzania number'
      );
      
      if (tanzaniaResult.success) {
        console.log('✅ Tanzania number message routed successfully');
        console.log('   Used Bot:', tanzaniaResult.usedBot);
        console.log('   Message ID:', tanzaniaResult.messageId);
        if (tanzaniaResult.response) {
          console.log('   Bot Response:', tanzaniaResult.response);
        }
      } else {
        console.log('❌ Tanzania number message failed');
        console.log('   Error:', tanzaniaResult.error);
      }
    } else {
      console.log('⏭️ Skipping Bot Middleware test - no available bots');
    }

    console.log();

    // Test 4: Interactive Messages
    if (botStats.availableBots.length > 0) {
      console.log('🧪 Test 4: Interactive Messages via Bot Middleware');
      
      const interactiveResult = await botMiddleware.sendInteractiveButtons(
        testPhoneNumber,
        'Welcome to CarRental Pro! Choose an option:',
        [
          { id: 'rent_vehicle', title: '🚗 Rent Vehicle' },
          { id: 'my_bookings', title: '📋 My Bookings' },
          { id: 'support', title: '💬 Support' }
        ]
      );
      
      if (interactiveResult.success) {
        console.log('✅ Interactive message sent successfully');
        console.log('   Used Bot:', interactiveResult.usedBot);
        console.log('   Message ID:', interactiveResult.messageId);
      } else {
        console.log('❌ Interactive message failed');
        console.log('   Error:', interactiveResult.error);
      }
    }

    console.log();

    // Test 5: Health Check
    console.log('🧪 Test 5: Bot Health Check');
    const healthCheck = await botMiddleware.forceHealthCheck();
    console.log('Bot Health Status:');
    Object.entries(healthCheck.botStatus).forEach(([botName, status]) => {
      console.log(`- ${botName}: ${status.healthy ? '✅ Healthy' : '❌ Unhealthy'} (${status.failures} failures)`);
    });

    console.log();

    // Test 6: Sarufi Health Check
    if (sarufiStatus.configured) {
      console.log('🧪 Test 6: Sarufi Service Health Check');
      const sarufiHealth = await sarufiService.healthCheck();
      
      console.log('Sarufi Health Status:', sarufiHealth.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy');
      console.log('Configuration Status:');
      console.log('- API Key:', sarufiHealth.config.api_key_configured ? '✅' : '❌');
      console.log('- Backend URL:', sarufiHealth.config.backend_url_configured ? '✅' : '❌');
      console.log('- Backend API Key:', sarufiHealth.config.backend_api_key_configured ? '✅' : '❌');
      console.log('- Service Enabled:', sarufiHealth.config.enabled ? '✅' : '❌');
    }

    console.log();

    // Test 7: Message Processing Simulation
    if (sarufiStatus.configured && sarufiStatus.enabled) {
      console.log('🧪 Test 7: Sarufi Message Processing Simulation');
      
      try {
        const processResult = await sarufiService.processMessage(
          tanzaniaTestNumber,
          'I want to rent a car for tomorrow',
          'text'
        );
        
        if (processResult.success) {
          console.log('✅ Message processing successful');
          console.log('   Response:', processResult.response || 'No response');
        } else {
          console.log('❌ Message processing failed');
          console.log('   Error:', processResult.error);
        }
      } catch (error) {
        console.log('❌ Message processing error:', error.message);
      }
    }

    console.log();
    console.log('🎉 Bot integration test completed!');
    console.log();
    console.log('📝 Next Steps:');
    console.log('1. Configure Sarufi bot with webhook URL:');
    console.log('   - Webhook URL: https://carrentalpro.com/webhook/sarufi');
    console.log('   - Backend API Key: crp_backend_api_key_2024');
    console.log('2. Configure WhatsApp webhook:');
    console.log('   - Callback URL: https://carrentalpro.com/webhook/whatsapp');
    console.log('   - Verify Token: carrentalpro_verify_2024');
    console.log('3. Test webhook endpoints:');
    console.log('   - GET /webhook/sarufi (verification)');
    console.log('   - POST /webhook/sarufi (message processing)');
    console.log('   - GET /webhook/sarufi/health (health check)');
    console.log('4. Start the server and test the full car rental flow');
    console.log('5. Monitor bot health via middleware routes');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBotIntegration()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testBotIntegration };