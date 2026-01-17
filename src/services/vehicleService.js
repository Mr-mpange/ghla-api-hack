const db = require('../config/database');
const { redis } = require('../config/redis');

class VehicleService {
  // Search vehicles with availability check
  async searchVehicles(searchParams) {
    try {
      const {
        pickupDate,
        returnDate,
        pickupLocationId,
        returnLocationId,
        category,
        minPrice,
        maxPrice,
        features = [],
        seats,
        transmission,
        fuelType,
        limit = 20,
        offset = 0
      } = searchParams;

      let query = `
        SELECT DISTINCT v.*, 
               l.name as location_name,
               l.address as location_address,
               CASE WHEN v.weekly_rate IS NOT NULL AND $1::date + INTERVAL '7 days' <= $2::date 
                    THEN v.weekly_rate 
                    ELSE v.daily_rate 
               END as effective_rate,
               (
                 SELECT AVG(rating)::DECIMAL(3,2) 
                 FROM rental_reviews rr 
                 WHERE rr.vehicle_id = v.id AND rr.is_published = true
               ) as avg_rating,
               (
                 SELECT COUNT(*) 
                 FROM rental_reviews rr 
                 WHERE rr.vehicle_id = v.id AND rr.is_published = true
               ) as review_count
        FROM vehicles v
        LEFT JOIN locations l ON v.location_id = l.id
        WHERE v.is_active = true 
          AND v.status = 'available'
          AND (v.location_id = $3 OR $3 IS NULL)
      `;

      const params = [pickupDate, returnDate, pickupLocationId];
      let paramIndex = 4;

      // Check availability - vehicle not booked during requested period
      if (pickupDate && returnDate) {
        query += ` AND v.id NOT IN (
          SELECT DISTINCT b.vehicle_id 
          FROM bookings b 
          WHERE b.status IN ('confirmed', 'active')
            AND NOT (
              b.return_date <= $${paramIndex}::timestamp OR 
              b.pickup_date >= $${paramIndex + 1}::timestamp
            )
        )`;
        params.push(pickupDate, returnDate);
        paramIndex += 2;
      }

      // Add filters
      if (category) {
        query += ` AND v.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (minPrice) {
        query += ` AND v.daily_rate >= $${paramIndex}`;
        params.push(minPrice);
        paramIndex++;
      }

      if (maxPrice) {
        query += ` AND v.daily_rate <= $${paramIndex}`;
        params.push(maxPrice);
        paramIndex++;
      }

      if (seats) {
        query += ` AND v.seats >= $${paramIndex}`;
        params.push(seats);
        paramIndex++;
      }

      if (transmission) {
        query += ` AND v.transmission = $${paramIndex}`;
        params.push(transmission);
        paramIndex++;
      }

      if (fuelType) {
        query += ` AND v.fuel_type = $${paramIndex}`;
        params.push(fuelType);
        paramIndex++;
      }

      // Feature filtering
      if (features.length > 0) {
        query += ` AND v.features && $${paramIndex}`;
        params.push(features);
        paramIndex++;
      }

      // Order by rating and price
      query += ` ORDER BY avg_rating DESC NULLS LAST, v.daily_rate ASC`;

      // Add pagination
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);
      
      // Calculate total days and pricing for each vehicle
      const vehicles = result.rows.map(vehicle => {
        if (pickupDate && returnDate) {
          const pickup = new Date(pickupDate);
          const returnD = new Date(returnDate);
          const totalDays = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));
          
          let totalPrice = vehicle.daily_rate * totalDays;
          
          // Apply weekly rate if applicable
          if (vehicle.weekly_rate && totalDays >= 7) {
            const weeks = Math.floor(totalDays / 7);
            const remainingDays = totalDays % 7;
            totalPrice = (weeks * vehicle.weekly_rate) + (remainingDays * vehicle.daily_rate);
          }

          return {
            ...vehicle,
            total_days: totalDays,
            total_price: totalPrice
          };
        }
        return vehicle;
      });

      return vehicles;

    } catch (error) {
      console.error('Error searching vehicles:', error.message);
      throw new Error('Failed to search vehicles');
    }
  }

  // Get vehicle details with availability
  async getVehicleDetails(vehicleId, pickupDate = null, returnDate = null) {
    try {
      const result = await db.query(`
        SELECT v.*, 
               l.name as location_name,
               l.address as location_address,
               l.phone as location_phone,
               l.operating_hours,
               (
                 SELECT AVG(rating)::DECIMAL(3,2) 
                 FROM rental_reviews rr 
                 WHERE rr.vehicle_id = v.id AND rr.is_published = true
               ) as avg_rating,
               (
                 SELECT COUNT(*) 
                 FROM rental_reviews rr 
                 WHERE rr.vehicle_id = v.id AND rr.is_published = true
               ) as review_count
        FROM vehicles v
        LEFT JOIN locations l ON v.location_id = l.id
        WHERE v.id = $1 AND v.is_active = true
      `, [vehicleId]);

      if (result.rows.length === 0) {
        throw new Error('Vehicle not found');
      }

      const vehicle = result.rows[0];

      // Check availability for specific dates
      if (pickupDate && returnDate) {
        const availabilityResult = await db.query(`
          SELECT COUNT(*) as conflict_count
          FROM bookings b 
          WHERE b.vehicle_id = $1
            AND b.status IN ('confirmed', 'active')
            AND NOT (
              b.return_date <= $2::timestamp OR 
              b.pickup_date >= $3::timestamp
            )
        `, [vehicleId, pickupDate, returnDate]);

        vehicle.is_available = availabilityResult.rows[0].conflict_count === '0';
        
        if (vehicle.is_available) {
          const pickup = new Date(pickupDate);
          const returnD = new Date(returnDate);
          const totalDays = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));
          
          let totalPrice = vehicle.daily_rate * totalDays;
          
          // Apply weekly rate if applicable
          if (vehicle.weekly_rate && totalDays >= 7) {
            const weeks = Math.floor(totalDays / 7);
            const remainingDays = totalDays % 7;
            totalPrice = (weeks * vehicle.weekly_rate) + (remainingDays * vehicle.daily_rate);
          }

          vehicle.total_days = totalDays;
          vehicle.total_price = totalPrice;
        }
      }

      // Get recent reviews
      const reviewsResult = await db.query(`
        SELECT rr.*, c.name as customer_name
        FROM rental_reviews rr
        JOIN customers c ON rr.customer_id = c.id
        WHERE rr.vehicle_id = $1 AND rr.is_published = true
        ORDER BY rr.created_at DESC
        LIMIT 5
      `, [vehicleId]);

      vehicle.recent_reviews = reviewsResult.rows;

      return vehicle;

    } catch (error) {
      console.error('Error getting vehicle details:', error.message);
      throw new Error('Failed to get vehicle details');
    }
  }

  // Get vehicle categories with counts
  async getVehicleCategories() {
    try {
      const cacheKey = 'vehicle_categories';
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const result = await db.query(`
        SELECT 
          category,
          COUNT(*) as vehicle_count,
          MIN(daily_rate) as min_price,
          MAX(daily_rate) as max_price,
          AVG(daily_rate)::DECIMAL(10,2) as avg_price
        FROM vehicles 
        WHERE is_active = true AND status = 'available'
        GROUP BY category
        ORDER BY vehicle_count DESC
      `);

      const categories = result.rows;

      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(categories));

      return categories;

    } catch (error) {
      console.error('Error getting vehicle categories:', error.message);
      throw new Error('Failed to get vehicle categories');
    }
  }

  // Get available locations
  async getLocations() {
    try {
      const result = await db.query(`
        SELECT l.*, 
               COUNT(v.id) as vehicle_count
        FROM locations l
        LEFT JOIN vehicles v ON l.id = v.location_id AND v.is_active = true AND v.status = 'available'
        WHERE l.is_active = true
        GROUP BY l.id
        ORDER BY l.name
      `);

      return result.rows;

    } catch (error) {
      console.error('Error getting locations:', error.message);
      throw new Error('Failed to get locations');
    }
  }

  // Check vehicle availability for specific dates
  async checkAvailability(vehicleId, pickupDate, returnDate) {
    try {
      const result = await db.query(`
        SELECT 
          v.id,
          v.make,
          v.model,
          v.status,
          COUNT(b.id) as booking_conflicts
        FROM vehicles v
        LEFT JOIN bookings b ON v.id = b.vehicle_id
          AND b.status IN ('confirmed', 'active')
          AND NOT (
            b.return_date <= $2::timestamp OR 
            b.pickup_date >= $3::timestamp
          )
        WHERE v.id = $1 AND v.is_active = true
        GROUP BY v.id, v.make, v.model, v.status
      `, [vehicleId, pickupDate, returnDate]);

      if (result.rows.length === 0) {
        return { available: false, reason: 'Vehicle not found' };
      }

      const vehicle = result.rows[0];
      
      if (vehicle.status !== 'available') {
        return { 
          available: false, 
          reason: `Vehicle is currently ${vehicle.status}` 
        };
      }

      if (parseInt(vehicle.booking_conflicts) > 0) {
        return { 
          available: false, 
          reason: 'Vehicle is already booked for selected dates' 
        };
      }

      return { available: true };

    } catch (error) {
      console.error('Error checking availability:', error.message);
      throw new Error('Failed to check vehicle availability');
    }
  }

  // Get vehicle calendar (for admin)
  async getVehicleCalendar(vehicleId, startDate, endDate) {
    try {
      const result = await db.query(`
        SELECT 
          b.id,
          b.booking_reference,
          b.pickup_date,
          b.return_date,
          b.status,
          c.name as customer_name,
          c.phone as customer_phone
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        WHERE b.vehicle_id = $1
          AND b.status IN ('confirmed', 'active')
          AND b.pickup_date <= $3::date
          AND b.return_date >= $2::date
        ORDER BY b.pickup_date
      `, [vehicleId, startDate, endDate]);

      return result.rows;

    } catch (error) {
      console.error('Error getting vehicle calendar:', error.message);
      throw new Error('Failed to get vehicle calendar');
    }
  }

  // Update vehicle status
  async updateVehicleStatus(vehicleId, status, notes = null) {
    try {
      const validStatuses = ['available', 'rented', 'maintenance', 'retired'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid vehicle status');
      }

      const result = await db.query(`
        UPDATE vehicles 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, vehicleId]);

      if (result.rows.length === 0) {
        throw new Error('Vehicle not found');
      }

      // Log status change if needed
      if (notes) {
        await db.query(`
          INSERT INTO vehicle_maintenance (vehicle_id, maintenance_type, description, status)
          VALUES ($1, 'status_change', $2, 'completed')
        `, [vehicleId, `Status changed to ${status}: ${notes}`]);
      }

      return result.rows[0];

    } catch (error) {
      console.error('Error updating vehicle status:', error.message);
      throw new Error('Failed to update vehicle status');
    }
  }

  // Get vehicle maintenance history
  async getMaintenanceHistory(vehicleId) {
    try {
      const result = await db.query(`
        SELECT * FROM vehicle_maintenance
        WHERE vehicle_id = $1
        ORDER BY created_at DESC
      `, [vehicleId]);

      return result.rows;

    } catch (error) {
      console.error('Error getting maintenance history:', error.message);
      throw new Error('Failed to get maintenance history');
    }
  }

  // Schedule maintenance
  async scheduleMaintenance(vehicleId, maintenanceData) {
    try {
      const {
        maintenanceType,
        description,
        scheduledDate,
        serviceProvider,
        estimatedCost
      } = maintenanceData;

      const result = await db.query(`
        INSERT INTO vehicle_maintenance (
          vehicle_id, maintenance_type, description, scheduled_date,
          service_provider, cost, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
        RETURNING *
      `, [vehicleId, maintenanceType, description, scheduledDate, serviceProvider, estimatedCost]);

      // Update vehicle status to maintenance if scheduled for today or past
      const today = new Date().toISOString().split('T')[0];
      if (scheduledDate <= today) {
        await this.updateVehicleStatus(vehicleId, 'maintenance', `Scheduled maintenance: ${description}`);
      }

      return result.rows[0];

    } catch (error) {
      console.error('Error scheduling maintenance:', error.message);
      throw new Error('Failed to schedule maintenance');
    }
  }

  // Get fleet statistics
  async getFleetStatistics() {
    try {
      const result = await db.query(`
        SELECT 
          COUNT(*) as total_vehicles,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available_vehicles,
          COUNT(CASE WHEN status = 'rented' THEN 1 END) as rented_vehicles,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_vehicles,
          COUNT(CASE WHEN status = 'retired' THEN 1 END) as retired_vehicles,
          AVG(EXTRACT(YEAR FROM NOW()) - year)::DECIMAL(4,1) as avg_age,
          COUNT(DISTINCT category) as categories_count
        FROM vehicles
        WHERE is_active = true
      `);

      const stats = result.rows[0];

      // Get utilization rate (last 30 days)
      const utilizationResult = await db.query(`
        SELECT 
          COUNT(DISTINCT b.vehicle_id) as utilized_vehicles,
          AVG(EXTRACT(EPOCH FROM (b.return_date - b.pickup_date)) / 86400)::DECIMAL(4,1) as avg_rental_days
        FROM bookings b
        WHERE b.status IN ('completed', 'active')
          AND b.pickup_date >= NOW() - INTERVAL '30 days'
      `);

      const utilization = utilizationResult.rows[0];
      stats.utilization_rate = stats.total_vehicles > 0 
        ? ((utilization.utilized_vehicles / stats.total_vehicles) * 100).toFixed(1)
        : 0;
      stats.avg_rental_days = utilization.avg_rental_days || 0;

      return stats;

    } catch (error) {
      console.error('Error getting fleet statistics:', error.message);
      throw new Error('Failed to get fleet statistics');
    }
  }

  // Get popular vehicles
  async getPopularVehicles(limit = 10) {
    try {
      const result = await db.query(`
        SELECT 
          v.*,
          COUNT(b.id) as booking_count,
          AVG(rr.rating)::DECIMAL(3,2) as avg_rating,
          COUNT(rr.id) as review_count
        FROM vehicles v
        LEFT JOIN bookings b ON v.id = b.vehicle_id AND b.status = 'completed'
        LEFT JOIN rental_reviews rr ON v.id = rr.vehicle_id AND rr.is_published = true
        WHERE v.is_active = true AND v.status = 'available'
        GROUP BY v.id
        ORDER BY booking_count DESC, avg_rating DESC NULLS LAST
        LIMIT $1
      `, [limit]);

      return result.rows;

    } catch (error) {
      console.error('Error getting popular vehicles:', error.message);
      throw new Error('Failed to get popular vehicles');
    }
  }
}

module.exports = new VehicleService();