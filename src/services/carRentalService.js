const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const logger = require('../utils/logger');

class CarRentalService {
  // Vehicle Search and Discovery
  async searchVehicles(searchParams) {
    try {
      const {
        location,
        pickupDate,
        returnDate,
        category,
        priceRange,
        features,
        seats,
        transmission,
        fuelType
      } = searchParams;

      let whereConditions = ['v.status = $1'];
      let queryParams = ['available'];
      let paramCount = 1;

      // Location filter
      if (location) {
        paramCount++;
        whereConditions.push(`l.name ILIKE $${paramCount} OR l.address ILIKE $${paramCount}`);
        queryParams.push(`%${location}%`);
      }

      // Category filter
      if (category) {
        paramCount++;
        whereConditions.push(`v.category = $${paramCount}`);
        queryParams.push(category);
      }

      // Price range filter
      if (priceRange) {
        if (priceRange.min) {
          paramCount++;
          whereConditions.push(`v.daily_rate >= $${paramCount}`);
          queryParams.push(priceRange.min);
        }
        if (priceRange.max) {
          paramCount++;
          whereConditions.push(`v.daily_rate <= $${paramCount}`);
          queryParams.push(priceRange.max);
        }
      }

      // Features filter
      if (features && features.length > 0) {
        paramCount++;
        whereConditions.push(`v.features ?& $${paramCount}`);
        queryParams.push(features);
      }

      // Seats filter
      if (seats) {
        paramCount++;
        whereConditions.push(`v.seats >= $${paramCount}`);
        queryParams.push(seats);
      }

      // Transmission filter
      if (transmission) {
        paramCount++;
        whereConditions.push(`v.transmission = $${paramCount}`);
        queryParams.push(transmission);
      }

      // Fuel type filter
      if (fuelType) {
        paramCount++;
        whereConditions.push(`v.fuel_type = $${paramCount}`);
        queryParams.push(fuelType);
      }

      const searchQuery = `
        SELECT 
          v.*,
          l.name as location_name,
          l.address as location_address,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.id) as review_count,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM bookings b 
              WHERE b.vehicle_id = v.id 
              AND b.status IN ('confirmed', 'active')
              AND (
                (b.pickup_datetime <= $${paramCount + 1} AND b.return_datetime >= $${paramCount + 1})
                OR (b.pickup_datetime <= $${paramCount + 2} AND b.return_datetime >= $${paramCount + 2})
                OR (b.pickup_datetime >= $${paramCount + 1} AND b.return_datetime <= $${paramCount + 2})
              )
            ) THEN false
            ELSE true
          END as is_available
        FROM vehicles v
        LEFT JOIN locations l ON v.location_id = l.id
        LEFT JOIN reviews r ON v.id = r.vehicle_id
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY v.id, l.name, l.address
        HAVING CASE 
          WHEN EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.vehicle_id = v.id 
            AND b.status IN ('confirmed', 'active')
            AND (
              (b.pickup_datetime <= $${paramCount + 1} AND b.return_datetime >= $${paramCount + 1})
              OR (b.pickup_datetime <= $${paramCount + 2} AND b.return_datetime >= $${paramCount + 2})
              OR (b.pickup_datetime >= $${paramCount + 1} AND b.return_datetime <= $${paramCount + 2})
            )
          ) THEN false
          ELSE true
        END = true
        ORDER BY v.daily_rate ASC, average_rating DESC
      `;

      queryParams.push(pickupDate, returnDate);

      const result = await query(searchQuery, queryParams);
      
      // Calculate dynamic pricing for each vehicle
      const vehiclesWithPricing = await Promise.all(
        result.rows.map(async (vehicle) => {
          const dynamicPrice = await this.calculateDynamicPrice(
            vehicle.id,
            pickupDate,
            returnDate,
            vehicle.daily_rate
          );
          
          return {
            ...vehicle,
            original_price: vehicle.daily_rate,
            dynamic_price: dynamicPrice,
            total_days: moment(returnDate).diff(moment(pickupDate), 'days') || 1
          };
        })
      );

      return {
        success: true,
        vehicles: vehiclesWithPricing,
        total: vehiclesWithPricing.length
      };
    } catch (error) {
      logger.error('Error searching vehicles:', error);
      return { success: false, error: error.message };
    }
  }

