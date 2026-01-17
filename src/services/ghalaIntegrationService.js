const axios = require('axios');
const logger = require('../utils/logger');

class GhalaIntegrationService {
  constructor() {
    this.ghalaApiUrl = process.env.GHALA_API_URL || 'https://api.ghala.io/v1';
    this.ghalaApiKey = process.env.GHALA_API_KEY;
    this.ghalaWebhookUrl = process.env.GHALA_WEBHOOK_URL;
    this.ghalaVerifyToken = process.env.GHALA_VERIFY_TOKEN;
    this.enabled = !!(this.ghalaApiKey && this.ghalaWebhookUrl);
    
    if (!this.enabled) {
      logger.warn('Ghala integration not configured - missing API key or webhook URL');
    }
  }

  /**
   * Process incoming message from Ghala Rails webhook
   */
  async processGhalaWebhook(payload) {
    try {
      logger.info('Processing Ghala webhook:', payload);

      // Extract message data from Ghala webhook format
      const messageData = this.extractMessageData(payload);
      
      if (!messageData) {
        logger.warn('No valid message data found in Ghala webhook');
        return { success: false, error: 'Invalid webhook payload' };
      }

      // Process through car rental system
      const response = await this.processCarRentalMessage(
        messageData.phoneNumber,
        messageData.message,
        messageData.messageType
      );

      // Send response back through Ghala if needed
      if (response.success && response.reply) {
        await this.sendGhalaResponse(messageData.phoneNumber, response.reply);
      }

      return {
        success: true,
        message: 'Webhook processed successfully',
        data: response
      };
    } catch (error) {
      logger.error('Error processing Ghala webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract message data from Ghala webhook payload
   */
  extractMessageData(payload) {
    try {
      // Handle different Ghala webhook formats
      if (payload.entry && payload.entry.length > 0) {
        // WhatsApp Business API format via Ghala
        const entry = payload.entry[0];
        if (entry.changes && entry.changes.length > 0) {
          const change = entry.changes[0];
          if (change.value && change.value.messages) {
            const message = change.value.messages[0];
            return {
              phoneNumber: `+${message.from}`,
              message: message.text?.body || message.type,
              messageType: message.type || 'text',
              timestamp: new Date().toISOString()
            };
          }
        }
      }

      // Direct Ghala format
      if (payload.phone_number && payload.message) {
        return {
          phoneNumber: payload.phone_number,
          message: payload.message,
          messageType: payload.message_type || 'text',
          timestamp: payload.timestamp || new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      logger.error('Error extracting message data from Ghala webhook:', error);
      return null;
    }
  }

  /**
   * Process car rental message (integrate with your existing system)
   */
  async processCarRentalMessage(phoneNumber, message, messageType = 'text') {
    try {
      // This would integrate with your existing car rental processing logic
      logger.info(`Processing car rental message from ${phoneNumber}: ${message}`);

      // Simulate car rental processing
      const response = {
        success: true,
        reply: this.generateCarRentalResponse(message),
        phoneNumber: phoneNumber,
        originalMessage: message
      };

      return response;
    } catch (error) {
      logger.error('Error processing car rental message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate appropriate car rental response
   */
  generateCarRentalResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('rent') || lowerMessage.includes('car')) {
      return `🚗 Welcome to CarRental Pro! I can help you rent a car. What type of vehicle do you need?

Available options:
• Economy cars - From KES 2,500/day
• SUVs - From KES 4,500/day  
• Luxury cars - From KES 8,000/day
• Vans - From KES 6,000/day

Reply with the car type you're interested in!`;
    }

    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return `💰 Our rental prices:

🚗 Economy: KES 2,500/day
🚙 SUV: KES 4,500/day
🏎️ Luxury: KES 8,000/day
🚐 Van: KES 6,000/day

Prices include:
✅ Insurance
✅ 24/7 Support
✅ Free delivery in Nairobi

Would you like to make a booking?`;
    }

    if (lowerMessage.includes('book') || lowerMessage.includes('reserve')) {
      return `📅 Great! Let's get your booking started.

Please provide:
1. Pickup date and time
2. Return date and time
3. Pickup location
4. Car type preference

Example: "I need an SUV from Jan 20 9am to Jan 22 6pm, pickup at JKIA"`;
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return `🆘 CarRental Pro Support

I can help you with:
• Car rentals and bookings
• Pricing information
• Pickup/delivery arrangements
• Booking modifications
• Payment assistance

What would you like help with?`;
    }

    // Default response
    return `👋 Hello! Welcome to CarRental Pro.

I can help you with:
🚗 Car rentals
💰 Pricing info
📅 Bookings
🆘 Support

What can I help you with today?`;
  }

  /**
   * Send response back through Ghala API
   */
  async sendGhalaResponse(phoneNumber, message) {
    try {
      if (!this.enabled) {
        logger.warn('Ghala integration not enabled - cannot send response');
        return { success: false, error: 'Ghala not configured' };
      }

      // Format phone number for Ghala API
      const formattedPhone = phoneNumber.replace(/[^\d]/g, '');

      const payload = {
        phone_number: formattedPhone,
        message: message,
        message_type: 'text'
      };

      logger.info('Sending response via Ghala API:', payload);

      // This would be the actual Ghala API call
      // const response = await axios.post(`${this.ghalaApiUrl}/messages/send`, payload, {
      //   headers: {
      //     'Authorization': `Bearer ${this.ghalaApiKey}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      // For now, just log the response
      logger.info('Response sent via Ghala (simulated):', payload);

      return {
        success: true,
        message: 'Response sent via Ghala',
        data: payload
      };
    } catch (error) {
      logger.error('Error sending response via Ghala:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify Ghala webhook signature
   */
  verifyGhalaWebhook(payload, signature) {
    try {
      // Implement Ghala webhook signature verification
      // This would depend on Ghala's specific signature method
      logger.info('Verifying Ghala webhook signature');
      return true; // Placeholder
    } catch (error) {
      logger.error('Error verifying Ghala webhook signature:', error);
      return false;
    }
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      configured: !!(this.ghalaApiKey && this.ghalaWebhookUrl),
      webhook_url: this.ghalaWebhookUrl,
      api_url: this.ghalaApiUrl,
      has_api_key: !!this.ghalaApiKey,
      verify_token: this.ghalaVerifyToken ? '***' + this.ghalaVerifyToken.slice(-4) : null
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      return {
        status: this.enabled ? 'healthy' : 'disabled',
        service: 'ghala_integration',
        timestamp: new Date().toISOString(),
        config: this.getStatus()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'ghala_integration',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new GhalaIntegrationService();