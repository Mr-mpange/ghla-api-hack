const conversationHandler = require('../handlers/conversationHandler');
const whatsappService = require('../services/whatsappService');
const ghalaService = require('../services/ghalaService');
const orderService = require('../services/orderService');
const customerService = require('../services/customerService');
const { messageQueue, paymentQueue, orderQueue, notificationQueue } = require('../config/redis');
const db = require('../config/database');
const crypto = require('crypto');

class QueueProcessors {
  constructor() {
    this.setupProcessors();
  }

  setupProcessors() {
    // Message processing queue
    messageQueue.process('process_conversation', 10, this.processConversation.bind(this));
    messageQueue.process('send_whatsapp_message', 5, this.sendWhatsAppMessage.bind(this));
    messageQueue.process('retry_failed_message', 3, this.retryFailedMessage.bind(this));

    // Payment processing queue
    paymentQueue.process('process_payment', 5, this.processPayment.bind(this));
    paymentQueue.process('verify_payment', 10, this.verifyPayment.bind(this));
    paymentQueue.process('generate_and_send_receipt', 5, this.generateAndSendReceipt.bind(this));
    paymentQueue.process('send_payment_reminder', 3, this.sendPaymentReminder.bind(this));
    paymentQueue.process('send_payment_failure_notification', 5, this.sendPaymentFailureNotification.bind(this));

    // Order processing queue
    orderQueue.process('send_order_confirmation', 5, this.sendOrderConfirmation.bind(this));
    orderQueue.process('trigger_order_processing', 5, this.triggerOrderProcessing.bind(this));
    orderQueue.process('send_status_update', 5, this.sendOrderStatusUpdate.bind(this));

    // Notification processing queue
    notificationQueue.process('send_order_processing', 5, this.sendOrderProcessingNotification.bind(this));
    notificationQueue.process('send_shipping_notification', 5, this.sendShippingNotification.bind(this));
    notificationQueue.process('send_delivery_notification', 5, this.sendDeliveryNotification.bind(this));
    notificationQueue.process('send_delivery_confirmation', 5, this.sendDeliveryConfirmation.bind(this));
    notificationQueue.process('send_cancellation_notification', 5, this.sendCancellationNotification.bind(this));
    notificationQueue.process('send_refund_notification', 5, this.sendRefundNotification.bind(this));

    console.log('✅ Queue processors initialized');
  }

  // Message Processors
  async processConversation(job) {
    const context = job.data;
    
    try {
      await conversationHandler.processConversation(context);
      return { success: true };
    } catch (error) {
      console.error('Error processing conversation:', error.message);
      throw error;
    }
  }

