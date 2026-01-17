const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database connection test
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
  process.exit(-1);
});

// Initialize car rental database schema
async function initializeCarRentalSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🚗 Initializing car rental database schema...');
    
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create locations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        contact_phone VARCHAR(20),
        operating_hours JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create vehicles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        make VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        category VARCHAR(20) NOT NULL,
        license_plate VARCHAR(20) UNIQUE NOT NULL,
        vin VARCHAR(50) UNIQUE,
        color VARCHAR(30),
        transmission VARCHAR(20),
        fuel_type VARCHAR(20),
        seats INTEGER,
        daily_rate DECIMAL(10,2) NOT NULL,
        security_deposit DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        location_id UUID REFERENCES locations(id),
        features JSONB,
        images JSONB,
        mileage INTEGER DEFAULT 0,
        last_service_date DATE,
        next_service_due DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        whatsapp_id VARCHAR(50) UNIQUE,
        full_name VARCHAR(100),
        email VARCHAR(100),
        id_number VARCHAR(50),
        license_number VARCHAR(50),
        license_expiry DATE,
        emergency_contact JSONB,
        verification_status VARCHAR(20) DEFAULT 'pending',
        loyalty_points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_reference VARCHAR(20) UNIQUE NOT NULL,
        customer_id UUID REFERENCES customers(id),
        vehicle_id UUID REFERENCES vehicles(id),
        pickup_location_id UUID REFERENCES locations(id),
        return_location_id UUID REFERENCES locations(id),
        pickup_datetime TIMESTAMP NOT NULL,
        return_datetime TIMESTAMP NOT NULL,
        actual_pickup_datetime TIMESTAMP,
        actual_return_datetime TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        security_deposit DECIMAL(10,2) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        extras JSONB,
        pickup_mileage INTEGER,
        return_mileage INTEGER,
        fuel_level_pickup INTEGER,
        fuel_level_return INTEGER,
        damage_notes TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id),
        ghala_payment_id VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        payment_method VARCHAR(20) NOT NULL,
        payment_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        transaction_ref VARCHAR(100),
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create conversation states table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_states (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_phone VARCHAR(20) NOT NULL,
        current_step VARCHAR(50) NOT NULL,
        context_data JSONB,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_conversation_states_phone ON conversation_states(customer_phone)');

    // Insert default locations
    await client.query(`
      INSERT INTO locations (name, address, latitude, longitude, contact_phone, operating_hours) 
      VALUES 
        ('Nairobi CBD', 'Kenyatta Avenue, Nairobi CBD', -1.2864, 36.8172, '+254700123456', '{"monday": "08:00-18:00", "tuesday": "08:00-18:00", "wednesday": "08:00-18:00", "thursday": "08:00-18:00", "friday": "08:00-18:00", "saturday": "09:00-17:00", "sunday": "10:00-16:00"}'),
        ('Westlands', 'Westlands Shopping Mall, Nairobi', -1.2676, 36.8108, '+254700123457', '{"monday": "08:00-18:00", "tuesday": "08:00-18:00", "wednesday": "08:00-18:00", "thursday": "08:00-18:00", "friday": "08:00-18:00", "saturday": "09:00-17:00", "sunday": "10:00-16:00"}'),
        ('JKIA Airport', 'Jomo Kenyatta International Airport', -1.3192, 36.9278, '+254700123458', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'),
        ('Wilson Airport', 'Wilson Airport, Nairobi', -1.3218, 36.8147, '+254700123459', '{"monday": "06:00-22:00", "tuesday": "06:00-22:00", "wednesday": "06:00-22:00", "thursday": "06:00-22:00", "friday": "06:00-22:00", "saturday": "06:00-22:00", "sunday": "06:00-22:00"}')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert sample vehicles
    const locationResult = await client.query("SELECT id FROM locations WHERE name = 'Nairobi CBD' LIMIT 1");
    if (locationResult.rows.length > 0) {
      const locationId = locationResult.rows[0].id;
      
      await client.query(`
        INSERT INTO vehicles (make, model, year, category, license_plate, color, transmission, fuel_type, seats, daily_rate, security_deposit, location_id, features)
        VALUES 
          ('Toyota', 'Vitz', 2020, 'Economy', 'KCA 001A', 'White', 'Automatic', 'Petrol', 5, 2500.00, 10000.00, $1, '{"air_conditioning": true, "bluetooth": true, "usb_charging": true, "power_steering": true}'),
          ('Toyota', 'RAV4', 2021, 'SUV', 'KCA 002B', 'Silver', 'Automatic', 'Petrol', 7, 4500.00, 15000.00, $1, '{"air_conditioning": true, "bluetooth": true, "gps_navigation": true, "4wd": true, "sunroof": true}'),
          ('Mercedes', 'C-Class', 2022, 'Luxury', 'KCA 003C', 'Black', 'Automatic', 'Petrol', 5, 8000.00, 25000.00, $1, '{"air_conditioning": true, "bluetooth": true, "gps_navigation": true, "leather_seats": true, "premium_sound": true, "sunroof": true}')
        ON CONFLICT (license_plate) DO NOTHING
      `, [locationId]);
    }

    console.log('✅ Car rental database schema initialized successfully');
    
  } catch (error) {
    console.error('❌ Error initializing car rental schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
  initializeCarRentalSchema
};