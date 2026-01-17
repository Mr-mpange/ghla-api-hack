const db = require('../config/database');

async function setupCarRentalDatabase() {
  try {
    console.log('🚗 Setting up Car Rental Database...');

    // Create vehicles table
    await db.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        make VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        category VARCHAR(30) NOT NULL, -- economy, compact, midsize, fullsize, luxury, suv, van
        license_plate VARCHAR(20) UNIQUE NOT NULL,
        vin VARCHAR(17) UNIQUE,
        color VARCHAR(30),
        fuel_type VARCHAR(20) DEFAULT 'petrol', -- petrol, diesel, hybrid, electric
        transmission VARCHAR(20) DEFAULT 'manual', -- manual, automatic
        seats INTEGER DEFAULT 5,
        doors INTEGER DEFAULT 4,
        air_conditioning BOOLEAN DEFAULT true,
        gps BOOLEAN DEFAULT false,
        bluetooth BOOLEAN DEFAULT false,
        daily_rate DECIMAL(10,2) NOT NULL,
        weekly_rate DECIMAL(10,2),
        monthly_rate DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'KES',
        mileage INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'available', -- available, rented, maintenance, retired
        location_id INTEGER,
        images TEXT[], -- Array of image URLs
        description TEXT,
        features TEXT[], -- Array of features
        insurance_included BOOLEAN DEFAULT true,
        deposit_amount DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create locations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(50) NOT NULL,
        county VARCHAR(50),
        postal_code VARCHAR(10),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        phone VARCHAR(20),
        email VARCHAR(100),
        operating_hours JSONB, -- {"monday": {"open": "08:00", "close": "18:00"}, ...}
        is_pickup_location BOOLEAN DEFAULT true,
        is_return_location BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create bookings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_reference VARCHAR(20) UNIQUE NOT NULL,
        customer_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        pickup_location_id INTEGER NOT NULL,
        return_location_id INTEGER NOT NULL,
        pickup_date TIMESTAMP NOT NULL,
        return_date TIMESTAMP NOT NULL,
        pickup_time TIME NOT NULL,
        return_time TIME NOT NULL,
        total_days INTEGER NOT NULL,
        base_amount DECIMAL(10,2) NOT NULL,
        extras_amount DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        deposit_amount DECIMAL(10,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'KES',
        status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, active, completed, cancelled
        payment_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid, refunded
        ghala_order_id VARCHAR(100),
        special_requests TEXT,
        terms_accepted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (pickup_location_id) REFERENCES locations(id),
        FOREIGN KEY (return_location_id) REFERENCES locations(id)
      )
    `);

    // Create booking_extras table
    await db.query(`
      CREATE TABLE IF NOT EXISTS booking_extras (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL,
        extra_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      )
    `);

    // Create extras table
    await db.query(`
      CREATE TABLE IF NOT EXISTS extras (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(30), -- insurance, equipment, service
        price DECIMAL(10,2) NOT NULL,
        price_type VARCHAR(20) DEFAULT 'per_day', -- per_day, per_booking, per_hour
        currency VARCHAR(3) DEFAULT 'KES',
        is_mandatory BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create payments table (enhanced for car rentals)
    await db.query(`
      CREATE TABLE IF NOT EXISTS rental_payments (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL,
        ghala_payment_id VARCHAR(100),
        payment_type VARCHAR(20) NOT NULL, -- deposit, full_payment, additional_charges, refund
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        payment_method VARCHAR(20), -- mpesa, airtel, card
        status VARCHAR(20) DEFAULT 'pending', -- pending, processing, success, failed, refunded
        transaction_reference VARCHAR(100),
        customer_phone VARCHAR(20),
        payment_date TIMESTAMP,
        webhook_data JSONB,
        failure_reason TEXT,
        refund_amount DECIMAL(10,2) DEFAULT 0,
        refund_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )
    `);

    // Create vehicle_maintenance table
    await db.query(`
      CREATE TABLE IF NOT EXISTS vehicle_maintenance (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        maintenance_type VARCHAR(50) NOT NULL, -- service, repair, inspection, cleaning
        description TEXT,
        cost DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'KES',
        scheduled_date DATE,
        completed_date DATE,
        status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
        service_provider VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
      )
    `);

    // Create vehicle_inspections table
    await db.query(`
      CREATE TABLE IF NOT EXISTS vehicle_inspections (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER,
        vehicle_id INTEGER NOT NULL,
        inspection_type VARCHAR(20) NOT NULL, -- pickup, return, maintenance
        inspector_name VARCHAR(100),
        fuel_level INTEGER, -- Percentage
        mileage INTEGER,
        exterior_condition JSONB, -- {"front": "good", "rear": "scratched", ...}
        interior_condition JSONB,
        damages JSONB, -- Array of damage descriptions with photos
        photos TEXT[], -- Array of photo URLs
        notes TEXT,
        inspection_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
      )
    `);

    // Create reviews table
    await db.query(`
      CREATE TABLE IF NOT EXISTS rental_reviews (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        vehicle_rating INTEGER CHECK (vehicle_rating >= 1 AND vehicle_rating <= 5),
        service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
        cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
        review_text TEXT,
        photos TEXT[],
        is_verified BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        admin_response TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
      )
    `);

    // Create customer_documents table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_documents (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        document_type VARCHAR(30) NOT NULL, -- driving_license, national_id, passport
        document_number VARCHAR(50) NOT NULL,
        expiry_date DATE,
        document_url TEXT,
        verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
        verified_at TIMESTAMP,
        verified_by VARCHAR(100),
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    // Create loyalty_points table
    await db.query(`
      CREATE TABLE IF NOT EXISTS loyalty_points (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        booking_id INTEGER,
        points_earned INTEGER DEFAULT 0,
        points_redeemed INTEGER DEFAULT 0,
        transaction_type VARCHAR(30), -- earned, redeemed, expired, bonus
        description TEXT,
        expiry_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )
    `);

    // Create promotional_codes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS promotional_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
        discount_value DECIMAL(10,2) NOT NULL,
        minimum_amount DECIMAL(10,2) DEFAULT 0,
        maximum_discount DECIMAL(10,2),
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        valid_from DATE NOT NULL,
        valid_until DATE NOT NULL,
        applicable_categories TEXT[], -- Array of vehicle categories
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
      CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
      CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(pickup_date, return_date);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
      CREATE INDEX IF NOT EXISTS idx_payments_booking ON rental_payments(booking_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON rental_payments(status);
      CREATE INDEX IF NOT EXISTS idx_reviews_vehicle ON rental_reviews(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_customer ON rental_reviews(customer_id);
    `);

    // Insert sample locations
    await db.query(`
      INSERT INTO locations (name, address, city, county, latitude, longitude, phone, operating_hours) VALUES
      ('Nairobi CBD Branch', 'Kimathi Street, Nairobi', 'Nairobi', 'Nairobi', -1.2864, 36.8172, '+254700000001', 
       '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"open": "10:00", "close": "16:00"}}'),
      ('JKIA Airport', 'Jomo Kenyatta International Airport', 'Nairobi', 'Nairobi', -1.3192, 36.9275, '+254700000002',
       '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "06:00", "close": "22:00"}}'),
      ('Westlands Branch', 'Westlands Road, Nairobi', 'Nairobi', 'Nairobi', -1.2676, 36.8108, '+254700000003',
       '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"closed": true}}'),
      ('Mombasa Branch', 'Moi Avenue, Mombasa', 'Mombasa', 'Mombasa', -4.0435, 39.6682, '+254700000004',
       '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"closed": true}}')
      ON CONFLICT DO NOTHING
    `);

    // Insert sample extras
    await db.query(`
      INSERT INTO extras (name, description, category, price, price_type) VALUES
      ('Comprehensive Insurance', 'Full coverage insurance with zero excess', 'insurance', 500.00, 'per_day'),
      ('GPS Navigation', 'Garmin GPS device with Kenya maps', 'equipment', 200.00, 'per_day'),
      ('Child Safety Seat', 'Safety seat for children 0-4 years', 'equipment', 300.00, 'per_day'),
      ('Additional Driver', 'Add extra authorized driver', 'service', 500.00, 'per_booking'),
      ('Airport Delivery', 'Vehicle delivery to airport', 'service', 1000.00, 'per_booking'),
      ('Fuel Service', 'Return vehicle with any fuel level', 'service', 800.00, 'per_booking'),
      ('WiFi Hotspot', 'Mobile internet hotspot device', 'equipment', 400.00, 'per_day'),
      ('Roof Rack', 'Additional luggage storage', 'equipment', 300.00, 'per_day')
      ON CONFLICT DO NOTHING
    `);

    // Insert sample vehicles
    await db.query(`
      INSERT INTO vehicles (make, model, year, category, license_plate, color, fuel_type, transmission, seats, doors, daily_rate, weekly_rate, monthly_rate, location_id, description, features, images) VALUES
      ('Toyota', 'Vitz', 2020, 'economy', 'KCA 001A', 'White', 'petrol', 'automatic', 5, 4, 2500.00, 15000.00, 60000.00, 1, 'Compact and fuel-efficient car perfect for city driving', ARRAY['Air Conditioning', 'Power Steering', 'Central Locking'], ARRAY['https://example.com/vitz1.jpg', 'https://example.com/vitz2.jpg']),
      ('Nissan', 'Note', 2021, 'compact', 'KCA 002B', 'Silver', 'petrol', 'automatic', 5, 4, 3000.00, 18000.00, 72000.00, 1, 'Spacious compact car with modern features', ARRAY['Air Conditioning', 'Bluetooth', 'USB Charging'], ARRAY['https://example.com/note1.jpg', 'https://example.com/note2.jpg']),
      ('Toyota', 'Fielder', 2019, 'midsize', 'KCA 003C', 'Blue', 'petrol', 'automatic', 5, 4, 3500.00, 21000.00, 84000.00, 2, 'Reliable station wagon with ample cargo space', ARRAY['Air Conditioning', 'Power Windows', 'ABS'], ARRAY['https://example.com/fielder1.jpg', 'https://example.com/fielder2.jpg']),
      ('Toyota', 'Prado', 2022, 'suv', 'KCA 004D', 'Black', 'diesel', 'automatic', 7, 4, 8000.00, 48000.00, 192000.00, 1, 'Premium SUV perfect for safari and long trips', ARRAY['4WD', 'Leather Seats', 'Sunroof', 'GPS'], ARRAY['https://example.com/prado1.jpg', 'https://example.com/prado2.jpg']),
      ('Mercedes', 'C-Class', 2021, 'luxury', 'KCA 005E', 'White', 'petrol', 'automatic', 5, 4, 12000.00, 72000.00, 288000.00, 3, 'Luxury sedan with premium features', ARRAY['Leather Interior', 'Premium Sound', 'Climate Control'], ARRAY['https://example.com/merc1.jpg', 'https://example.com/merc2.jpg']),
      ('Toyota', 'Hiace', 2020, 'van', 'KCA 006F', 'White', 'diesel', 'manual', 14, 4, 6000.00, 36000.00, 144000.00, 2, 'Spacious van perfect for group travel', ARRAY['Air Conditioning', 'High Roof', 'Sliding Doors'], ARRAY['https://example.com/hiace1.jpg', 'https://example.com/hiace2.jpg'])
      ON CONFLICT (license_plate) DO NOTHING
    `);

    // Insert sample promotional codes
    await db.query(`
      INSERT INTO promotional_codes (code, description, discount_type, discount_value, minimum_amount, valid_from, valid_until, applicable_categories) VALUES
      ('WELCOME10', 'Welcome discount for new customers', 'percentage', 10.00, 5000.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', ARRAY['economy', 'compact']),
      ('WEEKEND20', 'Weekend special discount', 'percentage', 20.00, 3000.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', ARRAY['economy', 'compact', 'midsize']),
      ('LUXURY500', 'Fixed discount on luxury vehicles', 'fixed_amount', 500.00, 10000.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', ARRAY['luxury'])
      ON CONFLICT (code) DO NOTHING
    `);

    console.log('✅ Car Rental Database setup completed successfully!');
    console.log('📊 Sample data inserted:');
    console.log('   - 4 Locations (Nairobi CBD, JKIA, Westlands, Mombasa)');
    console.log('   - 8 Extras (Insurance, GPS, Child Seat, etc.)');
    console.log('   - 6 Vehicles (Economy to Luxury categories)');
    console.log('   - 3 Promotional codes');

  } catch (error) {
    console.error('❌ Error setting up car rental database:', error.message);
    throw error;
  }
}

// Run setup if called directly
if (require.main === module) {
  setupCarRentalDatabase()
    .then(() => {
      console.log('🎉 Car Rental Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = setupCarRentalDatabase;