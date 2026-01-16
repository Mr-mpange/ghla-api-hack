const axios = require('axios');
const logger = require('../utils/logger');

const GHALA_API_URL = process.env.GHALA_API_URL || 'https://api.ghala.io/v1';
const GHALA_API_KEY = process.env.GHALA_API_KEY;

/**
 * Ghala API client
 */
const ghalaClient = axios.create({
  baseURL: GHALA_API_URL,
  headers: {
    'Authorization': `Bearer ${GHALA_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Create a payment order in Ghala
 * Supports M-Pesa, Airtel Money, and Card payments
 */
const createPaymentOrder = async (orderData) => {
  try {
    const { orderId, amount, currency, customerPhone, paymentMethod, description } = orderData;

    const response = await ghalaClient.post('/orders', {
      external_id: orderId,
      amount: amount,
      currency: currency || 'KES',
      customer: {
        phone: customerPhone
      },
      payment_method: paymentMethod, // 'mpesa', 'airtel', 'card'
      description: description || 'Product purchase',
      callback_url: `${process.env.APP_URL || 'https://your-domain.com'}/api/webhooks/ghala`
    });

    logger.info('Ghala order created:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error creating Ghala order:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get payment status from Ghala
 */
const getPaymentStatus = async (ghalaOrderId) => {
  try {
    const response = await ghalaClient.get(`/orders/${ghalaOrderId}`);
    return response.data;
  } catch (error) {
    logger.error('Error getting payment status:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send WhatsApp message via Ghala
 */
const sendWhatsAppMessage = async (to, message) => {
  try {
    const response = await ghalaClient.post('/whatsapp/messages', {
      to: to,
      type: 'text',
      text: {
        body: message
      }
    });

    logger.info('WhatsApp message sent:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send WhatsApp interactive buttons
 */
const sendInteractiveButtons = async (to, bodyText, buttons) => {
  try {
    const response = await ghalaClient.post('/whatsapp/messages', {
      to: to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map((btn, index) => ({
            type: 'reply',
            reply: {
              id: btn.id || `btn_${index}`,
              title: btn.title
            }
          }))
        }
      }
    });

    logger.info('Interactive buttons sent:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error sending interactive buttons:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send WhatsApp interactive list
 */
const sendInteractiveList = async (to, bodyText, buttonText, sections) => {
  try {
    const response = await ghalaClient.post('/whatsapp/messages', {
      to: to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: bodyText
        },
        action: {
          button: buttonText,
          sections: sections
        }
      }
    });

    logger.info('Interactive list sent:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error sending interactive list:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  createPaymentOrder,
  getPaymentStatus,
  sendWhatsAppMessage,
  sendInteractiveButtons,
  sendInteractiveList
};
