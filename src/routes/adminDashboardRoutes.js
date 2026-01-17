const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const logger = require('../utils/logger');
const moment = require('moment');

// Dashboard Overview
router.get('/overview', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = moment().subtract(parseInt(period), 'days').format('YYYY-MM-DD');
    const endDate = moment().format('YYYY-MM-DD');

    // Get key metrics
    const [
      totalVehicles,
      activeBookings,
      totalRevenue,
      customerCount,
      utilizationRate,
      recentBookings,
      topVehicles,
      revenueByDay
    ] = await Promise.all([
      // Total vehicles
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'rented' THEN 1 END) as rented,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
        FROM vehicles
      `),

      // Active bookings
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
        FROM bookings
        WHERE pickup_datetime >= CURRENT_DATE - INTERVAL '7 days'
      `),

      // Total revenue
      query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_revenue,
          COUNT(*) as total_payments,
          COALESCE(AVG(amount), 0) as avg_payment
        FROM payments
        WHERE status = 'success' 
        AND payment_type = 'rental'
        AND created_at >= $1
      `, [startDate]),

      // Customer count
      query(`
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_customers
        FROM customers
      `, [startDate]),

      // Fleet utilization rate
      query(`
        SELECT 
          COUNT(DISTINCT v.id) as total_vehicles,
          COUNT(DISTINCT CASE WHEN b.status IN ('confirmed', 'active') THEN b.vehicle_id END) as utilized_vehicles
        FROM vehicles v
        LEFT JOIN bookings b ON v.id = b.vehicle_id 
          AND b.pickup_datetime <= NOW() 
          AND b.return_datetime >= NOW()
      `),

      // Recent bookings
      query(`
        SELECT 
          b.id,
          b.booking_reference,
          b.status,
          b.total_amount,
          b.pickup_datetime,
          b.return_datetime,
          c.full_name as customer_name,
          c.phone_number,
          v.make,
          v.model,
          v.license_plate,
          l.name as pickup_location
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN locations l ON b.pickup_location_id = l.id
        ORDER BY b.created_at DESC
        LIMIT 10
      `),

      // Top performing vehicles
      query(`
        SELECT 
          v.id,
          v.make,
          v.model,
          v.license_plate,
          v.category,
          COUNT(b.id) as booking_count,
          COALESCE(SUM(b.total_amount), 0) as total_revenue,
          COALESCE(AVG(r.rating), 0) as avg_rating
        FROM vehicles v
        LEFT JOIN bookings b ON v.id = b.vehicle_id 
          AND b.status = 'completed'
          AND b.created_at >= $1
        LEFT JOIN reviews r ON v.id = r.vehicle_id
        GROUP BY v.id, v.make, v.model, v.license_plate, v.category
        ORDER BY total_revenue DESC
        LIMIT 5
      `, [startDate]),

      // Revenue by day
      query(`
        SELECT 
          DATE(p.created_at) as date,
          COALESCE(SUM(p.amount), 0) as revenue,
          COUNT(p.id) as payment_count
        FROM payments p
        WHERE p.status = 'success' 
        AND p.payment_type = 'rental'
        AND p.created_at >= $1
        GROUP BY DATE(p.created_at)
        ORDER BY date
      `, [startDate])
    ]);

    // Calculate utilization rate
    const utilization = totalVehicles.rows[0].total > 0 
      ? (utilizationRate.rows[0].utilized_vehicles / utilizationRate.rows[0].total_vehicles * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        metrics: {
          vehicles: totalVehicles.rows[0],
          bookings: activeBookings.rows[0],
          revenue: {
            ...totalRevenue.rows[0],
            total_revenue: parseFloat(totalRevenue.rows[0].total_revenue),
            avg_payment: parseFloat(totalRevenue.rows[0].avg_payment)
          },
          customers: customerCount.rows[0],
          utilization_rate: parseFloat(utilization)
        },
        recent_bookings: recentBookings.rows,
        top_vehicles: topVehicles.rows.map(v => ({
          ...v,
          total_revenue: parseFloat(v.total_revenue),
          avg_rating: parseFloat(v.avg_rating)
        })),
        revenue_chart: revenueByDay.rows.map(r => ({
          ...r,
          revenue: parseFloat(r.revenue)
        }))
      }
    });

  } catch (error) {
    logger.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard overview'
    });
  }
});

// Fleet Management
router.get('/fleet', async (req, res) => {
  try {
    const { 
      status, 
      category, 
      location, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Build WHERE conditions
    if (status) {
      paramCount++;
      whereConditions.push(`v.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (category) {
      paramCount++;
      whereConditions.push(`v.category = $${paramCount}`);
      queryParams.push(category);
    }

    if (location) {
      paramCount++;
      whereConditions.push(`v.location_id = $${paramCount}`);
      queryParams.push(location);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(v.make ILIKE $${paramCount} OR v.model ILIKE $${paramCount} OR v.license_plate ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vehicles v
      LEFT JOIN locations l ON v.location_id = l.id
      ${whereClause}
    `;

    const totalResult = await query(countQuery, queryParams);
    const total = parseInt(totalResult.rows[0].total);

    // Get vehicles with pagination
    const offset = (page - 1) * limit;
    paramCount += 2;
    
    const vehiclesQuery = `
      SELECT 
        v.*,
        l.name as location_name,
        l.address as location_address,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.id) as review_count,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.vehicle_id = v.id 
          AND b.status IN ('confirmed', 'active')
          AND b.pickup_datetime <= NOW() + INTERVAL '7 days'
        ) as upcoming_bookings,
        (
          SELECT b.return_datetime
          FROM bookings b
          WHERE b.vehicle_id = v.id
          AND b.status = 'active'
          ORDER BY b.return_datetime DESC
          LIMIT 1
        ) as current_rental_end
      FROM vehicles v
      LEFT JOIN locations l ON v.location_id = l.id
      LEFT JOIN reviews r ON v.id = r.vehicle_id
      ${whereClause}
      GROUP BY v.id, l.name, l.address
      ORDER BY v.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    queryParams.push(limit, offset);
    const vehiclesResult = await query(vehiclesQuery, queryParams);

    res.json({
      success: true,
      data: {
        vehicles: vehiclesResult.rows.map(v => ({
          ...v,
          avg_rating: parseFloat(v.avg_rating),
          daily_rate: parseFloat(v.daily_rate),
          security_deposit: parseFloat(v.security_deposit)
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching fleet data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fleet data'
    });
  }
});

// Vehicle Details
router.get('/fleet/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const [vehicleResult, bookingHistoryResult, maintenanceResult, revenueResult] = await Promise.all([
      // Vehicle details
      query(`
        SELECT 
          v.*,
          l.name as location_name,
          l.address as location_address,
          l.contact_phone as location_phone,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(r.id) as review_count
        FROM vehicles v
        LEFT JOIN locations l ON v.location_id = l.id
        LEFT JOIN reviews r ON v.id = r.vehicle_id
        WHERE v.id = $1
        GROUP BY v.id, l.name, l.address, l.contact_phone
      `, [vehicleId]),

      // Booking history
      query(`
        SELECT 
          b.id,
          b.booking_reference,
          b.status,
          b.pickup_datetime,
          b.return_datetime,
          b.total_amount,
          c.full_name as customer_name,
          c.phone_number,
          pl.name as pickup_location,
          rl.name as return_location
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN locations pl ON b.pickup_location_id = pl.id
        LEFT JOIN locations rl ON b.return_location_id = rl.id
        WHERE b.vehicle_id = $1
        ORDER BY b.created_at DESC
        LIMIT 20
      `, [vehicleId]),

      // Maintenance history
      query(`
        SELECT *
        FROM vehicle_maintenance
        WHERE vehicle_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `, [vehicleId]),

      // Revenue statistics
      query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount END), 0) as avg_booking_value
        FROM bookings
        WHERE vehicle_id = $1
      `, [vehicleId])
    ]);

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    const vehicle = vehicleResult.rows[0];

    res.json({
      success: true,
      data: {
        vehicle: {
          ...vehicle,
          avg_rating: parseFloat(vehicle.avg_rating),
          daily_rate: parseFloat(vehicle.daily_rate),
          security_deposit: parseFloat(vehicle.security_deposit)
        },
        booking_history: bookingHistoryResult.rows.map(b => ({
          ...b,
          total_amount: parseFloat(b.total_amount)
        })),
        maintenance_history: maintenanceResult.rows.map(m => ({
          ...m,
          cost: m.cost ? parseFloat(m.cost) : null
        })),
        revenue_stats: {
          ...revenueResult.rows[0],
          total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
          avg_booking_value: parseFloat(revenueResult.rows[0].avg_booking_value)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching vehicle details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle details'
    });
  }
});

// Update Vehicle Status
router.patch('/fleet/:vehicleId/status', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['available', 'rented', 'maintenance', 'out_of_service'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const result = await query(`
      UPDATE vehicles 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, vehicleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Log the status change
    if (notes) {
      await query(`
        INSERT INTO vehicle_maintenance (vehicle_id, maintenance_type, description, status, created_at)
        VALUES ($1, 'status_change', $2, 'completed', NOW())
      `, [vehicleId, `Status changed to ${status}: ${notes}`]);
    }

    res.json({
      success: true,
      data: {
        vehicle: result.rows[0],
        message: `Vehicle status updated to ${status}`
      }
    });

  } catch (error) {
    logger.error('Error updating vehicle status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle status'
    });
  }
});

