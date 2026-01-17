const express = require('express');
const router = express.Router();
const safuriBotService = require('../services/safuriBotService');
const carRentalConversationHandler = require('../handlers/carRentalConversationHandler');
const customerService = require('../services/customerService');
const logger = require('../utils/logger');

// Webhook verification middleware
const verifyWebhook = (req, res, next) => {
  const signature = req.headers['x-safuri-signature'] || req.headers['x-signature'];
  const webhookSecret = process.env.SAFURI_BOT_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    logger.warn('Missing signature or webhook secret for Safuri Bot webhook');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isValid = safuriBotService.validateWebhookSignature(
    JSON.stringify(req.body),
    signature,
    webhookSecret
  );

  if (!isValid) {
    logger.warn('Invalid webhook signature for Safuri Bot');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

// Webhook verification endpoint (GET)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.SAFURI_BOT_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('Safuri Bot webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.warn('Safuri Bot webhook verification failed');
    res.status(403).json({ error: 'Forbidden' });
  }
});

// Main webhook endpoint (POST)
router.post('/', verifyWebhook, async (req, res) => {
  try {
    const { body } = req;
    logger.info('Safuri Bot webhook received:', JSON.stringify(body, null, 2));

    // Acknowledge webhook immediately
    res.status(200).json({ success: true });

    // Process webhook data
    await processWebhookData(body);

  } catch (error) {
    logger.error('Error processing Safuri Bot webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process webhook data
async function processWebhookData(data) {
  try {
    // Handle different webhook event types
    if (data.event_type) {
      switch (data.event_type) {
        case 'message.received':
          await handleMessageReceived(data);
          break;
        case 'message.delivered':
          await handleMessageDelivered(data);
          break;
        case 'message.read':
          await handleMessageRead(data);
          break;
        case 'message.failed':
          await handleMessageFailed(data);
          break;
        case 'status.update':
          await handleStatusUpdate(data);
          break;
        default:
          logger.info(`Unhandled Safuri Bot webhook event: ${data.event_type}`);
      }
    } else if (data.messages && Array.isArray(data.messages)) {
      // Handle batch messages
      for (const message of data.messages) {
        await handleIncomingMessage(message);
      }
    } else if (data.message) {
      // Handle single message
      await handleIncomingMessage(data.message);
    } else {
      logger.warn('Unknown Safuri Bot webhook format:', data);
    }
  } catch (error) {
    logger.error('Error processing Safuri Bot webhook data:', error);
  }
}

// Handle incoming message
async function handleIncomingMessage(messageData) {
  try {
    const {
      from,
      phone_number,
      message_id,
      timestamp,
      type,
      text,
      interactive,
      location,
      image,
      document,
      audio,
      video
    } = messageData;

    const phoneNumber = from || phone_number;
    if (!phoneNumber) {
      logger.warn('No phone number in Safuri Bot message');
      return;
    }

    // Format phone number
    const formattedPhone = safuriBotService.formatPhoneNumber(phoneNumber);
    const fullPhoneNumber = `+${formattedPhone}`;

    logger.info(`Processing Safuri Bot message from ${fullPhoneNumber}`);

    // Handle different message types
    let messageContent = null;
    let messageType = 'text';

    switch (type) {
      case 'text':
        messageContent = text?.body || text;
        messageType = 'text';
        break;

      case 'interactive':
        messageContent = interactive;
        messageType = 'interactive';
        break;

      case 'location':
        messageContent = location;
        messageType = 'location';
        break;

      case 'image':
        messageContent = image;
        messageType = 'image';
        break;

      case 'document':
        messageContent = document;
        messageType = 'document';
        break;

      case 'audio':
        messageContent = audio;
        messageType = 'audio';
        break;

      case 'video':
        messageContent = video;
        messageType = 'video';
        break;

      default:
        logger.warn(`Unsupported Safuri Bot message type: ${type}`);
        return;
    }

    if (!messageContent) {
      logger.warn('No message content found in Safuri Bot message');
      return;
    }

    // Mark message as read
    if (message_id) {
      try {
        await safuriBotService.markAsRead(message_id);
      } catch (error) {
        logger.warn('Failed to mark Safuri Bot message as read:', error.message);
      }
    }

    // Process message through conversation handler
    await carRentalConversationHandler.handleMessage(
      fullPhoneNumber,
      messageContent,
      messageType
    );

  } catch (error) {
    logger.error('Error handling Safuri Bot incoming message:', error);
  }
}

// Handle message received event
async function handleMessageReceived(data) {
  logger.info('Safuri Bot message received event:', data);
  
  if (data.message) {
    await handleIncomingMessage(data.message);
  }
}

// Handle message delivered event
async function handleMessageDelivered(data) {
  logger.info('Safuri Bot message delivered:', data);
  
  // Update message status in database if needed
  if (data.message_id) {
    try {
      // You can update message delivery status in your database here
      logger.info(`Safuri Bot message ${data.message_id} delivered`);
    } catch (error) {
      logger.error('Error updating message delivery status:', error);
    }
  }
}

// Handle message read event
async function handleMessageRead(data) {
  logger.info('Safuri Bot message read:', data);
  
  // Update message read status in database if needed
  if (data.message_id) {
    try {
      // You can update message read status in your database here
      logger.info(`Safuri Bot message ${data.message_id} read`);
    } catch (error) {
      logger.error('Error updating message read status:', error);
    }
  }
}

// Handle message failed event
async function handleMessageFailed(data) {
  logger.error('Safuri Bot message failed:', data);
  
  // Handle message failure
  if (data.message_id && data.error) {
    try {
      // You can update message failure status in your database here
      logger.error(`Safuri Bot message ${data.message_id} failed: ${data.error}`);
      
      // Optionally retry with different bot or notify admin
      // await botMiddleware.sendMessage(data.recipient, 'Sorry, there was an issue sending your message. Please try again.');
    } catch (error) {
      logger.error('Error handling message failure:', error);
    }
  }
}

// Handle status update event
async function handleStatusUpdate(data) {
  logger.info('Safuri Bot status update:', data);
  
  // Handle various status updates
  switch (data.status) {
    case 'webhook_verified':
      logger.info('Safuri Bot webhook verified successfully');
      break;
    case 'business_verified':
      logger.info('Safuri Bot business account verified');
      break;
    case 'phone_number_verified':
      logger.info('Safuri Bot phone number verified');
      break;
    default:
      logger.info(`Safuri Bot status update: ${data.status}`);
  }
}

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Safuri Bot webhook error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = router;