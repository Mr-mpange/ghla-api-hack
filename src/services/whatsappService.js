const axios = require('axios');
const logger = require('../utils/logger');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  // Send a simple text message
  async sendMessage(to, text) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'text',
        text: {
          body: text
        }
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`WhatsApp message sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send interactive buttons
  async sendInteractiveButtons(to, text, buttons, header = null, footer = null) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: text
          },
          action: {
            buttons: buttons.map((button, index) => ({
              type: 'reply',
              reply: {
                id: button.id || `btn_${index}`,
                title: button.title.substring(0, 20) // WhatsApp limit
              }
            }))
          }
        }
      };

      if (header) {
        payload.interactive.header = {
          type: 'text',
          text: header
        };
      }

      if (footer) {
        payload.interactive.footer = {
          text: footer
        };
      }

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`WhatsApp interactive buttons sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending WhatsApp interactive buttons:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send interactive list
  async sendInteractiveList(to, text, buttonText, sections, header = null, footer = null) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: text
          },
          action: {
            button: buttonText,
            sections: sections.map(section => ({
              title: section.title,
              rows: section.rows.map(row => ({
                id: row.id,
                title: row.title.substring(0, 24), // WhatsApp limit
                description: row.description ? row.description.substring(0, 72) : undefined // WhatsApp limit
              }))
            }))
          }
        }
      };

      if (header) {
        payload.interactive.header = {
          type: 'text',
          text: header
        };
      }

      if (footer) {
        payload.interactive.footer = {
          text: footer
        };
      }

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`WhatsApp interactive list sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending WhatsApp interactive list:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send image message
  async sendImage(to, imageUrl, caption = '') {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption
        }
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`WhatsApp image sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending WhatsApp image:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send document
  async sendDocument(to, documentUrl, filename, caption = '') {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'document',
        document: {
          link: documentUrl,
          filename: filename,
          caption: caption
        }
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`WhatsApp document sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending WhatsApp document:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send location
  async sendLocation(to, latitude, longitude, name = '', address = '') {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'location',
        location: {
          latitude: latitude,
          longitude: longitude,
          name: name,
          address: address
        }
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`WhatsApp location sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending WhatsApp location:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Send template message
  async sendTemplate(to, templateName, languageCode = 'en', components = []) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components
        }
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`WhatsApp template sent to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      logger.error('Error sending WhatsApp template:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Mark message as read
  async markAsRead(messageId) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`WhatsApp message marked as read:`, response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error marking WhatsApp message as read:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Get media URL
  async getMediaUrl(mediaId) {
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      logger.info(`WhatsApp media URL retrieved:`, response.data);
      return {
        success: true,
        url: response.data.url,
        data: response.data
      };
    } catch (error) {
      logger.error('Error getting WhatsApp media URL:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Download media
  async downloadMedia(mediaUrl) {
    try {
      const response = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        responseType: 'stream'
      });

      logger.info(`WhatsApp media downloaded successfully`);
      return {
        success: true,
        stream: response.data,
        contentType: response.headers['content-type']
      };
    } catch (error) {
      logger.error('Error downloading WhatsApp media:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Validate webhook signature
  validateWebhookSignature(payload, signature, verifyToken) {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', verifyToken)
        .update(payload)
        .digest('hex');

      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      logger.error('Error validating webhook signature:', error);
      return false;
    }
  }

  // Format phone number
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters except +
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it starts with +, remove it for WhatsApp API
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }
    
    // If it starts with 0 (local format), replace with country code
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1); // Kenya country code
    }
    
    return formatted;
  }

  // Check if service is configured
  isConfigured() {
    return !!(this.accessToken && this.phoneNumberId);
  }

  // Get service status
  getStatus() {
    return {
      configured: this.isConfigured(),
      phoneNumberId: this.phoneNumberId ? `***${this.phoneNumberId.slice(-4)}` : null,
      hasAccessToken: !!this.accessToken
    };
  }
}

module.exports = new WhatsAppService();