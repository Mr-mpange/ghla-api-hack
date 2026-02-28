const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const logger = require('./utils/logger');
const snippePaymentService = require('./services/snippePaymentService');
const carRentalBotService = require('./services/carRentalBotService');
const whatsappResponseService = require('./services/whatsappResponseService');
const adminRoutes = require('./admin/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public')); // Serve static files

// Admin routes
app.use('/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      whatsapp: whatsappResponseService.getStatus(),
      payment: snippePaymentService.getStatus()
    }
  });
});

// WhatsApp webhook verification (GET)
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      logger.info('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      logger.warn('WhatsApp webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// WhatsApp webhook for incoming messages (POST)
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    logger.info('Received WhatsApp webhook');
    
    const messageData = whatsappResponseService.extractMessageData(req.body);
    
    if (messageData) {
      // Process message asynchronously
      whatsappResponseService.processIncomingMessage(messageData)
        .then(result => {
          logger.info('Message processed successfully:', result);
        })
        .catch(error => {
          logger.error('Error processing message:', error);
        });
    }
    
    // Respond immediately to WhatsApp
    res.sendStatus(200);
  } catch (error) {
    logger.error('Error in WhatsApp webhook:', error);
    res.sendStatus(500);
  }
});

// Snippe payment webhook
app.post('/webhook/snippe/payment', async (req, res) => {
  try {
    logger.info('Received Snippe payment webhook');
    
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    
    // Verify webhook signature from X-Webhook-Signature header
    const signature = req.headers['x-webhook-signature'];
    if (!snippePaymentService.verifyWebhookSignature(signature, rawBody)) {
      logger.warn('Invalid Snippe webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Log webhook headers for debugging
    logger.info('Webhook headers:', {
      event: req.headers['x-webhook-event'],
      timestamp: req.headers['x-webhook-timestamp']
    });

    // Process webhook
    const result = await carRentalBotService.handlePaymentWebhook(req.body);
    
    if (result.success) {
      logger.info('Payment webhook processed successfully');
      
      // Send confirmation message to customer if payment completed
      if (result.booking && result.booking.status === 'paid') {
        const confirmationMessage = `🎉 Payment Confirmed!

Your booking ${result.booking.id} for ${result.booking.carName} has been paid successfully.

Amount: TZS ${result.booking.paidAmount.toLocaleString()}
Pickup: ${result.booking.pickupDate}
Location: ${result.booking.pickupLocation}

We'll contact you shortly with pickup details.

Thank you for choosing CarRental Pro! 🚗`;

        await whatsappResponseService.sendTextMessage(
          result.booking.customerId,
          confirmationMessage
        );
      }
      
      // Respond with 200 to acknowledge receipt
      res.status(200).json({ success: true });
    } else {
      logger.error('Failed to process payment webhook:', result.error);
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    logger.error('Error in Snippe webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint for Snippe payment
app.post('/api/test-payment', async (req, res) => {
  try {
    const { bookingId, phoneNumber } = req.body;
    
    if (!bookingId || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // This is a test endpoint - in production, payment should only be initiated through WhatsApp
    const booking = carRentalBotService.bookings.get(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const result = await carRentalBotService.initiateSnippePayment(booking, phoneNumber);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in test payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payment status check endpoint
app.get('/api/payment-status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const result = await snippePaymentService.checkPaymentStatus(paymentId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error checking payment status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Briq Voice API Proxy (to avoid SSL issues with pre-release)
app.post('/api/briq-voice-proxy', async (req, res) => {
  try {
    const axios = require('axios');
    const https = require('https');
    
    logger.info('Proxying Briq voice call request');
    
    const { receiver_number, text } = req.body;
    
    if (!receiver_number || !text) {
      return res.status(400).json({ error: 'Missing receiver_number or text' });
    }
    
    // Forward request to Briq pre-release with SSL verification disabled
    const response = await axios.post(
      'https://pre-release.karibu.briq.tz/v1/voice/calls/tts',
      {
        receiver_number,
        text
      },
      {
        headers: {
          'X-API-Key': process.env.BRIQ_API_KEY,
          'Content-Type': 'application/json'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }
    );
    
    logger.info('Briq voice call proxied successfully');
    res.json(response.data);
  } catch (error) {
    logger.error('Error proxying Briq voice call:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 CarRental Pro Server running on port ${PORT}`);
  logger.info(`📱 WhatsApp webhook: ${process.env.APP_URL}/webhook/whatsapp`);
  logger.info(`💳 Snippe webhook: ${process.env.APP_URL}/webhook/snippe/payment`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
  
  // Log service status
  const whatsappStatus = whatsappResponseService.getStatus();
  const paymentStatus = snippePaymentService.getStatus();
  
  logger.info(`WhatsApp Service: ${whatsappStatus.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  logger.info(`Payment Service: ${paymentStatus.enabled ? '✅ Enabled' : '❌ Disabled'}`);
});

module.exports = app;
