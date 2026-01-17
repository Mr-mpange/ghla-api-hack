const axios = require('axios');
const logger = require('../utils/logger');

class CarRentalBotService {
  constructor() {
    this.cars = this.initializeCarCatalog();
    this.bookings = new Map(); // In-memory storage for demo
    this.customerSessions = new Map(); // Track customer conversation state
  }

  /**
   * Initialize car catalog with real data
   */
  initializeCarCatalog() {
    return {
      economy: [
        {
          id: 'eco_001',
          name: 'Toyota Vitz',
          price: 2500,
          features: ['Automatic', 'AC', 'Fuel Efficient', '4 Seats'],
          image: 'https://example.com/images/toyota-vitz.jpg',
          available: true,
          location: 'Nairobi, Dar es Salaam'
        },
        {
          id: 'eco_002',
          name: 'Nissan March',
          price: 2800,
          features: ['Manual/Auto', 'AC', 'Bluetooth', '4 Seats'],
          image: 'https://example.com/images/nissan-march.jpg',
          available: true,
          location: 'Nairobi, Mombasa'
        },
        {
          id: 'eco_003',
          name: 'Suzuki Swift',
          price: 3000,
          features: ['Automatic', 'AC', 'Sport Mode', '4 Seats'],
          image: 'https://example.com/images/suzuki-swift.jpg',
          available: false,
          location: 'Nairobi'
        }
      ],
      suv: [
        {
          id: 'suv_001',
          name: 'Toyota RAV4',
          price: 4500,
          features: ['AWD', 'Automatic', 'AC', '7 Seats', 'GPS'],
          image: 'https://example.com/images/toyota-rav4.jpg',
          available: true,
          location: 'Nairobi, Dar es Salaam, Mombasa'
        },
        {
          id: 'suv_002',
          name: 'Honda CR-V',
          price: 5000,
          features: ['AWD', 'Automatic', 'Sunroof', '5 Seats', 'Premium Sound'],
          image: 'https://example.com/images/honda-crv.jpg',
          available: true,
          location: 'Nairobi, Kampala'
        },
        {
          id: 'suv_003',
          name: 'Mazda CX-5',
          price: 5500,
          features: ['AWD', 'Automatic', 'Leather', '5 Seats', 'Premium Interior'],
          image: 'https://example.com/images/mazda-cx5.jpg',
          available: true,
          location: 'Nairobi'
        }
      ],
      luxury: [
        {
          id: 'lux_001',
          name: 'Mercedes C-Class',
          price: 8000,
          features: ['Automatic', 'Leather', 'Premium Sound', '5 Seats', 'GPS', 'Sunroof'],
          image: 'https://example.com/images/mercedes-c-class.jpg',
          available: true,
          location: 'Nairobi, Dar es Salaam'
        },
        {
          id: 'lux_002',
          name: 'BMW 3 Series',
          price: 9000,
          features: ['Automatic', 'Sport Mode', 'Premium Interior', '5 Seats', 'iDrive'],
          image: 'https://example.com/images/bmw-3-series.jpg',
          available: true,
          location: 'Nairobi'
        },
        {
          id: 'lux_003',
          name: 'Audi A4',
          price: 10000,
          features: ['Quattro AWD', 'Automatic', 'Virtual Cockpit', '5 Seats', 'Premium Plus'],
          image: 'https://example.com/images/audi-a4.jpg',
          available: false,
          location: 'Nairobi, Kampala'
        }
      ],
      van: [
        {
          id: 'van_001',
          name: 'Toyota Hiace',
          price: 6000,
          features: ['Manual', 'AC', '14 Seats', 'Luggage Space'],
          image: 'https://example.com/images/toyota-hiace.jpg',
          available: true,
          location: 'Nairobi, Dar es Salaam, Mombasa'
        },
        {
          id: 'van_002',
          name: 'Nissan Caravan',
          price: 7000,
          features: ['Automatic', 'AC', '12 Seats', 'Premium Interior'],
          image: 'https://example.com/images/nissan-caravan.jpg',
          available: true,
          location: 'Nairobi, Kampala'
        }
      ]
    };
  }