// Booking Management
router.get('/bookings', async (req, res) => {
  try {
    const {
      status,
      date_from,
      date_to,
      customer_search,
      vehicle_search,
      page = 1,
      limit = 20
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Build WHERE conditions
    if (status) {
      paramCount++;
      whereConditions.push(`b.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (date_from) {
      paramCount++;
      whereConditions.push(`b.pickup_datetime >= $${paramCount}`);
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      whereConditions.push(`b.pickup_datetime <= $${paramCount}`);
      queryParams.push(date_to);
    }

    if (customer_search) {
      paramCount++;
      whereConditions.push(`(c.full_name ILIKE $${paramCount} OR c.phone_number ILIKE $${paramCount})`);
      queryParams.push(`%${customer_search}%`);
    }

    if (vehicle_search) {
      paramCount++;
      whereConditions.push(`(v.make ILIKE $${paramCount} OR v.model ILIKE $${paramCount} OR v.license_plate ILIKE $${paramCount})`);
      queryParams.push(`%${vehicle_search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN vehicles v ON b.vehicle_id = v.id
      ${whereClause}
    `;

    const totalResult = await query(countQuery, queryParams);
    const total = parseInt(totalResult.rows[0].total);

    // Get bookings with pagination
    const offset = (page - 1) * limit;
    paramCount += 2;

    const bookingsQuery = `
      SELECT 
        b.*,
        c.full_name as customer_name,
        c.phone_number as customer_phone,
        c.email as customer_email,
        v.make,
        v.model,
        v.year,
        v.license_plate,
        pl.name as pickup_location_name,
        rl.name as return_location_name,
        p.status as payment_status,
        p.payment_method
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN locations pl ON b.pickup_location_id = pl.id
      LEFT JOIN locations rl ON b.return_location_id = rl.id
      LEFT JOIN payments p ON b.id = p.booking_id AND p.payment_type = 'rental'
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    queryParams.push(limit, offset);
    const bookingsResult = await query(bookingsQuery, queryParams);

    res.json({
      success: true,
      data: {
        bookings: bookingsResult.rows.map(b => ({
          ...b,
          total_amount: parseFloat(b.total_amount),
          security_deposit: parseFloat(b.security_deposit)
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// Update Booking Status
router.patch('/bookings/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const result = await query(`
      UPDATE bookings 
      SET status = $1, notes = COALESCE(notes, '') || $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, notes ? `\nAdmin update: ${notes}` : '', bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Update vehicle status based on booking status
    const booking = result.rows[0];
    let vehicleStatus = 'available';
    
    if (status === 'active') {
      vehicleStatus = 'rented';
    } else if (status === 'completed' || status === 'cancelled') {
      vehicleStatus = 'available';
    }

    await query(`
      UPDATE vehicles 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `, [vehicleStatus, booking.vehicle_id]);

    res.json({
      success: true,
      data: {
        booking: result.rows[0],
        message: `Booking status updated to ${status}`
      }
    });

  } catch (error) {
    logger.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status'
    });
  }
});

// Customer Management
router.get('/customers', async (req, res) => {
  try {
    const {
      search,
      verification_status,
      page = 1,
      limit = 20
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(`(c.full_name ILIKE $${paramCount} OR c.phone_number ILIKE $${paramCount} OR c.email ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (verification_status) {
      paramCount++;
      whereConditions.push(`c.verification_status = $${paramCount}`);
      queryParams.push(verification_status);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM customers c ${whereClause}`;
    const totalResult = await query(countQuery, queryParams);
    const total = parseInt(totalResult.rows[0].total);

    // Get customers with pagination
    const offset = (page - 1) * limit;
    paramCount += 2;

    const customersQuery = `
      SELECT 
        c.*,
        COUNT(b.id) as total_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as total_spent,
        MAX(b.created_at) as last_booking_date
      FROM customers c
      LEFT JOIN bookings b ON c.id = b.customer_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    queryParams.push(limit, offset);
    const customersResult = await query(customersQuery, queryParams);

    res.json({
      success: true,
      data: {
        customers: customersResult.rows.map(c => ({
          ...c,
          total_spent: parseFloat(c.total_spent)
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    });
  }
});

// Analytics and Reports
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { period = '30', group_by = 'day' } = req.query;
    const startDate = moment().subtract(parseInt(period), 'days').format('YYYY-MM-DD');

    let dateFormat, dateGroup;
    switch (group_by) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH24:00:00';
        dateGroup = 'hour';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        dateGroup = 'week';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        dateGroup = 'month';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        dateGroup = 'day';
    }

    const revenueQuery = `
      SELECT 
        TO_CHAR(p.created_at, $1) as period,
        COALESCE(SUM(p.amount), 0) as revenue,
        COUNT(p.id) as transaction_count,
        COUNT(DISTINCT b.customer_id) as unique_customers
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      WHERE p.status = 'success' 
      AND p.payment_type = 'rental'
      AND p.created_at >= $2
      GROUP BY TO_CHAR(p.created_at, $1)
      ORDER BY period
    `;

    const result = await query(revenueQuery, [dateFormat, startDate]);

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        group_by: dateGroup,
        revenue_data: result.rows.map(r => ({
          ...r,
          revenue: parseFloat(r.revenue)
        }))
      }
    });

  } catch (error) {
    logger.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue analytics'
    });
  }
});

// Fleet Utilization Analytics
router.get('/analytics/utilization', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = moment().subtract(parseInt(period), 'days').format('YYYY-MM-DD');

    const utilizationQuery = `
      SELECT 
        v.id,
        v.make,
        v.model,
        v.license_plate,
        v.category,
        COUNT(b.id) as total_bookings,
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (b.return_datetime - b.pickup_datetime)) / 3600
        ), 0) as total_hours_booked,
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        ROUND(
          (COALESCE(SUM(
            EXTRACT(EPOCH FROM (b.return_datetime - b.pickup_datetime)) / 3600
          ), 0) / (24 * $1)) * 100, 2
        ) as utilization_percentage
      FROM vehicles v
      LEFT JOIN bookings b ON v.id = b.vehicle_id 
        AND b.status IN ('completed', 'active')
        AND b.pickup_datetime >= $2
      GROUP BY v.id, v.make, v.model, v.license_plate, v.category
      ORDER BY utilization_percentage DESC
    `;

    const result = await query(utilizationQuery, [parseInt(period), startDate]);

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        utilization_data: result.rows.map(r => ({
          ...r,
          total_hours_booked: parseFloat(r.total_hours_booked),
          total_revenue: parseFloat(r.total_revenue),
          utilization_percentage: parseFloat(r.utilization_percentage)
        }))
      }
    });

  } catch (error) {
    logger.error('Error fetching utilization analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utilization analytics'
    });
  }
});

// Export data
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json', date_from, date_to } = req.query;

    let data = [];
    let filename = '';

    switch (type) {
      case 'bookings':
        const bookingsResult = await query(`
          SELECT 
            b.booking_reference,
            b.status,
            b.pickup_datetime,
            b.return_datetime,
            b.total_amount,
            c.full_name as customer_name,
            c.phone_number,
            v.make,
            v.model,
            v.license_plate,
            pl.name as pickup_location
          FROM bookings b
          JOIN customers c ON b.customer_id = c.id
          JOIN vehicles v ON b.vehicle_id = v.id
          JOIN locations pl ON b.pickup_location_id = pl.id
          ${date_from ? 'WHERE b.pickup_datetime >= $1' : ''}
          ${date_to ? (date_from ? 'AND' : 'WHERE') + ' b.pickup_datetime <= $' + (date_from ? '2' : '1') : ''}
          ORDER BY b.created_at DESC
        `, [date_from, date_to].filter(Boolean));
        
        data = bookingsResult.rows;
        filename = `bookings_export_${moment().format('YYYY-MM-DD')}`;
        break;

      case 'revenue':
        const revenueResult = await query(`
          SELECT 
            DATE(p.created_at) as date,
            SUM(p.amount) as daily_revenue,
            COUNT(p.id) as transaction_count
          FROM payments p
          WHERE p.status = 'success' AND p.payment_type = 'rental'
          ${date_from ? 'AND p.created_at >= $1' : ''}
          ${date_to ? (date_from ? 'AND' : 'WHERE') + ' p.created_at <= $' + (date_from ? '2' : '1') : ''}
          GROUP BY DATE(p.created_at)
          ORDER BY date
        `, [date_from, date_to].filter(Boolean));
        
        data = revenueResult.rows.map(r => ({
          ...r,
          daily_revenue: parseFloat(r.daily_revenue)
        }));
        filename = `revenue_export_${moment().format('YYYY-MM-DD')}`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: data,
        filename: `${filename}.json`
      });
    }

  } catch (error) {
    logger.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = router;