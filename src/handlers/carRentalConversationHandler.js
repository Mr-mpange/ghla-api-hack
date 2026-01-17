const carRentalService = require('../services/carRentalService');
const bookingService = require('../services/bookingService');
const customerService = require('../services/customerService');
const botMiddleware = require('../middleware/botMiddleware');
const logger = require('../utils/logger');
const moment = require('moment');

class CarRentalConversationHandler {
  constructor() {
    this.conversationStates = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  // Main message handler
  async handleMessage(phoneNumber, message, messageType = 'text') {
    try {
      logger.info(`Handling message from ${phoneNumber}: ${JSON.stringify(message)}`);

      // Get or create customer
      const customer = await customerService.getOrCreateCustomer(phoneNumber);
      
      // Get conversation state
      const state = this.getConversationState(phoneNumber);
      
      // Handle different message types
      let response;
      switch (messageType) {
        case 'interactive':
          response = await this.handleInteractiveMessage(phoneNumber, message, state);
          break;
        case 'location':
          response = await this.handleLocationMessage(phoneNumber, message, state);
          break;
        case 'document':
          response = await this.handleDocumentMessage(phoneNumber, message, state);
          break;
        default:
          response = await this.handleTextMessage(phoneNumber, message, state);
      }

      return response;
    } catch (error) {
      logger.error('Error handling message:', error);
      return await this.sendErrorMessage(phoneNumber);
    }
  }

  // Handle text messages
  async handleTextMessage(phoneNumber, message, state) {
    const lowerMessage = message.toLowerCase().trim();

    // Check for common commands
    if (this.isGreeting(lowerMessage)) {
      return await this.sendWelcomeMessage(phoneNumber);
    }

    if (this.isBookingCommand(lowerMessage)) {
      return await this.startBookingFlow(phoneNumber);
    }

    if (this.isMyBookingsCommand(lowerMessage)) {
      return await this.showMyBookings(phoneNumber);
    }

    if (this.isHelpCommand(lowerMessage)) {
      return await this.sendHelpMessage(phoneNumber);
    }

    // Handle conversation flow based on current state
    switch (state.flow) {
      case 'booking':
        return await this.handleBookingFlow(phoneNumber, message, state);
      case 'support':
        return await this.handleSupportFlow(phoneNumber, message, state);
      case 'booking_details':
        return await this.handleBookingDetailsFlow(phoneNumber, message, state);
      default:
        return await this.handleDefaultMessage(phoneNumber, message);
    }
  }

  // Handle interactive button/list responses
  async handleInteractiveMessage(phoneNumber, message, state) {
    const { button_reply, list_reply } = message;
    const selectedId = button_reply?.id || list_reply?.id;

    if (!selectedId) {
      return await this.sendErrorMessage(phoneNumber);
    }

    logger.info(`Interactive selection: ${selectedId}`);

    // Handle main menu selections
    if (selectedId.startsWith('main_')) {
      return await this.handleMainMenuSelection(phoneNumber, selectedId);
    }

    // Handle location selections
    if (selectedId.startsWith('location_')) {
      return await this.handleLocationSelection(phoneNumber, selectedId, state);
    }

    // Handle category selections
    if (selectedId.startsWith('category_')) {
      return await this.handleCategorySelection(phoneNumber, selectedId, state);
    }

    // Handle vehicle selections
    if (selectedId.startsWith('vehicle_')) {
      return await this.handleVehicleSelection(phoneNumber, selectedId, state);
    }

    // Handle extras selections
    if (selectedId.startsWith('extra_')) {
      return await this.handleExtraSelection(phoneNumber, selectedId, state);
    }

    // Handle insurance selections
    if (selectedId.startsWith('insurance_')) {
      return await this.handleInsuranceSelection(phoneNumber, selectedId, state);
    }

    // Handle payment method selections
    if (selectedId.startsWith('payment_')) {
      return await this.handlePaymentSelection(phoneNumber, selectedId, state);
    }

    return await this.sendErrorMessage(phoneNumber);
  }

  // Send welcome message with main menu
  async sendWelcomeMessage(phoneNumber) {
    const customer = await customerService.getCustomerByPhone(phoneNumber);
    const customerName = customer?.full_name ? `, ${customer.full_name.split(' ')[0]}` : '';

    const welcomeText = `🚗 Welcome to CarRental Pro${customerName}!

Your trusted partner for premium vehicle rentals. We offer:

✅ Wide selection of vehicles
✅ Competitive pricing
✅ 24/7 customer support
✅ Flexible rental periods
✅ Insurance coverage options

What would you like to do today?`;

    const buttons = [
      { id: 'main_rent', title: '🚗 Rent a Vehicle' },
      { id: 'main_bookings', title: '📋 My Bookings' },
      { id: 'main_support', title: '💬 Customer Support' }
    ];

    await botMiddleware.sendInteractiveButtons(phoneNumber, welcomeText, buttons);
    this.clearConversationState(phoneNumber);
    
    return { success: true };
  }

  // Handle main menu selections
  async handleMainMenuSelection(phoneNumber, selectedId) {
    switch (selectedId) {
      case 'main_rent':
        return await this.startBookingFlow(phoneNumber);
      case 'main_bookings':
        return await this.showMyBookings(phoneNumber);
      case 'main_support':
        return await this.startSupportFlow(phoneNumber);
      default:
        return await this.sendWelcomeMessage(phoneNumber);
    }
  }

  // Start booking flow
  async startBookingFlow(phoneNumber) {
    this.setConversationState(phoneNumber, {
      flow: 'booking',
      step: 'location_selection',
      data: {}
    });

    // Get popular locations
    const locationsResult = await carRentalService.getPopularLocations(8);
    const locations = locationsResult.locations || [];

    const locationText = `📍 *Select Pickup Location*

Choose your preferred pickup location:`;

    const locationRows = locations.map(location => ({
      id: `location_${location.id}`,
      title: location.name,
      description: location.address.substring(0, 60) + (location.address.length > 60 ? '...' : '')
    }));

    // Add custom location option
    locationRows.push({
      id: 'location_custom',
      title: '📍 Custom Location',
      description: 'Share your location or enter address'
    });

    await botMiddleware.sendInteractiveList(
      phoneNumber,
      locationText,
      'Select Location',
      [{ title: 'Available Locations', rows: locationRows }]
    );

    return { success: true };
  }

  // Handle location selection
  async handleLocationSelection(phoneNumber, selectedId, state) {
    if (selectedId === 'location_custom') {
      await botMiddleware.sendMessage(
        phoneNumber,
        `📍 *Custom Location*

Please share your location using the 📎 attachment button, or type your preferred pickup address.`
      );

      this.updateConversationState(phoneNumber, {
        step: 'custom_location_input'
      });

      return { success: true };
    }

    // Extract location ID
    const locationId = selectedId.replace('location_', '');
    
    // Get location details
    const locationsResult = await carRentalService.getLocations();
    const location = locationsResult.locations?.find(l => l.id === locationId);

    if (!location) {
      return await this.sendErrorMessage(phoneNumber);
    }

    // Update state with selected location
    this.updateConversationState(phoneNumber, {
      step: 'date_selection',
      data: {
        ...state.data,
        pickupLocationId: locationId,
        pickupLocationName: location.name
      }
    });

    // Ask for pickup date
    const dateText = `📅 *Pickup Date & Time*

Location: ${location.name}

Please enter your preferred pickup date and time.

*Format:* DD/MM/YYYY HH:MM
*Example:* 25/12/2024 10:00

*Note:* Minimum booking is 1 hour, maximum is 30 days.`;

    await botMiddleware.sendMessage(phoneNumber, dateText);

    return { success: true };
  }

  // Handle booking flow
  async handleBookingFlow(phoneNumber, message, state) {
    switch (state.step) {
      case 'custom_location_input':
        return await this.handleCustomLocationInput(phoneNumber, message, state);
      case 'date_selection':
        return await this.handleDateSelection(phoneNumber, message, state);
      case 'return_date_selection':
        return await this.handleReturnDateSelection(phoneNumber, message, state);
      case 'customer_info_collection':
        return await this.handleCustomerInfoCollection(phoneNumber, message, state);
      case 'license_verification':
        return await this.handleLicenseVerification(phoneNumber, message, state);
      default:
        return await this.sendWelcomeMessage(phoneNumber);
    }
  }

  // Handle custom location input
  async handleCustomLocationInput(phoneNumber, message, state) {
    if (message.length < 10) {
      await botMiddleware.sendMessage(
        phoneNumber,
        '❌ Please provide a more detailed address including area/estate and nearest landmark.'
      );
      return { success: false };
    }

    // Update state with custom location
    this.updateConversationState(phoneNumber, {
      step: 'date_selection',
      data: {
        ...state.data,
        pickupLocationId: 'custom',
        pickupLocationName: message.trim()
      }
    });

    // Ask for pickup date
    const dateText = `📅 *Pickup Date & Time*

Location: ${message.trim()}

Please enter your preferred pickup date and time.

*Format:* DD/MM/YYYY HH:MM
*Example:* 25/12/2024 10:00

*Note:* Minimum booking is 1 hour, maximum is 30 days.`;

    await botMiddleware.sendMessage(phoneNumber, dateText);

    return { success: true };
  }

  // Handle date selection
  async handleDateSelection(phoneNumber, message, state) {
    try {
      // Parse date and time
      const dateTimeRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/;
      const match = message.match(dateTimeRegex);

      if (!match) {
        await botMiddleware.sendMessage(
          phoneNumber,
          `❌ Invalid date format. Please use DD/MM/YYYY HH:MM format.

*Example:* 25/12/2024 10:00`
        );
        return { success: false };
      }

      const [, day, month, year, hour, minute] = match;
      const pickupDateTime = moment(`${year}-${month}-${day} ${hour}:${minute}`, 'YYYY-MM-DD HH:mm');

      // Validate date
      if (!pickupDateTime.isValid()) {
        await botMiddleware.sendMessage(phoneNumber, '❌ Invalid date. Please enter a valid date and time.');
        return { success: false };
      }

      if (pickupDateTime.isBefore(moment())) {
        await botMiddleware.sendMessage(phoneNumber, '❌ Pickup date cannot be in the past. Please select a future date.');
        return { success: false };
      }

      if (pickupDateTime.isAfter(moment().add(6, 'months'))) {
        await botMiddleware.sendMessage(phoneNumber, '❌ Pickup date cannot be more than 6 months in advance.');
        return { success: false };
      }

      // Update state
      this.updateConversationState(phoneNumber, {
        step: 'return_date_selection',
        data: {
          ...state.data,
          pickupDateTime: pickupDateTime.toISOString()
        }
      });

      // Ask for return date
      const returnDateText = `📅 *Return Date & Time*

Pickup: ${pickupDateTime.format('dddd, MMMM Do YYYY [at] h:mm A')}

Please enter your return date and time.

*Format:* DD/MM/YYYY HH:MM
*Example:* 27/12/2024 18:00`;

      await botMiddleware.sendMessage(phoneNumber, returnDateText);

      return { success: true };
    } catch (error) {
      logger.error('Error handling date selection:', error);
      return await this.sendErrorMessage(phoneNumber);
    }
  }

  // Handle return date selection
  async handleReturnDateSelection(phoneNumber, message, state) {
    try {
      // Parse return date and time
      const dateTimeRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/;
      const match = message.match(dateTimeRegex);

      if (!match) {
        await botMiddleware.sendMessage(
          phoneNumber,
          `❌ Invalid date format. Please use DD/MM/YYYY HH:MM format.

*Example:* 27/12/2024 18:00`
        );
        return { success: false };
      }

      const [, day, month, year, hour, minute] = match;
      const returnDateTime = moment(`${year}-${month}-${day} ${hour}:${minute}`, 'YYYY-MM-DD HH:mm');
      const pickupDateTime = moment(state.data.pickupDateTime);

      // Validate return date
      if (!returnDateTime.isValid()) {
        await botMiddleware.sendMessage(phoneNumber, '❌ Invalid return date. Please enter a valid date and time.');
        return { success: false };
      }

      if (returnDateTime.isBefore(pickupDateTime)) {
        await botMiddleware.sendMessage(phoneNumber, '❌ Return date must be after pickup date.');
        return { success: false };
      }

      const duration = returnDateTime.diff(pickupDateTime, 'hours');
      if (duration < 1) {
        await botMiddleware.sendMessage(phoneNumber, '❌ Minimum rental duration is 1 hour.');
        return { success: false };
      }

      if (duration > 30 * 24) {
        await botMiddleware.sendMessage(phoneNumber, '❌ Maximum rental duration is 30 days.');
        return { success: false };
      }

      // Update state
      this.updateConversationState(phoneNumber, {
        step: 'vehicle_search',
        data: {
          ...state.data,
          returnDateTime: returnDateTime.toISOString()
        }
      });

      // Search for available vehicles
      return await this.searchAndShowVehicles(phoneNumber, state.data);
    } catch (error) {
      logger.error('Error handling return date selection:', error);
      return await this.sendErrorMessage(phoneNumber);
    }
  }

  // Search and show available vehicles
  async searchAndShowVehicles(phoneNumber, bookingData) {
    try {
      // Show loading message
      await botMiddleware.sendMessage(phoneNumber, '🔍 Searching for available vehicles...');

      // Search for vehicles
      const searchParams = {
        location: bookingData.pickupLocationName,
        pickupDate: bookingData.pickupDateTime,
        returnDate: bookingData.returnDateTime
      };

      const searchResult = await carRentalService.searchVehicles(searchParams);

      if (!searchResult.success || searchResult.vehicles.length === 0) {
        await botMiddleware.sendMessage(
          phoneNumber,
          `😔 *No Vehicles Available*

Unfortunately, no vehicles are available for your selected dates and location.

Please try:
• Different dates
• Different location
• Contact support for assistance

Type "rent" to start a new search.`
        );

        this.clearConversationState(phoneNumber);
        return { success: false };
      }

      // Group vehicles by category
      const vehiclesByCategory = {};
      searchResult.vehicles.forEach(vehicle => {
        if (!vehiclesByCategory[vehicle.category]) {
          vehiclesByCategory[vehicle.category] = [];
        }
        vehiclesByCategory[vehicle.category].push(vehicle);
      });

      // Show vehicle categories
      const categoriesText = `🚗 *Available Vehicles*

Found ${searchResult.vehicles.length} vehicles for your dates:

${moment(bookingData.pickupDateTime).format('MMM Do')} - ${moment(bookingData.returnDateTime).format('MMM Do YYYY')}

Select a category to view vehicles:`;

      const categoryRows = Object.keys(vehiclesByCategory).map(category => {
        const vehicles = vehiclesByCategory[category];
        const minPrice = Math.min(...vehicles.map(v => v.dynamic_price));
        
        return {
          id: `category_${category}`,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} (${vehicles.length})`,
          description: `From KES ${minPrice.toLocaleString()}/day`
        };
      });

      await botMiddleware.sendInteractiveList(
        phoneNumber,
        categoriesText,
        'Select Category',
        [{ title: 'Vehicle Categories', rows: categoryRows }]
      );

      // Update state with search results
      this.updateConversationState(phoneNumber, {
        step: 'category_selection',
        data: {
          ...bookingData,
          searchResults: searchResult.vehicles,
          vehiclesByCategory
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Error searching vehicles:', error);
      return await this.sendErrorMessage(phoneNumber);
    }
  }

  // Handle category selection
  async handleCategorySelection(phoneNumber, selectedId, state) {
    try {
      const category = selectedId.replace('category_', '');
      const vehicles = state.data.vehiclesByCategory[category];

      if (!vehicles || vehicles.length === 0) {
        return await this.sendErrorMessage(phoneNumber);
      }

      // Show vehicles in selected category
      const vehicleText = `🚗 *${category.charAt(0).toUpperCase() + category.slice(1)} Vehicles*

Available vehicles in this category:`;

      const vehicleRows = vehicles.slice(0, 10).map(vehicle => ({
        id: `vehicle_${vehicle.id}`,
        title: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
        description: `KES ${vehicle.dynamic_price.toLocaleString()}/day • ${vehicle.seats} seats • ${vehicle.transmission}`
      }));

      await botMiddleware.sendInteractiveList(
        phoneNumber,
        vehicleText,
        'Select Vehicle',
        [{ title: 'Available Vehicles', rows: vehicleRows }]
      );

      // Update state
      this.updateConversationState(phoneNumber, {
        step: 'vehicle_selection',
        data: {
          ...state.data,
          selectedCategory: category,
          categoryVehicles: vehicles
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Error handling category selection:', error);
      return await this.sendErrorMessage(phoneNumber);
    }
  }

  // Handle vehicle selection
  async handleVehicleSelection(phoneNumber, selectedId, state) {
    try {
      const vehicleId = selectedId.replace('vehicle_', '');
      const vehicle = state.data.searchResults.find(v => v.id === vehicleId);

      if (!vehicle) {
        return await this.sendErrorMessage(phoneNumber);
      }

      // Get detailed vehicle information
      const vehicleDetailsResult = await carRentalService.getVehicleDetails(
        vehicleId,
        state.data.pickupDateTime,
        state.data.returnDateTime
      );

      if (!vehicleDetailsResult.success) {
        return await this.sendErrorMessage(phoneNumber);
      }

      const vehicleDetails = vehicleDetailsResult.vehicle;
      const duration = moment(state.data.returnDateTime).diff(moment(state.data.pickupDateTime), 'days') || 1;

      // Show vehicle details
      const detailsText = `🚗 *${vehicleDetails.make} ${vehicleDetails.model} ${vehicleDetails.year}*

📋 *Vehicle Details:*
• License Plate: ${vehicleDetails.license_plate}
• Category: ${vehicleDetails.category}
• Seats: ${vehicleDetails.seats}
• Transmission: ${vehicleDetails.transmission}
• Fuel Type: ${vehicleDetails.fuel_type}
• Color: ${vehicleDetails.color}

⭐ Rating: ${vehicleDetails.average_rating.toFixed(1)}/5 (${vehicleDetails.review_count} reviews)

💰 *Pricing:*
• Daily Rate: KES ${vehicleDetails.dynamic_price.toLocaleString()}
• Duration: ${duration} day${duration > 1 ? 's' : ''}
• Subtotal: KES ${(vehicleDetails.dynamic_price * duration).toLocaleString()}

📍 *Pickup Location:*
${vehicleDetails.location_name}
${vehicleDetails.location_address}

Would you like to select this vehicle?`;

      const buttons = [
        { id: `confirm_vehicle_${vehicleId}`, title: '✅ Select This Vehicle' },
        { id: 'back_to_vehicles', title: '🔙 View Other Vehicles' }
      ];

      await botMiddleware.sendInteractiveButtons(phoneNumber, detailsText, buttons);

      // Update state
      this.updateConversationState(phoneNumber, {
        step: 'vehicle_confirmation',
        data: {
          ...state.data,
          selectedVehicle: vehicleDetails
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Error handling vehicle selection:', error);
      return await this.sendErrorMessage(phoneNumber);
    }
  }

  // Show my bookings
  async showMyBookings(phoneNumber) {
    try {
      const customer = await customerService.getCustomerByPhone(phoneNumber);
      
      if (!customer) {
        await botMiddleware.sendMessage(
          phoneNumber,
          `📋 *My Bookings*

You don't have any bookings yet.

Type "rent" to make your first booking! 🚗`
        );
        return { success: true };
      }

      const bookingsResult = await carRentalService.getCustomerBookings(customer.id);
      
      if (!bookingsResult.success || bookingsResult.bookings.length === 0) {
        await botMiddleware.sendMessage(
          phoneNumber,
          `📋 *My Bookings*

You don't have any bookings yet.

Type "rent" to make your first booking! 🚗`
        );
        return { success: true };
      }

      // Show recent bookings
      const recentBookings = bookingsResult.bookings.slice(0, 5);
      let bookingsText = `📋 *My Bookings*\n\nHere are your recent bookings:\n\n`;

      recentBookings.forEach((booking, index) => {
        const status = this.getStatusEmoji(booking.status);
        const pickupDate = moment(booking.pickup_datetime).format('MMM Do, YYYY');
        
        bookingsText += `${index + 1}. ${status} *${booking.make} ${booking.model}*\n`;
        bookingsText += `   📅 ${pickupDate}\n`;
        bookingsText += `   💰 KES ${booking.total_amount.toLocaleString()}\n`;
        bookingsText += `   📍 ${booking.pickup_location_name}\n\n`;
      });

      bookingsText += `Type the booking number (1-${recentBookings.length}) to view details.`;

      await botMiddleware.sendMessage(phoneNumber, bookingsText);

      // Set state for booking details
      this.setConversationState(phoneNumber, {
        flow: 'booking_details',
        step: 'selection',
        data: { bookings: recentBookings }
      });

      return { success: true };
    } catch (error) {
      logger.error('Error showing bookings:', error);
      return await this.sendErrorMessage(phoneNumber);
    }
  }

  // Handle booking details flow
  async handleBookingDetailsFlow(phoneNumber, message, state) {
    try {
      const bookingIndex = parseInt(message.trim()) - 1;
      
      if (bookingIndex < 0 || bookingIndex >= state.data.bookings.length) {
        await botMiddleware.sendMessage(
          phoneNumber,
          `❌ Invalid selection. Please enter a number between 1 and ${state.data.bookings.length}.`
        );
        return { success: false };
      }

      const booking = state.data.bookings[bookingIndex];
      
      // Get detailed booking information
      const bookingDetailsResult = await bookingService.getBookingDetails(booking.id);
      
      if (!bookingDetailsResult.success) {
        return await this.sendErrorMessage(phoneNumber);
      }

      const bookingDetails = bookingDetailsResult.booking;
      
      // Format booking details
      const detailsText = this.formatBookingDetails(bookingDetails);
      
      await botMiddleware.sendMessage(phoneNumber, detailsText);

      // Show action buttons based on booking status
      if (bookingDetails.status === 'confirmed' || bookingDetails.status === 'pending') {
        const buttons = [
          { id: `modify_booking_${booking.id}`, title: '✏️ Modify Booking' },
          { id: `cancel_booking_${booking.id}`, title: '❌ Cancel Booking' }
        ];

        await botMiddleware.sendInteractiveButtons(
          phoneNumber,
          'What would you like to do?',
          buttons
        );
      }

      this.clearConversationState(phoneNumber);
      return { success: true };
    } catch (error) {
      logger.error('Error handling booking details flow:', error);
      return await this.sendErrorMessage(phoneNumber);
    }
  }

  // Format booking details
  formatBookingDetails(booking) {
    const status = this.getStatusEmoji(booking.status);
    const pickupDate = moment(booking.pickup_datetime).format('dddd, MMMM Do YYYY [at] h:mm A');
    const returnDate = moment(booking.return_datetime).format('dddd, MMMM Do YYYY [at] h:mm A');

    return `📋 *Booking Details*

${status} *Status:* ${booking.status.toUpperCase()}

🚗 *Vehicle:*
${booking.make} ${booking.model} ${booking.year}
License Plate: ${booking.license_plate}

📅 *Rental Period:*
📍 Pickup: ${pickupDate}
📍 Return: ${returnDate}

📍 *Locations:*
Pickup: ${booking.pickup_location_name}
${booking.pickup_location_address}

Return: ${booking.return_location_name || booking.pickup_location_name}
${booking.return_location_address || booking.pickup_location_address}

💰 *Payment:*
Total Amount: KES ${booking.total_amount.toLocaleString()}
Security Deposit: KES ${booking.security_deposit.toLocaleString()}
Payment Status: ${booking.payment_status || 'Pending'}

${booking.verification_code ? `🔐 Verification Code: ${booking.verification_code}` : ''}

${booking.notes ? `📝 Notes: ${booking.notes}` : ''}`;
  }

  // Get status emoji
  getStatusEmoji(status) {
    const statusEmojis = {
      pending: '⏳',
      pending_payment: '💳',
      confirmed: '✅',
      active: '🚗',
      completed: '🏁',
      cancelled: '❌'
    };
    return statusEmojis[status] || '📋';
  }

  // Send help message
  async sendHelpMessage(phoneNumber) {
    const helpText = `💬 *Help & Support*

*Quick Commands:*
• "rent" - Start booking a vehicle
• "bookings" - View your bookings
• "help" - Show this help message
• "support" - Contact customer support

*How to Book:*
1. Type "rent" or click "Rent a Vehicle"
2. Select pickup location
3. Choose dates and times
4. Browse available vehicles
5. Add extras (optional)
6. Complete payment
7. Receive confirmation

*Need Help?*
📞 Call: +254 700 123 456
📧 Email: support@carrentalpro.com
⏰ Available 24/7

*Booking Policy:*
• Minimum age: 21 years
• Valid driving license required
• Credit card for security deposit
• Fuel policy: Return with same level

Type "support" to chat with our team! 👨‍💼`;

    await botMiddleware.sendMessage(phoneNumber, helpText);
    return { success: true };
  }

  // Start support flow
  async startSupportFlow(phoneNumber) {
    const supportText = `💬 *Customer Support*

How can we help you today?

*Common Issues:*
• Booking modifications
• Payment problems
• Vehicle issues
• General inquiries

Please describe your issue, and our team will assist you shortly.

*Emergency Contact:*
📞 +254 700 123 456 (24/7)`;

    await botMiddleware.sendMessage(phoneNumber, supportText);

    this.setConversationState(phoneNumber, {
      flow: 'support',
      step: 'issue_description',
      data: {}
    });

    return { success: true };
  }

  // Handle support flow
  async handleSupportFlow(phoneNumber, message, state) {
    // In a real implementation, this would create a support ticket
    // and route to human agents
    
    await botMiddleware.sendMessage(
      phoneNumber,
      `✅ *Support Request Received*

Thank you for contacting us. Your message has been forwarded to our support team.

*Your Message:*
"${message}"

*Ticket ID:* SUP-${Date.now().toString().slice(-6)}

Our team will respond within 30 minutes during business hours.

*Emergency?* Call +254 700 123 456

Type "menu" to return to main menu.`
    );

    this.clearConversationState(phoneNumber);
    return { success: true };
  }

  // Send error message
  async sendErrorMessage(phoneNumber) {
    const errorText = `❌ *Something went wrong*

I didn't understand that. Here's what you can do:

• Type "rent" to book a vehicle
• Type "bookings" to view your bookings
• Type "help" for assistance
• Type "support" to chat with our team

Or use the menu buttons below! 👇`;

    const buttons = [
      { id: 'main_rent', title: '🚗 Rent Vehicle' },
      { id: 'main_bookings', title: '📋 My Bookings' },
      { id: 'main_support', title: '💬 Support' }
    ];

    await botMiddleware.sendInteractiveButtons(phoneNumber, errorText, buttons);
    return { success: true };
  }

  // Handle default message
  async handleDefaultMessage(phoneNumber, message) {
    // Try to understand the intent
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return await this.sendPricingInfo(phoneNumber);
    }
    
    if (lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return await this.sendLocationInfo(phoneNumber);
    }
    
    if (lowerMessage.includes('cancel')) {
      return await this.handleCancellationRequest(phoneNumber);
    }

    // Default response
    return await this.sendWelcomeMessage(phoneNumber);
  }

  // Send pricing information
  async sendPricingInfo(phoneNumber) {
    const pricingText = `💰 *Our Pricing*

*Economy Cars:* From KES 2,500/day
• Toyota Vitz, Nissan March
• Perfect for city driving

*Compact SUVs:* From KES 4,500/day
• Toyota RAV4, Honda CR-V
• Great for families

*Luxury Cars:* From KES 8,000/day
• Mercedes C-Class, BMW 3 Series
• Premium comfort and style

*Vans & Buses:* From KES 6,000/day
• Toyota Hiace, Nissan Urvan
• Perfect for groups

*Additional Costs:*
• Insurance: 20-35% of rental
• GPS: KES 200/day
• Child seat: KES 300/day
• Additional driver: KES 400/day

*Special Offers:*
• Weekly rentals: 15% discount
• Monthly rentals: 25% discount
• Early booking: Up to 10% off

Type "rent" to get exact pricing for your dates! 🚗`;

    await botMiddleware.sendMessage(phoneNumber, pricingText);
    return { success: true };
  }

  // Send location information
  async sendLocationInfo(phoneNumber) {
    const locationText = `📍 *Our Locations*

*Main Pickup Points:*
• 🏢 Nairobi CBD - Kenyatta Avenue
• 🏬 Westlands - Sarit Centre
• 🏡 Karen - Karen Shopping Centre
• ✈️ JKIA Airport - Terminal 1 & 2
• ✈️ Wilson Airport - Main Terminal

*Operating Hours:*
• Monday - Friday: 6:00 AM - 10:00 PM
• Saturday - Sunday: 7:00 AM - 9:00 PM
• Airport: 24/7 service available

*Custom Locations:*
We can deliver to your preferred location within Nairobi for an additional fee.

Type "rent" to start booking! 🚗`;

    await botMiddleware.sendMessage(phoneNumber, locationText);
    return { success: true };
  }

  // Handle cancellation request
  async handleCancellationRequest(phoneNumber) {
    const customer = await customerService.getCustomerByPhone(phoneNumber);
    
    if (!customer) {
      return await this.sendWelcomeMessage(phoneNumber);
    }

    const bookingsResult = await carRentalService.getCustomerBookings(customer.id, 'confirmed');
    
    if (!bookingsResult.success || bookingsResult.bookings.length === 0) {
      await botMiddleware.sendMessage(
        phoneNumber,
        `📋 *No Active Bookings*

You don't have any confirmed bookings to cancel.

Type "bookings" to view all your bookings.`
      );
      return { success: true };
    }

    // Show cancellable bookings
    const bookingsText = `❌ *Cancel Booking*

Select a booking to cancel:

${bookingsResult.bookings.map((booking, index) => 
  `${index + 1}. ${booking.make} ${booking.model} - ${moment(booking.pickup_datetime).format('MMM Do')}`
).join('\n')}

Type the booking number to cancel, or "menu" to go back.

*Cancellation Policy:*
• 24+ hours: 90% refund
• 12-24 hours: 50% refund
• 2-12 hours: 25% refund
• Less than 2 hours: No refund`;

    await botMiddleware.sendMessage(phoneNumber, bookingsText);

    this.setConversationState(phoneNumber, {
      flow: 'cancellation',
      step: 'booking_selection',
      data: { bookings: bookingsResult.bookings }
    });

    return { success: true };
  }

  // Utility methods for conversation state management
  getConversationState(phoneNumber) {
    const state = this.conversationStates.get(phoneNumber);
    if (!state || Date.now() - state.timestamp > this.sessionTimeout) {
      return this.createNewState();
    }
    return state;
  }

  setConversationState(phoneNumber, stateData) {
    this.conversationStates.set(phoneNumber, {
      ...stateData,
      timestamp: Date.now()
    });
  }

  updateConversationState(phoneNumber, updates) {
    const currentState = this.getConversationState(phoneNumber);
    this.setConversationState(phoneNumber, {
      ...currentState,
      ...updates,
      timestamp: Date.now()
    });
  }

  clearConversationState(phoneNumber) {
    this.conversationStates.delete(phoneNumber);
  }

  createNewState() {
    return {
      flow: null,
      step: null,
      data: {},
      timestamp: Date.now()
    };
  }

  // Utility methods for message classification
  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'start', 'begin'];
    return greetings.some(greeting => message.includes(greeting));
  }

  isBookingCommand(message) {
    const bookingCommands = ['rent', 'book', 'booking', 'reserve', 'car', 'vehicle'];
    return bookingCommands.some(command => message.includes(command));
  }

  isMyBookingsCommand(message) {
    const bookingCommands = ['my bookings', 'bookings', 'my booking', 'reservations', 'orders'];
    return bookingCommands.some(command => message.includes(command));
  }

  isHelpCommand(message) {
    const helpCommands = ['help', 'support', 'assist', 'info', 'information'];
    return helpCommands.some(command => message.includes(command));
  }
}

module.exports = new CarRentalConversationHandler();