  /**
   * Process customer message with advanced bot intelligence
   */
  async processMessage(phoneNumber, message, customerName = 'Customer') {
    try {
      logger.info(`Processing message from ${customerName} (+${phoneNumber}): "${message}"`);

      // Get or create customer session
      const session = this.getCustomerSession(phoneNumber);
      const lowerMessage = message.toLowerCase();

      // Update session with current message
      session.lastMessage = message;
      session.messageCount++;

      // Determine intent and generate response
      let response;
      let messageType = 'text';
      let buttons = null;
      let listItems = null;

      // Handle button clicks and interactive responses
      if (this.isButtonClick(message)) {
        return this.handleButtonClick(message, session, customerName, phoneNumber);
      }

      // Greeting and welcome
      if (this.isGreeting(lowerMessage)) {
        response = this.generateWelcomeMessage(customerName);
        buttons = this.getMainMenuButtons();
        messageType = 'interactive_buttons';
        session.state = 'main_menu';
      }
      // Car catalog requests
      else if (this.isCarCatalogRequest(lowerMessage)) {
        const category = this.extractCarCategory(lowerMessage);
        if (category) {
          response = this.generateCarCatalog(category, customerName);
          buttons = this.getCarCategoryButtons(category);
          messageType = 'interactive_buttons';
          session.state = 'browsing_cars';
          session.selectedCategory = category;
        } else {
          response = this.generateCategorySelection(customerName);
          listItems = this.getCategoryListItems();
          messageType = 'interactive_list';
          session.state = 'selecting_category';
        }
      }
      // Specific car selection
      else if (this.isCarSelection(lowerMessage)) {
        const carId = this.extractCarId(lowerMessage, session.selectedCategory);
        if (carId) {
          const car = this.getCarById(carId);
          response = this.generateCarDetails(car, customerName);
          buttons = this.getCarActionButtons(carId);
          messageType = 'interactive_buttons';
          session.state = 'viewing_car';
          session.selectedCar = carId;
        } else {
          response = this.generateCarNotFound(customerName);
        }
      }
      // Booking requests
      else if (this.isBookingRequest(lowerMessage)) {
        if (session.selectedCar) {
          response = this.generateBookingForm(session.selectedCar, customerName);
          buttons = this.getBookingFormButtons();
          messageType = 'interactive_buttons';
          session.state = 'booking_form';
        } else {
          response = this.generateSelectCarFirst(customerName);
          buttons = this.getMainMenuButtons();
          messageType = 'interactive_buttons';
        }
      }
      // Booking form processing
      else if (session.state === 'booking_form' && this.isBookingDetails(lowerMessage)) {
        const bookingDetails = this.extractBookingDetails(message);
        if (bookingDetails.isValid) {
          const booking = this.createBooking(phoneNumber, session.selectedCar, bookingDetails, customerName);
          response = this.generateBookingConfirmation(booking, customerName);
          buttons = this.getPaymentButtons(booking.id);
          messageType = 'interactive_buttons';
          session.state = 'payment_pending';
          session.currentBooking = booking.id;
        } else {
          response = this.generateBookingFormError(bookingDetails.errors, customerName);
          buttons = this.getBookingFormButtons();
          messageType = 'interactive_buttons';
        }
      }
      // Payment processing
      else if (session.state === 'payment_pending' && this.isPaymentRequest(lowerMessage)) {
        const booking = this.bookings.get(session.currentBooking);
        response = this.generatePaymentInstructions(booking, customerName);
        buttons = this.getPaymentConfirmationButtons(booking.id);
        messageType = 'interactive_buttons';
        session.state = 'payment_instructions';
      }
      // Payment confirmation
      else if (session.state === 'payment_instructions' && this.isPaymentConfirmation(lowerMessage)) {
        const booking = this.bookings.get(session.currentBooking);
        response = this.generatePaymentSuccess(booking, customerName);
        buttons = this.getPostPaymentButtons();
        messageType = 'interactive_buttons';
        session.state = 'booking_complete';
        // Update booking status
        booking.status = 'paid';
        booking.paymentDate = new Date().toISOString();
      }
      // Price inquiries
      else if (this.isPriceInquiry(lowerMessage)) {
        response = this.generatePricingInfo(customerName);
        buttons = this.getCategoryButtons();
        messageType = 'interactive_buttons';
      }
      // Location and availability
      else if (this.isLocationInquiry(lowerMessage)) {
        response = this.generateLocationInfo(customerName);
        buttons = this.getMainMenuButtons();
        messageType = 'interactive_buttons';
      }
      // Help and support
      else if (this.isHelpRequest(lowerMessage)) {
        response = this.generateHelpMessage(customerName);
        buttons = this.getHelpButtons();
        messageType = 'interactive_buttons';
      }
      // Check existing bookings
      else if (this.isBookingCheck(lowerMessage)) {
        const customerBookings = this.getCustomerBookings(phoneNumber);
        response = this.generateBookingStatus(customerBookings, customerName);
        if (customerBookings.length > 0) {
          buttons = this.getBookingManagementButtons();
          messageType = 'interactive_buttons';
        } else {
          buttons = this.getMainMenuButtons();
          messageType = 'interactive_buttons';
        }
      }
      // Default response with smart suggestions
      else {
        response = this.generateSmartResponse(message, session, customerName);
        buttons = this.getContextualButtons(session);
        messageType = 'interactive_buttons';
      }

      // Update session
      this.updateCustomerSession(phoneNumber, session);

      return {
        success: true,
        response: response,
        messageType: messageType,
        buttons: buttons,
        listItems: listItems,
        customerName: customerName,
        phoneNumber: phoneNumber,
        sessionState: session.state
      };

    } catch (error) {
      logger.error('Error processing car rental message:', error);
      return {
        success: false,
        error: error.message,
        response: `Sorry ${customerName}, I encountered an error. Please try again or contact support.`
      };
    }
  }

