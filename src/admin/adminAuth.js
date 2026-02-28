const crypto = require('crypto');
const logger = require('../utils/logger');

class AdminAuth {
  constructor() {
    this.otpStore = new Map(); // Store OTPs temporarily
    this.sessions = new Map(); // Store active sessions
    this.adminPhone = process.env.ADMIN_PHONE || '+255683859574';
  }

  /**
   * Generate 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate session token
   */
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send OTP via SMS (using Briq)
   */
  async sendOTP(phoneNumber) {
    try {
      const otp = this.generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      // Store OTP
      this.otpStore.set(phoneNumber, {
        otp,
        expiresAt,
        attempts: 0
      });

      // Send via Briq SMS
      const briqNotificationService = require('../services/briqNotificationService');
      const message = `Your CarRental Pro Admin OTP is: ${otp}\n\nValid for 5 minutes.\n\nDo not share this code.`;
      
      await briqNotificationService.sendSMS(phoneNumber, message);

      logger.info(`[Admin] OTP sent to ${phoneNumber}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300 // seconds
      };
    } catch (error) {
      logger.error(`[Admin] Failed to send OTP: ${error.message}`);
      return {
        success: false,
        error: 'Failed to send OTP'
      };
    }
  }

  /**
   * Verify OTP and create session
   */
  verifyOTP(phoneNumber, otp) {
    const stored = this.otpStore.get(phoneNumber);

    if (!stored) {
      return {
        success: false,
        error: 'No OTP found. Please request a new one.'
      };
    }

    // Check expiration
    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(phoneNumber);
      return {
        success: false,
        error: 'OTP expired. Please request a new one.'
      };
    }

    // Check attempts
    if (stored.attempts >= 3) {
      this.otpStore.delete(phoneNumber);
      return {
        success: false,
        error: 'Too many failed attempts. Please request a new OTP.'
      };
    }

    // Verify OTP
    if (stored.otp !== otp) {
      stored.attempts++;
      return {
        success: false,
        error: `Invalid OTP. ${3 - stored.attempts} attempts remaining.`
      };
    }

    // OTP is valid - create session
    const sessionToken = this.generateSessionToken();
    const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    this.sessions.set(sessionToken, {
      phoneNumber,
      createdAt: Date.now(),
      expiresAt: sessionExpiry
    });

    // Clean up OTP
    this.otpStore.delete(phoneNumber);

    logger.info(`[Admin] Session created for ${phoneNumber}`);

    return {
      success: true,
      sessionToken,
      expiresIn: 86400 // seconds
    };
  }

  /**
   * Validate session token
   */
  validateSession(sessionToken) {
    const session = this.sessions.get(sessionToken);

    if (!session) {
      return {
        valid: false,
        error: 'Invalid session'
      };
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionToken);
      return {
        valid: false,
        error: 'Session expired'
      };
    }

    return {
      valid: true,
      phoneNumber: session.phoneNumber
    };
  }

  /**
   * Logout - destroy session
   */
  logout(sessionToken) {
    this.sessions.delete(sessionToken);
    logger.info(`[Admin] Session destroyed`);
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  /**
   * Check if phone number is admin
   */
  isAdmin(phoneNumber) {
    return phoneNumber === this.adminPhone;
  }
}

module.exports = new AdminAuth();
