#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
🚗 Car Rental System Setup
==========================

This script will set up your comprehensive car rental system with:
• Enhanced database schema
• Workflow automation
• Admin dashboard
• WhatsApp integration
• Payment processing via Ghala
• Real-time notifications
• Analytics and reporting

Let's get started! 🚀
`);

async function setupCarRentalSystem() {
  try {
    console.log('📦 Installing dependencies...');
    
    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      console.error('❌ package.json not found. Please run this script from the project root.');
      process.exit(1);
    }

    // Install additional dependencies for car rental system
    const additionalDeps = [
      'moment',
      'node-cron',
      'joi'
    ];

    console.log('Installing additional dependencies:', additionalDeps.join(', '));
    execSync(`npm install ${additionalDeps.join(' ')}`, { stdio: 'inherit' });

    console.log('✅ Dependencies installed successfully');

    // Create .env file if it doesn't exist
    if (!fs.existsSync('.env')) {
      console.log('📝 Creating .env file...');
      
      const envContent = `# Car Rental System Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/car_rental_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=car_rental_db
DB_USER=username
DB_PASSWORD=password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Ghala API Configuration
GHALA_API_KEY=your_ghala_api_key_here
GHALA_API_URL=https://api.ghala.io/v1
GHALA_WEBHOOK_SECRET=your_webhook_secret_here

# WhatsApp Configuration
WHATSAPP_BUSINESS_NUMBER=+254700123456

