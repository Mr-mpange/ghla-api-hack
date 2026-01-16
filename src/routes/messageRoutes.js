const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const logger = require('../utils/logger');

/**
 * Webhook endpoint for incoming WhatsApp messages
 * This endpoint receives messages from Ghala/WhatsApp
 */
router.post('/incoming', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message format'
      });
    }

    // Process each message
    for (const message of messages) {
      await messageController.handleIncomingMessage(message);
    }

    res.json({
      success: true,
      message: 'Messages processed'
    });
  } catch (error) {
    logger.error('Error processing incoming message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
});

/**
 * Webhook verification endpoint (for WhatsApp)
 */
router.get('/incoming', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token';

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

module.exports = router;
