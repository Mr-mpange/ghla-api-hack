const orderModel = require('../models/orderModel');
const customerModel = require('../models/customerModel');
const paymentService = require('../services/paymentService');
const whatsappService = require('../services/whatsappService');
const { products } = require('../config/products');
const logger = require('../utils/logger');

/**
 * Create a new order
 */
const createOrder = async (req, res) => {
  try {
    const { phoneNumber, productId, quantity, deliveryAddress, customerName } = req.body;

    // Validate input
    if (!phoneNumber || !productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phoneNumber, productId, quantity'
      });
    }

    // Find product
    const product = products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find or create customer
    const customer = await customerModel.findOrCreateCustomer(phoneNumber, customerName);

    // Calculate total
    const totalAmount = product.price * quantity;

    // Create order
    const order = await orderModel.createOrder({
      customerId: customer.id,
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      unitPrice: product.price,
      totalAmount: totalAmount,
      currency: product.currency,
      deliveryAddress: deliveryAddress
    });

    // Send payment options to customer
    await whatsappService.sendPaymentOptions(phoneNumber, order.id, totalAmount);

    logger.info(`Order created: ${order.id}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

/**
 * Get order by ID
 */
const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
};

/**
 * Get all orders
 */
const getAllOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const orders = await orderModel.getAllOrders(limit, offset);

    res.json({
      success: true,
      data: orders,
      pagination: {
        limit,
        offset,
        count: orders.length
      }
    });
  } catch (error) {
    logger.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
};

/**
 * Process payment for an order
 */
const processPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, phoneNumber } = req.body;

    if (!paymentMethod || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: paymentMethod, phoneNumber'
      });
    }

    // Validate payment method
    if (!['mpesa', 'airtel', 'card'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Use "mpesa", "airtel", or "card"'
      });
    }

    // Initiate payment
    const result = await paymentService.initiatePayment(orderId, paymentMethod, phoneNumber);

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrder,
  getAllOrders,
  processPayment
};
