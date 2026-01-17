const db = require('../config/database');
const ghalaService = require('./ghalaService');
const { redis } = require('../config/redis');

class CustomerService {
  // Create or get customer by WhatsApp number
  async getOrCreateCustomer(whatsappNumber, name = null, email = null) {
    try {
      const formattedNumber = this.formatPhoneNumber(whatsappNumber);
      
      // Try to find existing customer
      let customer = await this.getCustomerByPhone(formattedNumber);
      
      if (!customer) {
        // Create new customer
        customer = await this.createCustomer({
          whatsappNumber: formattedNumber,
          name: name,
          email: email
        });
      } else if (name && !customer.name) {
        // Update customer name if provided and not set
        customer = await this.updateCustomer(customer.id, { name: name });
      }

      return customer;
    } catch (error) {
      console.error('Error getting or creating customer:', error.message);
      throw new Error('Failed to get or create customer');
    }
  }

  // Create new customer
  async createCustomer(customerData) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        INSERT INTO customers (
          whatsapp_number, name, email, address, city, 
          created_at, updated_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), true)
        RETURNING *
      `, [
        customerData.whatsappNumber,
        customerData.name,
        customerData.email,
        customerData.address,
        customerData.city
      ]);

      const customer = result.rows[0];

      // Create customer in Ghala
      try {
        const ghalaCustomer = await ghalaService.createCustomer({
          name: customer.name || 'Customer',
          phone: customer.whatsapp_number,
          email: customer.email,
          metadata: { localCustomerId: customer.id }
        });

        // Update with Ghala customer ID
        await client.query(`
          UPDATE customers SET ghala_customer_id = $1 WHERE id = $2
        `, [ghalaCustomer.id, customer.id]);

        customer.ghala_customer_id = ghalaCustomer.id;
      } catch (ghalaError) {
        console.error('Failed to create customer in Ghala:', ghalaError.message);
        // Continue with local customer, log for manual sync
      }

      await client.query('COMMIT');

      // Initialize customer session
      await this.initializeSession(customer.id);

      return customer;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating customer:', error.message);
      throw new Error('Failed to create customer');
    } finally {
      client.release();
    }
  }

  // Get customer by ID
  async getCustomer(customerId) {
    try {
      const result = await db.query(`
        SELECT * FROM customers WHERE id = $1 AND is_active = true
      `, [customerId]);

      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error fetching customer:', error.message);
      throw new Error('Failed to fetch customer');
    }
  }

  // Get customer by WhatsApp number
  async getCustomerByPhone(whatsappNumber) {
    try {
      const formattedNumber = this.formatPhoneNumber(whatsappNumber);
      
      const result = await db.query(`
        SELECT * FROM customers WHERE whatsapp_number = $1 AND is_active = true
      `, [formattedNumber]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error fetching customer by phone:', error.message);
      throw new Error('Failed to fetch customer by phone');
    }
  }

  // Update customer
  async updateCustomer(customerId, updateData) {
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No update data provided');
      }

      setClause.push(`updated_at = NOW()`);
      values.push(customerId);

      const query = `
        UPDATE customers 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating customer:', error.message);
      throw new Error('Failed to update customer');
    }
  }

  // Get customer session
  async getCustomerSession(customerId) {
    try {
      const result = await db.query(`
        SELECT * FROM customer_sessions 
        WHERE customer_id = $1 AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `, [customerId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error fetching customer session:', error.message);
      return null;
    }
  }

  // Initialize customer session
  async initializeSession(customerId) {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const result = await db.query(`
        INSERT INTO customer_sessions (
          customer_id, session_data, current_step, expires_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `, [
        customerId,
        JSON.stringify({ conversationState: 'welcome' }),
        'welcome',
        expiresAt
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error initializing customer session:', error.message);
      throw new Error('Failed to initialize customer session');
    }
  }

  // Update customer session
  async updateCustomerSession(customerId, sessionData, currentStep = null) {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Extend by 24 hours

      // Try to update existing session
      const updateResult = await db.query(`
        UPDATE customer_sessions 
        SET session_data = $1, current_step = COALESCE($2, current_step), 
            expires_at = $3, updated_at = NOW()
        WHERE customer_id = $4 AND expires_at > NOW()
        RETURNING *
      `, [JSON.stringify(sessionData), currentStep, expiresAt, customerId]);

      if (updateResult.rows.length > 0) {
        return updateResult.rows[0];
      }

      // Create new session if none exists
      const createResult = await db.query(`
        INSERT INTO customer_sessions (
          customer_id, session_data, current_step, expires_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `, [customerId, JSON.stringify(sessionData), currentStep || 'welcome', expiresAt]);

      return createResult.rows[0];
    } catch (error) {
      console.error('Error updating customer session:', error.message);
      throw new Error('Failed to update customer session');
    }
  }

  // Clear customer session
  async clearCustomerSession(customerId) {
    try {
      await db.query(`
        UPDATE customer_sessions 
        SET expires_at = NOW() 
        WHERE customer_id = $1
      `, [customerId]);

      return true;
    } catch (error) {
      console.error('Error clearing customer session:', error.message);
      return false;
    }
  }

  // Get customer order history
  async getCustomerOrderHistory(customerId, limit = 10) {
    try {
      const result = await db.query(`
        SELECT 
          o.order_number,
          o.status,
          o.total_amount,
          o.currency,
          o.created_at,
          o.delivered_at,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = $1
        GROUP BY o.id, o.order_number, o.status, o.total_amount, o.currency, o.created_at, o.delivered_at
        ORDER BY o.created_at DESC
        LIMIT $2
      `, [customerId, limit]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching customer order history:', error.message);
      throw new Error('Failed to fetch customer order history');
    }
  }

  // Update customer stats after order
  async updateCustomerStats(customerId, orderAmount) {
    try {
      await db.query(`
        UPDATE customers 
        SET 
          total_orders = total_orders + 1,
          total_spent = total_spent + $1,
          last_order_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
      `, [orderAmount, customerId]);

      return true;
    } catch (error) {
      console.error('Error updating customer stats:', error.message);
      return false;
    }
  }

  // Get customer analytics
  async getCustomerAnalytics(customerId) {
    try {
      const result = await db.query(`
        SELECT 
          c.total_orders,
          c.total_spent,
          c.last_order_at,
          c.created_at as customer_since,
          COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completed_orders,
          AVG(o.total_amount) as average_order_value,
          MAX(o.created_at) as last_order_date
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE c.id = $1
        GROUP BY c.id, c.total_orders, c.total_spent, c.last_order_at, c.created_at
      `, [customerId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error fetching customer analytics:', error.message);
      throw new Error('Failed to fetch customer analytics');
    }
  }

  // Cache customer preferences
  async cacheCustomerPreferences(customerId, preferences) {
    try {
      const cacheKey = `customer_prefs:${customerId}`;
      await redis.setex(cacheKey, 3600, JSON.stringify(preferences)); // Cache for 1 hour
      return true;
    } catch (error) {
      console.error('Error caching customer preferences:', error.message);
      return false;
    }
  }

  // Get cached customer preferences
  async getCachedCustomerPreferences(customerId) {
    try {
      const cacheKey = `customer_prefs:${customerId}`;
      const cached = await redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached customer preferences:', error.message);
      return null;
    }
  }

  // Search customers
  async searchCustomers(query, limit = 20) {
    try {
      const result = await db.query(`
        SELECT id, whatsapp_number, name, email, total_orders, total_spent, last_order_at
        FROM customers
        WHERE 
          is_active = true AND (
            name ILIKE $1 OR 
            whatsapp_number LIKE $2 OR 
            email ILIKE $1
          )
        ORDER BY last_order_at DESC NULLS LAST
        LIMIT $3
      `, [`%${query}%`, `%${query}%`, limit]);

      return result.rows;
    } catch (error) {
      console.error('Error searching customers:', error.message);
      throw new Error('Failed to search customers');
    }
  }

  // Utility methods
  formatPhoneNumber(phone) {
    // Remove any non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle Kenyan numbers
    if (cleaned.startsWith('0')) {
      return '+254' + cleaned.substring(1);
    }
    if (cleaned.startsWith('254')) {
      return '+' + cleaned;
    }
    if (!cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return cleaned;
  }

  isValidPhoneNumber(phone) {
    const formatted = this.formatPhoneNumber(phone);
    // Basic validation for Kenyan numbers
    return /^\+254[17]\d{8}$/.test(formatted);
  }

  // Customer segmentation
  async segmentCustomers() {
    try {
      const result = await db.query(`
        SELECT 
          CASE 
            WHEN total_orders = 0 THEN 'new'
            WHEN total_orders = 1 THEN 'first_time'
            WHEN total_orders BETWEEN 2 AND 5 THEN 'regular'
            WHEN total_orders > 5 THEN 'loyal'
          END as segment,
          CASE
            WHEN total_spent < 1000 THEN 'low_value'
            WHEN total_spent BETWEEN 1000 AND 5000 THEN 'medium_value'
            WHEN total_spent > 5000 THEN 'high_value'
          END as value_segment,
          COUNT(*) as customer_count,
          AVG(total_spent) as avg_spent,
          AVG(total_orders) as avg_orders
        FROM customers
        WHERE is_active = true
        GROUP BY 
          CASE 
            WHEN total_orders = 0 THEN 'new'
            WHEN total_orders = 1 THEN 'first_time'
            WHEN total_orders BETWEEN 2 AND 5 THEN 'regular'
            WHEN total_orders > 5 THEN 'loyal'
          END,
          CASE
            WHEN total_spent < 1000 THEN 'low_value'
            WHEN total_spent BETWEEN 1000 AND 5000 THEN 'medium_value'
            WHEN total_spent > 5000 THEN 'high_value'
          END
        ORDER BY customer_count DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('Error segmenting customers:', error.message);
      throw new Error('Failed to segment customers');
    }
  }
}

module.exports = new CustomerService();