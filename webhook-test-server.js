#!/usr/bin/env node

/**
 * Simple webhook test server for WhatsApp Business API
 * Use this to test webhook verification locally
 */

require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WhatsApp webhook verification endpoint
app.get('/webhook/whatsapp', (req, res) => {
  console.log('📞 WhatsApp webhook verification request received');
  console.log('Query params:', req.query);

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Expected verify token:', verifyToken);
  console.log('Received verify token:', token);
  console.log('Mode:', mode);
  console.log('Challenge:', challenge);

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WhatsApp webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ WhatsApp webhook verification failed');
    console.log('- Mode should be "subscribe", got:', mode);
    console.log('- Token should match, expected:', verifyToken, 'got:', token);
    res.status(403).json({
      success: false,
      error: 'Verification failed',
      expected_token: verifyToken,
      received_token: token
    });
  }
});

// WhatsApp webhook message endpoint
app.post('/webhook/whatsapp', (req, res) => {
  console.log('📨 WhatsApp webhook message received');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // Process the webhook payload
  const { entry } = req.body;
  
  if (entry && entry.length > 0) {
    entry.forEach(entryItem => {
      const { changes } = entryItem;
      
      if (changes && changes.length > 0) {
        changes.forEach(change => {
          if (change.field === 'messages') {
            const { value } = change;
            console.log('Message data:', value);
            
            if (value.messages) {
              value.messages.forEach(message => {
                console.log(`📱 Message from ${message.from}: ${message.text?.body || 'Non-text message'}`);
              });
            }
          }
        });
      }
    });
  }

  res.status(200).json({ success: true });
});

// Sarufi webhook verification endpoint
app.get('/webhook/sarufi', (req, res) => {
  console.log('🤖 Sarufi webhook verification request received');
  console.log('Query params:', req.query);

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Sarufi webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Sarufi webhook verification failed');
    res.status(403).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

// Sarufi webhook message endpoint
app.post('/webhook/sarufi', (req, res) => {
  console.log('🤖 Sarufi webhook message received');
  console.log('Body:', JSON.stringify(req.body, null, 2));

  const { phone_number, message, message_type } = req.body;
  
  if (phone_number && message) {
    console.log(`📱 Sarufi message from ${phone_number}: ${message}`);
    
    // Simulate processing and response
    const response = {
      success: true,
      message: 'Message processed successfully',
      response: `Thank you for your message: "${message}". This is a test response from the webhook server.`
    };
    
    res.status(200).json(response);
  } else {
    console.log('❌ Invalid Sarufi webhook payload');
    res.status(400).json({
      success: false,
      error: 'Missing required fields: phone_number, message'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Webhook test server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      whatsapp_verify: 'GET /webhook/whatsapp',
      whatsapp_webhook: 'POST /webhook/whatsapp',
      sarufi_verify: 'GET /webhook/sarufi',
      sarufi_webhook: 'POST /webhook/sarufi'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp & Sarufi Webhook Test Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      whatsapp_verify: 'GET /webhook/whatsapp',
      whatsapp_webhook: 'POST /webhook/whatsapp',
      sarufi_verify: 'GET /webhook/sarufi',
      sarufi_webhook: 'POST /webhook/sarufi'
    },
    configuration: {
      verify_token: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'Not set',
      port: port
    }
  });
});

// Start server
app.listen(port, () => {
  console.log('🚀 Webhook Test Server Started');
  console.log(`📡 Server running on port ${port}`);
  console.log(`🌐 Local URL: http://localhost:${port}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log(`   Health Check: http://localhost:${port}/health`);
  console.log(`   WhatsApp Verify: http://localhost:${port}/webhook/whatsapp`);
  console.log(`   Sarufi Verify: http://localhost:${port}/webhook/sarufi`);
  console.log('');
  console.log('🔧 Configuration:');
  console.log(`   Verify Token: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'NOT SET'}`);
  console.log(`   Backend URL: ${process.env.BACKEND_BASE_URL || 'NOT SET'}`);
  console.log('');
  console.log('📝 To test webhook verification:');
  console.log(`   curl "http://localhost:${port}/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN}&hub.challenge=test123"`);
  console.log('');
  console.log('🛑 Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down webhook test server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down webhook test server...');
  process.exit(0);
});