  // Dynamic Pricing Engine
  async calculateDynamicPrice(vehicleId, pickupDate, returnDate, basePrice) {
    try {
      let priceMultiplier = 1.0;
      const pickup = moment(pickupDate);
      const returnMoment = moment(returnDate);
      const duration = returnMoment.diff(pickup, 'days') || 1;

      // Weekend pricing (Friday-Sunday)
      if (pickup.day() >= 5 || returnMoment.day() >= 5) {
        priceMultiplier += 0.15; // 15% weekend surcharge
      }

      // Holiday pricing
      const holidays = await this.getHolidays();
      const isHoliday = holidays.some(holiday => 
        pickup.isBetween(holiday.start, holiday.end, 'day', '[]') ||
        returnMoment.isBetween(holiday.start, holiday.end, 'day', '[]')
      );
      if (isHoliday) {
        priceMultiplier += 0.25; // 25% holiday surcharge
      }

      // Demand-based pricing
      const demandMultiplier = await this.getDemandMultiplier(pickupDate, returnDate);
      priceMultiplier += demandMultiplier;

      // Duration discounts
      if (duration >= 7) {
        priceMultiplier -= 0.10; // 10% weekly discount
      } else if (duration >= 3) {
        priceMultiplier -= 0.05; // 5% multi-day discount
      }

      // Early booking discount
      const daysUntilPickup = pickup.diff(moment(), 'days');
      if (daysUntilPickup >= 14) {
        priceMultiplier -= 0.08; // 8% early booking discount
      } else if (daysUntilPickup >= 7) {
        priceMultiplier -= 0.05; // 5% early booking discount
      }

      // Ensure minimum pricing
      priceMultiplier = Math.max(priceMultiplier, 0.8); // Never go below 80% of base price
      priceMultiplier = Math.min(priceMultiplier, 2.0); // Never go above 200% of base price

      return Math.round(basePrice * priceMultiplier);
    } catch (error) {
      logger.error('Error calculating dynamic price:', error);
      return basePrice; // Return base price if calculation fails
    }
  }

  // Get demand multiplier based on historical data
  async getDemandMultiplier(pickupDate, returnDate) {
    try {
      const demandQuery = `
        SELECT COUNT(*) as booking_count
        FROM bookings
        WHERE pickup_datetime::date = $1::date
        AND status IN ('confirmed', 'active', 'completed')
      `;
      
      const result = await query(demandQuery, [pickupDate]);
      const bookingCount = parseInt(result.rows[0].booking_count);
      
      // Calculate demand multiplier (0-0.3 based on booking count)
      if (bookingCount >= 10) return 0.3;
      if (bookingCount >= 7) return 0.2;
      if (bookingCount >= 5) return 0.15;
      if (bookingCount >= 3) return 0.1;
      return 0;
    } catch (error) {
      logger.error('Error calculating demand multiplier:', error);
      return 0;
    }
  }

  // Get holidays for pricing calculations
  async getHolidays() {
    // This could be stored in database or fetched from external API
    const currentYear = moment().year();
    return [
      { start: moment(`${currentYear}-12-20`), end: moment(`${currentYear}-12-31`) }, // Christmas/New Year
      { start: moment(`${currentYear}-07-01`), end: moment(`${currentYear}-07-15`) }, // Summer holidays
      { start: moment(`${currentYear}-04-10`), end: moment(`${currentYear}-04-20`) }, // Easter holidays
    ];
  }

  // Vehicle Details with Enhanced Information
  async getVehicleDetails(vehicleId, pickupDate, returnDate) {
    try {
      const vehicleQuery = `
        SELECT 
          v.*,
          l.name as location_name,
          l.address as location_address,
          l.latitude,
          l.longitude,
          l.contact_phone as location_phone,
          l.operating_hours,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.id) as review_count,
          json_agg(
            json_build_object(
              'id', r.id,
              'customer_name', r.customer_name,
              'rating', r.rating,
              'comment', r.comment,
              'created_at', r.created_at
            )
          ) FILTER (WHERE r.id IS NOT NULL) as reviews
        FROM vehicles v
        LEFT JOIN locations l ON v.location_id = l.id
        LEFT JOIN reviews r ON v.id = r.vehicle_id
        WHERE v.id = $1
        GROUP BY v.id, l.name, l.address, l.latitude, l.longitude, l.contact_phone, l.operating_hours
      `;

      const result = await query(vehicleQuery, [vehicleId]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Vehicle not found' };
      }

      const vehicle = result.rows[0];
      
      // Calculate pricing
      const dynamicPrice = await this.calculateDynamicPrice(
        vehicleId,
        pickupDate,
        returnDate,
        vehicle.daily_rate
      );

      // Get available extras
      const extras = await this.getAvailableExtras();
      
      // Check availability
      const isAvailable = await this.checkVehicleAvailability(vehicleId, pickupDate, returnDate);

      return {
        success: true,
        vehicle: {
          ...vehicle,
          original_price: vehicle.daily_rate,
          dynamic_price: dynamicPrice,
          total_days: moment(returnDate).diff(moment(pickupDate), 'days') || 1,
          is_available: isAvailable,
          available_extras: extras
        }
      };
    } catch (error) {
      logger.error('Error getting vehicle details:', error);
      return { success: false, error: error.message };
    }
  }

