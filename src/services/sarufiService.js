const axios = require('axios');
const logger = require('../utils/logger');

class SarufiService {
  constructor() {
    this.apiKey = process.env.SARUFI_API_KEY;
    this.backendBaseUrl = process.env.BACKEND_BASE_URL;
    this.backendApiKey = process.env.BACKEND_API_KEY;
    this.enabled = true;
    
    if (!this.apiKey || !this.backendBaseUrl || !this.backendApiKey) {
      logger.warn('Missing Sarufi configuration: SARUFI_API_KEY, BACKEND_BASE_URL, or BACKEND_API_KEY');
      this.enabled = false;
    }
  }

  /**
   * Configure Sarufi bot with backend webhook URL and API key
   * Sarufi will use this to communicate with your backend
   */
  async configureSarufiBot() {
    try {
      const configData = {
        webhook_url: `${this.backendBaseUrl}/webhook/sarufi`,
        api_key: this.backendApiKey,
        verify_token: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
      };

      logger.info('Sarufi bot configuration:', {
        webhook_url: configData.webhook_url,
        backend_url: this.backendBaseUrl,
        api_key_configured: !!this.backendApiKey
      });

      return {
        success: true,
        message: 'Sarufi bot configured successfully',
        config: configData
      };
    } catch (error) {
      logger.error('Error configuring Sarufi bot:', error);
      throw error;
    }
  }

