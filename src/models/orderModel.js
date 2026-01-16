const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('crypto');

/**
 * Create a new order
 */
const createOrder = (orderData) => {
  return new Promise((resolve, reject) => {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const {
      customerId,
      productId,
      productName,
      quantity,
      unitPrice,
      totalAmount,
      currency = 'KES',
      deliveryAddress = null
    } = orderData;

    db.run(
      `INSERT INTO orders (
        id, customer_id, product_id, product_name, quantity, 
        unit_price, total_amount, currency, delivery_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, customerId, productId, productName, quantity, unitPrice, totalAmount, currency, deliveryAddress],
      function(err) {
        if (err) {
          logger.error('Error creating order:', err);
          return reject(err);
        }

        resolve({
          id: orderId,
          ...orderData
        });
      }
    );
  });
};

/**
 * Get order by ID
 */
const getOrderById = (orderId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT o.*, c.phone_number, c.name as customer_name 
       FROM orders o 
       JOIN customers c ON o.customer_id = c.id 
       WHERE o.id = ?`,
      [orderId],
      (err, order) => {
        if (err) {
          logger.error('Error getting order:', err);
          return reject(err);
        }
        resolve(order);
      }
    );
  });
};

/**
 * Update order status
 */
const updateOrderStatus = (orderId, status, paymentStatus = null) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params = [status];

    if (paymentStatus) {
      query += ', payment_status = ?';
      params.push(paymentStatus);
    }

    query += ' WHERE id = ?';
    params.push(orderId);

    db.run(query, params, (err) => {
      if (err) {
        logger.error('Error updating order:', err);
        return reject(err);
      }
      resolve();
    });
  });
};

/**
 * Update order with Ghala order ID
 */
const updateOrderGhalaId = (orderId, ghalaOrderId, paymentMethod) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE orders SET ghala_order_id = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [ghalaOrderId, paymentMethod, orderId],
      (err) => {
        if (err) {
          logger.error('Error updating order Ghala ID:', err);
          return reject(err);
        }
        resolve();
      }
    );
  });
};

/**
 * Get all orders with pagination
 */
const getAllOrders = (limit = 50, offset = 0) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT o.*, c.phone_number, c.name as customer_name 
       FROM orders o 
       JOIN customers c ON o.customer_id = c.id 
       ORDER BY o.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, orders) => {
        if (err) {
          logger.error('Error getting orders:', err);
          return reject(err);
        }
        resolve(orders);
      }
    );
  });
};

/**
 * Get orders by customer ID
 */
const getOrdersByCustomer = (customerId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId],
      (err, orders) => {
        if (err) {
          logger.error('Error getting customer orders:', err);
          return reject(err);
        }
        resolve(orders);
      }
    );
  });
};

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
  updateOrderGhalaId,
  getAllOrders,
  getOrdersByCustomer
};