  /**
   * Generate welcome message with personalization
   */
  generateWelcomeMessage(customerName) {
    return `👋 Hello ${customerName}! Welcome to CarRental Pro!

🚗 **Your Premium Car Rental Service**

I'm your personal car rental assistant. I can help you:

🔍 **Browse Our Fleet**
• Economy cars from KES 2,500/day
• SUVs from KES 4,500/day  
• Luxury cars from KES 8,000/day
• Vans from KES 6,000/day

📅 **Quick Services**
• Instant availability check
• Real-time booking
• Price comparisons
• Location-based search

💎 **Premium Features**
• 24/7 support
• Free delivery
• Comprehensive insurance
• Flexible payment options

What would you like to do today?`;
  }

  /**
   * Generate car catalog with images and details
   */
  generateCarCatalog(category, customerName) {
    const cars = this.cars[category] || [];
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    
    let catalog = `🚗 **${categoryName} Cars Available for ${customerName}**\n\n`;
    
    cars.forEach((car, index) => {
      const status = car.available ? '✅ Available' : '❌ Unavailable';
      const features = car.features.slice(0, 3).join(' • ');
      
      catalog += `**${index + 1}. ${car.name}** ${status}
💰 KES ${car.price.toLocaleString()}/day
⭐ ${features}
📍 ${car.location}

`;
    });

    catalog += `💡 **Tip**: Reply with the car number (e.g., "1" for ${cars[0]?.name}) to see full details and book!

🔄 **Need something else?** Try:
• "Show luxury cars"
• "Compare prices"
• "Check availability"`;

    return catalog;
  }

  /**
   * Generate detailed car information
   */
  generateCarDetails(car, customerName) {
    if (!car) return `Sorry ${customerName}, car not found.`;

    const status = car.available ? '✅ Available Now' : '❌ Currently Unavailable';
    const features = car.features.join('\n• ');

    return `🚗 **${car.name}** - Detailed Information

${status}
💰 **Price**: KES ${car.price.toLocaleString()}/day
📍 **Locations**: ${car.location}

⭐ **Features**:
• ${features}

📋 **What's Included**:
• Comprehensive insurance
• 24/7 roadside assistance
• Free delivery within city
• Unlimited mileage
• Full tank of fuel

💳 **Payment Options**:
• M-Pesa (50% deposit)
• Bank transfer
• Cash on delivery

${car.available ? '🎯 Ready to book this car?' : '🔄 Would you like to see similar available cars?'}`;
  }

  /**
   * Generate booking form
   */
  generateBookingForm(carId, customerName) {
    const car = this.getCarById(carId);
    if (!car) return `Sorry ${customerName}, car not found.`;

    return `📅 **Book ${car.name} - ${customerName}**

🚗 **Selected Car**: ${car.name}
💰 **Daily Rate**: KES ${car.price.toLocaleString()}
📍 **Available Locations**: ${car.location}

⚡ **Quick Booking Options**:

**1. Same Day Rental**
• Today 2PM - Tomorrow 2PM
• Total: KES ${car.price.toLocaleString()}
• Deposit: KES ${Math.floor(car.price * 0.5).toLocaleString()}

**2. Weekend Special**
• Friday 6PM - Sunday 6PM
• Total: KES ${(car.price * 2).toLocaleString()}
• Deposit: KES ${Math.floor(car.price).toLocaleString()}

**3. Weekly Deal**
• 7 days rental
• Total: KES ${(car.price * 6).toLocaleString()} (1 day FREE!)
• Deposit: KES ${Math.floor(car.price * 3).toLocaleString()}

📝 **Or provide custom details**:
"Book from [Date] [Time] to [Date] [Time] at [Location]"

Example: "Book from Jan 25 9am to Jan 27 6pm at JKIA"

Choose an option below or send custom details!`;
  }

  /**
   * Enhanced booking details extraction
   */
  extractBookingDetails(message) {
    const details = {
      isValid: false,
      errors: [],
      pickupDate: null,
      returnDate: null,
      pickupLocation: null,
      customerInfo: {},
      totalDays: 0,
      bookingType: 'custom'
    };

    const lowerMessage = message.toLowerCase();

    // Handle quick booking options
    if (lowerMessage.includes('same day') || lowerMessage.includes('today')) {
      details.isValid = true;
      details.bookingType = 'same_day';
      details.pickupDate = 'Today 2:00 PM';
      details.returnDate = 'Tomorrow 2:00 PM';
      details.pickupLocation = 'Main Office';
      details.totalDays = 1;
      return details;
    }

    if (lowerMessage.includes('weekend') || lowerMessage.includes('friday')) {
      details.isValid = true;
      details.bookingType = 'weekend';
      details.pickupDate = 'Friday 6:00 PM';
      details.returnDate = 'Sunday 6:00 PM';
      details.pickupLocation = 'Main Office';
      details.totalDays = 2;
      return details;
    }

    if (lowerMessage.includes('weekly') || lowerMessage.includes('week')) {
      details.isValid = true;
      details.bookingType = 'weekly';
      details.pickupDate = 'Tomorrow 9:00 AM';
      details.returnDate = 'Next Week 9:00 AM';
      details.pickupLocation = 'Main Office';
      details.totalDays = 7;
      return details;
    }

    // Handle custom booking details
    if (message.length > 20 && lowerMessage.includes('book')) {
      // Simple validation for custom bookings
      if (lowerMessage.includes('from') && lowerMessage.includes('to')) {
        details.isValid = true;
        details.bookingType = 'custom';
        details.pickupDate = 'As specified';
        details.returnDate = 'As specified';
        details.pickupLocation = 'As specified';
        details.totalDays = 3; // Default
        return details;
      }
    }

    // If we get here, booking details are incomplete
    details.errors.push('Please select a quick booking option or provide complete details');
    return details;
  }

  /**
   * Create booking with validation
   */
  createBooking(phoneNumber, carId, details, customerName) {
    const car = this.getCarById(carId);
    const bookingId = `BK${Date.now()}`;
    
    const booking = {
      id: bookingId,
      customerId: phoneNumber,
      customerName: customerName,
      carId: carId,
      carName: car.name,
      pickupDate: details.pickupDate,
      returnDate: details.returnDate,
      pickupLocation: details.pickupLocation,
      totalDays: details.totalDays,
      dailyRate: car.price,
      totalAmount: car.price * details.totalDays,
      deposit: Math.floor(car.price * details.totalDays * 0.5),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      customerDetails: details.customerInfo
    };

    this.bookings.set(bookingId, booking);
    
    // Mark car as temporarily unavailable
    car.available = false;
    
    return booking;
  }

  /**
   * Generate booking confirmation
   */
  generateBookingConfirmation(booking, customerName) {
    return `🎉 **Booking Confirmed!**

**Booking ID**: ${booking.id}
**Customer**: ${customerName}
**Car**: ${booking.carName}

📅 **Rental Period**:
• Pickup: ${booking.pickupDate}
• Return: ${booking.returnDate}
• Duration: ${booking.totalDays} days

📍 **Pickup Location**: ${booking.pickupLocation}

💰 **Payment Summary**:
• Daily Rate: KES ${booking.dailyRate.toLocaleString()}
• Total Amount: KES ${booking.totalAmount.toLocaleString()}
• Deposit Due: KES ${booking.deposit.toLocaleString()}

📱 **Next Steps**:
1. Pay deposit via M-Pesa: 0700123456
2. We'll deliver the car to your location
3. Complete payment on delivery

📞 **Support**: +255683859574
📧 **Email**: bookings@carrentalpro.com

Thank you for choosing CarRental Pro! 🚗✨`;
  }

  /**
   * Generate category selection message
   */
  generateCategorySelection(customerName) {
    return `🚗 **Choose Your Car Category, ${customerName}**

Which type of vehicle are you looking for?

💰 **Economy Cars** - Perfect for city driving
• From KES 2,500/day
• Fuel efficient and easy to park

🚙 **SUVs** - Great for families and adventures  
• From KES 4,500/day
• Spacious and reliable

🏎️ **Luxury Cars** - Premium experience
• From KES 8,000/day
• Top-of-the-line features

🚐 **Vans** - Perfect for groups
• From KES 6,000/day
• Seats up to 14 people

Select a category to see available cars!`;
  }

  /**
   * Get car category buttons
   */
  getCarCategoryButtons(category) {
    const cars = this.cars[category] || [];
    return cars.slice(0, 3).map((car, index) => ({
      id: `car_${car.id}`,
      title: `${index + 1}. ${car.name.substring(0, 15)}`
    }));
  }

