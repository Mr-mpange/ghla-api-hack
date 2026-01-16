const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { verifyWebhookSignature } = require('../utils/webhookVerifier');
const logger = require('../utils/logger');

/**
 * Ghala webhook endpoint
 * Receives events: order.created, payment.success, payment.failed
 */
router.post('/ghala', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get signature from header
    const signature = req.headers['x-ghala-signature'];
    const webhookSecret = process.env.GHALA_WEBHOOK_SECRET;

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(req.body, signature, webhookSecret)) {
      logger.warn('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Parse the body
    const payload = JSON.parse(req.body.toString());
    const { event, data } = payload;

    logger.info(`Webhook received: ${event}`);

    // Handle the webhook event
    const result = await webhookController.handleWebhookEvent(event, data);

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      result
    });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
});

/**
 * Webhook health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
