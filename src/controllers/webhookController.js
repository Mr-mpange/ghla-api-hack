const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

/**
 * Handle order.created webhook event
 */
const handleOrderCreated = async (eventData) => {
  try {
    logger.info('Order created event received:', eventData);
    
    // Log the order creation
    // Additional logic can be added here if needed
    
    return { success: true, message: 'Order created event processed' };
  } catch (error) {
    logger.error('Error handling order.created event:', error);
    throw error;
  }
};

/**
 * Handle payment.success webhook event
 */
const handlePaymentSuccess = async (eventData) => {
  try {
    logger.info('Payment success event received:', eventData);
    
    const { order_id, transaction_reference } = eventData;
    
    // Process successful payment
    await paymentService.handlePaymentSuccess(order_id, transaction_reference);
    
    return { success: true, message: 'Payment success event processed' };
  } catch (error) {
    logger.error('Error handling payment.success event:', error);
    throw error;
  }
};

/**
 * Handle payment.failed webhook event
 */
const handlePaymentFailed = async (eventData) => {
  try {
    logger.info('Payment failed event received:', eventData);
    
    const { order_id, failure_reason } = eventData;
    
    // Process failed payment
    await paymentService.handlePaymentFailure(order_id, failure_reason);
    
    return { success: true, message: 'Payment failed event processed' };
  } catch (error) {
    logger.error('Error handling payment.failed event:', error);
    throw error;
  }
};

/**
 * Main webhook event router
 */
const handleWebhookEvent = async (eventType, eventData) => {
  switch (eventType) {
    case 'order.created':
      return await handleOrderCreated(eventData);
    
    case 'payment.success':
      return await handlePaymentSuccess(eventData);
    
    case 'payment.failed':
      return await handlePaymentFailed(eventData);
    
    default:
      logger.warn(`Unhandled webhook event type: ${eventType}`);
      return { success: false, message: 'Unhandled event type' };
  }
};

module.exports = {
  handleWebhookEvent,
  handleOrderCreated,
  handlePaymentSuccess,
  handlePaymentFailed
};
