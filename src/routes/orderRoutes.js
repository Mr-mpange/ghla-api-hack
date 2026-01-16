const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

/**
 * Create a new order
 * POST /api/orders
 */
router.post('/', orderController.createOrder);

/**
 * Get all orders
 * GET /api/orders
 */
router.get('/', orderController.getAllOrders);

/**
 * Get order by ID
 * GET /api/orders/:orderId
 */
router.get('/:orderId', orderController.getOrder);

/**
 * Process payment for an order
 * POST /api/orders/:orderId/payment
 */
router.post('/:orderId/payment', orderController.processPayment);

module.exports = router;
