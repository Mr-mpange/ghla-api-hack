const axios = require('axios');
const logger = require('../utils/logger');
const carRentalBotService = require('./carRentalBotService');

class WhatsAppResponseService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    this.enabled = !!(this.accessToken && this.phoneNumberId);
    
    if (!this.enabled) {
      logger.warn('WhatsApp Response Service not configured - missing access token or phone number ID');
    }
  }

  /**
   * Send text message via WhatsApp Business API
   */
  async sendTextMessage(to, message) {
    try {
      if (!this.enabled) {
        logger.warn('WhatsApp Response Service not enabled');
        return { success: false, error: 'Service not configured' };
      }

      const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

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

  /**
   * Send interactive buttons via WhatsApp Business API
   */
  async sendInteractiveButtons(to, text, buttons, header = null, footer = null) {
    try {
      if (!this.enabled) {
        logger.warn('WhatsApp Response Service not enabled');
        return { success: false, error: 'Service not configured' };
      }

      // Format buttons for WhatsApp API
      const formattedButtons = buttons.slice(0, 3).map((button, index) => ({
        type: "reply",
        reply: {
          id: button.id || `btn_${index}`,
          title: button.title.substring(0, 20)
        }
      }));

      const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "button",
          header: header ? { type: "text", text: header } : undefined,
          body: { text: text },
          footer: footer ? { text: footer } : undefined,
          action: {
            buttons: formattedButtons
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

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

  /**
   * Send interactive list via WhatsApp Business API
   */
  async sendInteractiveList(to, text, buttonText, sections, header = null, footer = null) {
    try {
      if (!this.enabled) {
        logger.warn('WhatsApp Response Service not enabled');
        return { success: false, error: 'Service not configured' };
      }

      const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "list",
          header: header ? { type: "text", text: header } : undefined,
          body: { text: text },
          footer: footer ? { text: footer } : undefined,
          action: {
            button: buttonText,
            sections: sections
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

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

  /**
   * Send image message via WhatsApp Business API
   */
  async sendImageMessage(to, imageUrl, caption = '') {
    try {
      if (!this.enabled) {
        logger.warn('WhatsApp Response Service not enabled');
        return { success: false, error: 'Service not configured' };
      }

      const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "image",
        image: {
          link: imageUrl,
          caption: caption
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

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

  /**
   * Process incoming WhatsApp message with advanced car rental bot
   */
  async processIncomingMessage(messageData) {
    try {
      const { from, message, name, messageType } = messageData;
      
      logger.info(`Processing WhatsApp message from ${name} (+${from}): "${message}"`);
      
      // Process through advanced car rental bot
      const botResponse = await carRentalBotService.processMessage(from, message, name);
      
      if (!botResponse.success) {
        logger.error(`Bot processing failed for ${name} (+${from}):`, botResponse.error);
        return {
          success: false,
          error: botResponse.error
        };
      }

      // Send appropriate response based on message type
      let result;
      
      if (botResponse.messageType === 'interactive_buttons' && botResponse.buttons) {
        result = await this.sendInteractiveButtons(
          from, 
          botResponse.response, 
          botResponse.buttons,
          null,
          'CarRental Pro - Your Premium Car Rental Service'
        );
      } else if (botResponse.messageType === 'interactive_list' && botResponse.listItems) {
        result = await this.sendInteractiveList(
          from,
          botResponse.response,
          'Select Option',
          botResponse.listItems,
          null,
          'CarRental Pro'
        );
      } else {
        result = await this.sendTextMessage(from, botResponse.response);
      }
      
      if (result.success) {
        logger.info(`Advanced response sent successfully to ${name} (+${from})`);
        logger.info(`Session state: ${botResponse.sessionState}`);
        
        return {
          success: true,
          message: 'Advanced car rental response sent successfully',
          messageId: result.messageId,
          sessionState: botResponse.sessionState,
          messageType: botResponse.messageType
        };
      } else {
        logger.error(`Failed to send response to ${name} (+${from}):`, result.error);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      logger.error('Error processing incoming WhatsApp message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract message data from WhatsApp webhook payload
   */
  extractMessageData(webhookPayload) {
    try {
      if (webhookPayload.entry && webhookPayload.entry.length > 0) {
        const entry = webhookPayload.entry[0];
        if (entry.changes && entry.changes.length > 0) {
          const change = entry.changes[0];
          if (change.value && change.value.messages && change.value.messages.length > 0) {
            const message = change.value.messages[0];
            const contact = change.value.contacts ? change.value.contacts[0] : null;
            
            let messageText = '';
            let messageType = message.type;
            
            // Extract message content based on type
            if (message.text) {
              messageText = message.text.body;
            } else if (message.interactive) {
              if (message.interactive.button_reply) {
                messageText = message.interactive.button_reply.title;
                messageType = 'button_reply';
              } else if (message.interactive.list_reply) {
                messageText = message.interactive.list_reply.title;
                messageType = 'list_reply';
              }
            } else {
              messageText = `[${message.type} message]`;
            }
            
            return {
              from: message.from,
              message: messageText,
              messageId: message.id,
              timestamp: message.timestamp,
              name: contact ? contact.profile.name : 'Customer',
              messageType: messageType
            };
          }
        }
      }
      return null;
    } catch (error) {
      logger.error('Error extracting message data:', error);
      return null;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      configured: !!(this.accessToken && this.phoneNumberId),
      phone_number_id: this.phoneNumberId,
      has_access_token: !!this.accessToken,
      advanced_bot: true,
      features: [
        'Car catalog browsing',
        'Interactive buttons',
        'Booking management',
        'Session tracking',
        'Smart responses'
      ]
    };
  }
}

module.exports = new WhatsAppResponseService();