# 🚗 Comprehensive Car Rental System

A complete car rental management platform with WhatsApp integration, automated workflows, and real-time analytics powered by Ghala API.

## 🌟 Features

### 🚗 **Fleet Management**
- Real-time vehicle tracking and status monitoring
- Dynamic pricing based on demand and seasonality
- Comprehensive vehicle details with images and reviews
- Maintenance scheduling and alerts
- GPS tracking and geofencing

### 📱 **WhatsApp Integration**
- Complete booking flow via WhatsApp
- Interactive buttons and lists for better UX
- Automated notifications and reminders
- Customer support through WhatsApp
- Multi-language support

### 💳 **Payment Processing**
- Multiple payment methods via Ghala API
- M-Pesa, Airtel Money, and card payments
- Automated refund processing
- Security deposit management
- Payment analytics and reporting

### 🤖 **Workflow Automation**
- Automated booking reminders (24h, 2h, 30min)
- Return reminders and overdue alerts
- Payment follow-ups and notifications
- Maintenance scheduling
- Customer feedback collection
- Loyalty program management

### 📊 **Admin Dashboard**
- Real-time fleet overview and analytics
- Booking management and oversight
- Customer relationship management
- Revenue tracking and forecasting
- Performance metrics and KPIs

### 👥 **Customer Management**
- Complete customer profiles
- Booking history and preferences
- Loyalty points and tier management
- Document verification system
- Communication preferences

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Redis 6+
- WhatsApp Business Account
- Ghala API Account

### 1. Clone and Setup
```bash
git clone <repository-url>
cd car-rental-system
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/car_rental_db

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Ghala API
GHALA_API_KEY=your_ghala_api_key
GHALA_WEBHOOK_SECRET=your_webhook_secret

# Application
APP_URL=https://your-domain.com
ADMIN_TOKEN=your_secure_admin_token
```

### 3. Database Setup
```bash
npm run setup-db
```

### 4. Test WhatsApp Integration
```bash
npm run test:whatsapp
```

### 5. Start the System
```bash
# Development
npm run dev

# Production
npm run start:prod
```

### 6. Test the API
```bash
npm run test:api
```

## 📱 WhatsApp Setup

### 1. Meta Developer Console
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use existing WhatsApp Business app
3. Add WhatsApp product to your app
4. Get your credentials:
   - Access Token
   - Phone Number ID
   - Business Account ID

### 2. Webhook Configuration
1. Set webhook URL: `https://your-domain.com/api/webhooks/whatsapp`
2. Set verify token in your `.env` file
3. Subscribe to webhook fields:
   - `messages`
   - `message_deliveries`
   - `message_reads`
   - `message_reactions`

### 3. Test Integration
```bash
# Set test phone number in .env
TEST_PHONE_NUMBER=+254700123456

# Run WhatsApp test
npm run test:whatsapp
```

## 🏗️ System Architecture

### Core Components

```
src/
├── config/              # Database and Redis configuration
├── controllers/         # Request handlers
├── handlers/           # Business logic handlers
│   └── carRentalConversationHandler.js
├── models/             # Data models
├── routes/             # API routes
│   └── adminDashboardRoutes.js
├── services/           # Business services
│   ├── carRentalService.js
│   ├── bookingService.js
│   ├── whatsappService.js
│   └── workflowAutomationService.js
├── scripts/            # Setup and utility scripts
├── utils/              # Utility functions
├── webhooks/           # Webhook handlers
└── workers/            # Background job processors
```

### Database Schema

**Main Tables:**
- `vehicles` - Vehicle inventory and details
- `bookings` - Rental reservations
- `customers` - Customer profiles and preferences
- `payments` - Payment transactions
- `locations` - Pickup/return locations
- `extras` - Additional services and equipment
- `reviews` - Customer reviews and ratings
- `notifications` - System notifications

## 🔄 User Journey

### Customer Booking Flow
1. **Discovery**: WhatsApp greeting → Main menu
2. **Search**: Location selection → Date/time input
3. **Selection**: Vehicle browsing → Category selection
4. **Details**: Vehicle details → Extras selection
5. **Booking**: Customer info → Payment processing
6. **Confirmation**: Booking confirmation → QR code

### Admin Management Flow
1. **Dashboard**: Real-time overview and KPIs
2. **Fleet**: Vehicle status and maintenance
3. **Bookings**: Reservation management
4. **Customers**: CRM and support tools
5. **Analytics**: Revenue and performance reports

## 🛠️ API Endpoints

### Vehicle Management
```http
GET    /api/vehicles/search          # Search available vehicles
GET    /api/vehicles/:id             # Get vehicle details
GET    /api/locations                # Get pickup locations
GET    /api/categories               # Get vehicle categories
```

