const ghalaService = require('./ghalaService');
const { products, promotions } = require('../config/products');
const logger = require('../utils/logger');

/**
 * Send greeting message with main menu
 */
const sendGreeting = async (phoneNumber, customerName = null) => {
  const greeting = customerName 
    ? `Hello ${customerName}! 👋` 
    : 'Hello! 👋';

  const message = `${greeting}\n\nWelcome to our Micro-Sales Assistant!\n\nHow can I help you today?`;

  const buttons = [
    { id: 'view_products', title: '🛍️ View Products' },
    { id: 'view_promotions', title: '🎉 View Promotions' }
  ];

  return await ghalaService.sendInteractiveButtons(phoneNumber, message, buttons);
};

/**
 * Send product catalog as interactive list
 */
const sendProductCatalog = async (phoneNumber) => {
  const sections = [{
    title: 'Available Products',
    rows: products.map(product => ({
      id: product.id,
      title: `${product.emoji} ${product.name}`,
      description: `${product.currency} ${product.price} - ${product.description}`
    }))
  }];

  return await ghalaService.sendInteractiveList(
    phoneNumber,
    '🛍️ *Our Product Catalog*\n\nSelect a product to order:',
    'View Products',
    sections
  );
};

/**
 * Send promotions list
 */
const sendPromotions = async (phoneNumber) => {
  let message = '🎉 *Current Promotions*\n\n';
  
  promotions.forEach((promo, index) => {
    message += `${promo.emoji} *${promo.title}*\n`;
    message += `${promo.description}\n`;
    message += `Valid until: ${promo.validUntil}\n\n`;
  });

  message += 'Reply with "products" to browse our catalog!';

  return await ghalaService.sendWhatsAppMessage(phoneNumber, message);
};

/**
 * Send product details and quantity request
 */
const sendProductDetails = async (phoneNumber, productId) => {
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return await ghalaService.sendWhatsAppMessage(
      phoneNumber,
      'Sorry, product not found. Please try again.'
    );
  }

  const message = `${product.emoji} *${product.name}*\n\n` +
    `${product.description}\n\n` +
    `*Price:* ${product.currency} ${product.price}\n\n` +
    `Please reply with the quantity you want to order (e.g., "2")`;

  return await ghalaService.sendWhatsAppMessage(phoneNumber, message);
};

/**
 * Send payment options
 */
const sendPaymentOptions = async (phoneNumber, orderId, totalAmount) => {
  const message = `💰 *Order Total: KES ${totalAmount}*\n\n` +
    `Please select your payment method:`;

  const buttons = [
    { id: `pay_mpesa_${orderId}`, title: '📱 M-Pesa' },
    { id: `pay_airtel_${orderId}`, title: '📱 Airtel Money' },
    { id: `pay_card_${orderId}`, title: '💳 Card' }
  ];

  return await ghalaService.sendInteractiveButtons(phoneNumber, message, buttons);
};

/**
 * Send order confirmation
 */
const sendOrderConfirmation = async (phoneNumber, order) => {
  const message = `✅ *Order Confirmed!*\n\n` +
    `Order ID: ${order.id}\n` +
    `Product: ${order.product_name}\n` +
    `Quantity: ${order.quantity}\n` +
    `Total: ${order.currency} ${order.total_amount}\n\n` +
    `We're processing your payment...`;

  return await ghalaService.sendWhatsAppMessage(phoneNumber, message);
};

/**
 * Send payment success receipt
 */
const sendPaymentReceipt = async (phoneNumber, order, transactionRef) => {
  const message = `🎉 *Payment Successful!*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*RECEIPT*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Order ID: ${order.id}\n` +
    `Product: ${order.product_name}\n` +
    `Quantity: ${order.quantity}\n` +
    `Unit Price: ${order.currency} ${order.unit_price}\n` +
    `Total Paid: ${order.currency} ${order.total_amount}\n` +
    `Payment Method: ${order.payment_method}\n` +
    `Transaction Ref: ${transactionRef}\n` +
    `Date: ${new Date().toLocaleString()}\n\n` +
    `${order.delivery_address ? `Delivery Address:\n${order.delivery_address}\n\n` : ''}` +
    `Thank you for your purchase! 🙏\n\n` +
    `Your order will be delivered soon.`;

  return await ghalaService.sendWhatsAppMessage(phoneNumber, message);
};

/**
 * Send payment failure message
 */
const sendPaymentFailure = async (phoneNumber, orderId, reason = null) => {
  const message = `❌ *Payment Failed*\n\n` +
    `Order ID: ${orderId}\n` +
    `${reason ? `Reason: ${reason}\n\n` : ''}` +
    `Please try again or contact support if the issue persists.\n\n` +
    `Reply "retry" to try payment again.`;

  return await ghalaService.sendWhatsAppMessage(phoneNumber, message);
};

/**
 * Send follow-up for pending orders
 */
const sendPendingOrderReminder = async (phoneNumber, orderId) => {
  const message = `⏰ *Order Reminder*\n\n` +
    `You have a pending order (${orderId}).\n\n` +
    `Would you like to complete the payment?\n\n` +
    `Reply "yes" to continue or "cancel" to cancel the order.`;

  return await ghalaService.sendWhatsAppMessage(phoneNumber, message);
};

module.exports = {
  sendGreeting,
  sendProductCatalog,
  sendPromotions,
  sendProductDetails,
  sendPaymentOptions,
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendPaymentFailure,
  sendPendingOrderReminder
};
