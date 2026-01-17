const { query } = require('../config/database');
const logger = require('../utils/logger');

async function setupCarRentalDatabase() {
  try {
    logger.info('Setting up enhanced car rental database...');

    // Create extensions
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    // Create ENUM types
    await query(`
      DO $$ BEGIN
        CREATE TYPE vehicle_status AS ENUM ('available', 'rented', 'maintenance', 'out_of_service');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE booking_status AS ENUM ('pending', 'pending_payment', 'confirmed', 'active', 'completed', 'cancelled', 'payment_failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'success', 'failed', 'refunded', 'partial_refund');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE payment_type AS ENUM ('rental', 'deposit', 'extra', 'refund', 'penalty');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE insurance_type AS ENUM ('basic', 'premium', 'full');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create locations table
    await query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        contact_phone VARCHAR(20),
        operating_hours JSONB DEFAULT '{"monday": "06:00-22:00", "tuesday": "06:00-22:00", "wednesday": "06:00-22:00", "thursday": "06:00-22:00", "friday": "06:00-22:00", "saturday": "07:00-21:00", "sunday": "07:00-21:00"}',
        is_active BOOLEAN DEFAULT true,
        is_airport BOOLEAN DEFAULT false,
        is_24_7 BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create vehicles table
    await query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        make VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        category VARCHAR(20) NOT NULL,
        license_plate VARCHAR(20) UNIQUE NOT NULL,
        vin VARCHAR(50) UNIQUE,
        color VARCHAR(30),
        transmission VARCHAR(20) DEFAULT 'automatic',
        fuel_type VARCHAR(20) DEFAULT 'petrol',
        seats INTEGER DEFAULT 5,
        doors INTEGER DEFAULT 4,
        daily_rate DECIMAL(10,2) NOT NULL,
        weekly_rate DECIMAL(10,2),
        monthly_rate DECIMAL(10,2),
        security_deposit DECIMAL(10,2) NOT NULL DEFAULT 10000,
        mileage INTEGER DEFAULT 0,
        status vehicle_status DEFAULT 'available',
        location_id UUID REFERENCES locations(id),
        features JSONB DEFAULT '[]',
        images JSONB DEFAULT '[]',
        documents JSONB DEFAULT '{}',
        insurance_details JSONB DEFAULT '{}',
        maintenance_schedule JSONB DEFAULT '{}',
        last_service_date DATE,
        next_service_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create customers table (enhanced)
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        whatsapp_id VARCHAR(50) UNIQUE,
        full_name VARCHAR(100),
        email VARCHAR(100),
        date_of_birth DATE,
        id_number VARCHAR(50),
        id_type VARCHAR(20) DEFAULT 'national_id',
        license_number VARCHAR(50),
        license_expiry DATE,
        license_country VARCHAR(3) DEFAULT 'KE',
        emergency_contact JSONB DEFAULT '{}',
        address JSONB DEFAULT '{}',
        verification_status verification_status DEFAULT 'pending',
        verification_documents JSONB DEFAULT '{}',
        loyalty_points INTEGER DEFAULT 0,
        loyalty_tier VARCHAR(20) DEFAULT 'bronze',
        preferences JSONB DEFAULT '{}',
        communication_preferences JSONB DEFAULT '{"whatsapp": true, "email": false, "sms": false}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create extras table
    await query(`
      CREATE TABLE IF NOT EXISTS extras (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        pricing_type VARCHAR(20) DEFAULT 'per_day',
        max_quantity INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        image_url VARCHAR(255),
        terms_conditions TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create bookings table (enhanced)
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_reference VARCHAR(20) UNIQUE NOT NULL,
        customer_id UUID REFERENCES customers(id) NOT NULL,
        vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
        pickup_location_id UUID REFERENCES locations(id) NOT NULL,
        return_location_id UUID REFERENCES locations(id),
        pickup_datetime TIMESTAMP NOT NULL,
        return_datetime TIMESTAMP NOT NULL,
        actual_pickup_datetime TIMESTAMP,
        actual_return_datetime TIMESTAMP,
        status booking_status DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        security_deposit DECIMAL(10,2) NOT NULL,
        insurance_type insurance_type DEFAULT 'basic',
        extras JSONB DEFAULT '[]',
        pricing_breakdown JSONB DEFAULT '{}',
        terms_accepted BOOLEAN DEFAULT false,
        notes TEXT,
        verification_code VARCHAR(10),
        pickup_instructions TEXT,
        return_instructions TEXT,
        special_requests TEXT,
        cancellation_reason TEXT,
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create payments table (enhanced)
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id) NOT NULL,
        ghala_payment_id VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        payment_method VARCHAR(20) NOT NULL,
        payment_type payment_type NOT NULL,
        status payment_status DEFAULT 'pending',
        transaction_ref VARCHAR(100),
        failure_reason TEXT,
        refund_amount DECIMAL(10,2) DEFAULT 0,
        refund_reason TEXT,
        processed_at TIMESTAMP,
        refunded_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create booking_extras table
    await query(`
      CREATE TABLE IF NOT EXISTS booking_extras (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id) NOT NULL,
        extra_id UUID REFERENCES extras(id) NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create reviews table
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id) NOT NULL,
        vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
        customer_id UUID REFERENCES customers(id) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        comment TEXT,
        customer_name VARCHAR(100),
        is_verified BOOLEAN DEFAULT false,
        is_public BOOLEAN DEFAULT true,
        response TEXT,
        responded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create vehicle_maintenance table
    await query(`
      CREATE TABLE IF NOT EXISTS vehicle_maintenance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
        maintenance_type VARCHAR(50) NOT NULL,
        description TEXT,
        cost DECIMAL(10,2),
        mileage_at_service INTEGER,
        service_provider VARCHAR(100),
        scheduled_date DATE,
        completed_date DATE,
        next_service_date DATE,
        status VARCHAR(20) DEFAULT 'scheduled',
        notes TEXT,
        documents JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create promotional_codes table
    await query(`
      CREATE TABLE IF NOT EXISTS promotional_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(20) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
        discount_value DECIMAL(10,2) NOT NULL,
        minimum_amount DECIMAL(10,2) DEFAULT 0,
        maximum_discount DECIMAL(10,2),
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        applicable_categories JSONB DEFAULT '[]',
        valid_from DATE NOT NULL,
        valid_until DATE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create customer_sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID REFERENCES customers(id) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        session_data JSONB DEFAULT '{}',
        current_step VARCHAR(50),
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 minutes'),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID REFERENCES customers(id),
        booking_id UUID REFERENCES bookings(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        channel VARCHAR(20) DEFAULT 'whatsapp',
        status VARCHAR(20) DEFAULT 'pending',
        scheduled_at TIMESTAMP DEFAULT NOW(),
        sent_at TIMESTAMP,
        read_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create vehicle_tracking table (for GPS tracking)
    await query(`
      CREATE TABLE IF NOT EXISTS vehicle_tracking (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
        booking_id UUID REFERENCES bookings(id),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        speed DECIMAL(5,2),
        heading INTEGER,
        altitude DECIMAL(8,2),
        accuracy DECIMAL(8,2),
        battery_level INTEGER,
        ignition_status BOOLEAN,
        fuel_level DECIMAL(5,2),
        mileage INTEGER,
        location_address TEXT,
        recorded_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create damage_reports table
    await query(`
      CREATE TABLE IF NOT EXISTS damage_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id) NOT NULL,
        vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
        customer_id UUID REFERENCES customers(id) NOT NULL,
        report_type VARCHAR(20) DEFAULT 'return', -- 'pickup' or 'return'
        damage_description TEXT,
        damage_photos JSONB DEFAULT '[]',
        estimated_cost DECIMAL(10,2),
        actual_cost DECIMAL(10,2),
        is_customer_fault BOOLEAN DEFAULT false,
        insurance_claim_number VARCHAR(50),
        status VARCHAR(20) DEFAULT 'reported',
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create loyalty_transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID REFERENCES customers(id) NOT NULL,
        booking_id UUID REFERENCES bookings(id),
        transaction_type VARCHAR(20) NOT NULL, -- 'earned', 'redeemed', 'expired'
        points INTEGER NOT NULL,
        description TEXT,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create system_settings table
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value JSONB NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        updated_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await query(`CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(pickup_datetime, return_datetime)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_customers_verification ON customers(verification_status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_vehicle ON reviews(vehicle_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_vehicle ON vehicle_tracking(vehicle_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_time ON vehicle_tracking(recorded_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_customer ON notifications(customer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)`);

    // Insert default locations
    await query(`
      INSERT INTO locations (name, address, latitude, longitude, contact_phone, is_airport, is_24_7) VALUES
      ('Nairobi CBD', 'Kenyatta Avenue, Nairobi CBD', -1.2864, 36.8172, '+254700123456', false, false),
      ('Westlands', 'Sarit Centre, Westlands', -1.2630, 36.8063, '+254700123457', false, false),
      ('Karen', 'Karen Shopping Centre, Karen', -1.3197, 36.7073, '+254700123458', false, false),
      ('JKIA Airport', 'Jomo Kenyatta International Airport, Terminal 1', -1.3192, 36.9275, '+254700123459', true, true),
      ('Wilson Airport', 'Wilson Airport, Langata Road', -1.3218, 36.8147, '+254700123460', true, false)
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default extras
    await query(`
      INSERT INTO extras (name, description, category, price, pricing_type, max_quantity) VALUES
      ('GPS Navigation', 'Garmin GPS with offline maps and real-time traffic', 'navigation', 200, 'per_day', 1),
      ('Child Safety Seat (0-4 years)', 'Certified child safety seat for infants and toddlers', 'safety', 300, 'per_day', 2),
      ('Child Booster Seat (4-12 years)', 'Booster seat for older children', 'safety', 250, 'per_day', 2),
      ('Additional Driver', 'Add an additional authorized driver', 'driver', 400, 'per_day', 3),
      ('WiFi Hotspot', 'Mobile WiFi device with unlimited data', 'connectivity', 500, 'per_day', 1),
      ('Full Tank Option', 'Return vehicle with any fuel level', 'fuel', 3000, 'per_booking', 1),
      ('Ski Rack', 'Roof-mounted ski and snowboard rack', 'sports', 800, 'per_day', 1),
      ('Bike Rack', 'Rear-mounted bicycle rack (up to 3 bikes)', 'sports', 600, 'per_day', 1),
      ('Pet Kit', 'Pet-friendly accessories (seat covers, harness)', 'pet', 400, 'per_day', 1),
      ('Emergency Roadside Kit', '24/7 roadside assistance and emergency kit', 'emergency', 300, 'per_booking', 1)
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert sample vehicles
    await query(`
      INSERT INTO vehicles (make, model, year, category, license_plate, color, transmission, fuel_type, seats, daily_rate, weekly_rate, monthly_rate, security_deposit, location_id, features, images) VALUES
      ('Toyota', 'Vitz', 2020, 'economy', 'KCA-001A', 'White', 'automatic', 'petrol', 5, 2500, 15000, 50000, 10000, (SELECT id FROM locations WHERE name = 'Nairobi CBD' LIMIT 1), '["air_conditioning", "bluetooth", "usb_charging"]', '["https://example.com/vitz1.jpg"]'),
      ('Toyota', 'RAV4', 2021, 'suv', 'KCA-002B', 'Silver', 'automatic', 'petrol', 5, 4500, 27000, 90000, 15000, (SELECT id FROM locations WHERE name = 'Westlands' LIMIT 1), '["air_conditioning", "bluetooth", "gps", "backup_camera", "cruise_control"]', '["https://example.com/rav4.jpg"]'),
      ('Mercedes-Benz', 'C-Class', 2022, 'luxury', 'KCA-003C', 'Black', 'automatic', 'petrol', 5, 8000, 48000, 160000, 25000, (SELECT id FROM locations WHERE name = 'Karen' LIMIT 1), '["leather_seats", "sunroof", "premium_sound", "navigation", "heated_seats"]', '["https://example.com/mercedes.jpg"]'),
      ('Toyota', 'Hiace', 2019, 'van', 'KCA-004D', 'White', 'manual', 'diesel', 14, 6000, 36000, 120000, 20000, (SELECT id FROM locations WHERE name = 'JKIA Airport' LIMIT 1), '["air_conditioning", "power_steering", "high_roof"]', '["https://example.com/hiace.jpg"]')
      ON CONFLICT (license_plate) DO NOTHING
    `);

    // Insert default system settings
    await query(`
      INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
      ('business_hours', '{"monday": "06:00-22:00", "tuesday": "06:00-22:00", "wednesday": "06:00-22:00", "thursday": "06:00-22:00", "friday": "06:00-22:00", "saturday": "07:00-21:00", "sunday": "07:00-21:00"}', 'Standard business hours', true),
      ('cancellation_policy', '{"24_hours": 0.9, "12_hours": 0.5, "2_hours": 0.25, "less_than_2": 0}', 'Cancellation refund percentages', true),
      ('insurance_rates', '{"basic": 0, "premium": 0.20, "full": 0.35}', 'Insurance pricing as percentage of rental', false),
      ('loyalty_rates', '{"bronze": 1, "silver": 1.5, "gold": 2, "platinum": 3}', 'Loyalty points per KES spent', false),
      ('minimum_age', '21', 'Minimum age for rental', true),
      ('security_deposit_rates', '{"economy": 10000, "suv": 15000, "luxury": 25000, "van": 20000}', 'Security deposit by category', true)
      ON CONFLICT (setting_key) DO NOTHING
    `);

    // Insert sample promotional codes
    await query(`
      INSERT INTO promotional_codes (code, description, discount_type, discount_value, minimum_amount, usage_limit, valid_from, valid_until) VALUES
      ('WELCOME10', 'Welcome discount for new customers', 'percentage', 10, 2000, 100, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
      ('WEEKEND20', 'Weekend special discount', 'percentage', 20, 5000, 50, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
      ('LOYALTY500', 'Loyalty customer fixed discount', 'fixed', 500, 3000, 200, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days')
      ON CONFLICT (code) DO NOTHING
    `);

    logger.info('Enhanced car rental database setup completed successfully!');

    // Log table counts
    const tables = [
      'locations', 'vehicles', 'customers', 'extras', 'bookings', 
      'payments', 'reviews', 'promotional_codes', 'system_settings'
    ];

    for (const table of tables) {
      const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
      logger.info(`${table}: ${result.rows[0].count} records`);
    }

  } catch (error) {
    logger.error('Error setting up car rental database:', error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupCarRentalDatabase()
    .then(() => {
      logger.info('Database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupCarRentalDatabase };