const { Pool } = require('pg');
require('dotenv').config();

// Database setup script
async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Setting up database schema...');

    // Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        whatsapp_number VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100),
        email VARCHAR(100),
        address TEXT,
        city VARCHAR(50),
        ghala_customer_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        last_order_at TIMESTAMP
      );
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ghala_product_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        stock_quantity INTEGER DEFAULT 0,
        category VARCHAR(100),
        image_url TEXT,
        popularity_score INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        ghala_order_id VARCHAR(100) UNIQUE,
        customer_id UUID REFERENCES customers(id),
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        delivery_address TEXT,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        shipped_at TIMESTAMP,
        delivered_at TIMESTAMP,
        otp_code VARCHAR(10),
        tracking_number VARCHAR(100)
      );
    `);

    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id),
        ghala_payment_id VARCHAR(100) UNIQUE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        payment_method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        mpesa_code VARCHAR(20),
        transaction_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        paid_at TIMESTAMP
      );
    `);

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID REFERENCES customers(id),
        whatsapp_message_id VARCHAR(100),
        direction VARCHAR(10), -- 'inbound', 'outbound'
        message_type VARCHAR(50), -- 'text', 'interactive', 'template'
        content TEXT,
        status VARCHAR(50), -- 'sent', 'delivered', 'read', 'failed'
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create customer_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID REFERENCES customers(id),
        session_data JSONB,
        current_step VARCHAR(100),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create receipts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        receipt_id VARCHAR(100) UNIQUE NOT NULL,
        payment_id VARCHAR(100),
        order_id VARCHAR(100),
        customer_phone VARCHAR(20),
        receipt_data JSONB,
        hash VARCHAR(64) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create refunds table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ghala_refund_id VARCHAR(100) UNIQUE,
        payment_id VARCHAR(100),
        order_id VARCHAR(100),
        amount DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'KES',
        reason TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create suspicious_activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suspicious_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50),
        reference_id VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for performance
    console.log('📊 Creating database indexes...');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp_number);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_ghala_id ON orders(ghala_order_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status, created_at);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_ghala_id ON payments(ghala_payment_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_customer ON messages(customer_id, created_at);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_customer ON customer_sessions(customer_id, expires_at);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category, is_active);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_popularity ON products(popularity_score DESC, is_active);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_receipts_hash ON receipts(hash);
    `);

    // Create full-text search index for products
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_search ON products 
      USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
    `);

    console.log('✅ Database schema created successfully!');

    // Insert sample data if in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🌱 Inserting sample data...');
      
      // Sample products
      await pool.query(`
        INSERT INTO products (ghala_product_id, name, description, price, category, stock_quantity, popularity_score)
        VALUES 
          ('prod_001', 'Premium Coffee 1kg', 'High-quality Arabica coffee beans from Kenya', 1500, 'Beverages', 50, 10),
          ('prod_002', 'Natural Honey 500g', 'Pure natural honey from local beekeepers', 800, 'Food', 30, 8),
          ('prod_003', 'Maize Flour 2kg', 'Fresh maize flour for ugali and baking', 180, 'Food', 100, 15),
          ('prod_004', 'Maize Flour 5kg', 'Fresh maize flour for ugali and baking', 420, 'Food', 75, 12),
          ('prod_005', 'Maize Flour 10kg', 'Fresh maize flour for ugali and baking', 800, 'Food', 40, 9)
        ON CONFLICT (ghala_product_id) DO NOTHING;
      `);

      console.log('✅ Sample data inserted!');
    }

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;