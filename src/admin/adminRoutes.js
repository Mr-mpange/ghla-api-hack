const express = require('express');
const router = express.Router();
const adminAuth = require('./adminAuth');
const carRentalBotService = require('../services/carRentalBotService');
const logger = require('../utils/logger');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  const sessionToken = req.headers['x-session-token'] || req.cookies?.sessionToken;

  if (!sessionToken) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const validation = adminAuth.validateSession(sessionToken);

  if (!validation.valid) {
    return res.status(401).json({
      success: false,
      error: validation.error
    });
  }

  req.adminPhone = validation.phoneNumber;
  next();
};

// Request OTP
router.post('/auth/request-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Check if admin
    if (!adminAuth.isAdmin(phoneNumber)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const result = await adminAuth.sendOTP(phoneNumber);
    res.json(result);
  } catch (error) {
    logger.error(`[Admin] Request OTP error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Verify OTP and login
router.post('/auth/verify-otp', (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and OTP are required'
      });
    }

    const result = adminAuth.verifyOTP(phoneNumber, otp);

    if (result.success) {
      // Set cookie
      res.cookie('sessionToken', result.sessionToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      });
    }

    res.json(result);
  } catch (error) {
    logger.error(`[Admin] Verify OTP error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Logout
router.post('/auth/logout', requireAuth, (req, res) => {
  const sessionToken = req.headers['x-session-token'] || req.cookies?.sessionToken;
  const result = adminAuth.logout(sessionToken);
  res.clearCookie('sessionToken');
  res.json(result);
});

// Get dashboard stats
router.get('/dashboard/stats', requireAuth, (req, res) => {
  try {
    const bookings = Array.from(carRentalBotService.bookings.values());
    const sessions = Array.from(carRentalBotService.customerSessions.values());

    const stats = {
      totalBookings: bookings.length,
      pendingPayment: bookings.filter(b => b.status === 'pending_payment').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      paid: bookings.filter(b => b.status === 'paid').length,
      totalRevenue: bookings
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + b.totalAmount, 0),
      activeSessions: sessions.length,
      todayBookings: bookings.filter(b => {
        const today = new Date().toDateString();
        const bookingDate = new Date(b.createdAt).toDateString();
        return today === bookingDate;
      }).length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error(`[Admin] Stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all bookings
router.get('/bookings', requireAuth, (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let bookings = Array.from(carRentalBotService.bookings.values());

    // Filter by status
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }

    // Sort by creation date (newest first)
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const total = bookings.length;
    const paginatedBookings = bookings.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      bookings: paginatedBookings,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    logger.error(`[Admin] Bookings error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get single booking
router.get('/bookings/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const booking = carRentalBotService.bookings.get(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    logger.error(`[Admin] Booking detail error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get active sessions
router.get('/sessions', requireAuth, (req, res) => {
  try {
    const sessions = Array.from(carRentalBotService.customerSessions.entries()).map(([phone, session]) => ({
      phoneNumber: phone,
      state: session.state,
      lastActivity: session.lastActivity,
      messageCount: session.messageCount,
      currentBooking: session.currentBooking
    }));

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    logger.error(`[Admin] Sessions error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get car fleet status
router.get('/fleet', requireAuth, (req, res) => {
  try {
    const fleet = {
      economy: carRentalBotService.cars.economy.map(car => ({
        id: car.id,
        name: car.name,
        price: car.price,
        available: car.available
      })),
      suv: carRentalBotService.cars.suv.map(car => ({
        id: car.id,
        name: car.name,
        price: car.price,
        available: car.available
      })),
      luxury: carRentalBotService.cars.luxury.map(car => ({
        id: car.id,
        name: car.name,
        price: car.price,
        available: car.available
      })),
      vans: carRentalBotService.cars.vans.map(car => ({
        id: car.id,
        name: car.name,
        price: car.price,
        available: car.available
      }))
    };

    const totalCars = Object.values(fleet).reduce((sum, category) => sum + category.length, 0);
    const availableCars = Object.values(fleet).reduce((sum, category) => 
      sum + category.filter(car => car.available).length, 0
    );

    res.json({
      success: true,
      fleet,
      summary: {
        total: totalCars,
        available: availableCars,
        rented: totalCars - availableCars
      }
    });
  } catch (error) {
    logger.error(`[Admin] Fleet error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
