const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Snippe Payment Service
 * Handles payment processing via Snippe API
 * Documentation: https://docs.snippe.sh/docs/2026-01-25/
 */
class SnippePaymentService {
  constructor() {
    this.apiKey = process.env.SNIPPE_API_KEY;
    this.baseUrl = process.env.SNIPPE_API_URL || 'https://api.snippe.sh';
    this.webhookSecret = process.env.SNIPPE_WEBHOOK_SECRET;
    this.enabled = !!this.apiKey;
    
    if (!this.enabled) {
      logger.warn('Snippe Payment Service not configured - missing API key');
    }
  }

  /**
   * Create a payment request
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment response
   */
  async createPayment(paymentData) {
    try {
      if (!this.enabled) {
        logger.warn('Snippe Payment Service not enabled');
        return { success: false, error: 'Service not configured' };
      }

      const {
        amount,
        currency = 'TZS',
        phoneNumber,
        reference,
        description,
        customerName,
        customerEmail
      } = paymentData;

      // Validate required fields
      if (!amount || !phoneNumber || !reference) {
        return {
          success: false,
          error: 'Missing required payment fields'
        };
      }

      // Create payment payload
      const payload = {
        details: {
          amount: parseFloat(amount),
          currency: currency,
          description: description || `Car Rental Payment - ${reference}`
        },
        type: 'mobile', // mobile money payment
        phone_number: phoneNumber,
        reference: reference,
        customer: {
          firstname: customerName.split(' ')[0] || 'Customer',
          lastname: customerName.split(' ').slice(1).join(' ') || 'Name',
          email: customerEmail || `${phoneNumber}@carrentalpro.com`,
          phone: phoneNumber
        },
        callback_url: `${process.env.APP_URL}/webhook/snippe/payment`,
        metadata: {
          booking_id: reference,
          service: 'car_rental'
        }
      };

      logger.info(`Creating Snippe payment for ${phoneNumber}:`, {
        amount,
        reference
      });

      const response = await axios.post(
        `${this.baseUrl}/v1/payments`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `${reference}-${Date.now()}`
          }
        }
      );

      logger.info(`Snippe payment created successfully:`, response.data);

      return {
        success: true,
        paymentId: response.data.data.reference,
        status: response.data.data.status,
        reference: response.data.data.reference,
        amount: response.data.data.amount.value,
        currency: response.data.data.amount.currency,
        phoneNumber: phoneNumber,
        expiresAt: response.data.data.expires_at,
        data: response.data.data
      };

    } catch (error) {
      logger.error('Error creating Snippe payment:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.error_code
      };
    }
  }

  /**
   * Check payment status
   * @param {string} paymentId - Payment ID from Snippe
   * @returns {Promise<Object>} Payment status
   */
  async checkPaymentStatus(paymentId) {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Service not configured' };
      }

      const response = await axios.get(
        `${this.baseUrl}/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Payment status for ${paymentId}:`, response.data.data.status);

      return {
        success: true,
        status: response.data.data.status,
        amount: response.data.data.amount.value,
        currency: response.data.data.amount.currency,
        reference: response.data.data.reference,
        data: response.data.data
      };

    } catch (error) {
      logger.error('Error checking payment status:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Webhook signature from X-Webhook-Signature header
   * @param {string} payload - Raw webhook payload as string
   * @returns {boolean} Is signature valid
   */
  verifyWebhookSignature(signature, payload) {
    try {
      if (!this.webhookSecret) {
        logger.warn('Webhook secret not configured');
        return false;
      }

      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      // Use timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook notification
   * @param {Object} webhookData - Webhook payload
   * @returns {Object} Processed webhook data
   */
  processWebhook(webhookData) {
    try {
      const { id, type, data, created_at } = webhookData;

      logger.info(`Processing Snippe webhook - Event: ${type}, ID: ${id}`);

      // Extract payment/payout data
      const {
        reference,
        external_reference,
        status,
        amount,
        settlement,
        channel,
        customer,
        metadata,
        completed_at,
        failure_reason
      } = data;

      return {
        success: true,
        eventId: id,
        eventType: type,
        reference: reference,
        externalReference: external_reference,
        status: status,
        amount: amount.value,
        currency: amount.currency,
        settlement: settlement,
        channel: channel,
        customer: customer,
        metadata: metadata,
        completedAt: completed_at,
        failureReason: failure_reason,
        createdAt: created_at
      };

    } catch (error) {
      logger.error('Error processing webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a payment session (hosted checkout)
   * @param {Object} sessionData - Session details
   * @returns {Promise<Object>} Session response
   */
  async createPaymentSession(sessionData) {
    try {
      if (!this.enabled) {
        return { success: false, error: 'Service not configured' };
      }

      const {
        amount,
        currency = 'TZS',
        reference,
        description,
        customerName,
        customerEmail,
        successUrl,
        cancelUrl
      } = sessionData;

      const payload = {
        amount: parseFloat(amount),
        currency: currency,
        reference: reference,
        description: description || `Car Rental Payment - ${reference}`,
        customer: {
          name: customerName,
          email: customerEmail
        },
        success_url: successUrl || `${process.env.APP_URL}/payment/success`,
        cancel_url: cancelUrl || `${process.env.APP_URL}/payment/cancel`,
        metadata: {
          booking_id: reference,
          service: 'car_rental'
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/v1/sessions`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `session-${reference}-${Date.now()}`
          }
        }
      );

      logger.info(`Payment session created:`, response.data);

      return {
        success: true,
        sessionId: response.data.data.id,
        checkoutUrl: response.data.data.checkout_url,
        reference: response.data.data.reference,
        data: response.data.data
      };

    } catch (error) {
      logger.error('Error creating payment session:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      configured: !!this.apiKey,
      hasWebhookSecret: !!this.webhookSecret,
      baseUrl: this.baseUrl,
      features: [
        'Mobile money payments',
        'Card payments',
        'Payment sessions',
        'Webhook notifications',
        'Payment status tracking'
      ]
    };
  }
}

module.exports = new SnippePaymentService();
