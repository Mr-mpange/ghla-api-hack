const whatsappService = require('../services/whatsappService');
const customerService = require('../services/customerService');
const orderService = require('../services/orderService');
const productService = require('../services/productService');
const { messageQueue, orderQueue } = require('../config/redis');

class ConversationHandler {
  constructor() {
    this.conversationSteps = {
      'welcome': this.handleWelcome.bind(this),
      'browsing_products': this.handleProductBrowsing.bind(this),
      'product_selected': this.handleProductSelection.bind(this),
      'quantity_selection': this.handleQuantitySelection.bind(this),
      'address_confirmation': this.handleAddressConfirmation.bind(this),
      'order_confirmation': this.handleOrderConfirmation.bind(this),
      'payment_method': this.handlePaymentMethod.bind(this),
      'order_tracking': this.handleOrderTracking.bind(this),
      'customer_support': this.handleCustomerSupport.bind(this),
      'feedback': this.handleFeedback.bind(this)
    };

    this.quickCommands = {
      'menu': this.showMainMenu.bind(this),
      'products': this.showProducts.bind(this),
      'orders': this.showOrderHistory.bind(this),
      'help': this.showHelp.bind(this),
      'track': this.handleOrderTracking.bind(this),
      'reorder': this.handleReorder.bind(this),
      'cancel': this.handleCancel.bind(this)
    };
  }

  // Main conversation processor
  async processConversation(context) {
    try {
      const { customer, session, messageText, interactive, button, list } = context;

      // Handle quick commands first
      const command = this.extractCommand(messageText);
      if (command && this.quickCommands[command]) {
        return await this.quickCommands[command](context);
      }

      // Handle interactive responses
      if (interactive || button || list) {
        return await this.handleInteractiveResponse(context);
      }

      // Handle conversation flow based on current step
      const currentStep = session?.current_step || 'welcome';
      const handler = this.conversationSteps[currentStep];

      if (handler) {
        return await handler(context);
      } else {
        return await this.handleUnknownStep(context);
      }

    } catch (error) {
      console.error('Error processing conversation:', error.message);
      await this.sendErrorMessage(context.customer.whatsapp_number);
    }
  }

  // Welcome message and main menu
  async handleWelcome(context) {
    const { customer, messageText } = context;

    // Check if it's a greeting
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    const isGreeting = greetings.some(greeting => 
      messageText.toLowerCase().includes(greeting)
    );

    if (isGreeting || !messageText || messageText.toLowerCase() === 'menu') {
      await this.showMainMenu(context);
    } else {
      // Try to understand what they want
      await this.handleNaturalLanguageQuery(context);
    }

    // Update session
    await customerService.updateCustomerSession(customer.id, {
      conversationState: 'welcome',
      lastInteraction: new Date()
    }, 'welcome');
  }

  // Show main menu
  async showMainMenu(context) {
    const { customer } = context;

    const menuMessage = whatsappService.sendButtonMessage(
      customer.whatsapp_number,
      `🛒 *Welcome to YourBusiness!*\n\nWhat would you like to do today?`,
      [
        { id: 'browse_products', title: '🛍️ Browse Products' },
        { id: 'track_order', title: '📦 Track Order' },
        { id: 'order_history', title: '📋 Order History' }
      ],
      null,
      'Reply HELP for assistance'
    );

    await customerService.updateCustomerSession(customer.id, {
      conversationState: 'main_menu',
      lastInteraction: new Date()
    }, 'welcome');

    return menuMessage;
  }

