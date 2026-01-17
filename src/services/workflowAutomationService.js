const { query } = require('../config/database');
const botMiddleware = require('../middleware/botMiddleware');
const ghalaService = require('./ghalaService');
const logger = require('../utils/logger');
const moment = require('moment');
const cron = require('node-cron');

class WorkflowAutomationService {
  constructor() {
    this.isInitialized = false;
    this.scheduledJobs = new Map();
  }

  // Initialize automation workflows
  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing workflow automation service...');

      // Schedule recurring tasks
      this.scheduleBookingReminders();
      this.schedulePaymentReminders();
      this.scheduleMaintenanceAlerts();
      this.scheduleCustomerFollowups();
      this.scheduleRevenueReports();
      this.scheduleSystemHealthChecks();

      this.isInitialized = true;
      logger.info('Workflow automation service initialized successfully');
    } catch (error) {
      logger.error('Error initializing workflow automation:', error);
      throw error;
    }
  }

  // Schedule booking reminders
  scheduleBookingReminders() {
    // Run every 15 minutes to check for upcoming bookings
    const job = cron.schedule('*/15 * * * *', async () => {
      try {
        await this.processBookingReminders();
      } catch (error) {
        logger.error('Error processing booking reminders:', error);
      }
    }, { scheduled: false });

    this.scheduledJobs.set('booking_reminders', job);
    job.start();
    logger.info('Scheduled booking reminders automation');
  }

  // Process booking reminders
  async processBookingReminders() {
    try {
      // Get bookings that need reminders
      const upcomingBookings = await query(`
        SELECT 
          b.*,
          c.full_name,
          c.phone_number,
          v.make,
          v.model,
          v.license_plate,
          l.name as pickup_location_name,
          l.address as pickup_location_address,
          l.contact_phone as location_phone
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN locations l ON b.pickup_location_id = l.id
        WHERE b.status = 'confirmed'
        AND b.pickup_datetime BETWEEN NOW() AND NOW() + INTERVAL '25 hours'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.booking_id = b.id 
          AND n.type = 'pickup_reminder_24h'
          AND n.status = 'sent'
        )
      `);

      for (const booking of upcomingBookings.rows) {
        const hoursUntilPickup = moment(booking.pickup_datetime).diff(moment(), 'hours');
        
        // 24-hour reminder
        if (hoursUntilPickup <= 24 && hoursUntilPickup > 23) {
          await this.send24HourReminder(booking);
        }
        
        // 2-hour reminder
        if (hoursUntilPickup <= 2 && hoursUntilPickup > 1) {
          await this.send2HourReminder(booking);
        }
        
        // 30-minute reminder
        if (hoursUntilPickup <= 0.5 && hoursUntilPickup > 0) {
          await this.send30MinuteReminder(booking);
        }
      }

      // Process return reminders
      await this.processReturnReminders();

    } catch (error) {
      logger.error('Error processing booking reminders:', error);
    }
  }

  // Send 24-hour pickup reminder
  async send24HourReminder(booking) {
    try {
      const pickupTime = moment(booking.pickup_datetime).format('dddd, MMMM Do YYYY [at] h:mm A');
      
      const message = `⏰ *Pickup Reminder - 24 Hours*

Hi ${booking.full_name}! Your vehicle pickup is tomorrow.

🚗 *Vehicle:* ${booking.make} ${booking.model}
📅 *Pickup:* ${pickupTime}
📍 *Location:* ${booking.pickup_location_name}
${booking.pickup_location_address}

📞 *Location Contact:* ${booking.location_phone}

*What to bring:*
• Valid driving license
• National ID/Passport
• Payment method for security deposit

*Pickup Process:*
1. Arrive 15 minutes early
2. Present your documents
3. Complete vehicle inspection
4. Sign rental agreement
5. Receive vehicle keys

Need to modify your booking? Reply to this message.

Safe travels! 🚗✨`;

      await botMiddleware.sendMessage(booking.phone_number, message);
      
      // Record notification
      await this.recordNotification(booking.customer_id, booking.id, 'pickup_reminder_24h', 
        'Pickup Reminder - 24 Hours', message);

      logger.info(`Sent 24-hour reminder for booking ${booking.booking_reference}`);
    } catch (error) {
      logger.error('Error sending 24-hour reminder:', error);
    }
  }

  // Send 2-hour pickup reminder
  async send2HourReminder(booking) {
    try {
      const pickupTime = moment(booking.pickup_datetime).format('h:mm A');
      
      const message = `🚨 *Final Pickup Reminder - 2 Hours*

Your vehicle pickup is in 2 hours!

🚗 ${booking.make} ${booking.model}
⏰ ${pickupTime} today
📍 ${booking.pickup_location_name}

*Verification Code:* ${booking.verification_code}

Show this code for quick pickup.

Running late? Call ${booking.location_phone}

See you soon! 🚗`;

      await botMiddleware.sendMessage(booking.phone_number, message);
      
      await this.recordNotification(booking.customer_id, booking.id, 'pickup_reminder_2h', 
        'Final Pickup Reminder - 2 Hours', message);

      logger.info(`Sent 2-hour reminder for booking ${booking.booking_reference}`);
    } catch (error) {
      logger.error('Error sending 2-hour reminder:', error);
    }
  }

  // Send 30-minute pickup reminder
  async send30MinuteReminder(booking) {
    try {
      const message = `⚡ *Urgent: Pickup in 30 Minutes*

Your vehicle is ready for pickup!

🚗 ${booking.make} ${booking.model}
📍 ${booking.pickup_location_name}
🔐 Code: ${booking.verification_code}

Our team is waiting for you.

📞 Emergency: ${booking.location_phone}`;

      await botMiddleware.sendMessage(booking.phone_number, message);
      
      await this.recordNotification(booking.customer_id, booking.id, 'pickup_reminder_30m', 
        'Urgent Pickup Reminder - 30 Minutes', message);

      logger.info(`Sent 30-minute reminder for booking ${booking.booking_reference}`);
    } catch (error) {
      logger.error('Error sending 30-minute reminder:', error);
    }
  }

  // Process return reminders
  async processReturnReminders() {
    try {
      const activeRentals = await query(`
        SELECT 
          b.*,
          c.full_name,
          c.phone_number,
          v.make,
          v.model,
          v.license_plate,
          l.name as return_location_name,
          l.address as return_location_address
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN locations l ON COALESCE(b.return_location_id, b.pickup_location_id) = l.id
        WHERE b.status = 'active'
        AND b.return_datetime BETWEEN NOW() AND NOW() + INTERVAL '25 hours'
      `);

      for (const rental of activeRentals.rows) {
        const hoursUntilReturn = moment(rental.return_datetime).diff(moment(), 'hours');
        
        // 24-hour return reminder
        if (hoursUntilReturn <= 24 && hoursUntilReturn > 23) {
          await this.send24HourReturnReminder(rental);
        }
        
        // 4-hour return reminder
        if (hoursUntilReturn <= 4 && hoursUntilReturn > 3) {
          await this.send4HourReturnReminder(rental);
        }
        
        // 1-hour return reminder
        if (hoursUntilReturn <= 1 && hoursUntilReturn > 0) {
          await this.send1HourReturnReminder(rental);
        }
      }

      // Check for overdue returns
      await this.processOverdueReturns();

    } catch (error) {
      logger.error('Error processing return reminders:', error);
    }
  }

  // Send 24-hour return reminder
  async send24HourReturnReminder(rental) {
    try {
      const returnTime = moment(rental.return_datetime).format('dddd, MMMM Do YYYY [at] h:mm A');
      
      const message = `📅 *Return Reminder - 24 Hours*

Hi ${rental.full_name}! Your rental return is tomorrow.

🚗 *Vehicle:* ${rental.make} ${rental.model} (${rental.license_plate})
📅 *Return:* ${returnTime}
📍 *Location:* ${rental.return_location_name}
${rental.return_location_address}

*Before Return:*
• Refuel to pickup level
• Clean interior if needed
• Remove personal items
• Note any new damage

*Return Process:*
1. Arrive on time
2. Vehicle inspection
3. Fuel level check
4. Key handover
5. Final payment settlement

Need an extension? Reply "EXTEND" for options.

Thank you for choosing us! 🚗✨`;

      await botMiddleware.sendMessage(rental.phone_number, message);
      
      await this.recordNotification(rental.customer_id, rental.id, 'return_reminder_24h', 
        'Return Reminder - 24 Hours', message);

      logger.info(`Sent 24-hour return reminder for booking ${rental.booking_reference}`);
    } catch (error) {
      logger.error('Error sending 24-hour return reminder:', error);
    }
  }

  // Send 4-hour return reminder
  async send4HourReturnReminder(rental) {
    try {
      const returnTime = moment(rental.return_datetime).format('h:mm A');
      
      const message = `⏰ *Return Reminder - 4 Hours*

Your rental return is at ${returnTime} today.

🚗 ${rental.make} ${rental.model}
📍 ${rental.return_location_name}

*Quick Checklist:*
✅ Fuel level check
✅ Clean vehicle
✅ Remove belongings
✅ Check for damage

Running late? Reply "LATE" for assistance.

Drive safely! 🚗`;

      await botMiddleware.sendMessage(rental.phone_number, message);
      
      await this.recordNotification(rental.customer_id, rental.id, 'return_reminder_4h', 
        'Return Reminder - 4 Hours', message);

      logger.info(`Sent 4-hour return reminder for booking ${rental.booking_reference}`);
    } catch (error) {
      logger.error('Error sending 4-hour return reminder:', error);
    }
  }

  // Send 1-hour return reminder
  async send1HourReturnReminder(rental) {
    try {
      const message = `🚨 *Final Return Reminder - 1 Hour*

Vehicle return in 1 hour!

🚗 ${rental.make} ${rental.model}
📍 ${rental.return_location_name}
⏰ ${moment(rental.return_datetime).format('h:mm A')}

Please head to the return location now.

Late fees apply after the return time.`;

      await botMiddleware.sendMessage(rental.phone_number, message);
      
      await this.recordNotification(rental.customer_id, rental.id, 'return_reminder_1h', 
        'Final Return Reminder - 1 Hour', message);

      logger.info(`Sent 1-hour return reminder for booking ${rental.booking_reference}`);
    } catch (error) {
      logger.error('Error sending 1-hour return reminder:', error);
    }
  }

  // Process overdue returns
  async processOverdueReturns() {
    try {
      const overdueRentals = await query(`
        SELECT 
          b.*,
          c.full_name,
          c.phone_number,
          v.make,
          v.model,
          v.license_plate
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE b.status = 'active'
        AND b.return_datetime < NOW()
      `);

      for (const rental of overdueRentals.rows) {
        const hoursOverdue = moment().diff(moment(rental.return_datetime), 'hours');
        
        // Send overdue notification every 6 hours
        if (hoursOverdue > 0 && hoursOverdue % 6 === 0) {
          await this.sendOverdueNotification(rental, hoursOverdue);
        }
        
        // Escalate after 24 hours
        if (hoursOverdue >= 24) {
          await this.escalateOverdueRental(rental, hoursOverdue);
        }
      }

    } catch (error) {
      logger.error('Error processing overdue returns:', error);
    }
  }

  // Send overdue notification
  async sendOverdueNotification(rental, hoursOverdue) {
    try {
      const message = `🚨 *OVERDUE RENTAL ALERT*

Your rental return is ${hoursOverdue} hours overdue!

🚗 ${rental.make} ${rental.model} (${rental.license_plate})
⏰ Was due: ${moment(rental.return_datetime).format('MMM Do, h:mm A')}

*URGENT ACTION REQUIRED:*
Please return the vehicle immediately to avoid additional charges.

*Late Fees:* KES 500 per hour
*Current Late Fee:* KES ${hoursOverdue * 500}

📞 Call us NOW: +254 700 123 456

Return the vehicle immediately or contact us to extend your rental.`;

      await botMiddleware.sendMessage(rental.phone_number, message);
      
      await this.recordNotification(rental.customer_id, rental.id, 'overdue_alert', 
        `Overdue Rental Alert - ${hoursOverdue} Hours`, message);

      logger.warn(`Sent overdue notification for booking ${rental.booking_reference} (${hoursOverdue} hours)`);
    } catch (error) {
      logger.error('Error sending overdue notification:', error);
    }
  }

  // Escalate overdue rental
  async escalateOverdueRental(rental, hoursOverdue) {
    try {
      // Mark as potential theft/loss
      await query(`
        UPDATE bookings 
        SET notes = COALESCE(notes, '') || $1
        WHERE id = $2
      `, [`\nESCALATED: ${hoursOverdue} hours overdue - potential theft/loss`, rental.id]);

      // Send final warning
      const message = `🚨 *FINAL WARNING - LEGAL ACTION*

Your rental is ${hoursOverdue} hours overdue!

🚗 ${rental.make} ${rental.model} (${rental.license_plate})

This matter has been escalated to our legal team.

*IMMEDIATE ACTION REQUIRED:*
Return the vehicle within 2 hours or face:
• Police report for vehicle theft
• Legal prosecution
• Additional penalties and fees

📞 URGENT CONTACT: +254 700 123 456

This is your final warning.`;

      await botMiddleware.sendMessage(rental.phone_number, message);
      
      // Notify admin team
      await this.notifyAdminTeam('overdue_escalation', {
        booking: rental,
        hoursOverdue: hoursOverdue,
        message: `Booking ${rental.booking_reference} escalated - ${hoursOverdue} hours overdue`
      });

      logger.error(`ESCALATED: Booking ${rental.booking_reference} is ${hoursOverdue} hours overdue`);
    } catch (error) {
      logger.error('Error escalating overdue rental:', error);
    }
  }

  // Schedule payment reminders
  schedulePaymentReminders() {
    const job = cron.schedule('0 */2 * * *', async () => {
      try {
        await this.processPaymentReminders();
      } catch (error) {
        logger.error('Error processing payment reminders:', error);
      }
    }, { scheduled: false });

    this.scheduledJobs.set('payment_reminders', job);
    job.start();
    logger.info('Scheduled payment reminders automation');
  }

  // Process payment reminders
  async processPaymentReminders() {
    try {
      // Get pending payments
      const pendingPayments = await query(`
        SELECT 
          b.*,
          c.full_name,
          c.phone_number,
          p.created_at as payment_created_at,
          p.ghala_payment_id
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN payments p ON b.id = p.booking_id
        WHERE b.status = 'pending_payment'
        AND p.status = 'pending'
        AND p.payment_type = 'rental'
        AND p.created_at < NOW() - INTERVAL '30 minutes'
      `);

      for (const booking of pendingPayments.rows) {
        const minutesSincePayment = moment().diff(moment(booking.payment_created_at), 'minutes');
        
        // Send reminder after 30 minutes, 2 hours, 6 hours, then daily
        if (minutesSincePayment >= 30 && minutesSincePayment < 35) {
          await this.sendPaymentReminder(booking, '30 minutes');
        } else if (minutesSincePayment >= 120 && minutesSincePayment < 125) {
          await this.sendPaymentReminder(booking, '2 hours');
        } else if (minutesSincePayment >= 360 && minutesSincePayment < 365) {
          await this.sendPaymentReminder(booking, '6 hours');
        } else if (minutesSincePayment >= 1440 && minutesSincePayment % 1440 < 5) {
          const days = Math.floor(minutesSincePayment / 1440);
          await this.sendPaymentReminder(booking, `${days} day${days > 1 ? 's' : ''}`);
        }
        
        // Cancel booking after 48 hours
        if (minutesSincePayment >= 2880) {
          await this.cancelUnpaidBooking(booking);
        }
      }

    } catch (error) {
      logger.error('Error processing payment reminders:', error);
    }
  }

  // Send payment reminder
  async sendPaymentReminder(booking, timePeriod) {
    try {
      const message = `💳 *Payment Reminder*

Hi ${booking.full_name}, your payment is still pending.

🚗 *Booking:* ${booking.booking_reference}
💰 *Amount:* KES ${booking.total_amount.toLocaleString()}
⏰ *Pending for:* ${timePeriod}

Your booking will be automatically cancelled if payment is not completed within 48 hours.

*To complete payment:*
Reply "PAY" to receive payment link

Need help? Reply "HELP"

Complete your payment to secure your booking! 🚗`;

      await botMiddleware.sendMessage(booking.phone_number, message);
      
      await this.recordNotification(booking.customer_id, booking.id, 'payment_reminder', 
        `Payment Reminder - ${timePeriod}`, message);

      logger.info(`Sent payment reminder for booking ${booking.booking_reference} (${timePeriod})`);
    } catch (error) {
      logger.error('Error sending payment reminder:', error);
    }
  }

  // Cancel unpaid booking
  async cancelUnpaidBooking(booking) {
    try {
      await query(`
        UPDATE bookings 
        SET status = 'cancelled', 
            cancellation_reason = 'Payment not completed within 48 hours',
            cancelled_at = NOW()
        WHERE id = $1
      `, [booking.id]);

      const message = `❌ *Booking Cancelled*

Your booking has been automatically cancelled due to non-payment.

🚗 *Booking:* ${booking.booking_reference}
💰 *Amount:* KES ${booking.total_amount.toLocaleString()}

You can make a new booking anytime by typing "rent".

We're sorry to see you go! 😔`;

      await botMiddleware.sendMessage(booking.phone_number, message);
      
      await this.recordNotification(booking.customer_id, booking.id, 'booking_cancelled', 
        'Booking Cancelled - Payment Timeout', message);

      logger.info(`Cancelled unpaid booking ${booking.booking_reference}`);
    } catch (error) {
      logger.error('Error cancelling unpaid booking:', error);
    }
  }

  // Schedule maintenance alerts
  scheduleMaintenanceAlerts() {
    const job = cron.schedule('0 8 * * *', async () => {
      try {
        await this.processMaintenanceAlerts();
      } catch (error) {
        logger.error('Error processing maintenance alerts:', error);
      }
    }, { scheduled: false });

    this.scheduledJobs.set('maintenance_alerts', job);
    job.start();
    logger.info('Scheduled maintenance alerts automation');
  }

  // Process maintenance alerts
  async processMaintenanceAlerts() {
    try {
      // Check vehicles due for maintenance
      const maintenanceDue = await query(`
        SELECT 
          v.*,
          COALESCE(v.mileage, 0) as current_mileage,
          v.next_service_date
        FROM vehicles v
        WHERE (
          v.next_service_date <= CURRENT_DATE + INTERVAL '7 days'
          OR v.mileage >= 10000 -- Service every 10,000 km
        )
        AND v.status != 'maintenance'
      `);

      for (const vehicle of maintenanceDue.rows) {
        await this.sendMaintenanceAlert(vehicle);
      }

    } catch (error) {
      logger.error('Error processing maintenance alerts:', error);
    }
  }

  // Send maintenance alert
  async sendMaintenanceAlert(vehicle) {
    try {
      const alertData = {
        vehicle: vehicle,
        dueDate: vehicle.next_service_date,
        mileage: vehicle.current_mileage,
        message: `Vehicle ${vehicle.license_plate} (${vehicle.make} ${vehicle.model}) is due for maintenance`
      };

      await this.notifyAdminTeam('maintenance_due', alertData);
      
      logger.info(`Sent maintenance alert for vehicle ${vehicle.license_plate}`);
    } catch (error) {
      logger.error('Error sending maintenance alert:', error);
    }
  }

  // Schedule customer follow-ups
  scheduleCustomerFollowups() {
    const job = cron.schedule('0 10 * * *', async () => {
      try {
        await this.processCustomerFollowups();
      } catch (error) {
        logger.error('Error processing customer follow-ups:', error);
      }
    }, { scheduled: false });

    this.scheduledJobs.set('customer_followups', job);
    job.start();
    logger.info('Scheduled customer follow-ups automation');
  }

  // Process customer follow-ups
  async processCustomerFollowups() {
    try {
      // Get completed bookings from yesterday
      const completedBookings = await query(`
        SELECT 
          b.*,
          c.full_name,
          c.phone_number,
          v.make,
          v.model
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE b.status = 'completed'
        AND DATE(b.actual_return_datetime) = CURRENT_DATE - INTERVAL '1 day'
        AND NOT EXISTS (
          SELECT 1 FROM reviews r WHERE r.booking_id = b.id
        )
      `);

      for (const booking of completedBookings.rows) {
        await this.sendFeedbackRequest(booking);
      }

      // Send loyalty program updates
      await this.processLoyaltyUpdates();

    } catch (error) {
      logger.error('Error processing customer follow-ups:', error);
    }
  }

  // Send feedback request
  async sendFeedbackRequest(booking) {
    try {
      const message = `⭐ *How was your rental experience?*

Hi ${booking.full_name}! Thank you for choosing CarRental Pro.

🚗 *Your Recent Rental:*
${booking.make} ${booking.model}
Booking: ${booking.booking_reference}

We'd love to hear about your experience!

*Rate your rental (1-5 stars):*
⭐ - Poor
⭐⭐ - Fair  
⭐⭐⭐ - Good
⭐⭐⭐⭐ - Very Good
⭐⭐⭐⭐⭐ - Excellent

Reply with your rating and any comments.

Your feedback helps us improve! 🚗✨`;

      await botMiddleware.sendMessage(booking.phone_number, message);
      
      await this.recordNotification(booking.customer_id, booking.id, 'feedback_request', 
        'Feedback Request', message);

      logger.info(`Sent feedback request for booking ${booking.booking_reference}`);
    } catch (error) {
      logger.error('Error sending feedback request:', error);
    }
  }

  // Process loyalty updates
  async processLoyaltyUpdates() {
    try {
      // Get customers who reached new loyalty tiers
      const loyaltyUpdates = await query(`
        SELECT 
          c.*,
          COUNT(b.id) as total_bookings,
          COALESCE(SUM(b.total_amount), 0) as total_spent
        FROM customers c
        JOIN bookings b ON c.id = b.customer_id
        WHERE b.status = 'completed'
        GROUP BY c.id
        HAVING (
          (COUNT(b.id) >= 5 AND c.loyalty_tier = 'bronze') OR
          (COUNT(b.id) >= 15 AND c.loyalty_tier = 'silver') OR
          (COUNT(b.id) >= 30 AND c.loyalty_tier = 'gold')
        )
      `);

      for (const customer of loyaltyUpdates.rows) {
        await this.updateLoyaltyTier(customer);
      }

    } catch (error) {
      logger.error('Error processing loyalty updates:', error);
    }
  }

  // Update loyalty tier
  async updateLoyaltyTier(customer) {
    try {
      let newTier = 'bronze';
      let tierBenefits = '';

      if (customer.total_bookings >= 30) {
        newTier = 'platinum';
        tierBenefits = '• 25% discount on all rentals\n• Priority vehicle selection\n• Free upgrades\n• Dedicated support line';
      } else if (customer.total_bookings >= 15) {
        newTier = 'gold';
        tierBenefits = '• 15% discount on all rentals\n• Priority booking\n• Free GPS and child seats';
      } else if (customer.total_bookings >= 5) {
        newTier = 'silver';
        tierBenefits = '• 10% discount on all rentals\n• Free vehicle delivery';
      }

      if (newTier !== customer.loyalty_tier) {
        await query(`
          UPDATE customers 
          SET loyalty_tier = $1, updated_at = NOW()
          WHERE id = $2
        `, [newTier, customer.id]);

        const message = `🎉 *Congratulations! Loyalty Tier Upgrade*

Hi ${customer.full_name}! You've been upgraded to ${newTier.toUpperCase()} tier!

✨ *Your New Benefits:*
${tierBenefits}

*Your Stats:*
• Total Bookings: ${customer.total_bookings}
• Total Spent: KES ${parseFloat(customer.total_spent).toLocaleString()}

Thank you for your loyalty! 🚗💎`;

        await botMiddleware.sendMessage(customer.phone_number, message);
        
        await this.recordNotification(customer.id, null, 'loyalty_upgrade', 
          `Loyalty Tier Upgrade - ${newTier}`, message);

        logger.info(`Upgraded customer ${customer.id} to ${newTier} tier`);
      }

    } catch (error) {
      logger.error('Error updating loyalty tier:', error);
    }
  }

  // Schedule revenue reports
  scheduleRevenueReports() {
    // Daily report at 9 AM
    const dailyJob = cron.schedule('0 9 * * *', async () => {
      try {
        await this.generateDailyReport();
      } catch (error) {
        logger.error('Error generating daily report:', error);
      }
    }, { scheduled: false });

    // Weekly report on Mondays at 9 AM
    const weeklyJob = cron.schedule('0 9 * * 1', async () => {
      try {
        await this.generateWeeklyReport();
      } catch (error) {
        logger.error('Error generating weekly report:', error);
      }
    }, { scheduled: false });

    this.scheduledJobs.set('daily_reports', dailyJob);
    this.scheduledJobs.set('weekly_reports', weeklyJob);
    
    dailyJob.start();
    weeklyJob.start();
    
    logger.info('Scheduled revenue reports automation');
  }

  // Generate daily report
  async generateDailyReport() {
    try {
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
      
      const reportData = await query(`
        SELECT 
          COUNT(DISTINCT b.id) as total_bookings,
          COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
          COALESCE(SUM(CASE WHEN p.status = 'success' THEN p.amount END), 0) as total_revenue,
          COUNT(DISTINCT b.customer_id) as unique_customers,
          COUNT(DISTINCT b.vehicle_id) as vehicles_used
        FROM bookings b
        LEFT JOIN payments p ON b.id = p.booking_id AND p.payment_type = 'rental'
        WHERE DATE(b.created_at) = $1
      `, [yesterday]);

      const report = reportData.rows[0];
      
      await this.notifyAdminTeam('daily_report', {
        date: yesterday,
        ...report,
        total_revenue: parseFloat(report.total_revenue)
      });

      logger.info(`Generated daily report for ${yesterday}`);
    } catch (error) {
      logger.error('Error generating daily report:', error);
    }
  }

  // Generate weekly report
  async generateWeeklyReport() {
    try {
      const weekStart = moment().subtract(1, 'week').startOf('week').format('YYYY-MM-DD');
      const weekEnd = moment().subtract(1, 'week').endOf('week').format('YYYY-MM-DD');
      
      const reportData = await query(`
        SELECT 
          COUNT(DISTINCT b.id) as total_bookings,
          COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
          COALESCE(SUM(CASE WHEN p.status = 'success' THEN p.amount END), 0) as total_revenue,
          COUNT(DISTINCT b.customer_id) as unique_customers,
          COUNT(DISTINCT CASE WHEN c.created_at >= $1 THEN c.id END) as new_customers,
          ROUND(AVG(CASE WHEN p.status = 'success' THEN p.amount END), 2) as avg_booking_value
        FROM bookings b
        LEFT JOIN payments p ON b.id = p.booking_id AND p.payment_type = 'rental'
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.created_at BETWEEN $1 AND $2
      `, [weekStart, weekEnd]);

      const report = reportData.rows[0];
      
      await this.notifyAdminTeam('weekly_report', {
        week_start: weekStart,
        week_end: weekEnd,
        ...report,
        total_revenue: parseFloat(report.total_revenue),
        avg_booking_value: parseFloat(report.avg_booking_value)
      });

      logger.info(`Generated weekly report for ${weekStart} to ${weekEnd}`);
    } catch (error) {
      logger.error('Error generating weekly report:', error);
    }
  }

  // Schedule system health checks
  scheduleSystemHealthChecks() {
    const job = cron.schedule('*/30 * * * *', async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Error performing health check:', error);
      }
    }, { scheduled: false });

    this.scheduledJobs.set('health_checks', job);
    job.start();
    logger.info('Scheduled system health checks automation');
  }

  // Perform system health check
  async performHealthCheck() {
    try {
      const healthData = {
        timestamp: new Date(),
        database: await this.checkDatabaseHealth(),
        whatsapp: await this.checkWhatsAppHealth(),
        payments: await this.checkPaymentHealth(),
        storage: await this.checkStorageHealth()
      };

      // Check for critical issues
      const criticalIssues = [];
      
      if (!healthData.database.healthy) {
        criticalIssues.push('Database connection issues');
      }
      
      if (!healthData.whatsapp.healthy) {
        criticalIssues.push('WhatsApp service issues');
      }
      
      if (!healthData.payments.healthy) {
        criticalIssues.push('Payment service issues');
      }

      if (criticalIssues.length > 0) {
        await this.notifyAdminTeam('system_alert', {
          severity: 'critical',
          issues: criticalIssues,
          healthData: healthData
        });
      }

      // Log health status
      logger.info('System health check completed', healthData);

    } catch (error) {
      logger.error('Error performing health check:', error);
      
      await this.notifyAdminTeam('system_alert', {
        severity: 'critical',
        issues: ['Health check system failure'],
        error: error.message
      });
    }
  }

  // Check database health
  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await query('SELECT 1');
      const responseTime = Date.now() - start;
      
      return {
        healthy: responseTime < 1000,
        responseTime: responseTime,
        status: responseTime < 1000 ? 'good' : 'slow'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: 'error'
      };
    }
  }

  // Check WhatsApp health
  async checkWhatsAppHealth() {
    try {
      // This would check WhatsApp API status
      // For now, return healthy
      return {
        healthy: true,
        status: 'good'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: 'error'
      };
    }
  }

  // Check payment health
  async checkPaymentHealth() {
    try {
      // This would check Ghala API status
      // For now, return healthy
      return {
        healthy: true,
        status: 'good'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: 'error'
      };
    }
  }

  // Check storage health
  async checkStorageHealth() {
    try {
      // Check disk space, memory usage, etc.
      return {
        healthy: true,
        status: 'good'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: 'error'
      };
    }
  }

  // Record notification
  async recordNotification(customerId, bookingId, type, title, message) {
    try {
      await query(`
        INSERT INTO notifications (customer_id, booking_id, type, title, message, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, 'sent', NOW())
      `, [customerId, bookingId, type, title, message]);
    } catch (error) {
      logger.error('Error recording notification:', error);
    }
  }

  // Notify admin team
  async notifyAdminTeam(type, data) {
    try {
      // In a real implementation, this would send notifications to admin team
      // via email, Slack, or other channels
      logger.info(`Admin notification: ${type}`, data);
      
      // Store admin notification
      await query(`
        INSERT INTO notifications (type, title, message, channel, status, created_at)
        VALUES ($1, $2, $3, 'admin', 'sent', NOW())
      `, [type, `Admin Alert: ${type}`, JSON.stringify(data)]);
      
    } catch (error) {
      logger.error('Error notifying admin team:', error);
    }
  }

  // Stop all scheduled jobs
  stopAllJobs() {
    for (const [name, job] of this.scheduledJobs) {
      job.destroy();
      logger.info(`Stopped ${name} automation`);
    }
    this.scheduledJobs.clear();
    this.isInitialized = false;
  }

  // Get automation status
  getStatus() {
    return {
      initialized: this.isInitialized,
      active_jobs: Array.from(this.scheduledJobs.keys()),
      job_count: this.scheduledJobs.size
    };
  }
}

module.exports = new WorkflowAutomationService();