  async sendWhatsAppMessage(job) {
    const { phone, message, messageType = 'text', template, interactive } = job.data;

    try {
      let result;

      switch (messageType) {
        case 'text':
          result = await whatsappService.sendTextMessage(phone, message);
          break;
        case 'template':
          result = await whatsappService.sendTemplateMessage(phone, template.name, template.language, template.components);
          break;
        case 'interactive':
          if (interactive.type === 'button') {
            result = await whatsappService.sendButtonMessage(
              phone, interactive.body, interactive.buttons, 
              interactive.header, interactive.footer
            );
          } else if (interactive.type === 'list') {
            result = await whatsappService.sendListMessage(
              phone, interactive.body, interactive.buttonText, 
              interactive.sections, interactive.header, interactive.footer
            );
          }
          break;
        default:
          result = await whatsappService.sendTextMessage(phone, message);
      }

      // Log successful message
      if (job.data.customerId) {
        await this.logMessage(job.data.customerId, result.messages[0].id, 'outbound', messageType, message);
      }

      return result;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.message);
      throw error;
    }
  }

  async retryFailedMessage(job) {
    const { customerId, customerPhone, originalContent, messageType, retryCount } = job.data;

    try {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryCount * 1000));

      const result = await whatsappService.sendTextMessage(customerPhone, originalContent);
      
      await this.logMessage(customerId, result.messages[0].id, 'outbound', messageType, `RETRY ${retryCount}: ${originalContent}`);

      return result;
    } catch (error) {
      console.error(`Error retrying message (attempt ${retryCount}):`, error.message);
      
      if (retryCount < 3) {
        // Queue another retry
        await messageQueue.add('retry_failed_message', {
          ...job.data,
          retryCount: retryCount + 1
        }, {
          delay: retryCount * 60000 // Exponential backoff
        });
      }
      
      throw error;
    }
  }

  // Payment Processors
  async processPayment(job) {
    const { paymentId, ghalaPaymentId, customerPhone } = job.data;

    try {
      // Get payment details from Ghala
      const ghalaPayment = await ghalaService.getPayment(ghalaPaymentId);
      
      // Update local payment record
      await db.query(`
        UPDATE payments 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
      `, [ghalaPayment.status, paymentId]);

      // Send status update to customer
      if (ghalaPayment.status === 'pending') {
        await messageQueue.add('send_whatsapp_message', {
          phone: customerPhone,
          message: `⏳ Payment is being processed. You'll receive confirmation shortly.`,
          messageType: 'text'
        });
      }

      return { success: true, status: ghalaPayment.status };
    } catch (error) {
      console.error('Error processing payment:', error.message);
      throw error;
    }
  }

  async verifyPayment(job) {
    const { paymentId } = job.data;

    try {
      const payment = await ghalaService.verifyPayment(paymentId);
      
      if (payment.status === 'success') {
        // Payment verified, trigger receipt generation
        await paymentQueue.add('generate_and_send_receipt', {
          ghalaPaymentId: paymentId,
          customerPhone: payment.customer.phone,
          paymentData: payment
        });
      }

      return payment;
    } catch (error) {
      console.error('Error verifying payment:', error.message);
      throw error;
    }
  }

  async generateAndSendReceipt(job) {
    const { ghalaPaymentId, customerPhone, paymentData } = job.data;

    try {
      // Generate immutable receipt
      const receipt = this.generateImmutableReceipt(paymentData);
      
      // Save receipt to database
      await db.query(`
        INSERT INTO receipts (
          receipt_id, payment_id, order_id, customer_phone, 
          receipt_data, hash, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        receipt.receiptId,
        ghalaPaymentId,
        paymentData.order_id,
        customerPhone,
        JSON.stringify(receipt),
        receipt.hash
      ]);

      // Send receipt via WhatsApp
      const receiptMessage = whatsappService.createPaymentReceiptMessage(receipt);
      
      await messageQueue.add('send_whatsapp_message', {
        phone: customerPhone,
        message: receiptMessage,
        messageType: 'text'
      });

      return receipt;
    } catch (error) {
      console.error('Error generating and sending receipt:', error.message);
      throw error;
    }
  }

  async sendPaymentReminder(job) {
    const { ghalaPaymentId, customerPhone, amount, paymentMethod } = job.data;

    try {
      const reminderMessage = `⏰ *Payment Reminder*

Your payment of KES ${amount} is still pending.

${paymentMethod === 'mpesa' ? 
  'Please check your phone for M-Pesa prompt and enter your PIN.' :
  'Please complete your payment to proceed with the order.'
}

Need help? Reply 'help' for support.`;

      await messageQueue.add('send_whatsapp_message', {
        phone: customerPhone,
        message: reminderMessage,
        messageType: 'text'
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending payment reminder:', error.message);
      throw error;
    }
  }

  async sendPaymentFailureNotification(job) {
    const { ghalaPaymentId, customerPhone, failureReason, retryOptions } = job.data;

    try {
      let failureMessage = `❌ *Payment Failed*

Your payment could not be processed.

Reason: ${failureReason || 'Payment was declined'}

`;

      if (retryOptions && retryOptions.length > 0) {
        failureMessage += `You can try again with:
${retryOptions.map(option => `• ${option}`).join('\n')}

`;
      }

      failureMessage += `Reply 'retry' to try again or 'help' for support.`;

      await messageQueue.add('send_whatsapp_message', {
        phone: customerPhone,
        message: failureMessage,
        messageType: 'text'
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending payment failure notification:', error.message);
      throw error;
    }
  }

  // Order Processors
  async sendOrderConfirmation(job) {
    const { orderId, customerPhone, otp } = job.data;

    try {
      const order = await orderService.getOrder(orderId);
      
      const confirmationMessage = `🎯 *Order Confirmed!*

Order #: ${order.order_number}
Total: KES ${order.total_amount}

📦 *Items:*
${order.items.map(item => `• ${item.product_name} x${item.quantity}`).join('\n')}

📍 *Delivery Address:*
${order.delivery_address}

🔐 *Delivery OTP:* ${otp}
(Share this code with the delivery person)

Your order is being prepared and will be delivered within 2-4 hours.

Thank you for your order! 🙏`;

      await messageQueue.add('send_whatsapp_message', {
        phone: customerPhone,
        message: confirmationMessage,
        messageType: 'text',
        customerId: order.customer_id
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending order confirmation:', error.message);
      throw error;
    }
  }

  async triggerOrderProcessing(job) {
    const { ghalaOrderId } = job.data;

    try {
      // Update order status to processing
      await ghalaService.updateOrderStatus(ghalaOrderId, 'processing', {
        processing_started_at: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Error triggering order processing:', error.message);
      throw error;
    }
  }

  async sendOrderStatusUpdate(job) {
    const { orderId, status, metadata } = job.data;

    try {
      const order = await orderService.getOrder(orderId);
      
      const statusMessages = {
        'processing': '⚙️ Your order is being prepared',
        'shipped': '🚚 Your order has been shipped',
        'out_for_delivery': '🚛 Your order is out for delivery',
        'delivered': '✅ Your order has been delivered',
        'cancelled': '❌ Your order has been cancelled'
      };

      const message = `📦 *Order Update*

Order #: ${order.order_number}
Status: ${statusMessages[status] || status}

${metadata.estimatedTime ? `⏰ ETA: ${metadata.estimatedTime}` : ''}
${metadata.trackingNumber ? `🚚 Tracking: ${metadata.trackingNumber}` : ''}

Reply 'track' for more details.`;

      await messageQueue.add('send_whatsapp_message', {
        phone: order.whatsapp_number,
        message: message,
        messageType: 'text',
        customerId: order.customer_id
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending order status update:', error.message);
      throw error;
    }
  }

  // Notification Processors
  async sendOrderProcessingNotification(job) {
    const { ghalaOrderId, customerPhone, estimatedTime } = job.data;

    try {
      const message = `⚙️ *Order Processing*

Your order is now being prepared by our team.

⏰ Estimated preparation time: ${estimatedTime}

We'll notify you once your order is ready for shipping.

Thank you for your patience! 🙏`;

      await messageQueue.add('send_whatsapp_message', {
        phone: customerPhone,
        message: message,
        messageType: 'text'
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending order processing notification:', error.message);
      throw error;
    }
  }

  async sendShippingNotification(job) {
    const { ghalaOrderId, customerPhone, trackingNumber, deliveryInfo, estimatedDelivery } = job.data;

    try {
      let message = `🚚 *Order Shipped!*

Your order is on its way to you.

`;

      if (trackingNumber) {
        message += `📦 Tracking Number: ${trackingNumber}\n`;
      }

      if (deliveryInfo) {
        message += `🚛 Driver: ${deliveryInfo.driverName || 'TBD'}
📱 Driver Phone: ${deliveryInfo.driverPhone || 'TBD'}
🚗 Vehicle: ${deliveryInfo.vehicleNumber || 'TBD'}

`;
      }

      if (estimatedDelivery) {
        message += `⏰ Estimated Delivery: ${estimatedDelivery}\n`;
      }

      message += `We'll send you another update when your order is out for delivery.

Reply 'track' to get live updates.`;

      await messageQueue.add('send_whatsapp_message', {
        phone: customerPhone,
        message: message,
        messageType: 'text'
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending shipping notification:', error.message);
      throw error;
    }
  }

  async sendDeliveryNotification(job) {
    const { ghalaOrderId, customerPhone, deliveryOTP, driverInfo, estimatedArrival } = job.data;

    try {
      let message = `🚛 *Out for Delivery!*

Your order is out for delivery and will arrive soon.

`;

      if (deliveryOTP) {
        message += `🔐 *Delivery OTP: ${deliveryOTP}*
Please share this code with the delivery person.

`;
      }

      if (driverInfo) {
        message += `👤 Driver: ${driverInfo.name}
📱 Phone: ${driverInfo.phone}
🚗 Vehicle: ${driverInfo.vehicle}

`;
      }

      if (estimatedArrival) {
        message += `⏰ ETA: ${estimatedArrival}\n`;
      }

      message += `Please be available to receive your order.

Any delivery issues? Contact our support.`;

      await messageQueue.add('send_whatsapp_message', {
        phone: customerPhone,
        message: message,
        messageType: 'text'
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending delivery notification:', error.message);
      throw error;
    }
  }

  async sendDeliveryConfirmation(job) {
    const { ghalaOrderId, customerPhone, orderData } = job.data;

    try {
      const message = `✅ *Order Delivered Successfully!*

Thank you for choosing us! Your order has been delivered.

⭐ *Rate Your Experience*
Reply with a number from 1-5:
5 = Excellent
4 = Good  
3 = Average
2 = Poor
1 = Very Poor

💬 *Quick Actions:*
• Reply 'reorder' to order the same items again
• Reply 'products' to browse more products
• Reply 'help' if you need support

We appreciate your business! 🙏`;

      await messageQueue.add('send_whatsapp_message', {
        phone: customerPhone,
        message: message,
        messageType: 'text'
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending delivery confirmation:', error.message);
      throw error;
    }
  }

  async sendCancellationNotification(job) {
    const { ghalaOrderId, customerPhone, cancellationReason, refundInfo } = job.data;

    try {
      let message = `❌ *Order Cancelled*

Your order has been cancelled.

`;

      if (cancellationReason) {
        message += `Reason: ${cancellationReason}\n\n`;
      }

      if (refundInfo && refundInfo.amount > 0) {
        message += `💰 *Refund Information:*
Amount: KES ${refundInfo.amount}
Method: ${refundInfo.method}
Timeline: ${refundInfo.timeline || '3-5 business days'}

`;
      }

      message += `We apologize for any inconvenience.

Need help? Reply 'help' for support.
Want to place a new order? Reply 'products'.`;

      await messageQueue.add('send_whatsapp_message', {
        phone: customerPhone,
        message: message,
        messageType: 'text'
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending cancellation notification:', error.message);
      throw error;
    }
  }

  async sendRefundNotification(job) {
    const { ghalaRefundId, customerPhone, refundData } = job.data;

    try {
      const message = `💸 *Refund Processed*

Your refund has been processed successfully.

💰 Amount: KES ${refundData.amount}
📅 Date: ${new Date().toLocaleDateString()}
🔄 Method: ${refundData.method || 'Original payment method'}
⏰ Timeline: ${refundData.timeline || '3-5 business days'}

${refundData.reference ? `Reference: ${refundData.reference}` : ''}

You should see the refund in your account within the specified timeline.

Questions? Reply 'help' for support.`;

      await messageQueue.add('send_whatsapp_message', {
        phone: customerPhone,
        message: message,
        messageType: 'text'
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending refund notification:', error.message);
      throw error;
    }
  }

  // Utility Methods
  async logMessage(customerId, whatsappMessageId, direction, messageType, content) {
    try {
      await db.query(`
        INSERT INTO messages (
          customer_id, whatsapp_message_id, direction, message_type, 
          content, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [customerId, whatsappMessageId, direction, messageType, content, 'sent']);
    } catch (error) {
      console.error('Error logging message:', error.message);
    }
  }

  generateImmutableReceipt(paymentData) {
    const receiptData = {
      receiptId: `RCP-${Date.now()}`,
      orderId: paymentData.order_id,
      customerId: paymentData.customer.id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      paymentMethod: paymentData.payment_method,
      mpesaCode: paymentData.mpesa_code,
      transactionId: paymentData.transaction_id,
      timestamp: new Date().toISOString(),
      items: paymentData.order?.items || []
    };

    // Generate hash for tamper detection
    const receiptHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(receiptData))
      .digest('hex');

    return {
      ...receiptData,
      hash: receiptHash,
      verificationUrl: `${process.env.APP_URL}/verify/receipt/${receiptHash}`
    };
  }
}

// Initialize and export
const queueProcessors = new QueueProcessors();
module.exports = queueProcessors;