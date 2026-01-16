const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Simple authentication middleware
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const [username, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
    .toString()
    .split(':');

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
};

/**
 * Get dashboard statistics
 */
router.get('/stats', authenticate, (req, res) => {
  try {
    const stats = {};

    // Total orders
    db.get('SELECT COUNT(*) as total FROM orders', (err, result) => {
      if (err) throw err;
      stats.totalOrders = result.total;

      // Completed orders
      db.get(
        'SELECT COUNT(*) as total FROM orders WHERE status = ?',
        ['completed'],
        (err, result) => {
          if (err) throw err;
          stats.completedOrders = result.total;

          // Total revenue
          db.get(
            'SELECT SUM(total_amount) as revenue FROM orders WHERE payment_status = ?',
            ['paid'],
            (err, result) => {
              if (err) throw err;
              stats.totalRevenue = result.revenue || 0;

              // Total customers
              db.get('SELECT COUNT(*) as total FROM customers', (err, result) => {
                if (err) throw err;
                stats.totalCustomers = result.total;

                // Pending orders
                db.get(
                  'SELECT COUNT(*) as total FROM orders WHERE status = ?',
                  ['pending'],
                  (err, result) => {
                    if (err) throw err;
                    stats.pendingOrders = result.total;

                    res.json({
                      success: true,
                      data: stats
                    });
                  }
                );
              });
            }
          );
        }
      );
    });
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

/**
 * Get recent orders
 */
router.get('/orders/recent', authenticate, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    db.all(
      `SELECT o.*, c.phone_number, c.name as customer_name 
       FROM orders o 
       JOIN customers c ON o.customer_id = c.id 
       ORDER BY o.created_at DESC 
       LIMIT ?`,
      [limit],
      (err, orders) => {
        if (err) {
          logger.error('Error getting recent orders:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to get orders'
          });
        }

        res.json({
          success: true,
          data: orders
        });
      }
    );
  } catch (error) {
    logger.error('Error getting recent orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent orders',
      error: error.message
    });
  }
});

/**
 * Get customers list
 */
router.get('/customers', authenticate, (req, res) => {
  try {
    db.all(
      `SELECT c.*, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent
       FROM customers c
       LEFT JOIN orders o ON c.id = o.customer_id
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      (err, customers) => {
        if (err) {
          logger.error('Error getting customers:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to get customers'
          });
        }

        res.json({
          success: true,
          data: customers
        });
      }
    );
  } catch (error) {
    logger.error('Error getting customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customers',
      error: error.message
    });
  }
});

module.exports = router;