  // Handle product browsing
  async handleProductBrowsing(context) {
    const { customer, messageText } = context;

    try {
      // Get product categories or search products
      let products;
      
      if (messageText && messageText.length > 2) {
        // Search products by name
        products = await productService.searchProducts(messageText);
      } else {
        // Show popular products
        products = await productService.getProducts({ limit: 10, popular: true });
      }

      if (products.length === 0) {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "Sorry, I couldn't find any products matching your search. Try browsing our categories:"
        );
        return await this.showProductCategories(context);
      }

      // Show products as interactive list
      const listMessage = whatsappService.createProductListMessage(products, 'Available Products');
      
      await whatsappService.sendListMessage(
        customer.whatsapp_number,
        listMessage.bodyText,
        listMessage.buttonText,
        listMessage.sections,
        null,
        listMessage.footerText
      );

      // Update session
      await customerService.updateCustomerSession(customer.id, {
        conversationState: 'browsing_products',
        availableProducts: products.map(p => ({ id: p.id, name: p.name, price: p.price })),
        lastInteraction: new Date()
      }, 'browsing_products');

    } catch (error) {
      console.error('Error handling product browsing:', error.message);
      await whatsappService.sendTextMessage(
        customer.whatsapp_number,
        "Sorry, I'm having trouble loading products right now. Please try again."
      );
    }
  }

  // Handle product selection
  async handleProductSelection(context) {
    const { customer, session, messageText } = context;

    try {
      const sessionData = session.session_data;
      const selectedProductId = this.extractProductId(messageText, sessionData);

      if (!selectedProductId) {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "Please select a product from the list above, or type 'menu' to start over."
        );
        return;
      }

      // Get product details
      const product = await productService.getProduct(selectedProductId);
      
      if (!product) {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "Sorry, that product is no longer available. Please select another one."
        );
        return;
      }

      // Show product details and ask for quantity
      const productMessage = `📦 *${product.name}*

💰 Price: KES ${product.price}
📋 Description: ${product.description}
📊 Stock: ${product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock'}

${product.stock_quantity > 0 ? 'How many would you like to order?' : 'This item is currently out of stock.'}`;

      await whatsappService.sendTextMessage(customer.whatsapp_number, productMessage);

      if (product.stock_quantity > 0) {
        // Update session with selected product
        await customerService.updateCustomerSession(customer.id, {
          ...sessionData,
          selectedProduct: product,
          conversationState: 'product_selected',
          lastInteraction: new Date()
        }, 'quantity_selection');
      } else {
        // Go back to product browsing
        await customerService.updateCustomerSession(customer.id, {
          conversationState: 'browsing_products',
          lastInteraction: new Date()
        }, 'browsing_products');
      }

    } catch (error) {
      console.error('Error handling product selection:', error.message);
      await this.sendErrorMessage(customer.whatsapp_number);
    }
  }

  // Handle quantity selection
  async handleQuantitySelection(context) {
    const { customer, session, messageText } = context;

    try {
      const sessionData = session.session_data;
      const selectedProduct = sessionData.selectedProduct;

      if (!selectedProduct) {
        return await this.handleWelcome(context);
      }

      // Parse quantity from message
      const quantity = this.parseQuantity(messageText);

      if (!quantity || quantity < 1) {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "Please enter a valid quantity (e.g., '2' or 'two')."
        );
        return;
      }

      if (quantity > selectedProduct.stock_quantity) {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          `Sorry, we only have ${selectedProduct.stock_quantity} units available. Please enter a smaller quantity.`
        );
        return;
      }

      // Calculate totals
      const subtotal = selectedProduct.price * quantity;
      const deliveryFee = 200; // Base delivery fee
      const total = subtotal + deliveryFee;

      // Show order summary
      const summaryMessage = `📋 *ORDER SUMMARY*

• ${selectedProduct.name} x${quantity} = KES ${subtotal}
• Delivery Fee = KES ${deliveryFee}
• *Total = KES ${total}*

📍 Delivery address needed. Please provide your delivery address:`;

      await whatsappService.sendTextMessage(customer.whatsapp_number, summaryMessage);

      // Update session
      await customerService.updateCustomerSession(customer.id, {
        ...sessionData,
        orderItems: [{
          productId: selectedProduct.id,
          name: selectedProduct.name,
          quantity: quantity,
          unitPrice: selectedProduct.price,
          total: subtotal
        }],
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        totalAmount: total,
        conversationState: 'quantity_selected',
        lastInteraction: new Date()
      }, 'address_confirmation');

    } catch (error) {
      console.error('Error handling quantity selection:', error.message);
      await this.sendErrorMessage(customer.whatsapp_number);
    }
  }

  // Handle address confirmation
  async handleAddressConfirmation(context) {
    const { customer, session, messageText } = context;

    try {
      const sessionData = session.session_data;
      
      if (!messageText || messageText.length < 10) {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "Please provide a complete delivery address including area/estate and nearest landmark."
        );
        return;
      }

      const deliveryAddress = messageText.trim();

      // Show final order confirmation
      const confirmationMessage = `✅ *CONFIRM YOUR ORDER*

📦 *Items:*
${sessionData.orderItems.map(item => `• ${item.name} x${item.quantity} = KES ${item.total}`).join('\n')}

💰 *Total Breakdown:*
• Subtotal: KES ${sessionData.subtotal}
• Delivery: KES ${sessionData.deliveryFee}
• *Total: KES ${sessionData.totalAmount}*

📍 *Delivery Address:*
${deliveryAddress}

Reply *CONFIRM* to place order or *CANCEL* to cancel.`;

      await whatsappService.sendTextMessage(customer.whatsapp_number, confirmationMessage);

      // Update session
      await customerService.updateCustomerSession(customer.id, {
        ...sessionData,
        deliveryAddress: deliveryAddress,
        conversationState: 'address_confirmed',
        lastInteraction: new Date()
      }, 'order_confirmation');

    } catch (error) {
      console.error('Error handling address confirmation:', error.message);
      await this.sendErrorMessage(customer.whatsapp_number);
    }
  }

  // Handle order confirmation
  async handleOrderConfirmation(context) {
    const { customer, session, messageText } = context;

    try {
      const sessionData = session.session_data;
      const response = messageText.toLowerCase().trim();

      if (response === 'confirm' || response === 'yes') {
        // Create order
        const orderData = {
          customerId: customer.id,
          customer: {
            name: customer.name || 'Customer',
            phone: customer.whatsapp_number,
            email: customer.email
          },
          items: sessionData.orderItems,
          totalAmount: sessionData.totalAmount,
          deliveryAddress: sessionData.deliveryAddress,
          currency: 'KES'
        };

        const order = await orderService.createOrder(orderData);

        // Show payment options
        await whatsappService.sendButtonMessage(
          customer.whatsapp_number,
          `🎯 Order #${order.order_number} created successfully!

💳 *Choose Payment Method:*`,
          [
            { id: 'mpesa', title: '📱 M-Pesa' },
            { id: 'airtel', title: '📱 Airtel Money' },
            { id: 'card', title: '💳 Card Payment' }
          ],
          null,
          'Select your preferred payment method'
        );

        // Update session
        await customerService.updateCustomerSession(customer.id, {
          orderId: order.id,
          orderNumber: order.order_number,
          conversationState: 'order_created',
          lastInteraction: new Date()
        }, 'payment_method');

      } else if (response === 'cancel' || response === 'no') {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "Order cancelled. Type 'menu' to start over or 'products' to browse again."
        );

        await customerService.clearCustomerSession(customer.id);

      } else {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "Please reply with *CONFIRM* to place the order or *CANCEL* to cancel."
        );
      }

    } catch (error) {
      console.error('Error handling order confirmation:', error.message);
      await this.sendErrorMessage(customer.whatsapp_number);
    }
  }

  // Handle payment method selection
  async handlePaymentMethod(context) {
    const { customer, session, messageText, button } = context;

    try {
      const sessionData = session.session_data;
      let paymentMethod;

      // Extract payment method from button or text
      if (button && button.payload) {
        paymentMethod = button.payload;
      } else {
        paymentMethod = this.extractPaymentMethod(messageText);
      }

      if (!paymentMethod) {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "Please select a payment method: M-Pesa, Airtel Money, or Card Payment."
        );
        return;
      }

      // Process payment
      const paymentResult = await orderService.processPayment(
        sessionData.orderId,
        paymentMethod,
        customer.whatsapp_number
      );

      // Send payment instructions
      await this.sendPaymentInstructions(customer.whatsapp_number, paymentMethod, paymentResult);

      // Update session
      await customerService.updateCustomerSession(customer.id, {
        ...sessionData,
        paymentMethod: paymentMethod,
        paymentId: paymentResult.payment.id,
        conversationState: 'payment_initiated',
        lastInteraction: new Date()
      }, 'payment_method');

    } catch (error) {
      console.error('Error handling payment method:', error.message);
      await this.sendErrorMessage(customer.whatsapp_number);
    }
  }

  // Handle interactive responses (buttons, lists)
  async handleInteractiveResponse(context) {
    const { customer, interactive, button, list } = context;

    try {
      let selectedId;

      if (button) {
        selectedId = button.payload || button.text;
      } else if (list) {
        selectedId = list.id;
      } else if (interactive && interactive.button_reply) {
        selectedId = interactive.button_reply.id;
      } else if (interactive && interactive.list_reply) {
        selectedId = interactive.list_reply.id;
      }

      if (!selectedId) {
        return await this.handleWelcome(context);
      }

      // Route based on selection
      if (selectedId.startsWith('product_')) {
        const productId = selectedId.replace('product_', '');
        context.messageText = productId;
        return await this.handleProductSelection(context);
      }

      // Handle main menu selections
      switch (selectedId) {
        case 'browse_products':
          return await this.handleProductBrowsing(context);
        case 'track_order':
          return await this.handleOrderTracking(context);
        case 'order_history':
          return await this.showOrderHistory(context);
        case 'mpesa':
        case 'airtel':
        case 'card':
          context.messageText = selectedId;
          return await this.handlePaymentMethod(context);
        default:
          return await this.handleWelcome(context);
      }

    } catch (error) {
      console.error('Error handling interactive response:', error.message);
      await this.sendErrorMessage(customer.whatsapp_number);
    }
  }

  // Handle natural language queries
  async handleNaturalLanguageQuery(context) {
    const { customer, messageText } = context;

    const query = messageText.toLowerCase();

    // Product search keywords
    if (query.includes('maize') || query.includes('flour') || query.includes('coffee') || 
        query.includes('honey') || query.includes('buy') || query.includes('need')) {
      context.messageText = messageText;
      return await this.handleProductBrowsing(context);
    }

    // Order tracking keywords
    if (query.includes('track') || query.includes('order') || query.includes('delivery')) {
      return await this.handleOrderTracking(context);
    }

    // Help keywords
    if (query.includes('help') || query.includes('support') || query.includes('problem')) {
      return await this.showHelp(context);
    }

    // Default to main menu
    return await this.showMainMenu(context);
  }

  // Utility methods
  extractCommand(messageText) {
    if (!messageText) return null;
    
    const text = messageText.toLowerCase().trim();
    const commands = ['menu', 'products', 'orders', 'help', 'track', 'reorder', 'cancel'];
    
    return commands.find(cmd => text === cmd || text.startsWith(cmd));
  }

  extractProductId(messageText, sessionData) {
    // Try to extract product ID from message or session data
    if (sessionData && sessionData.availableProducts) {
      const products = sessionData.availableProducts;
      
      // Check if message is a number (product index)
      const index = parseInt(messageText) - 1;
      if (index >= 0 && index < products.length) {
        return products[index].id;
      }

      // Check if message contains product name
      const product = products.find(p => 
        p.name.toLowerCase().includes(messageText.toLowerCase())
      );
      
      return product ? product.id : null;
    }

    return null;
  }

  parseQuantity(messageText) {
    const text = messageText.toLowerCase().trim();
    
    // Handle numeric input
    const numMatch = text.match(/\d+/);
    if (numMatch) {
      return parseInt(numMatch[0]);
    }

    // Handle word numbers
    const wordNumbers = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };

    return wordNumbers[text] || null;
  }

  extractPaymentMethod(messageText) {
    const text = messageText.toLowerCase().trim();
    
    if (text.includes('mpesa') || text.includes('m-pesa') || text === '1') {
      return 'mpesa';
    }
    if (text.includes('airtel') || text === '2') {
      return 'airtel';
    }
    if (text.includes('card') || text.includes('visa') || text.includes('mastercard') || text === '3') {
      return 'card';
    }

    return null;
  }

  async sendPaymentInstructions(phone, paymentMethod, paymentResult) {
    let message;

    switch (paymentMethod) {
      case 'mpesa':
        message = `📱 *M-Pesa Payment Initiated*

Check your phone for STK Push notification.

💰 Amount: KES ${paymentResult.ghalaPayment.amount}
🏢 Business: YourBusiness
📱 Phone: ${phone}

⏰ Please complete payment within 5 minutes.
You'll receive a confirmation once payment is successful.`;
        break;

      case 'airtel':
        message = `📱 *Airtel Money Payment*

You'll receive a payment prompt shortly.

💰 Amount: KES ${paymentResult.ghalaPayment.amount}
📱 Phone: ${phone}

Please complete the payment to proceed with your order.`;
        break;

      case 'card':
        message = `💳 *Card Payment*

Click the link below to complete payment:
${paymentResult.ghalaPayment.payment_url}

💰 Amount: KES ${paymentResult.ghalaPayment.amount}
🔒 Secure payment powered by Ghala

Complete payment within 15 minutes.`;
        break;

      default:
        message = "Payment initiated. Please follow the instructions sent to complete your payment.";
    }

    await whatsappService.sendTextMessage(phone, message);
  }

  async sendErrorMessage(phone) {
    await whatsappService.sendTextMessage(
      phone,
      "Sorry, something went wrong. Please type 'menu' to start over or 'help' for assistance."
    );
  }

  async showHelp(context) {
    const { customer } = context;

    const helpMessage = `🆘 *HELP & SUPPORT*

*Quick Commands:*
• Type 'menu' - Main menu
• Type 'products' - Browse products
• Type 'track' - Track your order
• Type 'orders' - Order history

*How to Order:*
1. Browse products
2. Select item and quantity
3. Provide delivery address
4. Choose payment method
5. Complete payment

*Need Human Support?*
Call: +254 700 000 000
Email: support@yourbusiness.com

*Business Hours:*
Mon-Fri: 8AM-6PM
Sat: 9AM-1PM`;

    await whatsappService.sendTextMessage(customer.whatsapp_number, helpMessage);
  }

  async showOrderHistory(context) {
    const { customer } = context;

    try {
      const orders = await orderService.getCustomerOrders(customer.id, 5);

      if (orders.length === 0) {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "You haven't placed any orders yet. Type 'products' to start shopping!"
        );
        return;
      }

      let historyMessage = "📋 *YOUR ORDER HISTORY*\n\n";

      orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        const status = order.status.toUpperCase();
        
        historyMessage += `🔸 Order #${order.order_number}
📅 ${date}
💰 KES ${order.total_amount}
📊 Status: ${status}
📦 Items: ${order.item_count}

`;
      });

      historyMessage += "Reply with order number to track specific order.";

      await whatsappService.sendTextMessage(customer.whatsapp_number, historyMessage);

    } catch (error) {
      console.error('Error showing order history:', error.message);
      await this.sendErrorMessage(customer.whatsapp_number);
    }
  }

  async handleOrderTracking(context) {
    const { customer, messageText } = context;

    try {
      // If no order number provided, show recent orders
      if (!messageText || messageText.toLowerCase() === 'track') {
        const recentOrders = await orderService.getCustomerOrders(customer.id, 3);
        
        if (recentOrders.length === 0) {
          await whatsappService.sendTextMessage(
            customer.whatsapp_number,
            "You don't have any orders to track. Type 'products' to place your first order!"
          );
          return;
        }

        const sections = [{
          title: 'Recent Orders',
          rows: recentOrders.map(order => ({
            id: `track_${order.order_number}`,
            title: `Order #${order.order_number}`,
            description: `${order.status.toUpperCase()} - KES ${order.total_amount}`
          }))
        }];

        await whatsappService.sendListMessage(
          customer.whatsapp_number,
          "📦 Select an order to track:",
          "Track Order",
          sections
        );

        return;
      }

      // Extract order number from message
      const orderNumber = this.extractOrderNumber(messageText);
      if (!orderNumber) {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "Please provide a valid order number (e.g., ORD-2024-001)."
        );
        return;
      }

      // Get order details
      const order = await orderService.getOrderByNumber(orderNumber);
      
      if (!order || order.customer_id !== customer.id) {
        await whatsappService.sendTextMessage(
          customer.whatsapp_number,
          "Order not found. Please check the order number and try again."
        );
        return;
      }

      // Show order tracking info
      const trackingMessage = this.formatOrderTracking(order);
      await whatsappService.sendTextMessage(customer.whatsapp_number, trackingMessage);

    } catch (error) {
      console.error('Error handling order tracking:', error.message);
      await this.sendErrorMessage(customer.whatsapp_number);
    }
  }

  extractOrderNumber(messageText) {
    const orderMatch = messageText.match(/ORD-\d{4}-\d{3}/i);
    return orderMatch ? orderMatch[0].toUpperCase() : null;
  }

  formatOrderTracking(order) {
    const statusEmojis = {
      'pending': '⏳',
      'confirmed': '✅',
      'processing': '⚙️',
      'shipped': '🚚',
      'out_for_delivery': '🚛',
      'delivered': '📦',
      'cancelled': '❌'
    };

    const statusMessages = {
      'pending': 'Order received, awaiting payment',
      'confirmed': 'Payment confirmed, preparing order',
      'processing': 'Order is being prepared',
      'shipped': 'Order shipped and on the way',
      'out_for_delivery': 'Order out for delivery',
      'delivered': 'Order delivered successfully',
      'cancelled': 'Order cancelled'
    };

    let message = `📦 *ORDER TRACKING*

🔸 Order #${order.order_number}
${statusEmojis[order.status]} Status: ${statusMessages[order.status]}
💰 Total: KES ${order.total_amount}
📅 Ordered: ${new Date(order.created_at).toLocaleDateString()}

📍 *Delivery Address:*
${order.delivery_address}

`;

    if (order.tracking_number) {
      message += `🚚 Tracking: ${order.tracking_number}\n`;
    }

    if (order.otp_code && order.status === 'out_for_delivery') {
      message += `🔐 Delivery OTP: ${order.otp_code}\n`;
    }

    if (order.delivered_at) {
      message += `✅ Delivered: ${new Date(order.delivered_at).toLocaleDateString()}\n`;
    }

    message += "\nNeed help? Reply 'help' for support options.";

    return message;
  }

  async handleUnknownStep(context) {
    console.warn('Unknown conversation step:', context.session?.current_step);
    return await this.handleWelcome(context);
  }
}

module.exports = new ConversationHandler();