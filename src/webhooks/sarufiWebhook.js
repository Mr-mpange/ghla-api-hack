const express = require('express');
const sarufiService = require('../services/sarufiService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Webhook endpoint for Sarufi bot
 * This is where Sarufi will send incoming messages
 */
router.post('/sarufi', async (req, res) => {
  try {
    logger.info('Received Sarufi webhook:', req.body);

    const { phone_number, message, message_type, timestamp } = req.body;

    if (!phone_number || !message) {
      logger.warn('Invalid Sarufi webhook payload - missing phone_number or message');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phone_number, message'
      });
    }

    // Format phone number
    const formattedPhoneNumber = sarufiService.formatPhoneNumber(phone_number);

    // Process the message through your backend
    const result = await sarufiService.processMessage(
      formattedPhoneNumber,
      message,
      message_type || 'text'
    );

    if (result.success) {
      logger.info('Message processed successfully:', result);
      
      // Send response back to Sarufi
      if (result.response) {
        await sarufiService.sendResponse(formattedPhoneNumber, result.response);
      }

      res.status(200).json({
        success: true,
        message: 'Message processed successfully',
        data: result
      });
    } else {
      logger.error('Failed to process message:', result.error);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in Sarufi webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Webhook verification endpoint for Sarufi
 * Used to verify the webhook URL during setup
 */
router.get('/sarufi', (req, res) => {
  try {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('Sarufi webhook verification:', { mode, token, challenge });

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('Sarufi webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.warn('Sarufi webhook verification failed');
      res.status(403).json({
        success: false,
        error: 'Verification failed'
      });
    }
  } catch (error) {
    logger.error('Error in Sarufi webhook verification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint for Sarufi webhook
 */
router.get('/sarufi/health', async (req, res) => {
  try {
    const health = await sarufiService.healthCheck();
    res.status(200).json(health);
  } catch (error) {
    logger.error('Error in Sarufi health check:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

/**
 * Configuration endpoint for Sarufi
 */
router.get('/sarufi/config', (req, res) => {
  try {
    const config = sarufiService.getConfiguration();
    res.status(200).json(config);
  } catch (error) {
    logger.error('Error getting Sarufi configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration'
    });
  }
});

module.exports = router;