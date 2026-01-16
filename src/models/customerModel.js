const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Find or create customer by phone number
 */
const findOrCreateCustomer = (phoneNumber, name = null) => {
  return new Promise((resolve, reject) => {
    // First, try to find existing customer
    db.get(
      'SELECT * FROM customers WHERE phone_number = ?',
      [phoneNumber],
      (err, customer) => {
        if (err) {
          logger.error('Error finding customer:', err);
          return reject(err);
        }

        if (customer) {
          return resolve(customer);
        }

        // Create new customer
        db.run(
          'INSERT INTO customers (phone_number, name) VALUES (?, ?)',
          [phoneNumber, name],
          function(err) {
            if (err) {
              logger.error('Error creating customer:', err);
              return reject(err);
            }

            resolve({
              id: this.lastID,
              phone_number: phoneNumber,
              name: name
            });
          }
        );
      }
    );
  });
};

/**
 * Get customer by ID
 */
const getCustomerById = (customerId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM customers WHERE id = ?',
      [customerId],
      (err, customer) => {
        if (err) {
          logger.error('Error getting customer:', err);
          return reject(err);
        }
        resolve(customer);
      }
    );
  });
};

/**
 * Update customer information
 */
const updateCustomer = (customerId, updates) => {
  return new Promise((resolve, reject) => {
    const { name } = updates;
    db.run(
      'UPDATE customers SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, customerId],
      (err) => {
        if (err) {
          logger.error('Error updating customer:', err);
          return reject(err);
        }
        resolve();
      }
    );
  });
};

module.exports = {
  findOrCreateCustomer,
  getCustomerById,
  updateCustomer
};