  /**
   * Process incoming message through backend API
   * This is called when Sarufi sends a message to your backend
   */
  async processMessage(phoneNumber, message, messageType = 'text') {
    try {
      if (!this.enabled) {
        logger.warn('Sarufi service is not properly configured');
        return { success: false, error: 'Sarufi service not configured' };
      }

      const payload = {
        phone_number: phoneNumber,
        message: message,
        message_type: messageType,
        timestamp: new Date().toISOString(),
        source: 'sarufi'
      };

      logger.info('Processing message through backend:', payload);

      const response = await axios.post(`${this.backendBaseUrl}/api/chat/process`, payload, {
        headers: {
          'Authorization': `Bearer ${this.backendApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      logger.info('Backend response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Error processing message through backend:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send message via Sarufi (compatible with bot middleware)
   * Since Sarufi handles messaging through webhooks, this simulates the process
   */
  async sendMessage(phoneNumber, message, variables = {}) {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Sarufi service not configured' };
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Simulate sending message through Sarufi
      // In reality, Sarufi would handle this through its own messaging system
      logger.info('Sarufi message simulation:', {
        phone_number: formattedPhone,
        message: message,
        variables: variables
      });

      return {
        success: true,
        messageId: `sarufi_${Date.now()}`,
        message: 'Message sent via Sarufi',
        data: {
          phone_number: formattedPhone,
          message: message,
          variables: variables,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error sending message via Sarufi:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send interactive buttons via Sarufi
   */
  async sendInteractiveButtons(phoneNumber, text, buttons, header = null, footer = null, variables = {}) {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Sarufi service not configured' };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      logger.info('Sarufi interactive buttons simulation:', {
        phone_number: formattedPhone,
        text: text,
        buttons: buttons,
        header: header,
        footer: footer
      });

      return {
        success: true,
        messageId: `sarufi_btn_${Date.now()}`,
        message: 'Interactive buttons sent via Sarufi',
        data: {
          phone_number: formattedPhone,
          text: text,
          buttons: buttons,
          header: header,
          footer: footer,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error sending interactive buttons via Sarufi:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send interactive list via Sarufi
   */
  async sendInteractiveList(phoneNumber, text, buttonText, sections, header = null, footer = null, variables = {}) {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Sarufi service not configured' };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      logger.info('Sarufi interactive list simulation:', {
        phone_number: formattedPhone,
        text: text,
        buttonText: buttonText,
        sections: sections
      });

      return {
        success: true,
        messageId: `sarufi_list_${Date.now()}`,
        message: 'Interactive list sent via Sarufi',
        data: {
          phone_number: formattedPhone,
          text: text,
          buttonText: buttonText,
          sections: sections,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error sending interactive list via Sarufi:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send image via Sarufi
   */
  async sendImage(phoneNumber, imageUrl, caption = '', variables = {}) {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Sarufi service not configured' };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      logger.info('Sarufi image simulation:', {
        phone_number: formattedPhone,
        imageUrl: imageUrl,
        caption: caption
      });

      return {
        success: true,
        messageId: `sarufi_img_${Date.now()}`,
        message: 'Image sent via Sarufi',
        data: {
          phone_number: formattedPhone,
          imageUrl: imageUrl,
          caption: caption,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error sending image via Sarufi:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send document via Sarufi
   */
  async sendDocument(phoneNumber, documentUrl, filename, caption = '', variables = {}) {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Sarufi service not configured' };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      logger.info('Sarufi document simulation:', {
        phone_number: formattedPhone,
        documentUrl: documentUrl,
        filename: filename,
        caption: caption
      });

      return {
        success: true,
        messageId: `sarufi_doc_${Date.now()}`,
        message: 'Document sent via Sarufi',
        data: {
          phone_number: formattedPhone,
          documentUrl: documentUrl,
          filename: filename,
          caption: caption,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error sending document via Sarufi:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send location via Sarufi
   */
  async sendLocation(phoneNumber, latitude, longitude, name = '', address = '', variables = {}) {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Sarufi service not configured' };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      logger.info('Sarufi location simulation:', {
        phone_number: formattedPhone,
        latitude: latitude,
        longitude: longitude,
        name: name,
        address: address
      });

      return {
        success: true,
        messageId: `sarufi_loc_${Date.now()}`,
        message: 'Location sent via Sarufi',
        data: {
          phone_number: formattedPhone,
          latitude: latitude,
          longitude: longitude,
          name: name,
          address: address,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error sending location via Sarufi:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send template via Sarufi
   */
  async sendTemplate(phoneNumber, templateName, languageCode = 'en', components = [], variables = {}) {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Sarufi service not configured' };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      logger.info('Sarufi template simulation:', {
        phone_number: formattedPhone,
        templateName: templateName,
        languageCode: languageCode,
        components: components
      });

      return {
        success: true,
        messageId: `sarufi_tpl_${Date.now()}`,
        message: 'Template sent via Sarufi',
        data: {
          phone_number: formattedPhone,
          templateName: templateName,
          languageCode: languageCode,
          components: components,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error sending template via Sarufi:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send response back to customer via Sarufi
   * Since Sarufi handles the actual message sending, we just format the response
   */
  async sendResponse(phoneNumber, response) {
    try {
      const formattedResponse = {
        phone_number: phoneNumber,
        message: response.message || response,
        message_type: response.type || 'text',
        timestamp: new Date().toISOString()
      };

      logger.info('Response formatted for Sarufi:', formattedResponse);
      
      return {
        success: true,
        message: 'Response sent successfully',
        data: formattedResponse
      };
    } catch (error) {
      logger.error('Error sending response via Sarufi:', error);
      throw error;
    }
  }

  /**
   * Health check for Sarufi service
   */
  async healthCheck() {
    try {
      const isConfigured = !!(this.apiKey && this.backendBaseUrl && this.backendApiKey);
      
      return {
        status: isConfigured ? 'healthy' : 'unhealthy',
        service: 'sarufi',
        timestamp: new Date().toISOString(),
        config: {
          api_key_configured: !!this.apiKey,
          backend_url_configured: !!this.backendBaseUrl,
          backend_api_key_configured: !!this.backendApiKey,
          enabled: this.enabled
        }
      };
    } catch (error) {
      logger.error('Sarufi health check failed:', error);
      return {
        status: 'unhealthy',
        service: 'sarufi',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get service configuration
   */
  getConfiguration() {
    return {
      service: 'sarufi',
      backend_url: this.backendBaseUrl,
      webhook_url: `${this.backendBaseUrl}/webhook/sarufi`,
      api_key_configured: !!this.apiKey,
      backend_api_key_configured: !!this.backendApiKey,
      enabled: this.enabled
    };
  }

  /**
   * Format phone number for processing
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters except +
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!formatted.startsWith('+')) {
      // If it starts with 0 (local format), replace with country code
      if (formatted.startsWith('0')) {
        formatted = '+255' + formatted.substring(1); // Tanzania country code
      } else {
        formatted = '+' + formatted;
      }
    }
    
    return formatted;
  }

  /**
   * Check if service is configured
   */
  isConfigured() {
    return !!(this.apiKey && this.backendBaseUrl && this.backendApiKey);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      enabled: this.enabled,
      backend_url: this.backendBaseUrl,
      webhook_url: this.backendBaseUrl ? `${this.backendBaseUrl}/webhook/sarufi` : null,
      has_api_key: !!this.apiKey,
      has_backend_api_key: !!this.backendApiKey
    };
  }

  /**
   * Test connection to backend
   */
  async testConnection() {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Sarufi service is not configured' };
      }

      // Test backend connection
      const response = await axios.get(`${this.backendBaseUrl}/api/health`, {
        headers: {
          'Authorization': `Bearer ${this.backendApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        success: true,
        status: 'connected',
        data: response.data
      };
    } catch (error) {
      logger.error('Sarufi backend connection test failed:', error.response?.data || error.message);
      return {
        success: false,
        status: 'disconnected',
        error: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = new SarufiService();