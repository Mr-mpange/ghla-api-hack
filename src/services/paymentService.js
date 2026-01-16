const ghalaService = require('./ghalaService');
const orderModel = require('../models/orderModel');
const whatsappService = require('./whatsappService');
const logger = require('../utils/logger');
const db = require('../config/database');

/**
 * Initiate payment for an order
 */
const initiatePayment = async (orderId, paymentMethod, customerPhone) => {
  try {
    const order = await orderModel.getOrderById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Create payment order in Ghala
    const ghalaOrder = await ghalaService.createPaymentOrder({
      orderId: order.id,
      amount: order.total_amount,
      currency: order.currency,
      customerPhone: customerPhone,
      paymentMethod: paymentMethod,
      description: `Payment for ${order.product_name} x${order.quantity}`
    });

    // Update order with Ghala order ID
    await orderModel.updateOrderGhalaId(order.id, ghalaOrder.id, paymentMethod);

    // Record payment in database
    await createPaymentRecord({
      orderId: order.id,
      ghalaPaymentId: ghalaOrder.id,
      amount: order.total_amount,
      currency: order.currency,
      paymentMethod: paymentMethod
    });

    // Send order confirmation
    await whatsappService.sendOrderConfirmation(customerPhone, order);

    logger.info(`Payment initiated for order ${orderId}`);
    return ghalaOrder;
  } catch (error) {
    logger.error('Error initiating payment:', error);
    throw error;
  }
};

/**
 * Create payment record in database
 */
const createPaymentRecord = (paymentData) => {
  return new Promise((resolve, reject) => {
    const { orderId, ghalaPaymentId, amount, currency, paymentMethod } = paymentData;

    db.run(
      `INSERT INTO payments (order_id, ghala_payment_id, amount, currency, payment_method)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, ghalaPaymentId, amount, currency, paymentMethod],
      function(err) {
        if (err) {
          logger.error('Error creating payment record:', err);
          return reject(err);
        }
        resolve({ id: this.lastID });
      }
    );
  });
};

/**
 * Update payment status
 */
const updatePaymentStatus = (ghalaPaymentId, status, transactionRef = null) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params = [status];

    if (transactionRef) {
      query += ', transaction_ref = ?';
      params.push(transactionRef);
    }

    query += ' WHERE ghala_payment_id = ?';
    params.push(ghalaPaymentId);

    db.run(query, params, (err) => {
      if (err) {
        logger.error('Error updating payment status:', err);
        return reject(err);
      }
      resolve();
    });
  });
};

/**
 * Get payment by Ghala payment ID
 */
const getPaymentByGhalaId = (ghalaPaymentId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM payments WHERE ghala_payment_id = ?',
      [ghalaPaymentId],
      (err, payment) => {
        if (err) {
          logger.error('Error getting payment:', err);
          return reject(err);
        }
        resolve(payment);
      }
    );
  });
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (ghalaPaymentId, transactionRef) => {
  try {
    // Update payment status
    await updatePaymentStatus(ghalaPaymentId, 'success', transactionRef);

    // Get payment and order details
    const payment = await getPaymentByGhalaId(ghalaPaymentId);
    const order = await orderModel.getOrderById(payment.order_id);

    // Update order status
    await orderModel.updateOrderStatus(order.id, 'completed', 'paid');

    // Send receipt to customer
    await whatsappService.sendPaymentReceipt(
      order.phone_number,
      order,
      transactionRef
    );

    logger.info(`Payment successful for order ${order.id}`);
    return { success: true, order };
  } catch (error) {
    logger.error('Error handling payment success:', error);
    throw error;
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailure = async (ghalaPaymentId, reason = null) => {
  try {
    // Update payment status
    await updatePaymentStatus(ghalaPaymentId, 'failed');

    // Get payment and order details
    const payment = await getPaymentByGhalaId(ghalaPaymentId);
    const order = await orderModel.getOrderById(payment.order_id);

    // Update order status
    await orderModel.updateOrderStatus(order.id, 'payment_failed', 'failed');

    // Send failure notification to customer
    await whatsappService.sendPaymentFailure(
      order.phone_number,
      order.id,
      reason
    );

    logger.info(`Payment failed for order ${order.id}`);
    return { success: false, order };
  } catch (error) {
    logger.error('Error handling payment failure:', error);
    throw error;
  }
};

module.exports = {
  initiatePayment,
  createPaymentRecord,
  updatePaymentStatus,
  getPaymentByGhalaId,
  handlePaymentSuccess,
  handlePaymentFailure
};
