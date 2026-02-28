const axios = require('axios');
const https = require('https');
const logger = require('../utils/logger');

class BriqNotificationService {
  constructor() {
    this.apiKey = process.env.BRIQ_API_KEY;
    // Hardcoded base URLs for different Briq services
    this.smsApiUrl = 'https://karibu.briq.tz';  // SMS uses production HTTPS
    this.voiceApiUrl = 'http://pre-release.karibu.briq.tz';  // Voice uses pre-release HTTP (SSL issues)
    this.senderId = process.env.BRIQ_SENDER_ID || 'BRIQ';
    
    // Create HTTPS agent that ignores SSL errors for pre-release
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
    
    // Validate configuration
    if (!this.apiKey) {
      logger.warn('[Briq] API key not configured. Notifications will be disabled.');
    }
  }

  /**
   * Send SMS notification via Briq
   */
  async sendSMS(phoneNumber, message) {
    try {
      logger.info(`[Briq] Sending SMS to ${phoneNumber}`);
      
      const response = await axios.post(
        `${this.smsApiUrl}/v1/message/send-instant`,
        {
          content: message,
          recipients: [phoneNumber],
          sender_id: this.senderId
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`[Briq] SMS sent successfully: ${JSON.stringify(response.data)}`);
      return {
        success: true,
        messageId: response.data.job_id || response.data.message_id,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      logger.error(`[Briq] SMS send failed: ${error.message}`);
      if (error.response) {
        logger.error(`[Briq] Response data: ${JSON.stringify(error.response.data)}`);
      }
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Send Voice call notification via Briq Voice API (TTS)
   * Uses HTTP (non-secure) because pre-release has SSL issues
   */
  async sendVoiceCall(phoneNumber, message) {
    try {
      logger.info(`[Briq] Sending voice call to ${phoneNumber}`);
      
      // Format phone number (remove + for Briq Voice API - E.164 or national format)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
      
      // Use HTTP (non-secure) for voice API due to SSL issues on pre-release
      const response = await axios.post(
        `${this.voiceApiUrl}/v1/voice/calls/tts`,
        {
          receiver_number: formattedPhone,
          text: message
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`[Briq] Voice call initiated: ${JSON.stringify(response.data)}`);
      return {
        success: true,
        messageId: response.data.call_log_id || response.data.infobip_call_id,
        status: response.data.status || 'initiated',
        data: response.data
      };
    } catch (error) {
      logger.error(`[Briq] Voice call failed: ${error.message}`);
      if (error.response) {
        logger.error(`[Briq] Response data: ${JSON.stringify(error.response.data)}`);
      }
      
      // Fallback to SMS if voice fails
      logger.warn(`[Briq] Voice call failed, using SMS fallback`);
      return await this.sendSMS(phoneNumber, message);
    }
  }

  /**
   * Send WhatsApp message via Briq
   * Note: Briq may send as SMS if WhatsApp is not enabled for your account
   * Contact Briq support to enable WhatsApp messaging
   */
  async sendWhatsAppMessage(phoneNumber, message) {
    try {
      logger.info(`[Briq] Sending WhatsApp message to ${phoneNumber}`);
      logger.warn(`[Briq] WhatsApp may be sent as SMS if not enabled on your account`);
      
      // Try with channel parameter (Briq accepts it but may send as SMS)
      const response = await axios.post(
        `${this.smsApiUrl}/v1/message/send-instant`,
        {
          content: message,
          recipients: [phoneNumber],
          sender_id: this.senderId,
          channel: 'whatsapp'
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`[Briq] WhatsApp message sent: ${JSON.stringify(response.data)}`);
      return {
        success: true,
        messageId: response.data.job_id || response.data.message_id,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      logger.error(`[Briq] WhatsApp send failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send all notifications (SMS, Voice, WhatsApp) for payment confirmation
   */
  async sendPaymentConfirmationNotifications(booking) {
    const { customerName, customerPhone, carName, pickupDate, returnDate, totalAmount } = booking;

    // Format phone number (ensure it starts with +255)
    const formattedPhone = customerPhone.startsWith('+') ? customerPhone : `+${customerPhone}`;

    // Create congratulations messages
    const smsMessage = `Congratulations ${customerName}! Your ${carName} booking is confirmed. Pickup: ${pickupDate}. Total: TZS ${totalAmount.toLocaleString()}. Your car will arrive soon. Thank you for choosing CarRental Pro!`;

    const voiceMessage = `Hello ${customerName}. Congratulations! Your booking for ${carName} has been confirmed successfully. Pickup date is ${pickupDate}. Total amount paid is ${totalAmount} Tanzanian Shillings. Your car will arrive soon as possible. Thank you for choosing CarRental Pro.`;

    const whatsappMessage = `🎉 Congratulations ${customerName}!\n\n✅ Your booking is confirmed!\n\n🚗 Car: ${carName}\n📅 Pickup: ${pickupDate}\n📅 Return: ${returnDate}\n💰 Total Paid: TZS ${totalAmount.toLocaleString()}\n\n🚚 Your car will arrive soon as possible!\n\nThank you for choosing CarRental Pro! 🙏`;

    const results = {
      sms: null,
      voice: null,
      whatsapp: null
    };

    // Send SMS
    try {
      results.sms = await this.sendSMS(formattedPhone, smsMessage);
      logger.info(`[Briq] SMS notification result: ${JSON.stringify(results.sms)}`);
    } catch (error) {
      logger.error(`[Briq] SMS notification error: ${error.message}`);
    }

    // Send Voice Call
    try {
      results.voice = await this.sendVoiceCall(formattedPhone, voiceMessage);
      logger.info(`[Briq] Voice notification result: ${JSON.stringify(results.voice)}`);
    } catch (error) {
      logger.error(`[Briq] Voice notification error: ${error.message}`);
    }

    // Send WhatsApp
    try {
      results.whatsapp = await this.sendWhatsAppMessage(formattedPhone, whatsappMessage);
      logger.info(`[Briq] WhatsApp notification result: ${JSON.stringify(results.whatsapp)}`);
    } catch (error) {
      logger.error(`[Briq] WhatsApp notification error: ${error.message}`);
    }

    return results;
  }
}

module.exports = new BriqNotificationService();
