const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

// Import routes and services
const whatsappWebhook = require('./webhooks/whatsappWebhook');
const ghalaWebhook = require('./webhooks/ghalaWebhook');
const sarufiWebhook = require('./webhooks/sarufiWebhook');
const queueProcessors = require('./workers/queueProcessors');
const productService = require('./services/productService');

// Import car rental components
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const carRentalService = require('./services/carRentalService');
const bookingService = require('./services/bookingService');
const workflowAutomationService = require('./services/workflowAutomationService');
const carRentalConversationHandler = require('./handlers/carRentalConversationHandler');
const botMiddleware = require('./middleware/botMiddleware');

// Import database and Redis
const db = require('./config/database');
const { redis } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Webhook-specific rate limiting (more restrictive)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 webhook requests per minute
  message: 'Webhook rate limit exceeded',
});

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use('/api/webhooks', webhookLimiter, express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check Redis connection
    await redis.ping();

    // Check workflow automation status
    const automationStatus = workflowAutomationService.getStatus();
    
    // Check bot middleware status
    const botStatus = botMiddleware.getBotStatistics();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        server: 'running',
        automation: automationStatus.initialized ? 'active' : 'inactive',
        bots: botStatus.availableBots.length > 0 ? 'available' : 'unavailable'
      },
      automation: automationStatus,
      bots: botStatus,
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
app.use('/api/webhooks/whatsapp', whatsappWebhook);
app.use('/api/webhooks/ghala', ghalaWebhook);
app.use('/api/webhooks/sarufi', sarufiWebhook);

// Car Rental Admin Dashboard Routes
app.use('/api/admin/dashboard', adminDashboardRoutes);

// Car Rental API Routes
app.get('/api/vehicles/search', async (req, res) => {
  try {
    const result = await carRentalService.searchVehicles(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error searching vehicles:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search vehicles'
    });
  }
});

app.get('/api/vehicles/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { pickupDate, returnDate } = req.query;
    
    const result = await carRentalService.getVehicleDetails(vehicleId, pickupDate, returnDate);
    res.json(result);
  } catch (error) {
    console.error('Error getting vehicle details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get vehicle details'
    });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const result = await carRentalService.getLocations();
    res.json(result);
  } catch (error) {
    console.error('Error getting locations:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get locations'
    });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const result = await carRentalService.getVehicleCategories();
    res.json(result);
  } catch (error) {
    console.error('Error getting categories:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const result = await bookingService.createBookingWorkflow(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error creating booking:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

app.get('/api/bookings/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await bookingService.getBookingDetails(bookingId);
    res.json(result);
  } catch (error) {
    console.error('Error getting booking details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get booking details'
    });
  }
});

app.patch('/api/bookings/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes } = req.body;
    
    const result = await bookingService.updateBookingStatus(bookingId, status, notes);
    res.json(result);
  } catch (error) {
    console.error('Error updating booking status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status'
    });
  }
});

app.post('/api/bookings/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    
    const result = await bookingService.cancelBooking(bookingId, reason);
    res.json(result);
  } catch (error) {
    console.error('Error cancelling booking:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking'
    });
  }
});

// WhatsApp Car Rental Chat API
app.post('/api/chat/message', async (req, res) => {
  try {
    const { phoneNumber, message, messageType = 'text' } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }
    
    const result = await carRentalConversationHandler.handleMessage(phoneNumber, message, messageType);
    res.json(result);
  } catch (error) {
    console.error('Error handling chat message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to handle message'
    });
  }
});

// Admin endpoints (protected in production)
app.get('/api/admin/sync-products', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await productService.syncProductsFromGhala();
    res.json({
      success: true,
      message: 'Products synced successfully',
      data: result
    });
  } catch (error) {
    console.error('Error syncing products:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to sync products'
    });
  }
});

app.get('/api/admin/queue-stats', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { messageQueue, paymentQueue, orderQueue, notificationQueue } = require('./config/redis');
    
    const stats = {
      messageQueue: await messageQueue.getJobCounts(),
      paymentQueue: await paymentQueue.getJobCounts(),
      orderQueue: await orderQueue.getJobCounts(),
      notificationQueue: await notificationQueue.getJobCounts()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting queue stats:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue stats'
    });
  }
});

app.post('/api/admin/setup-database', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { setupCarRentalDatabase } = require('./scripts/setupCarRentalDatabaseEnhanced');
    await setupCarRentalDatabase();
    
    res.json({
      success: true,
      message: 'Car rental database setup completed successfully'
    });
  } catch (error) {
    console.error('Error setting up database:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to setup database'
    });
  }
});

app.get('/api/admin/automation/status', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = workflowAutomationService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting automation status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get automation status'
    });
  }
});

