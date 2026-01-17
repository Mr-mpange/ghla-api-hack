const db = require('../config/database');
const ghalaService = require('./ghalaService');
const whatsappService = require('./whatsappService');
const vehicleService = require('./vehicleService');

class BookingService {
  // Generate unique booking reference
  generateBookingReference() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `CR${timestamp}${random}`.toUpperCase();
  }

  // Calculate booking pricing
  async calculateBookingPrice(bookingData) {
    try {
      const { vehicleId, pickupDate, returnDate, extras = [] } = bookingData;

      // Get vehicle details
      const vehicle = await vehicleService.getVehicleDetails(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      const pickup = new Date(pickupDate);
      const returnD = new Date(returnDate);
      const totalDays = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));

      if (totalDays <= 0) {
        throw new Error('Invalid rental period');
      }

      // Calculate base amount
      let baseAmount = vehicle.daily_rate * totalDays;
      
      // Apply weekly rate if applicable
      if (vehicle.weekly_rate && totalDays >= 7) {
        const weeks = Math.floor(totalDays / 7);
        const remainingDays = totalDays % 7;
        baseAmount = (weeks * vehicle.weekly_rate) + (remainingDays * vehicle.daily_rate);
      }

      // Calculate extras
      let extrasAmount = 0;
      const extrasDetails = [];

      if (extras.length > 0) {
        const extrasResult = await db.query(`
          SELECT * FROM extras WHERE id = ANY($1) AND is_active = true
        `, [extras.map(e => e.extraId)]);

        for (const extra of extras) {
          const extraDetail = extrasResult.rows.find(e => e.id === extra.extraId);
          if (extraDetail) {
            let extraPrice = 0;
            const quantity = extra.quantity || 1;

            switch (extraDetail.price_type) {
              case 'per_day':
                extraPrice = extraDetail.price * totalDays * quantity;
                break;
              case 'per_booking':
                extraPrice = extraDetail.price * quantity;
                break;
              case 'per_hour':
                // Assume 24 hours per day for hourly extras
                extraPrice = extraDetail.price * totalDays * 24 * quantity;
                break;
              default:
                extraPrice = extraDetail.price * quantity;
            }

            extrasAmount += extraPrice;
            extrasDetails.push({
              ...extraDetail,
              quantity,
              total_price: extraPrice
            });
          }
        }
      }

      // Calculate tax (16% VAT in Kenya)
      const taxRate = 0.16;
      const subtotal = baseAmount + extrasAmount;
      const taxAmount = subtotal * taxRate;

      // Calculate total
      const totalAmount = subtotal + taxAmount;

      return {
        vehicle,
        totalDays,
        baseAmount: parseFloat(baseAmount.toFixed(2)),
        extrasAmount: parseFloat(extrasAmount.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        depositAmount: parseFloat((vehicle.deposit_amount || 0).toFixed(2)),
        extrasDetails,
        currency: vehicle.currency || 'KES'
      };

    } catch (error) {
      console.error('Error calculating booking price:', error.message);
      throw new Error('Failed to calculate booking price');
    }
  }

  // Create new booking
  async createBooking(bookingData) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      const {
        customerId,
        vehicleId,
        pickupLocationId,
        returnLocationId,
        pickupDate,
        returnDate,
        pickupTime,
        returnTime,
        extras = [],
        specialRequests,
        promoCode
      } = bookingData;

      // Check vehicle availability
      const availability = await vehicleService.checkAvailability(vehicleId, pickupDate, returnDate);
      if (!availability.available) {
        throw new Error(availability.reason);
      }

      // Calculate pricing
      const pricing = await this.calculateBookingPrice({
        vehicleId,
        pickupDate,
        returnDate,
        extras
      });

      let finalAmount = pricing.totalAmount;
      let discountAmount = 0;

      // Apply promotional code if provided
      if (promoCode) {
        const promoResult = await client.query(`
          SELECT * FROM promotional_codes 
          WHERE code = $1 AND is_active = true 
            AND valid_from <= CURRENT_DATE 
            AND valid_until >= CURRENT_DATE
            AND (usage_limit IS NULL OR used_count < usage_limit)
        `, [promoCode]);

        if (promoResult.rows.length > 0) {
          const promo = promoResult.rows[0];
          
          // Check if vehicle category is applicable
          if (!promo.applicable_categories || 
              promo.applicable_categories.includes(pricing.vehicle.category)) {
            
            if (pricing.totalAmount >= promo.minimum_amount) {
              if (promo.discount_type === 'percentage') {
                discountAmount = (pricing.totalAmount * promo.discount_value) / 100;
                if (promo.maximum_discount) {
                  discountAmount = Math.min(discountAmount, promo.maximum_discount);
                }
              } else {
                discountAmount = promo.discount_value;
              }
              
              finalAmount = pricing.totalAmount - discountAmount;
              
              // Update promo code usage
              await client.query(`
                UPDATE promotional_codes 
                SET used_count = used_count + 1 
                WHERE id = $1
              `, [promo.id]);
            }
          }
        }
      }

      // Generate booking reference
      const bookingReference = this.generateBookingReference();

      // Create booking
      const bookingResult = await client.query(`
        INSERT INTO bookings (
          booking_reference, customer_id, vehicle_id, pickup_location_id, 
          return_location_id, pickup_date, return_date, pickup_time, return_time,
          total_days, base_amount, extras_amount, tax_amount, discount_amount,
          total_amount, deposit_amount, currency, special_requests, terms_accepted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true)
        RETURNING *
      `, [
        bookingReference, customerId, vehicleId, pickupLocationId, returnLocationId,
        pickupDate, returnDate, pickupTime, returnTime, pricing.totalDays,
        pricing.baseAmount, pricing.extrasAmount, pricing.taxAmount, discountAmount,
        finalAmount, pricing.depositAmount, pricing.currency, specialRequests
      ]);

      const booking = bookingResult.rows[0];

      // Add extras to booking
      if (extras.length > 0) {
        for (const extra of pricing.extrasDetails) {
          const requestedExtra = extras.find(e => e.extraId === extra.id);
          await client.query(`
            INSERT INTO booking_extras (booking_id, extra_id, quantity, unit_price, total_price)
            VALUES ($1, $2, $3, $4, $5)
          `, [booking.id, extra.id, requestedExtra.quantity || 1, extra.price, extra.total_price]);
        }
      }

      await client.query('COMMIT');

      // Get complete booking details
      const completeBooking = await this.getBookingDetails(booking.id);

      return completeBooking;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating booking:', error.message);
      throw new Error('Failed to create booking');
    } finally {
      client.release();
    }
  }

  // Get booking details
  async getBookingDetails(bookingId) {
    try {
      const result = await db.query(`
        SELECT 
          b.*,
          v.make, v.model, v.year, v.category, v.license_plate, v.color,
          v.images, v.features,
          c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
          pl.name as pickup_location_name, pl.address as pickup_location_address,
          rl.name as return_location_name, rl.address as return_location_address
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN customers c ON b.customer_id = c.id
        JOIN locations pl ON b.pickup_location_id = pl.id
        JOIN locations rl ON b.return_location_id = rl.id
        WHERE b.id = $1
      `, [bookingId]);

      if (result.rows.length === 0) {
        throw new Error('Booking not found');
      }

      const booking = result.rows[0];

      // Get booking extras
      const extrasResult = await db.query(`
        SELECT be.*, e.name, e.description, e.category
        FROM booking_extras be
        JOIN extras e ON be.extra_id = e.id
        WHERE be.booking_id = $1
      `, [bookingId]);

      booking.extras = extrasResult.rows;

      // Get payment history
      const paymentsResult = await db.query(`
        SELECT * FROM rental_payments
        WHERE booking_id = $1
        ORDER BY created_at DESC
      `, [bookingId]);

      booking.payments = paymentsResult.rows;

      return booking;

    } catch (error) {
      console.error('Error getting booking details:', error.message);
      throw new Error('Failed to get booking details');
    }
  }

  // Get customer bookings
  async getCustomerBookings(customerId, status = null, limit = 20, offset = 0) {
    try {
      let query = `
        SELECT 
          b.*,
          v.make, v.model, v.year, v.category, v.license_plate,
          v.images[1] as vehicle_image,
          pl.name as pickup_location_name,
          rl.name as return_location_name
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN locations pl ON b.pickup_location_id = pl.id
        JOIN locations rl ON b.return_location_id = rl.id
        WHERE b.customer_id = $1
      `;

      const params = [customerId];
      let paramIndex = 2;

      if (status) {
        query += ` AND b.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);
      return result.rows;

    } catch (error) {
      console.error('Error getting customer bookings:', error.message);
      throw new Error('Failed to get customer bookings');
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, status, notes = null) {
    try {
      const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid booking status');
      }

      const result = await db.query(`
        UPDATE bookings 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, bookingId]);

      if (result.rows.length === 0) {
        throw new Error('Booking not found');
      }

      const booking = result.rows[0];

      // Update vehicle status based on booking status
      if (status === 'active') {
        await vehicleService.updateVehicleStatus(booking.vehicle_id, 'rented', 'Vehicle picked up');
      } else if (status === 'completed' || status === 'cancelled') {
        await vehicleService.updateVehicleStatus(booking.vehicle_id, 'available', 'Vehicle returned');
      }

      // Send WhatsApp notification
      await this.sendBookingStatusNotification(booking, status, notes);

      return booking;

    } catch (error) {
      console.error('Error updating booking status:', error.message);
      throw new Error('Failed to update booking status');
    }
  }

  // Cancel booking
  async cancelBooking(bookingId, reason, refundAmount = 0) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Get booking details
      const booking = await this.getBookingDetails(bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }

      if (booking.status === 'completed') {
        throw new Error('Cannot cancel completed booking');
      }

      // Update booking status
      await client.query(`
        UPDATE bookings 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1
      `, [bookingId]);

      // Process refund if applicable
      if (refundAmount > 0) {
        await client.query(`
          INSERT INTO rental_payments (
            booking_id, payment_type, amount, currency, status, 
            refund_amount, refund_date
          ) VALUES ($1, 'refund', $2, $3, 'success', $2, NOW())
        `, [bookingId, refundAmount, booking.currency]);

        // Process refund through Ghala if original payment exists
        const originalPayment = booking.payments.find(p => p.status === 'success' && p.payment_type !== 'refund');
        if (originalPayment && originalPayment.ghala_payment_id) {
          try {
            await ghalaService.processRefund(originalPayment.ghala_payment_id, refundAmount);
          } catch (refundError) {
            console.error('Ghala refund failed:', refundError.message);
            // Continue with cancellation even if refund fails
          }
        }
      }

      // Make vehicle available again
      await vehicleService.updateVehicleStatus(booking.vehicle_id, 'available', 'Booking cancelled');

      await client.query('COMMIT');

      // Send cancellation notification
      await this.sendCancellationNotification(booking, reason, refundAmount);

      return await this.getBookingDetails(bookingId);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error cancelling booking:', error.message);
      throw new Error('Failed to cancel booking');
    } finally {
      client.release();
    }
  }

  // Process booking payment
  async processBookingPayment(bookingId, paymentData) {
    try {
      const booking = await this.getBookingDetails(bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      const {
        paymentMethod,
        customerPhone,
        paymentType = 'full_payment' // full_payment, deposit
      } = paymentData;

      let amount = paymentType === 'deposit' ? booking.deposit_amount : booking.total_amount;

      // Create payment order with Ghala
      const ghalaOrder = await ghalaService.createPaymentOrder({
        orderId: `${booking.booking_reference}-${Date.now()}`,
        amount: amount,
        currency: booking.currency,
        customerPhone: customerPhone,
        paymentMethod: paymentMethod,
        description: `Car rental payment - ${booking.booking_reference}`,
        metadata: {
          bookingId: booking.id,
          paymentType: paymentType
        }
      });

      // Record payment in database
      const paymentResult = await db.query(`
        INSERT INTO rental_payments (
          booking_id, ghala_payment_id, payment_type, amount, currency,
          payment_method, status, customer_phone, transaction_reference
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
        RETURNING *
      `, [
        booking.id, ghalaOrder.id, paymentType, amount, booking.currency,
        paymentMethod, customerPhone, ghalaOrder.reference
      ]);

      return {
        payment: paymentResult.rows[0],
        ghalaOrder: ghalaOrder
      };

    } catch (error) {
      console.error('Error processing booking payment:', error.message);
      throw new Error('Failed to process booking payment');
    }
  }

  // Handle payment webhook
  async handlePaymentWebhook(webhookData) {
    try {
      const { orderId, status, amount, reference, metadata } = webhookData;

      if (!metadata || !metadata.bookingId) {
        console.error('No booking ID in payment webhook metadata');
        return;
      }

      const bookingId = metadata.bookingId;

      // Update payment status
      await db.query(`
        UPDATE rental_payments 
        SET status = $1, payment_date = NOW(), webhook_data = $2
        WHERE booking_id = $3 AND ghala_payment_id = $4
      `, [status, JSON.stringify(webhookData), bookingId, orderId]);

      // Update booking status based on payment
      if (status === 'success') {
        const booking = await this.getBookingDetails(bookingId);
        
        // Check if this completes the payment
        const totalPaid = booking.payments
          .filter(p => p.status === 'success')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        if (totalPaid >= booking.total_amount) {
          await this.updateBookingStatus(bookingId, 'confirmed', 'Payment completed');
        } else {
          await db.query(`
            UPDATE bookings 
            SET payment_status = 'partial'
            WHERE id = $1
          `, [bookingId]);
        }

        // Send payment confirmation
        await this.sendPaymentConfirmation(booking, amount);
      }

    } catch (error) {
      console.error('Error handling payment webhook:', error.message);
    }
  }

  // Send booking status notification via WhatsApp
  async sendBookingStatusNotification(booking, status, notes = null) {
    try {
      let message = '';
      
      switch (status) {
        case 'confirmed':
          message = `🎉 Booking Confirmed!\n\nBooking: ${booking.booking_reference}\nVehicle: ${booking.make} ${booking.model}\nPickup: ${booking.pickup_date}\nLocation: ${booking.pickup_location_name}\n\nThank you for choosing our service!`;
          break;
        case 'active':
          message = `🚗 Vehicle Picked Up!\n\nBooking: ${booking.booking_reference}\nVehicle: ${booking.make} ${booking.model}\nReturn Date: ${booking.return_date}\n\nEnjoy your trip! Drive safely.`;
          break;
        case 'completed':
          message = `✅ Rental Completed!\n\nBooking: ${booking.booking_reference}\nThank you for using our service!\n\nPlease rate your experience: [Rate Now]`;
          break;
        case 'cancelled':
          message = `❌ Booking Cancelled\n\nBooking: ${booking.booking_reference}\nReason: ${notes || 'Customer request'}\n\nWe're sorry to see you go. Book again anytime!`;
          break;
      }

      if (message) {
        await whatsappService.sendMessage(booking.customer_phone, message);
      }

    } catch (error) {
      console.error('Error sending booking notification:', error.message);
    }
  }

  // Send payment confirmation
  async sendPaymentConfirmation(booking, amount) {
    try {
      const message = `💳 Payment Received!\n\nAmount: ${booking.currency} ${amount}\nBooking: ${booking.booking_reference}\nVehicle: ${booking.make} ${booking.model}\n\nYour booking is confirmed! See you at pickup.`;
      
      await whatsappService.sendMessage(booking.customer_phone, message);

    } catch (error) {
      console.error('Error sending payment confirmation:', error.message);
    }
  }

  // Send cancellation notification
  async sendCancellationNotification(booking, reason, refundAmount) {
    try {
      let message = `❌ Booking Cancelled\n\nBooking: ${booking.booking_reference}\nReason: ${reason}`;
      
      if (refundAmount > 0) {
        message += `\n\nRefund: ${booking.currency} ${refundAmount}\nRefund will be processed within 3-5 business days.`;
      }
      
      message += '\n\nWe apologize for any inconvenience. Book again anytime!';
      
      await whatsappService.sendMessage(booking.customer_phone, message);

    } catch (error) {
      console.error('Error sending cancellation notification:', error.message);
    }
  }

  // Get booking statistics
  async getBookingStatistics(dateRange = {}) {
    try {
      const { 
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
        endDate = new Date() 
      } = dateRange;

      const result = await db.query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          SUM(total_amount) as total_revenue,
          AVG(total_amount)::DECIMAL(10,2) as avg_booking_value,
          AVG(total_days)::DECIMAL(4,1) as avg_rental_days
        FROM bookings
        WHERE created_at BETWEEN $1 AND $2
      `, [startDate, endDate]);

      return result.rows[0];

    } catch (error) {
      console.error('Error getting booking statistics:', error.message);
      throw new Error('Failed to get booking statistics');
    }
  }
}

module.exports = new BookingService();