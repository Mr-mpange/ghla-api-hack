const customerModel = require('../models/customerModel');
const orderModel = require('../models/orderModel');
const whatsappService = require('../services/whatsappService');
const paymentService = require('../services/paymentService');
const { products } = require('../config/products');
const logger = require('../utils/logger');

// Store user conversation state (in production, use Redis or database)
const userStates = new Map();

/**
 * Handle incoming WhatsApp messages
 */
const handleIncomingMessage = async (message) => {
  try {
    const { from, text, type, interactive } = message;
    const phoneNumber = from;

    logger.info(`Message received from ${phoneNumber}: ${text || type}`);

    // Get or initialize user state
    let userState = userStates.get(phoneNumber) || { step: 'greeting' };

    // Handle interactive button responses
    if (type === 'interactive' && interactive) {
      return await handleInteractiveResponse(phoneNumber, interactive, userState);
    }

    // Handle text messages based on current state
    if (type === 'text' && text) {
      return await handleTextMessage(phoneNumber, text.body.toLowerCase(), userState);
    }

    // Default: send greeting
    await whatsappService.sendGreeting(phoneNumber);
  } catch (error) {
    logger.error('Error handling incoming message:', error);
    throw error;
  }
};

/**
 * Handle interactive button/list responses
 */
const handleInteractiveResponse = async (phoneNumber, interactive, userState) => {
  const responseId = interactive.button_reply?.id || interactive.list_reply?.id;

  logger.info(`Interactive response: ${responseId}`);

  // View Products
  if (responseId === 'view_products') {
    await whatsappService.sendProductCatalog(phoneNumber);
    userState.step = 'product_selected';
    userStates.set(phoneNumber, userState);
    return;
  }

  // View Promotions
  if (responseId === 'view_promotions') {
    await whatsappService.sendPromotions(phoneNumber);
    userState.step = 'greeting';
    userStates.set(phoneNumber, userState);
    return;
  }

  // Product selected
  if (responseId.startsWith('prod_')) {
    const productId = responseId;
    await whatsappService.sendProductDetails(phoneNumber, productId);
    userState.step = 'quantity_input';
    userState.selectedProduct = productId;
    userStates.set(phoneNumber, userState);
    return;
  }

  // Payment method selected
  if (responseId.startsWith('pay_')) {
    const [, method, orderId] = responseId.split('_');
    await paymentService.initiatePayment(orderId, method, phoneNumber);
    userState.step = 'payment_processing';
    userStates.set(phoneNumber, userState);
    return;
  }
};

/**
 * Handle text message responses
 */
const handleTextMessage = async (phoneNumber, text, userState) => {
  // Greeting keywords
  if (['hi', 'hello', 'hey', 'start', 'menu'].includes(text)) {
    await whatsappService.sendGreeting(phoneNumber);
    userState.step = 'greeting';
    userStates.set(phoneNumber, userState);
    return;
  }

  // Products keyword
  if (['products', 'catalog', 'shop', 'buy'].includes(text)) {
    await whatsappService.sendProductCatalog(phoneNumber);
    userState.step = 'product_selected';
    userStates.set(phoneNumber, userState);
    return;
  }

  // Promotions keyword
  if (['promotions', 'promo', 'deals', 'offers'].includes(text)) {
    await whatsappService.sendPromotions(phoneNumber);
    return;
  }

  // Handle quantity input
  if (userState.step === 'quantity_input' && userState.selectedProduct) {
    const quantity = parseInt(text);
    
    if (isNaN(quantity) || quantity < 1) {
      await whatsappService.sendWhatsAppMessage(
        phoneNumber,
        'Please enter a valid quantity (e.g., "2")'
      );
      return;
    }

    userState.quantity = quantity;
    userState.step = 'address_input';
    userStates.set(phoneNumber, userState);

    await whatsappService.sendWhatsAppMessage(
      phoneNumber,
      '📍 Please provide your delivery address, or reply "skip" if not needed:'
    );
    return;
  }

  // Handle address input
  if (userState.step === 'address_input') {
    const deliveryAddress = text === 'skip' ? null : text;
    
    // Find or create customer
    const customer = await customerModel.findOrCreateCustomer(phoneNumber);
    
    // Get product details
    const product = products.find(p => p.id === userState.selectedProduct);
    const totalAmount = product.price * userState.quantity;

    // Create order
    const order = await orderModel.createOrder({
      customerId: customer.id,
      productId: product.id,
      productName: product.name,
      quantity: userState.quantity,
      unitPrice: product.price,
      totalAmount: totalAmount,
      currency: product.currency,
      deliveryAddress: deliveryAddress
    });

    // Send payment options
    await whatsappService.sendPaymentOptions(phoneNumber, order.id, totalAmount);

    userState.step = 'payment_selection';
    userState.orderId = order.id;
    userStates.set(phoneNumber, userState);
    return;
  }

  // Default response
  await whatsappService.sendWhatsAppMessage(
    phoneNumber,
    'I didn\'t understand that. Reply "menu" to see options.'
  );
};

/**
 * Clear user state (after order completion)
 */
const clearUserState = (phoneNumber) => {
  userStates.delete(phoneNumber);
};

module.exports = {
  handleIncomingMessage,
  clearUserState
};