  /**
   * Handle button clicks and interactive responses
   */
  handleButtonClick(buttonId, session, customerName, phoneNumber) {
    let response, buttons, messageType = 'interactive_buttons', listItems = null;

    switch (buttonId) {
      case '🚗 Browse Cars':
      case 'browse_cars':
        response = this.generateCategorySelection(customerName);
        listItems = this.getCategoryListItems();
        messageType = 'interactive_list';
        session.state = 'selecting_category';
        break;

      case '💰 Check Prices':
      case 'check_prices':
        response = this.generatePricingInfo(customerName);
        buttons = this.getCategoryButtons();
        session.state = 'checking_prices';
        break;

      case '📋 My Bookings':
      case 'my_bookings':
        const customerBookings = this.getCustomerBookings(phoneNumber);
        response = this.generateBookingStatus(customerBookings, customerName);
        buttons = customerBookings.length > 0 ? this.getBookingManagementButtons() : this.getMainMenuButtons();
        session.state = 'viewing_bookings';
        break;

      case '🆘 Get Help':
      case 'get_help':
        response = this.generateHelpMessage(customerName);
        buttons = this.getHelpButtons();
        session.state = 'getting_help';
        break;

      // Category selections
      case 'economy':
        response = this.generateCarCatalog('economy', customerName);
        buttons = this.getCarCategoryButtons('economy');
        session.state = 'browsing_cars';
        session.selectedCategory = 'economy';
        break;

      case 'suv':
        response = this.generateCarCatalog('suv', customerName);
        buttons = this.getCarCategoryButtons('suv');
        session.state = 'browsing_cars';
        session.selectedCategory = 'suv';
        break;

      case 'luxury':
        response = this.generateCarCatalog('luxury', customerName);
        buttons = this.getCarCategoryButtons('luxury');
        session.state = 'browsing_cars';
        session.selectedCategory = 'luxury';
        break;

      case 'van':
        response = this.generateCarCatalog('van', customerName);
        buttons = this.getCarCategoryButtons('van');
        session.state = 'browsing_cars';
        session.selectedCategory = 'van';
        break;

      // Car selections
      default:
        if (buttonId.startsWith('car_')) {
          const carId = buttonId.replace('car_', '');
          const car = this.getCarById(carId);
          if (car) {
            response = this.generateCarDetails(car, customerName);
            buttons = this.getCarActionButtons(carId);
            session.state = 'viewing_car';
            session.selectedCar = carId;
          } else {
            response = this.generateCarNotFound(customerName);
            buttons = this.getMainMenuButtons();
          }
        }
        // Book car buttons
        else if (buttonId.startsWith('book_')) {
          const carId = buttonId.replace('book_', '');
          response = this.generateBookingForm(carId, customerName);
          buttons = this.getBookingFormButtons();
          session.state = 'booking_form';
          session.selectedCar = carId;
        }
        // Payment buttons
        else if (buttonId.startsWith('pay_')) {
          const bookingId = buttonId.replace('pay_', '');
          const booking = this.bookings.get(bookingId);
          if (booking) {
            response = this.generatePaymentInstructions(booking, customerName);
            buttons = this.getPaymentConfirmationButtons(bookingId);
            session.state = 'payment_instructions';
          }
        }
        // Payment confirmation
        else if (buttonId.startsWith('confirm_payment_')) {
          const bookingId = buttonId.replace('confirm_payment_', '');
          const booking = this.bookings.get(bookingId);
          if (booking) {
            response = this.generatePaymentSuccess(booking, customerName);
            buttons = this.getPostPaymentButtons();
            session.state = 'booking_complete';
            booking.status = 'paid';
            booking.paymentDate = new Date().toISOString();
          }
        }
        // Default fallback
        else {
          response = this.generateSmartResponse(buttonId, session, customerName);
          buttons = this.getMainMenuButtons();
        }
        break;
    }

    this.updateCustomerSession(phoneNumber, session);

    return {
      success: true,
      response: response,
      messageType: messageType,
      buttons: buttons,
      listItems: listItems,
      customerName: customerName,
      phoneNumber: phoneNumber,
      sessionState: session.state
    };
  }

  /**
   * Check if message is a button click
   */
  isButtonClick(message) {
    const buttonPatterns = [
      '🚗 Browse Cars', '💰 Check Prices', '📋 My Bookings', '🆘 Get Help',
      'browse_cars', 'check_prices', 'my_bookings', 'get_help',
      'economy', 'suv', 'luxury', 'van'
    ];
    return buttonPatterns.includes(message) || 
           message.startsWith('car_') || 
           message.startsWith('book_') || 
           message.startsWith('pay_') ||
           message.startsWith('confirm_payment_');
  }

