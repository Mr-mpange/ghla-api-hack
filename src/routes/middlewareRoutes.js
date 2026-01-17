const express = require('express');
const router = express.Router();
const botMiddleware = require('../middleware/botMiddleware');
const whatsappService = require('../services/whatsappService');
const sarufiService = require('../services/sarufiService');
const logger = require('../utils/logger');

// Middleware configuration endpoint
router.get('/config', async (req, res) => {
  try {
    const config = {
      botMiddleware: {
        primaryBot: process.env.PRIMARY_BOT || 'whatsapp',
        fallbackBot: process.env.FALLBACK_BOT || 'sarufi',
        failoverEnabled: process.env.BOT_FAILOVER_ENABLED === 'true',
        loadBalancing: process.env.BOT_LOAD_BALANCING || 'phone_based'
      },
      whatsapp: {
        configured: whatsappService.isConfigured(),
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER
      },
      sarufi: {
        configured: sarufiService.isConfigured(),
        enabled: sarufiService.enabled,
        baseUrl: process.env.SARUFI_BASE_URL,
        botId: process.env.SARUFI_BOT_ID,
        phoneNumber: process.env.SARUFI_PHONE_NUMBER,
        environment: process.env.SARUFI_ENVIRONMENT
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Error getting middleware config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get middleware configuration'
    });
  }
});

// Update middleware configuration
router.post('/config', async (req, res) => {
  try {
    const { primaryBot, fallbackBot, failoverEnabled, loadBalancing } = req.body;

    // Validate configuration
    const validBots = ['whatsapp', 'sarufi'];
    const validStrategies = ['round_robin', 'primary_fallback', 'phone_based', 'random'];

    if (primaryBot && !validBots.includes(primaryBot)) {
      return res.status(400).json({
        success: false,
        error: `Invalid primary bot. Must be one of: ${validBots.join(', ')}`
      });
    }

    if (fallbackBot && !validBots.includes(fallbackBot)) {
      return res.status(400).json({
        success: false,
        error: `Invalid fallback bot. Must be one of: ${validBots.join(', ')}`
      });
    }

    if (loadBalancing && !validStrategies.includes(loadBalancing)) {
      return res.status(400).json({
        success: false,
        error: `Invalid load balancing strategy. Must be one of: ${validStrategies.join(', ')}`
      });
    }

    // Update environment variables (in memory)
    if (primaryBot) process.env.PRIMARY_BOT = primaryBot;
    if (fallbackBot) process.env.FALLBACK_BOT = fallbackBot;
    if (typeof failoverEnabled === 'boolean') process.env.BOT_FAILOVER_ENABLED = failoverEnabled.toString();
    if (loadBalancing) process.env.BOT_LOAD_BALANCING = loadBalancing;

    // Reinitialize bot middleware with new config
    botMiddleware.primaryBot = process.env.PRIMARY_BOT;
    botMiddleware.fallbackBot = process.env.FALLBACK_BOT;
    botMiddleware.failoverEnabled = process.env.BOT_FAILOVER_ENABLED === 'true';
    botMiddleware.loadBalancing = process.env.BOT_LOAD_BALANCING;

    res.json({
      success: true,
      message: 'Middleware configuration updated successfully',
      data: {
        primaryBot: botMiddleware.primaryBot,
        fallbackBot: botMiddleware.fallbackBot,
        failoverEnabled: botMiddleware.failoverEnabled,
        loadBalancing: botMiddleware.loadBalancing
      }
    });
  } catch (error) {
    logger.error('Error updating middleware config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update middleware configuration'
    });
  }
});

// Bot status endpoint
router.get('/bots/status', async (req, res) => {
  try {
    const status = botMiddleware.getBotStatistics();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting bot status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bot status'
    });
  }
});

// Test specific bot
router.post('/bots/:botName/test', async (req, res) => {
  try {
    const { botName } = req.params;
    const { phoneNumber, message, messageType = 'text' } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    const botService = botMiddleware.getBotService(botName);
    if (!botService) {
      return res.status(404).json({
        success: false,
        error: `Bot ${botName} not found`
      });
    }

    let result;
    switch (messageType) {
      case 'interactive_buttons':
        result = await botService.sendInteractiveButtons(
          phoneNumber,
          message,
          req.body.buttons || []
        );
        break;
      case 'interactive_list':
        result = await botService.sendInteractiveList(
          phoneNumber,
          message,
          req.body.buttonText || 'Select',
          req.body.sections || []
        );
        break;
      default:
        result = await botService.sendMessage(phoneNumber, message);
    }

    res.json({
      success: result.success,
      data: result,
      testedBot: botName,
      message: result.success ? `Test message sent via ${botName}` : `Test message failed on ${botName}`
    });
  } catch (error) {
    logger.error(`Error testing ${req.params.botName}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to test ${req.params.botName}`
    });
  }
});

// Route assignment for Sarufi
router.post('/sarufi/assign-route', async (req, res) => {
  try {
    const { 
      routeName, 
      routePath, 
      method = 'POST',
      description,
      variables = {},
      authorization 
    } = req.body;

    if (!routeName || !routePath) {
      return res.status(400).json({
        success: false,
        error: 'Route name and path are required'
      });
    }

    // Create route configuration for Sarufi
    const routeConfig = {
      name: routeName,
      path: routePath,
      method: method.toUpperCase(),
      description: description || `Car rental route: ${routeName}`,
      variables: variables,
      authorization: authorization || process.env.SARUFI_AUTHORIZATION,
      baseUrl: process.env.SARUFI_BASE_URL,
      apiKey: process.env.SARUFI_API_KEY,
      botId: process.env.SARUFI_BOT_ID
    };

    // In a real implementation, you would register this route with Sarufi
    // For now, we'll store it in memory or database
    logger.info(`Sarufi route assigned: ${routeName} -> ${routePath}`, routeConfig);

    res.json({
      success: true,
      message: `Route ${routeName} assigned successfully`,
      data: routeConfig
    });
  } catch (error) {
    logger.error('Error assigning Sarufi route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign Sarufi route'
    });
  }
});

// Get assigned routes
router.get('/sarufi/routes', async (req, res) => {
  try {
    // In a real implementation, you would fetch routes from Sarufi or database
    const routes = [
      {
        name: 'car_rental_booking',
        path: '/api/bookings',
        method: 'POST',
        description: 'Create car rental booking',
        variables: ['customer_id', 'vehicle_id', 'pickup_date', 'return_date']
      },
      {
        name: 'vehicle_search',
        path: '/api/vehicles/search',
        method: 'GET',
        description: 'Search available vehicles',
        variables: ['location', 'pickup_date', 'return_date', 'category']
      },
      {
        name: 'booking_status',
        path: '/api/bookings/:id',
        method: 'GET',
        description: 'Get booking status',
        variables: ['booking_id']
      }
    ];

    res.json({
      success: true,
      data: {
        routes: routes,
        total: routes.length
      }
    });
  } catch (error) {
    logger.error('Error getting Sarufi routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Sarufi routes'
    });
  }
});

// Middleware health check
router.get('/health', async (req, res) => {
  try {
    const botStats = botMiddleware.getBotStatistics();
    const healthCheck = await botMiddleware.forceHealthCheck();
    
    res.json({
      success: true,
      data: {
        middleware: {
          status: 'healthy',
          availableBots: botStats.availableBots.length,
          configuration: {
            primaryBot: botStats.primaryBot,
            fallbackBot: botStats.fallbackBot,
            failoverEnabled: botStats.failoverEnabled,
            loadBalancing: botStats.loadBalancing
          }
        },
        bots: healthCheck.botStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Middleware health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Middleware health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;