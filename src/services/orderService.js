const db = require('../config/database');
const ghalaService = require('./ghalaService');
const { orderQueue, paymentQueue } = require('../config/redis');
const crypto = require('crypto');

class OrderService {
  // Create new order
  async createOrder(orderData) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Generate order number
      const orderNumber = this.generateOrderNumber();
      
      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const deliveryFee = this.calculateDeliveryFee(orderData.deliveryAddress);
      const totalAmount = subtotal + deliveryFee;

      // Create order record
      const orderResult = await client.query(`
        INSERT INTO orders (
          order_number, customer_id, status, total_amount, currency,
          delivery_address, delivery_fee, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [
        orderNumber,
        orderData.customerId,
        'pending',
        totalAmount,
        orderData.currency || 'KES',
        orderData.deliveryAddress,
        deliveryFee
      ]);

      const order = orderResult.rows[0];

      // Create order items
      for (const item of orderData.items) {
        await client.query(`
          INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, total_price, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
          order.id,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.unitPrice * item.quantity
        ]);
      }

      // Generate delivery OTP
      const otp = this.generateOTP();
      await client.query(`
        UPDATE orders SET otp_code = $1 WHERE id = $2
      `, [otp, order.id]);

      await client.query('COMMIT');

      // Create order in Ghala
      try {
        const ghalaOrder = await ghalaService.createOrder({
          orderNumber: order.order_number,
          customer: orderData.customer,
          items: orderData.items,
          totalAmount: totalAmount,
          currency: order.currency,
          deliveryAddress: order.delivery_address,
          metadata: { localOrderId: order.id }
        });

        // Update with Ghala order ID
        await db.query(`
          UPDATE orders SET ghala_order_id = $1 WHERE id = $2
        `, [ghalaOrder.id, order.id]);

        order.ghala_order_id = ghalaOrder.id;
      } catch (ghalaError) {
        console.error('Failed to create order in Ghala:', ghalaError.message);
        // Continue with local order, log for manual sync
      }

      // Queue order confirmation message
      await orderQueue.add('send_order_confirmation', {
        orderId: order.id,
        customerPhone: orderData.customer.phone,
        otp: otp
      });

      return {
        ...order,
        items: orderData.items,
        subtotal: subtotal,
        otp: otp
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating order:', error.message);
      throw new Error('Failed to create order');
    } finally {
      client.release();
    }
  }

  // Get order by ID
  async getOrder(orderId) {
    try {
      const orderResult = await db.query(`
        SELECT o.*, c.whatsapp_number, c.name as customer_name, c.email as customer_email
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.id = $1
      `, [orderId]);

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // Get order items
      const itemsResult = await db.query(`
        SELECT oi.*, p.name as product_name, p.description as product_description
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `, [orderId]);

      order.items = itemsResult.rows;

      return order;
    } catch (error) {
      console.error('Error fetching order:', error.message);
      throw new Error('Failed to fetch order');
    }
  }

  // Get order by order number
  async getOrderByNumber(orderNumber) {
    try {
      const orderResult = await db.query(`
        SELECT o.*, c.whatsapp_number, c.name as customer_name, c.email as customer_email
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.order_number = $1
      `, [orderNumber]);

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // Get order items
      const itemsResult = await db.query(`
        SELECT oi.*, p.name as product_name, p.description as product_description
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `, [order.id]);

      order.items = itemsResult.rows;

      return order;
    } catch (error) {
      console.error('Error fetching order by number:', error.message);
      throw new Error('Failed to fetch order');
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status, metadata = {}) {
    try {
      const result = await db.query(`
        UPDATE orders 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, orderId]);

      if (result.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = result.rows[0];

      // Update status in Ghala if order exists there
      if (order.ghala_order_id) {
        try {
          await ghalaService.updateOrderStatus(order.ghala_order_id, status, metadata);
        } catch (ghalaError) {
          console.error('Failed to update order status in Ghala:', ghalaError.message);
        }
      }

      // Queue status update notification
      await orderQueue.add('send_status_update', {
        orderId: order.id,
        status: status,
        metadata: metadata
      });

      return order;
    } catch (error) {
      console.error('Error updating order status:', error.message);
      throw new Error('Failed to update order status');
    }
  }

  // Process payment for order
  async processPayment(orderId, paymentMethod, customerPhone) {
    try {
      const order = await this.getOrder(orderId);
      
      if (order.payment_status === 'paid') {
        throw new Error('Order already paid');
      }

      // Create payment in Ghala
      const ghalaPayment = await ghalaService.createPayment({
        orderId: order.ghala_order_id || order.order_number,
        amount: order.total_amount,
        currency: order.currency,
        paymentMethod: paymentMethod,
        customerPhone: customerPhone,
        metadata: { localOrderId: order.id }
      });

      // Create local payment record
      const paymentResult = await db.query(`
        INSERT INTO payments (
          order_id, ghala_payment_id, amount, currency, payment_method, 
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [
        order.id,
        ghalaPayment.id,
        order.total_amount,
        order.currency,
        paymentMethod,
        'pending'
      ]);

      const payment = paymentResult.rows[0];

      // Update order payment status
      await db.query(`
        UPDATE orders SET payment_method = $1, payment_status = $2 WHERE id = $3
      `, [paymentMethod, 'pending', order.id]);

      // Queue payment processing
      await paymentQueue.add('process_payment', {
        paymentId: payment.id,
        ghalaPaymentId: ghalaPayment.id,
        customerPhone: customerPhone
      });

      return {
        payment: payment,
        ghalaPayment: ghalaPayment
      };

    } catch (error) {
      console.error('Error processing payment:', error.message);
      throw new Error('Failed to process payment');
    }
  }

  // Verify delivery OTP
  async verifyDeliveryOTP(orderId, providedOTP) {
    try {
      const order = await this.getOrder(orderId);
      
      if (!order.otp_code) {
        return { valid: false, reason: 'No OTP set for this order' };
      }

      if (order.status === 'delivered') {
        return { valid: false, reason: 'Order already delivered' };
      }

      if (order.otp_code !== providedOTP) {
        // Log failed attempt
        await db.query(`
          INSERT INTO messages (customer_id, direction, message_type, content, status, created_at)
          VALUES ($1, 'system', 'otp_failed', $2, 'logged', NOW())
        `, [order.customer_id, `Failed OTP attempt: ${providedOTP} for order ${order.order_number}`]);

        return { valid: false, reason: 'Invalid OTP' };
      }

      // Mark order as delivered
      await this.updateOrderStatus(orderId, 'delivered');
      
      // Clear OTP
      await db.query(`
        UPDATE orders SET otp_code = NULL, delivered_at = NOW() WHERE id = $1
      `, [orderId]);

      return { valid: true };

    } catch (error) {
      console.error('Error verifying delivery OTP:', error.message);
      throw new Error('Failed to verify delivery OTP');
    }
  }

  // Get customer orders
  async getCustomerOrders(customerId, limit = 10, offset = 0) {
    try {
      const result = await db.query(`
        SELECT o.*, 
               COUNT(oi.id) as item_count,
               SUM(oi.total_price) as items_total
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT $2 OFFSET $3
      `, [customerId, limit, offset]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching customer orders:', error.message);
      throw new Error('Failed to fetch customer orders');
    }
  }

  // Generate order analytics
  async getOrderAnalytics(dateRange = {}) {
    try {
      const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = dateRange;

      const analytics = await db.query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
          AVG(total_amount) as average_order_value,
          SUM(total_amount) as total_revenue,
          SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as confirmed_revenue
        FROM orders
        WHERE created_at BETWEEN $1 AND $2
      `, [startDate, endDate]);

      return analytics.rows[0];
    } catch (error) {
      console.error('Error generating order analytics:', error.message);
      throw new Error('Failed to generate order analytics');
    }
  }

  // Utility methods
  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${new Date().getFullYear()}-${random}`;
  }

  generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  calculateDeliveryFee(address) {
    // Simple delivery fee calculation
    // In production, this would integrate with delivery service APIs
    const baseDeliveryFee = 200; // KES 200 base fee
    
    // Add logic for distance-based pricing
    if (address.toLowerCase().includes('nairobi')) {
      return baseDeliveryFee;
    } else {
      return baseDeliveryFee + 100; // Additional fee for outside Nairobi
    }
  }

  generateOrderHash(order) {
    const orderString = `${order.id}:${order.total_amount}:${order.customer_id}:${order.created_at}`;
    return crypto.createHash('sha256').update(orderString).digest('hex');
  }

  verifyOrderIntegrity(order, providedHash) {
    const calculatedHash = this.generateOrderHash(order);
    return calculatedHash === providedHash;
  }
}

module.exports = new OrderService();