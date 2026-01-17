const axios = require('axios');
const logger = require('../utils/logger');

class SafuriBotService {
  constructor() {
    this.baseUrl = process.env.SAFURI_BOT_BASE_URL;
    this.apiKey = process.env.SAFURI_BOT_API_KEY;
    this.authorization = process.env.SAFURI_BOT_AUTHORIZATION;
    this.businessId = process.env.SAFURI_BOT_BUSINESS_ID;
    this.phoneNumber = process.env.SAFURI_BOT_PHONE_NUMBER;
    this.timeout = parseInt(process.env.SAFURI_BOT_TIMEOUT) || 30000;
    this.enabled = process.env.SAFURI_BOT_ENABLED === 'true';
  }

  // Get default headers for API requests
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.authorization,
      'X-API-Key': this.apiKey,
      'Accept': 'application/json'
    };
  }

  // Send a simple text message
  async sendMessage(to, text, variables = {}) {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const payload = {
        business_id: this.businessId,
        phone_number: this.phoneNumber,
        recipient: to.replace('+', ''),
        message_type: 'text',
        message: {
          text: text
        },
        variables: variables
      };

      const response = await axios.post(
        `${this.baseUrl}/messages/send`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot message sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.message_id || response.data.id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending Safuri Bot message:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send interactive buttons
  async sendInteractiveButtons(to, text, buttons, header = null, footer = null, variables = {}) {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const payload = {
        business_id: this.businessId,
        phone_number: this.phoneNumber,
        recipient: to.replace('+', ''),
        message_type: 'interactive',
        message: {
          type: 'button',
          header: header ? { type: 'text', text: header } : undefined,
          body: { text: text },
          footer: footer ? { text: footer } : undefined,
          action: {
            buttons: buttons.map((button, index) => ({
              type: 'reply',
              reply: {
                id: button.id || `btn_${index}`,
                title: button.title.substring(0, 20) // Safuri Bot limit
              }
            }))
          }
        },
        variables: variables
      };

      const response = await axios.post(
        `${this.baseUrl}/messages/send`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot interactive buttons sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.message_id || response.data.id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending Safuri Bot interactive buttons:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send interactive list
  async sendInteractiveList(to, text, buttonText, sections, header = null, footer = null, variables = {}) {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const payload = {
        business_id: this.businessId,
        phone_number: this.phoneNumber,
        recipient: to.replace('+', ''),
        message_type: 'interactive',
        message: {
          type: 'list',
          header: header ? { type: 'text', text: header } : undefined,
          body: { text: text },
          footer: footer ? { text: footer } : undefined,
          action: {
            button: buttonText,
            sections: sections.map(section => ({
              title: section.title,
              rows: section.rows.map(row => ({
                id: row.id,
                title: row.title.substring(0, 24), // Safuri Bot limit
                description: row.description ? row.description.substring(0, 72) : undefined
              }))
            }))
          }
        },
        variables: variables
      };

      const response = await axios.post(
        `${this.baseUrl}/messages/send`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot interactive list sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.message_id || response.data.id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending Safuri Bot interactive list:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send template message
  async sendTemplate(to, templateName, languageCode = 'en', components = [], variables = {}) {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const payload = {
        business_id: this.businessId,
        phone_number: this.phoneNumber,
        recipient: to.replace('+', ''),
        message_type: 'template',
        message: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components
        },
        variables: variables
      };

      const response = await axios.post(
        `${this.baseUrl}/messages/send`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot template sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.message_id || response.data.id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending Safuri Bot template:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send image message
  async sendImage(to, imageUrl, caption = '', variables = {}) {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const payload = {
        business_id: this.businessId,
        phone_number: this.phoneNumber,
        recipient: to.replace('+', ''),
        message_type: 'image',
        message: {
          link: imageUrl,
          caption: caption
        },
        variables: variables
      };

      const response = await axios.post(
        `${this.baseUrl}/messages/send`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot image sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.message_id || response.data.id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending Safuri Bot image:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send document
  async sendDocument(to, documentUrl, filename, caption = '', variables = {}) {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const payload = {
        business_id: this.businessId,
        phone_number: this.phoneNumber,
        recipient: to.replace('+', ''),
        message_type: 'document',
        message: {
          link: documentUrl,
          filename: filename,
          caption: caption
        },
        variables: variables
      };

      const response = await axios.post(
        `${this.baseUrl}/messages/send`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot document sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.message_id || response.data.id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending Safuri Bot document:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send location
  async sendLocation(to, latitude, longitude, name = '', address = '', variables = {}) {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const payload = {
        business_id: this.businessId,
        phone_number: this.phoneNumber,
        recipient: to.replace('+', ''),
        message_type: 'location',
        message: {
          latitude: latitude,
          longitude: longitude,
          name: name,
          address: address
        },
        variables: variables
      };

      const response = await axios.post(
        `${this.baseUrl}/messages/send`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot location sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.message_id || response.data.id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending Safuri Bot location:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Get message status
  async getMessageStatus(messageId) {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const response = await axios.get(
        `${this.baseUrl}/messages/${messageId}/status`,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot message status retrieved:`, response.data);
      return {
        success: true,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      logger.error('Error getting Safuri Bot message status:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Get business profile
  async getBusinessProfile() {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const response = await axios.get(
        `${this.baseUrl}/business/${this.businessId}/profile`,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot business profile retrieved:`, response.data);
      return {
        success: true,
        profile: response.data,
        data: response.data
      };
    } catch (error) {
      logger.error('Error getting Safuri Bot business profile:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Update business profile
  async updateBusinessProfile(profileData) {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const response = await axios.put(
        `${this.baseUrl}/business/${this.businessId}/profile`,
        profileData,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot business profile updated:`, response.data);
      return {
        success: true,
        profile: response.data,
        data: response.data
      };
    } catch (error) {
      logger.error('Error updating Safuri Bot business profile:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Create webhook
  async createWebhook(webhookUrl, events = []) {
    try {
      if (!this.enabled) {
        logger.warn('Safuri Bot is disabled');
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const payload = {
        business_id: this.businessId,
        url: webhookUrl,
        events: events.length > 0 ? events : [
          'message.received',
          'message.delivered',
          'message.read',
          'message.failed'
        ]
      };

      const response = await axios.post(
        `${this.baseUrl}/webhooks`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      logger.info(`Safuri Bot webhook created:`, response.data);
      return {
        success: true,
        webhook: response.data,
        data: response.data
      };
    } catch (error) {
      logger.error('Error creating Safuri Bot webhook:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Validate webhook signature
  validateWebhookSignature(payload, signature, secret) {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret || process.env.SAFURI_BOT_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      logger.error('Error validating Safuri Bot webhook signature:', error);
      return false;
    }
  }

  // Format phone number for Safuri Bot
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters except +
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it starts with +, remove it for Safuri Bot API
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }
    
    // If it starts with 0 (local format), replace with country code
    if (formatted.startsWith('0')) {
      formatted = '255' + formatted.substring(1); // Tanzania country code
    }
    
    return formatted;
  }

  // Check if service is configured
  isConfigured() {
    return !!(this.baseUrl && this.apiKey && this.authorization && this.businessId);
  }

  // Get service status
  getStatus() {
    return {
      configured: this.isConfigured(),
      enabled: this.enabled,
      baseUrl: this.baseUrl,
      businessId: this.businessId ? `***${this.businessId.slice(-4)}` : null,
      phoneNumber: this.phoneNumber,
      hasApiKey: !!this.apiKey,
      hasAuthorization: !!this.authorization
    };
  }

  // Test connection
  async testConnection() {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Safuri Bot is disabled' };
      }

      const response = await axios.get(
        `${this.baseUrl}/health`,
        {
          headers: this.getHeaders(),
          timeout: 5000
        }
      );

      return {
        success: true,
        status: 'connected',
        data: response.data
      };
    } catch (error) {
      logger.error('Safuri Bot connection test failed:', error.response?.data || error.message);
      return {
        success: false,
        status: 'disconnected',
        error: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = new SafuriBotService();