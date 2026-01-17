const express = require('express');
const whatsappService = require('../services/whatsappService');
const customerService = require('../services/customerService');
const conversationHandler = require('../handlers/conversationHandler');
const { messageQueue } = require('../config/redis');
const db = require('../config/database');

const router = express.Router();

// WhatsApp webhook verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verificationResult = whatsappService.verifyWebhook(mode, token, challenge);
  
  if (verificationResult) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// WhatsApp webhook message handler
router.post('/', async (req, res) => {
  try {
    // Parse incoming message
    const messageData = whatsappService.parseWebhookMessage(req.body);
    
    if (!messageData) {
      return res.status(200).send('OK');
    }

    // Handle different message types
    if (messageData.type === 'message') {
      await handleIncomingMessage(messageData);
    } else if (messageData.type === 'status') {
      await handleMessageStatus(messageData);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Handle incoming messages
async function handleIncomingMessage(messageData) {
  try {
    const { from, text, interactive, button, list, contact, messageId } = messageData;

    // Get or create customer
    const customer = await customerService.getOrCreateCustomer(
      from, 
      contact.name, 
      null
    );

    // Log incoming message
    await logMessage(customer.id, messageId, 'inbound', messageData.messageType, text || 'Interactive message');

    // Mark message as read
    await whatsappService.markMessageAsRead(messageId);

    // Get customer session for conversation context
    const session = await customerService.getCustomerSession(customer.id);

    // Prepare conversation context
    const conversationContext = {
      customer: customer,
      session: session,
      messageData: messageData,
      messageText: text,
      interactive: interactive,
      button: button,
      list: list
    };

    // Queue message for processing
    await messageQueue.add('process_conversation', conversationContext, {
      priority: 10, // High priority for customer messages
      delay: 100 // Small delay to ensure message ordering
    });

  } catch (error) {
    console.error('Error handling incoming message:', error.message);
    
    // Send error message to customer
    try {
      await whatsappService.sendTextMessage(
        messageData.from,
        "Sorry, I'm experiencing technical difficulties. Please try again in a moment."
      );
    } catch (sendError) {
      console.error('Error sending error message:', sendError.message);
    }
  }
}

// Handle message status updates
async function handleMessageStatus(statusData) {
  try {
    const { messageId, status, timestamp, recipientId } = statusData;

    // Update message status in database
    await db.query(`
      UPDATE messages 
      SET status = $1, updated_at = NOW()
      WHERE whatsapp_message_id = $2
    `, [status, messageId]);

    // Log status for analytics
    console.log(`Message ${messageId} status: ${status}`);

    // Handle failed messages
    if (status === 'failed') {
      await handleFailedMessage(messageId, recipientId);
    }

  } catch (error) {
    console.error('Error handling message status:', error.message);
  }
}

// Handle failed message delivery
async function handleFailedMessage(messageId, recipientId) {
  try {
    // Get the failed message
    const messageResult = await db.query(`
      SELECT m.*, c.whatsapp_number 
      FROM messages m
      JOIN customers c ON m.customer_id = c.id
      WHERE m.whatsapp_message_id = $1
    `, [messageId]);

    if (messageResult.rows.length === 0) {
      return;
    }

    const message = messageResult.rows[0];

    // Queue retry for important messages
    if (message.message_type === 'order_confirmation' || 
        message.message_type === 'payment_receipt') {
      
      await messageQueue.add('retry_failed_message', {
        customerId: message.customer_id,
        customerPhone: message.whatsapp_number,
        originalContent: message.content,
        messageType: message.message_type,
        retryCount: 1
      }, {
        delay: 60000, // Retry after 1 minute
        attempts: 3
      });
    }

  } catch (error) {
    console.error('Error handling failed message:', error.message);
  }
}

// Log message to database
async function logMessage(customerId, whatsappMessageId, direction, messageType, content) {
  try {
    await db.query(`
      INSERT INTO messages (
        customer_id, whatsapp_message_id, direction, message_type, 
        content, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [customerId, whatsappMessageId, direction, messageType, content, 'sent']);

  } catch (error) {
    console.error('Error logging message:', error.message);
  }
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'whatsapp-webhook',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;