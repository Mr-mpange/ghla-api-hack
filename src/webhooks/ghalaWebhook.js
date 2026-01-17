const express = require('express');
const ghalaIntegrationService = require('../services/ghalaIntegrationService');
const whatsappResponseService = require('../services/whatsappResponseService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Webhook endpoint for Ghala Rails integration
 * This receives messages forwarded from Ghala's webhook system
 */
router.post('/ghala', async (req, res) => {
  try {
    logger.info('Received Ghala webhook:', {
      headers: req.headers,
      body: req.body
    });

    // Extract message data from WhatsApp webhook format
    const messageData = whatsappResponseService.extractMessageData(req.body);
    
    if (!messageData) {
      logger.warn('No valid message data found in Ghala webhook');
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload - no message data found'
      });
    }

    logger.info(`Processing message from ${messageData.name} (+${messageData.from}): "${messageData.message}"`);

    // Process the message and send response
    const result = await whatsappResponseService.processIncomingMessage(messageData);

    if (result.success) {
      logger.info('Message processed and response sent successfully');
      res.status(200).json({
        success: true,
        message: 'Message processed and response sent',
        messageId: result.messageId
      });
    } else {
      logger.error('Failed to process message or send response:', result.error);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in Ghala webhook handler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Webhook verification endpoint for Ghala
 * Used to verify the webhook URL during setup
 */
router.get('/ghala', (req, res) => {
  try {
    const verifyToken = process.env.GHALA_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('Ghala webhook verification:', { mode, token, challenge });

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('Ghala webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.warn('Ghala webhook verification failed');
      res.status(403).json({
        success: false,
        error: 'Verification failed',
        expected_token: verifyToken,
        received_token: token
      });
    }
  } catch (error) {
    logger.error('Error in Ghala webhook verification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint for Ghala integration
 */
router.get('/ghala/health', async (req, res) => {
  try {
    const ghalaHealth = await ghalaIntegrationService.healthCheck();
    const whatsappStatus = whatsappResponseService.getStatus();
    
    res.status(200).json({
      success: true,
      services: {
        ghala_integration: ghalaHealth,
        whatsapp_response: whatsappStatus
      }
    });
  } catch (error) {
    logger.error('Error in Ghala health check:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

/**
 * Configuration endpoint for Ghala integration
 */
router.get('/ghala/config', (req, res) => {
  try {
    const ghalaConfig = ghalaIntegrationService.getStatus();
    const whatsappConfig = whatsappResponseService.getStatus();
    
    res.status(200).json({
      success: true,
      service: 'ghala_integration',
      config: {
        ghala: ghalaConfig,
        whatsapp_response: whatsappConfig
      }
    });
  } catch (error) {
    logger.error('Error getting Ghala configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration'
    });
  }
});

/**
 * Test endpoint for Ghala integration
 */
router.post('/ghala/test', async (req, res) => {
  try {
    const { phone_number, message, name } = req.body;

    if (!phone_number || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phone_number, message'
      });
    }

    const messageData = {
      from: phone_number.replace(/[^\d]/g, ''),
      message: message,
      name: name || 'Test Customer',
      messageType: 'text'
    };

    const result = await whatsappResponseService.processIncomingMessage(messageData);

    res.status(200).json({
      success: true,
      message: 'Test message processed',
      result: result
    });
  } catch (error) {
    logger.error('Error in Ghala test endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed'
    });
  }
});

module.exports = router;