  /**
   * Check if message is payment request
   */
  isPaymentRequest(message) {
    const keywords = ['pay', 'payment', 'deposit', 'mpesa', 'bank', 'cash'];
    return keywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  /**
   * Check if message is payment confirmation
   */
  isPaymentConfirmation(message) {
    const keywords = ['paid', 'sent', 'transferred', 'completed', 'done', 'confirm'];
    return keywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  /**
   * Generate payment instructions
   */
  generatePaymentInstructions(booking, customerName) {
    return `💳 **Payment Instructions for ${customerName}**

**Booking ID**: ${booking.id}
**Car**: ${booking.carName}
**Total Amount**: KES ${booking.totalAmount.toLocaleString()}
**Deposit Required**: KES ${booking.deposit.toLocaleString()}

📱 **M-Pesa Payment**:
• Paybill: 400200
• Account: ${booking.id}
• Amount: KES ${booking.deposit.toLocaleString()}

🏦 **Bank Transfer**:
• Bank: KCB Bank
• Account: 1234567890
• Name: CarRental Pro Ltd
• Reference: ${booking.id}

💵 **Cash Payment**:
• Visit our office with booking ID
• Pay at pickup location

⏰ **Payment Deadline**: 2 hours from now
📞 **Support**: +255683859574

After payment, click "Payment Sent" below.`;
  }

  /**
   * Generate payment success message
   */
  generatePaymentSuccess(booking, customerName) {
    return `🎉 **Payment Confirmed! Thank you ${customerName}!**

**Booking ID**: ${booking.id}
**Status**: ✅ PAID & CONFIRMED
**Car**: ${booking.carName}
**Pickup**: ${booking.pickupDate} at ${booking.pickupLocation}

📋 **Next Steps**:
1. ✅ Payment received and confirmed
2. 🚗 Car will be prepared for pickup
3. 📱 You'll receive pickup confirmation
4. 🔑 Collect car at scheduled time

📞 **Pickup Contact**: +255683859574
📧 **Email Confirmation**: Sent to your phone

🎯 **Important**:
• Bring valid ID/Passport
• Arrive 15 minutes early
• Car will be fully fueled
• Insurance documents included

Thank you for choosing CarRental Pro! 🚗✨`;
  }

  /**
   * Get booking form buttons
   */
  getBookingFormButtons() {
    return [
      { id: 'quick_booking', title: '⚡ Quick Booking' },
      { id: 'custom_booking', title: '📝 Custom Details' },
      { id: 'back_to_cars', title: '⬅️ Back to Cars' }
    ];
  }

  /**
   * Get payment buttons
   */
  getPaymentButtons(bookingId) {
    return [
      { id: `pay_${bookingId}`, title: '💳 Pay Now' },
      { id: 'payment_help', title: '❓ Payment Help' },
      { id: 'modify_booking', title: '✏️ Modify Booking' }
    ];
  }

  /**
   * Get payment confirmation buttons
   */
  getPaymentConfirmationButtons(bookingId) {
    return [
      { id: `confirm_payment_${bookingId}`, title: '✅ Payment Sent' },
      { id: 'payment_help', title: '❓ Need Help' },
      { id: 'contact_support', title: '📞 Call Support' }
    ];
  }

  /**
   * Get post-payment buttons
   */
  getPostPaymentButtons() {
    return [
      { id: 'pickup_details', title: '📍 Pickup Details' },
      { id: 'add_extras', title: '➕ Add Extras' },
      { id: 'new_booking', title: '🆕 New Booking' }
    ];
  }

  /**
   * Get category list items
   */
  getCategoryListItems() {
    return [
      {
        title: "Car Categories",
        rows: [
          { id: "economy", title: "Economy Cars", description: "From KES 2,500/day" },
          { id: "suv", title: "SUVs", description: "From KES 4,500/day" },
          { id: "luxury", title: "Luxury Cars", description: "From KES 8,000/day" },
          { id: "van", title: "Vans", description: "From KES 6,000/day" }
        ]
      }
    ];
  }

  /**
   * Check if message is car selection
   */
  isCarSelection(message) {
    const numbers = ['1', '2', '3', '4', '5'];
    return numbers.some(num => message.trim() === num) || 
           message.toLowerCase().includes('select') ||
           message.toLowerCase().includes('choose');
  }

  /**
   * Extract car ID from message
   */
  extractCarId(message, category) {
    if (!category) return null;
    
    const cars = this.cars[category] || [];
    const messageNum = parseInt(message.trim());
    
    if (messageNum >= 1 && messageNum <= cars.length) {
      return cars[messageNum - 1].id;
    }
    
    return null;
  }

  /**
   * Generate car not found message
   */
  generateCarNotFound(customerName) {
    return `Sorry ${customerName}, I couldn't find that car. 

Please try:
• Selecting a number (1, 2, 3, etc.)
• Saying "Show me SUVs" 
• Or "Browse cars"

What would you like to do?`;
  }

  /**
   * Generate select car first message
   */
  generateSelectCarFirst(customerName) {
    return `Hi ${customerName}! To make a booking, please first select a car.

You can:
• Browse our car categories
• Check specific car types
• View available vehicles

What type of car interests you?`;
  }

  /**
   * Get car action buttons
   */
  getCarActionButtons(carId) {
    return [
      { id: `book_${carId}`, title: '📅 Book This Car' },
      { id: 'compare_cars', title: '🔄 Compare Cars' },
      { id: 'back_catalog', title: '⬅️ Back to Catalog' }
    ];
  }

  /**
   * Check if message contains booking details
   */
  isBookingDetails(message) {
    const keywords = ['name:', 'id:', 'from', 'to', 'pickup', 'book'];
    return keywords.some(keyword => message.toLowerCase().includes(keyword)) && message.length > 30;
  }

  /**
   * Generate booking form error
   */
  generateBookingFormError(errors, customerName) {
    return `Sorry ${customerName}, there were some issues with your booking details:

❌ **Issues Found:**
${errors.map(error => `• ${error}`).join('\n')}

Please provide complete booking information:

**Format**: 
"Book [Car Name] from [Date] [Time] to [Date] [Time] at [Location]. Name: [Your Name], ID: [ID Number]"

**Example**:
"Book Toyota RAV4 from Jan 20 9am to Jan 22 6pm at JKIA. Name: John Doe, ID: 12345678"`;
  }

  /**
   * Get booking action buttons
   */
  getBookingActionButtons(bookingId) {
    return [
      { id: `pay_${bookingId}`, title: '💳 Pay Deposit' },
      { id: `modify_${bookingId}`, title: '✏️ Modify Booking' },
      { id: 'new_booking', title: '🆕 New Booking' }
    ];
  }

  /**
   * Check if message is booking check
   */
  isBookingCheck(message) {
    const keywords = ['my booking', 'booking status', 'check booking', 'my reservation'];
    return keywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  /**
   * Generate booking status message
   */
  generateBookingStatus(bookings, customerName) {
    if (bookings.length === 0) {
      return `Hi ${customerName}! You don't have any bookings yet.

Would you like to:
• Browse our car catalog
• Make a new booking
• Check our prices

What can I help you with?`;
    }

    let status = `📋 **Your Bookings, ${customerName}**\n\n`;
    
    bookings.forEach((booking, index) => {
      status += `**${index + 1}. Booking #${booking.id}**
🚗 Car: ${booking.carName}
📅 Period: ${booking.pickupDate} to ${booking.returnDate}
💰 Total: KES ${booking.totalAmount.toLocaleString()}
📍 Status: ${booking.status}

`;
    });

    return status + `Need help with any booking? Just let me know!`;
  }

  /**
   * Get booking management buttons
   */
  getBookingManagementButtons() {
    return [
      { id: 'modify_booking', title: '✏️ Modify Booking' },
      { id: 'cancel_booking', title: '❌ Cancel Booking' },
      { id: 'new_booking', title: '🆕 New Booking' }
    ];
  }

  /**
   * Generate help message
   */
  generateHelpMessage(customerName) {
    return `🆘 **CarRental Pro Support for ${customerName}**

I can help you with:

🚗 **Car Rentals**
• Browse our complete fleet
• Check real-time availability
• Compare prices and features
• Get detailed car information

📅 **Bookings**
• Make new reservations
• Modify existing bookings
• Check booking status
• Cancel reservations

💰 **Pricing & Payments**
• Get price quotes
• Payment options (M-Pesa, Bank, Cash)
• Deposit information
• Special offers

📍 **Locations & Delivery**
• Pickup locations
• Free delivery areas
• Airport services
• Cross-border rentals

🆘 **24/7 Support**
📱 WhatsApp: +255683859574
📧 Email: support@carrentalpro.com
🌐 Website: www.carrentalpro.com

What do you need help with?`;
  }

  /**
   * Get help buttons
   */
  getHelpButtons() {
    return [
      { id: 'pricing_help', title: '💰 Pricing Info' },
      { id: 'booking_help', title: '📅 Booking Help' },
      { id: 'contact_support', title: '📞 Contact Support' }
    ];
  }

  /**
   * Get car category buttons
   */
  getCategoryButtons() {
    return [
      { id: 'economy_cars', title: '🚗 Economy' },
      { id: 'suv_cars', title: '🚙 SUVs' },
      { id: 'luxury_cars', title: '🏎️ Luxury' },
      { id: 'van_cars', title: '🚐 Vans' }
    ];
  }

  /**
   * Helper methods for intent recognition
   */
  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'start', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.includes(greeting));
  }

  isCarCatalogRequest(message) {
    const keywords = ['car', 'vehicle', 'rent', 'show', 'browse', 'catalog', 'fleet'];
    return keywords.some(keyword => message.includes(keyword));
  }

  extractCarCategory(message) {
    if (message.includes('economy') || message.includes('cheap') || message.includes('budget')) return 'economy';
    if (message.includes('suv') || message.includes('rav4') || message.includes('crv')) return 'suv';
    if (message.includes('luxury') || message.includes('mercedes') || message.includes('bmw') || message.includes('audi')) return 'luxury';
    if (message.includes('van') || message.includes('hiace') || message.includes('caravan')) return 'van';
    return null;
  }

  isBookingRequest(message) {
    const keywords = ['book', 'reserve', 'rent this', 'i want this', 'take this'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isPriceInquiry(message) {
    const keywords = ['price', 'cost', 'how much', 'pricing', 'rate'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isHelpRequest(message) {
    const keywords = ['help', 'support', 'assistance', 'problem', 'issue'];
    return keywords.some(keyword => message.includes(keyword));
  }

  /**
   * Session management
   */
  getCustomerSession(phoneNumber) {
    if (!this.customerSessions.has(phoneNumber)) {
      this.customerSessions.set(phoneNumber, {
        state: 'new',
        selectedCategory: null,
        selectedCar: null,
        currentBooking: null,
        messageCount: 0,
        lastMessage: null,
        createdAt: new Date().toISOString()
      });
    }
    return this.customerSessions.get(phoneNumber);
  }

  updateCustomerSession(phoneNumber, session) {
    session.updatedAt = new Date().toISOString();
    this.customerSessions.set(phoneNumber, session);
  }

  /**
   * Get car by ID
   */
  getCarById(carId) {
    for (const category of Object.values(this.cars)) {
      const car = category.find(c => c.id === carId);
      if (car) return car;
    }
    return null;
  }

  /**
   * Extract booking details from message
   */
  extractBookingDetails(message) {
    // Simple extraction logic - in production, use NLP
    const details = {
      isValid: false,
      errors: [],
      pickupDate: null,
      returnDate: null,
      pickupLocation: null,
      customerInfo: {},
      totalDays: 0
    };

    // Basic validation
    if (message.length < 20) {
      details.errors.push('Please provide more details');
    }

    if (!message.toLowerCase().includes('name:')) {
      details.errors.push('Please include your name');
    }

    if (details.errors.length === 0) {
      details.isValid = true;
      details.pickupDate = 'Jan 20, 9:00 AM'; // Placeholder
      details.returnDate = 'Jan 22, 6:00 PM'; // Placeholder
      details.pickupLocation = 'JKIA'; // Placeholder
      details.totalDays = 3;
      details.customerInfo = { name: 'Customer', id: '12345678' };
    }

    return details;
  }

  /**
   * Get customer bookings
   */
  getCustomerBookings(phoneNumber) {
    return Array.from(this.bookings.values()).filter(booking => booking.customerId === phoneNumber);
  }

  /**
   * Generate smart contextual response
   */
  generateSmartResponse(message, session, customerName) {
    return `Hi ${customerName}! I understand you said: "${message}"

I'm here to help you with car rentals. Here are some things I can do:

🚗 **Browse Cars**: "Show me economy cars"
💰 **Check Prices**: "How much for SUVs?"
📅 **Make Booking**: "Book a Toyota RAV4"
📋 **Check Bookings**: "My bookings"
🆘 **Get Help**: "I need help"

What would you like to do?`;
  }

  /**
   * Get contextual buttons based on session state
   */
  getContextualButtons(session) {
    switch (session.state) {
      case 'browsing_cars':
        return this.getCategoryButtons();
      case 'viewing_car':
        return [
          { id: 'book_car', title: '📅 Book This Car' },
          { id: 'compare_cars', title: '🔄 Compare Cars' },
          { id: 'back_to_catalog', title: '⬅️ Back to Catalog' }
        ];
      default:
        return this.getMainMenuButtons();
    }
  }
  /**
   * Get main menu buttons
   */
  getMainMenuButtons() {
    return [
      { id: 'browse_cars', title: '🚗 Browse Cars' },
      { id: 'check_prices', title: '💰 Check Prices' },
      { id: 'my_bookings', title: '📋 My Bookings' },
      { id: 'get_help', title: '🆘 Get Help' }
    ];
  }

  /**
   * Generate pricing information
   */
  generatePricingInfo(customerName) {
    return `💰 **CarRental Pro Pricing for ${customerName}**

🚗 **Economy Cars**: KES 2,500 - 3,000/day
• Toyota Vitz, Nissan March, Suzuki Swift
• Perfect for city driving and fuel efficiency

🚙 **SUVs**: KES 4,500 - 5,500/day  
• Toyota RAV4, Honda CR-V, Mazda CX-5
• Great for families and rough roads

🏎️ **Luxury Cars**: KES 8,000 - 10,000/day
• Mercedes C-Class, BMW 3 Series, Audi A4
• Premium comfort and features

🚐 **Vans**: KES 6,000 - 7,000/day
• Toyota Hiace, Nissan Caravan
• Perfect for groups up to 14 people

✅ **All Prices Include:**
• Comprehensive insurance
• 24/7 roadside assistance  
• Free delivery in major cities
• Unlimited mileage
• Full tank of fuel

💳 **Payment Options:**
• M-Pesa (50% deposit to confirm)
• Bank transfer (full payment)
• Cash on delivery

Which category interests you?`;
  }

  /**
   * Check if message is location inquiry
   */
  isLocationInquiry(message) {
    const keywords = ['location', 'where', 'pickup', 'delivery', 'office', 'branch'];
    return keywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  /**
   * Generate location information
   */
  generateLocationInfo(customerName) {
    return `📍 **CarRental Pro Locations for ${customerName}**

🏢 **Main Offices:**
• Nairobi: Westlands, CBD, Airport
• Dar es Salaam: City Center, Airport
• Mombasa: Town, Airport
• Kampala: City Center

✈️ **Airport Services:**
• JKIA (Nairobi) - 24/7 pickup/drop-off
• Julius Nyerere Airport (Dar es Salaam)
• Moi International Airport (Mombasa)
• Entebbe Airport (Kampala)

🚚 **Free Delivery Areas:**
• Within 10km of city centers
• Major hotels and business districts
• Residential areas (selected locations)

🌍 **Cross-Border Services:**
• Kenya ↔ Tanzania ↔ Uganda
• Special permits included
• Border assistance provided

📱 **Book Pickup/Delivery:**
Just tell me your preferred location and time!

Where would you like your car delivered?`;
  }
}

module.exports = new CarRentalBotService();