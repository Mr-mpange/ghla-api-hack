const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

class GhalaService {
  constructor() {
    this.apiKey = process.env.GHALA_API_KEY;
    this.apiUrl = process.env.GHALA_API_URL || 'https://api.ghala.io/v1';
    this.webhookSecret = process.env.GHALA_WEBHOOK_SECRET;
    
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Product Management
  async getProducts(filters = {}) {
    try {
      const response = await this.client.get('/products', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      throw new Error('Failed to fetch products from Ghala');
    }
  }

  async getProduct(productId) {
    try {
      const response = await this.client.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error.response?.data || error.message);
      throw new Error('Failed to fetch product from Ghala');
    }
  }

  // Order Management
  async createOrder(orderData) {
    try {
      const payload = {
        external_id: orderData.orderNumber,
        customer: {
          name: orderData.customer.name,
          phone: orderData.customer.phone,
          email: orderData.customer.email,
        },
        items: orderData.items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
        total_amount: orderData.totalAmount,
        currency: orderData.currency || 'KES',
        delivery_address: orderData.deliveryAddress,
        metadata: orderData.metadata || {},
      };

      const response = await this.client.post('/orders', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error.response?.data || error.message);
      throw new Error('Failed to create order in Ghala');
    }
  }

  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error.response?.data || error.message);
      throw new Error('Failed to fetch order from Ghala');
    }
  }

  async updateOrderStatus(orderId, status, metadata = {}) {
    try {
      const response = await this.client.patch(`/orders/${orderId}`, {
        status,
        metadata,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error.response?.data || error.message);
      throw new Error('Failed to update order status in Ghala');
    }
  }

  // Payment Processing
  async createPayment(paymentData) {
    try {
      const payload = {
        order_id: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'KES',
        payment_method: paymentData.paymentMethod,
        customer_phone: paymentData.customerPhone,
        callback_url: `${process.env.APP_URL}/api/webhooks/ghala/payment`,
        metadata: paymentData.metadata || {},
      };

      const response = await this.client.post('/payments', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error.response?.data || error.message);
      throw new Error('Failed to create payment in Ghala');
    }
  }

  async getPayment(paymentId) {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment:', error.response?.data || error.message);
      throw new Error('Failed to fetch payment from Ghala');
    }
  }

  async verifyPayment(paymentId) {
    try {
      const response = await this.client.post(`/payments/${paymentId}/verify`);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error.response?.data || error.message);
      throw new Error('Failed to verify payment in Ghala');
    }
  }

  // Customer Management
  async createCustomer(customerData) {
    try {
      const payload = {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        metadata: customerData.metadata || {},
      };

      const response = await this.client.post('/customers', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error.response?.data || error.message);
      throw new Error('Failed to create customer in Ghala');
    }
  }

  async getCustomer(customerId) {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error.response?.data || error.message);
      throw new Error('Failed to fetch customer from Ghala');
    }
  }

  // WhatsApp Messaging
  async sendWhatsAppMessage(phone, message, messageType = 'text') {
    try {
      const payload = {
        to: phone,
        type: messageType,
        message: message,
      };

      const response = await this.client.post('/whatsapp/messages', payload);
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp message via Ghala');
    }
  }

  async sendInteractiveMessage(phone, interactive) {
    try {
      const payload = {
        to: phone,
        type: 'interactive',
        interactive: interactive,
      };

      const response = await this.client.post('/whatsapp/messages', payload);
      return response.data;
    } catch (error) {
      console.error('Error sending interactive message:', error.response?.data || error.message);
      throw new Error('Failed to send interactive message via Ghala');
    }
  }

  async sendTemplateMessage(phone, template) {
    try {
      const payload = {
        to: phone,
        type: 'template',
        template: template,
      };

      const response = await this.client.post('/whatsapp/messages', payload);
      return response.data;
    } catch (error) {
      console.error('Error sending template message:', error.response?.data || error.message);
      throw new Error('Failed to send template message via Ghala');
    }
  }

  // Webhook Signature Verification
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      console.warn('⚠️ Webhook secret not configured');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error.message);
      return false;
    }
  }

  // Utility Methods
  formatPhoneNumber(phone) {
    // Ensure phone number is in international format
    if (phone.startsWith('0')) {
      return '+254' + phone.substring(1);
    }
    if (phone.startsWith('254')) {
      return '+' + phone;
    }
    if (!phone.startsWith('+')) {
      return '+' + phone;
    }
    return phone;
  }

  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  generateReceiptNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RCP-${timestamp}-${random}`;
  }
}

module.exports = new GhalaService();