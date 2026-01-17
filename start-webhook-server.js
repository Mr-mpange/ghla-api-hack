#!/usr/bin/env node

/**
 * Start Webhook Server for ngrok Testing
 * This starts a simple server optimized for webhook testing
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const whatsappResponseService = require('./src/services/whatsappResponseService');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CarRental Pro Webhook Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      ghala_webhook: '/webhook/ghala',
      sarufi_webhook: '/webhook/sarufi',
      whatsapp_webhook: '/webhook/whatsapp',
      health: '/health',
      test: '/test'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'webhook_server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: {
      node_env: process.env.NODE_ENV,
      port: port,
      whatsapp_configured: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
    }
  });
});

// Ghala webhook endpoint
app.post('/webhook/ghala', async (req, res) => {
  try {
    console.log('🔔 Ghala webhook received!');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Extract message data from WhatsApp webhook format
    const messageData = whatsappResponseService.extractMessageData(req.body);
    
    if (!messageData) {
      console.log('❌ No valid message data found');
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload - no message data found'
      });
    }

    console.log(`📱 Processing message from ${messageData.name} (+${messageData.from}): "${messageData.message}"`);

    // Process the message and send response
    const result = await whatsappResponseService.processIncomingMessage(messageData);

    if (result.success) {
      console.log('✅ Message processed and response sent successfully');
      console.log(`📤 Response sent to ${messageData.name}`);
      
      res.status(200).json({
        success: true,
        message: 'Message processed and response sent',
        messageId: result.messageId,
        customer: messageData.name,
        phone: messageData.from
      });
    } else {
      console.log('❌ Failed to process message or send response:', result.error);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('💥 Error in Ghala webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Ghala webhook verification
app.get('/webhook/ghala', (req, res) => {
  try {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'carrentalpro_verify_2024';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔐 Webhook verification request:');
    console.log(`   Mode: ${mode}`);
    console.log(`   Token: ${token}`);
    console.log(`   Challenge: ${challenge}`);
    console.log(`   Expected Token: ${verifyToken}`);

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verification successful!');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed');
      res.status(403).json({
        success: false,
        error: 'Verification failed',
        expected_token: verifyToken,
        received_token: token
      });
    }
  } catch (error) {
    console.error('💥 Error in webhook verification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Test endpoint for manual testing
app.post('/webhook/ghala/test', async (req, res) => {
  try {
    console.log('🧪 Test endpoint called');
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

    console.log(`🧪 Testing with: ${messageData.name} (+${messageData.from}) - "${messageData.message}"`);

    const result = await whatsappResponseService.processIncomingMessage(messageData);

    console.log('🧪 Test result:', result);

    res.status(200).json({
      success: true,
      message: 'Test message processed',
      result: result,
      test_data: messageData
    });
  } catch (error) {
    console.error('💥 Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed'
    });
  }
});

// Sarufi webhook (for completeness)
app.post('/webhook/sarufi', (req, res) => {
  console.log('🤖 Sarufi webhook received:', req.body);
  res.status(200).json({ success: true, message: 'Sarufi webhook received' });
});

app.get('/webhook/sarufi', (req, res) => {
  const challenge = req.query['hub.challenge'];
  console.log('🤖 Sarufi webhook verification:', challenge);
  res.status(200).send(challenge || 'OK');
});

// WhatsApp webhook (for completeness)
app.post('/webhook/whatsapp', (req, res) => {
  console.log('📱 WhatsApp webhook received:', req.body);
  res.status(200).json({ success: true, message: 'WhatsApp webhook received' });
});

app.get('/webhook/whatsapp', (req, res) => {
  const challenge = req.query['hub.challenge'];
  console.log('📱 WhatsApp webhook verification:', challenge);
  res.status(200).send(challenge || 'OK');
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Webhook server is working!',
    timestamp: new Date().toISOString(),
    test_endpoints: {
      ghala_test: 'POST /webhook/ghala/test',
      health: 'GET /health',
      root: 'GET /'
    }
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❓ 404 - Not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /test',
      'POST /webhook/ghala',
      'GET /webhook/ghala',
      'POST /webhook/ghala/test'
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log('🚀 CarRental Pro Webhook Server Started!');
  console.log('═'.repeat(60));
  console.log(`📡 Server running on port ${port}`);
  console.log(`🌐 Local URL: http://localhost:${port}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log(`   Root: http://localhost:${port}/`);
  console.log(`   Health: http://localhost:${port}/health`);
  console.log(`   Ghala Webhook: http://localhost:${port}/webhook/ghala`);
  console.log(`   Test Endpoint: http://localhost:${port}/webhook/ghala/test`);
  console.log('');
  console.log('🔧 Configuration:');
  console.log(`   Verify Token: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'carrentalpro_verify_2024'}`);
  console.log(`   WhatsApp Configured: ${!!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)}`);
  console.log('');
  console.log('🌐 Next Steps:');
  console.log('1. Start ngrok: ngrok http 3000');
  console.log('2. Copy ngrok URL (e.g., https://abc123.ngrok.io)');
  console.log('3. Set Ghala webhook: https://abc123.ngrok.io/webhook/ghala');
  console.log('4. Test by sending WhatsApp message to +255683859574');
  console.log('');
  console.log('🛑 Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down webhook server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down webhook server...');
  process.exit(0);
});