app.get('/api/admin/bots/status', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = botMiddleware.getBotStatistics();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting bot status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get bot status'
    });
  }
});

app.post('/api/admin/bots/health-check', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = await botMiddleware.forceHealthCheck();
    res.json({
      success: true,
      message: 'Health check completed',
      data: status
    });
  } catch (error) {
    console.error('Error performing bot health check:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to perform health check'
    });
  }
});

app.post('/api/admin/bots/reset-health', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { botName } = req.body;
    botMiddleware.resetBotHealth(botName);
    
    res.json({
      success: true,
      message: botName ? `Health reset for ${botName}` : 'Health reset for all bots'
    });
  } catch (error) {
    console.error('Error resetting bot health:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to reset bot health'
    });
  }
});

app.post('/api/admin/automation/restart', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    workflowAutomationService.stopAllJobs();
    await workflowAutomationService.initialize();
    
    res.json({
      success: true,
      message: 'Workflow automation restarted successfully'
    });
  } catch (error) {
    console.error('Error restarting automation:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to restart automation'
    });
  }
});

app.post('/api/admin/bots/test-message', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { phoneNumber, message, botName } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    let result;
    if (botName) {
      // Test specific bot
      const botService = botMiddleware.getBotService(botName);
      if (!botService) {
        return res.status(400).json({
          success: false,
          error: `Bot ${botName} not found`
        });
      }
      result = await botService.sendMessage(phoneNumber, message);
      result.testedBot = botName;
    } else {
      // Test through middleware (automatic selection)
      result = await botMiddleware.sendMessage(phoneNumber, message);
    }
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Test message sent successfully' : 'Test message failed'
    });
  } catch (error) {
    console.error('Error sending test message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send test message'
    });
  }
});

// Receipt verification endpoint
app.get('/verify/receipt/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    const result = await db.query(`
      SELECT receipt_data, created_at FROM receipts WHERE hash = $1
    `, [hash]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        message: 'Receipt not found'
      });
    }

    const receipt = result.rows[0];
    
    res.json({
      valid: true,
      receipt: JSON.parse(receipt.receipt_data),
      verified_at: new Date().toISOString(),
      issued_at: receipt.created_at
    });

  } catch (error) {
    console.error('Error verifying receipt:', error.message);
    res.status(500).json({
      valid: false,
      message: 'Verification failed'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Initialize workflow automation on startup
async function initializeServices() {
  try {
    console.log('🔧 Initializing car rental services...');
    
    // Initialize workflow automation
    await workflowAutomationService.initialize();
    
    console.log('✅ Car rental services initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing services:', error.message);
    // Don't exit the process, just log the error
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  try {
    // Stop workflow automation
    workflowAutomationService.stopAllJobs();
    
    // Close database connections
    await db.pool.end();
    
    // Close Redis connections
    await redis.quit();
    
    // Close queues
    const { messageQueue, paymentQueue, orderQueue, notificationQueue } = require('./config/redis');
    await Promise.all([
      messageQueue.close(),
      paymentQueue.close(),
      orderQueue.close(),
      notificationQueue.close()
    ]);
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.emit('SIGTERM');
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`
🚀 Car Rental System Started!

📊 Server: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📱 WhatsApp Webhook: http://localhost:${PORT}/api/webhooks/whatsapp
🤖 Sarufi Bot Webhook: http://localhost:${PORT}/api/webhooks/sarufi
💳 Ghala Webhook: http://localhost:${PORT}/api/webhooks/ghala
🏥 Health Check: http://localhost:${PORT}/health

🚗 Car Rental API:
   • Search Vehicles: GET /api/vehicles/search
   • Vehicle Details: GET /api/vehicles/:id
   • Locations: GET /api/locations
   • Categories: GET /api/categories
   • Create Booking: POST /api/bookings
   • Booking Details: GET /api/bookings/:id

📊 Admin Dashboard: /api/admin/dashboard/*
🤖 Bot Management: /api/admin/bots/*
🤖 Chat API: POST /api/chat/message
🔧 Queue Processors: Active
📦 Product Sync: Available at /api/admin/sync-products
🧾 Receipt Verification: Available at /verify/receipt/:hash

🤖 Bot Integration:
   • WhatsApp Business API: Configured
   • Sarufi Bot API: ${process.env.SARUFI_ENABLED === 'true' ? 'Enabled' : 'Disabled'}
   • Failover: ${process.env.BOT_FAILOVER_ENABLED === 'true' ? 'Enabled' : 'Disabled'}
   • Load Balancing: ${process.env.BOT_LOAD_BALANCING || 'phone_based'}

Ready to process car rental bookings with dual bot support! 🚗✨
  `);

  // Initialize services after server starts
  await initializeServices();
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error.message);
  }
  process.exit(1);
});

module.exports = app;