  // Check Vehicle Availability
  async checkVehicleAvailability(vehicleId, pickupDate, returnDate) {
    try {
      const availabilityQuery = `
        SELECT COUNT(*) as conflict_count
        FROM bookings
        WHERE vehicle_id = $1
        AND status IN ('confirmed', 'active')
        AND (
          (pickup_datetime <= $2 AND return_datetime >= $2)
          OR (pickup_datetime <= $3 AND return_datetime >= $3)
          OR (pickup_datetime >= $2 AND return_datetime <= $3)
        )
      `;

      const result = await query(availabilityQuery, [vehicleId, pickupDate, returnDate]);
      return parseInt(result.rows[0].conflict_count) === 0;
    } catch (error) {
      logger.error('Error checking vehicle availability:', error);
      return false;
    }
  }

  // Get Available Extras
  async getAvailableExtras() {
    try {
      const extrasQuery = `
        SELECT * FROM extras
        WHERE is_active = true
        ORDER BY category, name
      `;

      const result = await query(extrasQuery);
      return result.rows;
    } catch (error) {
      logger.error('Error getting available extras:', error);
      return [];
    }
  }

  // Create Booking with Enhanced Features
  async createBooking(bookingData) {
    try {
      const {
        customerId,
        vehicleId,
        pickupLocationId,
        returnLocationId,
        pickupDatetime,
        returnDatetime,
        extras = [],
        insuranceType = 'basic',
        notes = ''
      } = bookingData;

      // Validate availability
      const isAvailable = await this.checkVehicleAvailability(vehicleId, pickupDatetime, returnDatetime);
      if (!isAvailable) {
        return { success: false, error: 'Vehicle not available for selected dates' };
      }

      // Get vehicle details for pricing
      const vehicleResult = await query('SELECT * FROM vehicles WHERE id = $1', [vehicleId]);
      if (vehicleResult.rows.length === 0) {
        return { success: false, error: 'Vehicle not found' };
      }

      const vehicle = vehicleResult.rows[0];
      const duration = moment(returnDatetime).diff(moment(pickupDatetime), 'days') || 1;
      
      // Calculate pricing
      const basePrice = await this.calculateDynamicPrice(vehicleId, pickupDatetime, returnDatetime, vehicle.daily_rate);
      const extrasTotal = await this.calculateExtrasTotal(extras, duration);
      const insuranceTotal = await this.calculateInsuranceTotal(insuranceType, basePrice, duration);
      const totalAmount = (basePrice * duration) + extrasTotal + insuranceTotal;

      // Create booking
      const bookingId = uuidv4();
      const bookingQuery = `
        INSERT INTO bookings (
          id, customer_id, vehicle_id, pickup_location_id, return_location_id,
          pickup_datetime, return_datetime, status, total_amount, security_deposit,
          extras, insurance_type, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *
      `;

      const bookingResult = await query(bookingQuery, [
        bookingId,
        customerId,
        vehicleId,
        pickupLocationId,
        returnLocationId || pickupLocationId,
        pickupDatetime,
        returnDatetime,
        'pending',
        totalAmount,
        vehicle.security_deposit,
        JSON.stringify(extras),
        insuranceType,
        notes
      ]);

      // Create pricing breakdown
      const pricingBreakdown = {
        base_price: basePrice,
        duration: duration,
        subtotal: basePrice * duration,
        extras_total: extrasTotal,
        insurance_total: insuranceTotal,
        total_amount: totalAmount,
        security_deposit: vehicle.security_deposit
      };

      return {
        success: true,
        booking: bookingResult.rows[0],
        pricing: pricingBreakdown
      };
    } catch (error) {
      logger.error('Error creating booking:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate Extras Total
  async calculateExtrasTotal(extras, duration) {
    if (!extras || extras.length === 0) return 0;

    try {
      const extrasQuery = `
        SELECT * FROM extras
        WHERE id = ANY($1)
      `;

      const result = await query(extrasQuery, [extras.map(e => e.id)]);
      const extrasData = result.rows;

      let total = 0;
      extras.forEach(extra => {
        const extraData = extrasData.find(e => e.id === extra.id);
        if (extraData) {
          if (extraData.pricing_type === 'per_day') {
            total += extraData.price * duration * (extra.quantity || 1);
          } else {
            total += extraData.price * (extra.quantity || 1);
          }
        }
      });

      return total;
    } catch (error) {
      logger.error('Error calculating extras total:', error);
      return 0;
    }
  }

  // Calculate Insurance Total
  async calculateInsuranceTotal(insuranceType, basePrice, duration) {
    const insuranceRates = {
      basic: 0,
      premium: 0.20,
      full: 0.35
    };

    const rate = insuranceRates[insuranceType] || 0;
    return Math.round(basePrice * duration * rate);
  }

  // Get Customer Bookings
  async getCustomerBookings(customerId, status = null) {
    try {
      let whereClause = 'b.customer_id = $1';
      let queryParams = [customerId];

      if (status) {
        whereClause += ' AND b.status = $2';
        queryParams.push(status);
      }

      const bookingsQuery = `
        SELECT 
          b.*,
          v.make,
          v.model,
          v.year,
          v.license_plate,
          v.images,
          pl.name as pickup_location_name,
          pl.address as pickup_location_address,
          rl.name as return_location_name,
          rl.address as return_location_address
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN locations pl ON b.pickup_location_id = pl.id
        LEFT JOIN locations rl ON b.return_location_id = rl.id
        WHERE ${whereClause}
        ORDER BY b.created_at DESC
      `;

      const result = await query(bookingsQuery, queryParams);
      return {
        success: true,
        bookings: result.rows
      };
    } catch (error) {
      logger.error('Error getting customer bookings:', error);
      return { success: false, error: error.message };
    }
  }

  // Update Booking Status
  async updateBookingStatus(bookingId, status, notes = '') {
    try {
      const updateQuery = `
        UPDATE bookings
        SET status = $1, notes = COALESCE(notes, '') || $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await query(updateQuery, [status, notes, bookingId]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Booking not found' };
      }

      return {
        success: true,
        booking: result.rows[0]
      };
    } catch (error) {
      logger.error('Error updating booking status:', error);
      return { success: false, error: error.message };
    }
  }

  // Get Locations
  async getLocations() {
    try {
      const locationsQuery = `
        SELECT * FROM locations
        WHERE is_active = true
        ORDER BY name
      `;

      const result = await query(locationsQuery);
      return {
        success: true,
        locations: result.rows
      };
    } catch (error) {
      logger.error('Error getting locations:', error);
      return { success: false, error: error.message };
    }
  }

  // Get Popular Locations
  async getPopularLocations(limit = 5) {
    try {
      const popularQuery = `
        SELECT 
          l.*,
          COUNT(b.id) as booking_count
        FROM locations l
        LEFT JOIN bookings b ON l.id = b.pickup_location_id
        WHERE l.is_active = true
        GROUP BY l.id
        ORDER BY booking_count DESC, l.name
        LIMIT $1
      `;

      const result = await query(popularQuery, [limit]);
      return {
        success: true,
        locations: result.rows
      };
    } catch (error) {
      logger.error('Error getting popular locations:', error);
      return { success: false, error: error.message };
    }
  }

  // Vehicle Categories
  async getVehicleCategories() {
    try {
      const categoriesQuery = `
        SELECT 
          category,
          COUNT(*) as vehicle_count,
          MIN(daily_rate) as min_price,
          MAX(daily_rate) as max_price,
          AVG(daily_rate) as avg_price
        FROM vehicles
        WHERE status = 'available'
        GROUP BY category
        ORDER BY avg_price
      `;

      const result = await query(categoriesQuery);
      return {
        success: true,
        categories: result.rows
      };
    } catch (error) {
      logger.error('Error getting vehicle categories:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CarRentalService();