const axios = require('axios');
const logger = require('../utils/logger');

class BriqNotificationService {
  constructor() {
    this.apiKey = process.env.BRIQ_API_KEY;
    // Using production base URL for both SMS and Voice
    this.apiUrl = 'https://karibu.briq.tz';
    this.senderId = process.env.BRIQ_SENDER_ID || 'BRIQ';
    
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
        `${this.apiUrl}/v1/message/send-instant`,
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
   * Uses production HTTPS endpoint
   */
  async sendVoiceCall(phoneNumber, message) {
    try {
      logger.info(`[Briq] Sending voice call to ${phoneNumber}`);
      
      // Format phone number (remove + for Briq Voice API - E.164 or national format)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
      
      logger.info(`[Briq] Voice call - Original: ${phoneNumber}, Formatted: ${formattedPhone}`);
      logger.info(`[Briq] Voice call - Message length: ${message.length} chars`);
      logger.info(`[Briq] Voice call - Message preview: ${message.substring(0, 100)}...`);
      
      // Use production HTTPS endpoint
      const response = await axios.post(
        `${this.apiUrl}/v1/voice/calls/tts`,
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
        `${this.apiUrl}/v1/message/send-instant`,
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
    // Log booking data for debugging
    logger.info(`[Briq] Booking data received: ${JSON.stringify({
      id: booking.id,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      carName: booking.carName,
      totalAmount: booking.totalAmount
    })}`);

    const { customerName, customerPhone, carName, pickupDate, returnDate, totalAmount } = booking;

    // Validate required fields
    if (!customerPhone) {
      logger.error(`[Briq] Missing customerPhone in booking ${booking.id}`);
      throw new Error('Customer phone number is required for notifications');
    }

    if (!customerName || !carName || !totalAmount) {
      logger.error(`[Briq] Missing required booking data: name=${customerName}, car=${carName}, amount=${totalAmount}`);
      throw new Error('Missing required booking information');
    }

    // Format phone number (ensure it starts with +255)
    const formattedPhone = customerPhone.startsWith('+') ? customerPhone : `+${customerPhone}`;
    
    logger.info(`[Briq] Formatted phone for notifications: ${formattedPhone}`);

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