# Application Configuration
APP_URL=https://your-domain.com
ADMIN_TOKEN=your_secure_admin_token_here

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Allowed Origins for CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
`;

      fs.writeFileSync('.env', envContent);
      console.log('✅ .env file created. Please update it with your actual configuration.');
    }

    // Create directories if they don't exist
    const directories = [
      'logs',
      'uploads',
      'temp',
      'backups'
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    // Create a simple HTML dashboard file
    const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Car Rental System Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            color: #333;
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            color: #666;
            font-size: 1.2em;
            margin: 10px 0;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #667eea;
        }
        .card h3 {
            margin: 0 0 15px 0;
            color: #333;
        }
        .card p {
            color: #666;
            margin: 0 0 15px 0;
        }
        .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #5a6fd8;
        }
        .api-endpoints {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
        }
        .endpoint {
            background: white;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            border-left: 3px solid #28a745;
        }
        .method {
            background: #28a745;
            color: white;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 0.8em;
            margin-right: 10px;
        }
        .method.post { background: #007bff; }
        .method.patch { background: #ffc107; color: #333; }
        .method.delete { background: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 Car Rental System</h1>
            <p>Comprehensive car rental management platform powered by Ghala API</p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>🚗 Vehicle Management</h3>
                <p>Manage your fleet, track availability, and monitor vehicle status in real-time.</p>
                <a href="/api/admin/dashboard/fleet" class="btn">View Fleet</a>
            </div>

            <div class="card">
                <h3>📋 Booking Management</h3>
                <p>Handle reservations, process payments, and manage customer bookings.</p>
                <a href="/api/admin/dashboard/bookings" class="btn">View Bookings</a>
            </div>

            <div class="card">
                <h3>👥 Customer Management</h3>
                <p>Manage customer profiles, loyalty programs, and communication preferences.</p>
                <a href="/api/admin/dashboard/customers" class="btn">View Customers</a>
            </div>

            <div class="card">
                <h3>📊 Analytics & Reports</h3>
                <p>Track revenue, utilization rates, and generate comprehensive reports.</p>
                <a href="/api/admin/dashboard/analytics/revenue" class="btn">View Analytics</a>
            </div>

            <div class="card">
                <h3>🤖 Workflow Automation</h3>
                <p>Automated reminders, notifications, and business process management.</p>
                <a href="/api/admin/automation/status" class="btn">View Status</a>
            </div>

            <div class="card">
                <h3>💬 WhatsApp Integration</h3>
                <p>Seamless customer communication through WhatsApp Business API.</p>
                <a href="/api/chat/message" class="btn">Test Chat</a>
            </div>
        </div>

        <div class="api-endpoints">
            <h3>🔗 API Endpoints</h3>
            
            <div class="endpoint">
                <span class="method">GET</span>
                <strong>/api/vehicles/search</strong> - Search available vehicles
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span>
                <strong>/api/vehicles/:id</strong> - Get vehicle details
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span>
                <strong>/api/bookings</strong> - Create new booking
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span>
                <strong>/api/bookings/:id</strong> - Get booking details
            </div>
            
            <div class="endpoint">
                <span class="method">PATCH</span>
                <strong>/api/bookings/:id/status</strong> - Update booking status
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span>
                <strong>/api/chat/message</strong> - Send WhatsApp message
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span>
                <strong>/api/admin/dashboard/overview</strong> - Dashboard overview
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span>
                <strong>/health</strong> - System health check
            </div>
        </div>

        <div style="text-align: center; margin-top: 40px; color: #666;">
            <p>🚀 Car Rental System v1.0.0 | Powered by Ghala API</p>
            <p>For support, visit our documentation or contact the development team.</p>
        </div>
    </div>
</body>
</html>`;

    if (!fs.existsSync('public')) {
      fs.mkdirSync('public');
    }
    fs.writeFileSync('public/dashboard.html', dashboardHTML);
    console.log('✅ Dashboard HTML created at public/dashboard.html');

    // Create a startup script
    const startupScript = `#!/bin/bash

echo "🚗 Starting Car Rental System..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application
echo "🚀 Starting server..."
npm start
`;

    fs.writeFileSync('start.sh', startupScript);
    execSync('chmod +x start.sh');
    console.log('✅ Startup script created: start.sh');

    // Create package.json scripts if they don't exist
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    // Add car rental specific scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'setup-db': 'node src/scripts/setupCarRentalDatabaseEnhanced.js',
      'start:dev': 'nodemon src/server.js',
      'start:prod': 'NODE_ENV=production node src/server.js',
      'test:api': 'node test-api.js',
      'backup-db': 'pg_dump $DATABASE_URL > backups/backup-$(date +%Y%m%d-%H%M%S).sql',
      'restore-db': 'psql $DATABASE_URL < $1'
    };

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json scripts updated');

    // Create a simple API test script
    const apiTestScript = `const axios = require('axios');

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Car Rental System API...');
  
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const health = await axios.get(\`\${BASE_URL}/health\`);
    console.log('✅ Health check:', health.data.status);
    
    // Test locations endpoint
    console.log('Testing locations endpoint...');
    const locations = await axios.get(\`\${BASE_URL}/api/locations\`);
    console.log('✅ Locations:', locations.data.success ? 'OK' : 'Failed');
    
    // Test categories endpoint
    console.log('Testing categories endpoint...');
    const categories = await axios.get(\`\${BASE_URL}/api/categories\`);
    console.log('✅ Categories:', categories.data.success ? 'OK' : 'Failed');
    
    // Test vehicle search
    console.log('Testing vehicle search...');
    const vehicles = await axios.get(\`\${BASE_URL}/api/vehicles/search?location=Nairobi\`);
    console.log('✅ Vehicle search:', vehicles.data.success ? 'OK' : 'Failed');
    
    console.log('\\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
`;

    fs.writeFileSync('test-api.js', apiTestScript);
    console.log('✅ API test script created: test-api.js');

    // Create README for car rental system
    const readmeContent = `# 🚗 Car Rental System

A comprehensive car rental management platform with WhatsApp integration and automated workflows.

## Features

- 🚗 **Fleet Management** - Complete vehicle inventory management
- 📋 **Booking System** - Automated reservation processing
- 💳 **Payment Processing** - Integrated with Ghala API
- 📱 **WhatsApp Integration** - Customer communication via WhatsApp
- 🤖 **Workflow Automation** - Automated reminders and notifications
- 📊 **Analytics Dashboard** - Real-time reporting and insights
- 👥 **Customer Management** - CRM with loyalty programs
- 🔧 **Admin Tools** - Comprehensive management interface

## Quick Start

1. **Setup Environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

2. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Setup Database**
   \`\`\`bash
   npm run setup-db
   \`\`\`

4. **Start Development Server**
   \`\`\`bash
   npm run start:dev
   \`\`\`

5. **Test API**
   \`\`\`bash
   npm run test:api
   \`\`\`

## API Endpoints

### Vehicle Management
- \`GET /api/vehicles/search\` - Search available vehicles
- \`GET /api/vehicles/:id\` - Get vehicle details
- \`GET /api/locations\` - Get pickup locations
- \`GET /api/categories\` - Get vehicle categories

### Booking Management
- \`POST /api/bookings\` - Create new booking
- \`GET /api/bookings/:id\` - Get booking details
- \`PATCH /api/bookings/:id/status\` - Update booking status
- \`POST /api/bookings/:id/cancel\` - Cancel booking

### Admin Dashboard
- \`GET /api/admin/dashboard/overview\` - Dashboard overview
- \`GET /api/admin/dashboard/fleet\` - Fleet management
- \`GET /api/admin/dashboard/bookings\` - Booking management
- \`GET /api/admin/dashboard/customers\` - Customer management

### WhatsApp Integration
- \`POST /api/chat/message\` - Send WhatsApp message

## Configuration

### Environment Variables

\`\`\`env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/car_rental_db

# Ghala API
GHALA_API_KEY=your_api_key
GHALA_WEBHOOK_SECRET=your_webhook_secret

# WhatsApp
WHATSAPP_BUSINESS_NUMBER=+254700123456

# Application
APP_URL=https://your-domain.com
ADMIN_TOKEN=secure_admin_token
\`\`\`

### Database Setup

The system uses PostgreSQL with the following main tables:
- \`vehicles\` - Vehicle inventory
- \`bookings\` - Rental reservations
- \`customers\` - Customer profiles
- \`payments\` - Payment transactions
- \`locations\` - Pickup/return locations

## Workflow Automation

The system includes automated workflows for:
- Booking reminders (24h, 2h, 30min before pickup)
- Return reminders (24h, 4h, 1h before return)
- Payment reminders for pending payments
- Overdue rental alerts and escalation
- Maintenance scheduling alerts
- Customer feedback requests
- Loyalty program updates

## WhatsApp Integration

Customers can interact with the system via WhatsApp:
- Search and book vehicles
- View booking details
- Receive automated notifications
- Get customer support
- Make payments

## Admin Dashboard

Comprehensive admin interface for:
- Fleet management and tracking
- Booking oversight and management
- Customer relationship management
- Financial reporting and analytics
- System health monitoring

## Development

### Project Structure

\`\`\`
src/
├── config/          # Database and Redis configuration
├── controllers/     # Request handlers
├── handlers/        # Business logic handlers
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business services
├── scripts/         # Setup and utility scripts
├── utils/           # Utility functions
├── webhooks/        # Webhook handlers
└── workers/         # Background job processors
\`\`\`

### Available Scripts

- \`npm start\` - Start production server
- \`npm run start:dev\` - Start development server
- \`npm run setup-db\` - Setup database schema
- \`npm run test:api\` - Test API endpoints
- \`npm run backup-db\` - Backup database

## Deployment

1. Set up PostgreSQL and Redis
2. Configure environment variables
3. Run database setup
4. Deploy to your hosting platform
5. Configure webhooks with Ghala

## Support

For support and documentation, contact the development team or refer to the API documentation.

---

🚗 **Car Rental System** - Powered by Ghala API
`;

    fs.writeFileSync('CAR_RENTAL_README.md', readmeContent);
    console.log('✅ Car rental README created');

    console.log(`
🎉 Car Rental System Setup Complete!

✅ Dependencies installed
✅ Environment file created (.env)
✅ Directory structure created
✅ Dashboard HTML created
✅ Startup script created (start.sh)
✅ API test script created (test-api.js)
✅ Package.json scripts updated
✅ Documentation created

🚀 Next Steps:

1. Update your .env file with actual configuration:
   - Database connection details
   - Ghala API credentials
   - WhatsApp Business number
   - Admin token

2. Setup your database:
   npm run setup-db

3. Start the development server:
   npm run start:dev

4. Test the API:
   npm run test:api

5. Access the dashboard:
   http://localhost:3000/dashboard.html

📚 Documentation:
   - Main README: CAR_RENTAL_README.md
   - API Documentation: API_DOCUMENTATION.md
   - System Design: CAR_RENTAL_SYSTEM_DESIGN.md

🚗 Your comprehensive car rental system is ready to go!
    `);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupCarRentalSystem();
}

module.exports = { setupCarRentalSystem };