### Booking Management
```http
POST   /api/bookings                 # Create new booking
GET    /api/bookings/:id             # Get booking details
PATCH  /api/bookings/:id/status      # Update booking status
POST   /api/bookings/:id/cancel      # Cancel booking
```

### Admin Dashboard
```http
GET    /api/admin/dashboard/overview      # Dashboard overview
GET    /api/admin/dashboard/fleet         # Fleet management
GET    /api/admin/dashboard/bookings      # Booking management
GET    /api/admin/dashboard/customers     # Customer management
GET    /api/admin/dashboard/analytics/*   # Analytics endpoints
```

### WhatsApp Integration
```http
POST   /api/chat/message             # Send WhatsApp message
POST   /api/webhooks/whatsapp        # WhatsApp webhook
```

### System Management
```http
GET    /health                       # System health check
GET    /api/admin/automation/status  # Automation status
POST   /api/admin/setup-database     # Setup database
```

## 🤖 Automation Features

### Booking Reminders
- **24 hours before**: Pickup reminder with location details
- **2 hours before**: Final reminder with verification code
- **30 minutes before**: Urgent pickup notification

### Return Reminders
- **24 hours before**: Return preparation checklist
- **4 hours before**: Return location and time
- **1 hour before**: Final return reminder

### Payment Management
- **30 minutes**: First payment reminder
- **2 hours**: Second payment reminder
- **6 hours**: Third payment reminder
- **48 hours**: Automatic booking cancellation

### Customer Engagement
- **Post-rental**: Feedback request and rating
- **Loyalty updates**: Tier upgrades and benefits
- **Maintenance alerts**: Admin notifications
- **System reports**: Daily and weekly summaries

## 📊 Analytics & Reporting

### Business Metrics
- Fleet utilization rates
- Revenue per vehicle per day
- Customer acquisition and retention
- Booking conversion rates
- Average booking value

### Operational Metrics
- System uptime and performance
- Payment success rates
- Customer satisfaction scores
- Response times and SLAs

### Financial Reports
- Daily/weekly/monthly revenue
- Payment method performance
- Refund and chargeback tracking
- Profit margin analysis

## 🔐 Security Features

### Data Protection
- AES-256 encryption for sensitive data
- TLS 1.3 for data in transit
- GDPR compliance measures
- PCI DSS payment security

### Access Control
- Role-based permissions
- API rate limiting
- Webhook signature verification
- Admin token authentication

### Monitoring
- Real-time error tracking
- Security event logging
- Performance monitoring
- Automated health checks

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### API Testing
```bash
npm run test:api
```

### WhatsApp Testing
```bash
npm run test:whatsapp
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build and start
npm run start:prod

# With PM2
pm2 start ecosystem.config.js
```

### Docker
```bash
# Build image
docker build -t car-rental-system .

# Run container
docker run -p 3000:3000 car-rental-system
```

### Environment Setup
1. **Database**: PostgreSQL with connection pooling
2. **Cache**: Redis for session and queue management
3. **Storage**: File system or cloud storage for uploads
4. **Monitoring**: Application performance monitoring
5. **Logging**: Centralized logging system

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Database read replicas
- Redis clustering
- Microservices architecture

### Performance Optimization
- Database query optimization
- Caching strategies
- CDN for static assets
- Background job processing

### Monitoring & Alerting
- Application metrics
- Infrastructure monitoring
- Error tracking
- Performance alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Development Guidelines
- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Use conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](API_DOCUMENTATION.md)
- [System Design](CAR_RENTAL_SYSTEM_DESIGN.md)
- [Workflow Specification](CAR_RENTAL_FLOW_SPECIFICATION.md)
- [Ghala Integration](GHALA_INTEGRATION.md)

### Getting Help
- 📧 Email: support@carrentalpro.com
- 💬 WhatsApp: +254700123456
- 🐛 Issues: GitHub Issues
- 📖 Wiki: Project Wiki

### Community
- 💬 Discord: [Join our community]
- 🐦 Twitter: [@CarRentalPro]
- 📺 YouTube: [CarRental Pro Channel]

---

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core booking system
- ✅ WhatsApp integration
- ✅ Payment processing
- ✅ Admin dashboard
- ✅ Workflow automation

### Phase 2 (Next)
- 🔄 Mobile app development
- 🔄 Advanced analytics
- 🔄 Multi-language support
- 🔄 IoT vehicle integration
- 🔄 AI-powered recommendations

### Phase 3 (Future)
- 🔮 Blockchain verification
- 🔮 Autonomous vehicle support
- 🔮 Marketplace integration
- 🔮 Global expansion features
- 🔮 Carbon footprint tracking

---

**🚗 CarRental Pro** - Revolutionizing car rental management with intelligent automation and seamless customer experience.

*Built with ❤️ using Node.js, PostgreSQL, Redis, and Ghala API*