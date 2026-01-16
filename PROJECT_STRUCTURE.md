# 📁 Project Structure

Complete overview of the WhatsApp Micro-Sales Assistant codebase.

```
whatsapp-micro-sales-assistant/
│
├── 📄 README.md                    # Main project documentation
├── 📄 QUICKSTART.md                # 5-minute setup guide
├── 📄 SETUP_GUIDE.md               # Comprehensive setup instructions
├── 📄 PROJECT_STRUCTURE.md         # This file
│
├── 📄 package.json                 # Node.js dependencies
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore rules
│
├── 🧪 test-api.sh                  # API test script (Linux/Mac)
├── 🧪 test-api.ps1                 # API test script (Windows)
│
├── 📂 src/                         # Source code
│   │
│   ├── 📄 server.js                # Express server entry point
│   │
│   ├── 📂 config/                  # Configuration files
│   │   ├── database.js             # SQLite database setup & schema
│   │   └── products.js             # Product catalog & promotions
│   │
│   ├── 📂 controllers/             # Business logic controllers
│   │   ├── webhookController.js   # Ghala webhook event handlers
│   │   ├── orderController.js     # Order management logic
│   │   └── messageController.js   # WhatsApp message handling
│   │
│   ├── 📂 services/                # External service integrations
│   │   ├── ghalaService.js        # Ghala API client
│   │   ├── whatsappService.js     # WhatsApp messaging functions
│   │   └── paymentService.js      # Payment processing logic
│   │
│   ├── 📂 models/                  # Database models
│   │   ├── orderModel.js          # Order CRUD operations
│   │   └── customerModel.js       # Customer CRUD operations
│   │
│   ├── 📂 routes/                  # API route definitions
│   │   ├── webhookRoutes.js       # Webhook endpoints
│   │   ├── orderRoutes.js         # Order endpoints
│   │   ├── adminRoutes.js         # Admin dashboard endpoints
│   │   └── messageRoutes.js       # Message handling endpoints
│   │
│   └── 📂 utils/                   # Utility functions
│       ├── logger.js              # Logging utility
│       └── webhookVerifier.js     # Webhook signature verification
│
├── 📂 public/                      # Static files
│   └── 📂 admin/                   # Admin dashboard
│       └── index.html             # Dashboard UI
│
└── 📂 data/                        # Database files (auto-created)
    └── sales_assistant.db         # SQLite database
```

---

## 📋 File Descriptions

### Root Files

#### `README.md`
Main project documentation with features, quick start, and project structure overview.

#### `QUICKSTART.md`
5-minute setup guide for getting started quickly.

#### `SETUP_GUIDE.md`
Comprehensive guide covering:
- Detailed setup instructions
- Ghala API configuration
- Deployment options
- Testing procedures
- Troubleshooting
- Security best practices

#### `package.json`
Node.js project configuration with dependencies:
- `express` - Web framework
- `axios` - HTTP client for Ghala API
- `sqlite3` - Database
- `dotenv` - Environment variables
- `body-parser` - Request parsing
- `cors` - CORS middleware

#### `.env.example`
Template for environment variables. Copy to `.env` and fill in your credentials.

---

### Source Code (`src/`)

#### `server.js`
Main Express server setup:
- Middleware configuration
- Route mounting
- Error handling
- Server initialization

**Key Features:**
- Health check endpoint
- Static file serving for admin dashboard
- Graceful shutdown handling

---

### Configuration (`src/config/`)

#### `database.js`
SQLite database configuration:
- Database connection setup
- Schema initialization
- Tables: `customers`, `orders`, `payments`

**Database Schema:**
```sql
customers (id, phone_number, name, created_at, updated_at)
orders (id, customer_id, product_id, quantity, total_amount, status, ...)
payments (id, order_id, amount, payment_method, status, ...)
```

#### `products.js`
Product catalog and promotions:
- Product definitions (id, name, price, description)
- Current promotions
- Easy to customize

---

### Controllers (`src/controllers/`)

#### `webhookController.js`
Handles Ghala webhook events:
- `order.created` - Order creation notification
- `payment.success` - Successful payment processing
- `payment.failed` - Failed payment handling

#### `orderController.js`
Order management endpoints:
- `createOrder()` - Create new order
- `getOrder()` - Get order by ID
- `getAllOrders()` - List all orders
- `processPayment()` - Initiate payment

#### `messageController.js`
WhatsApp message handling:
- Conversation state management
- Interactive button responses
- Text message processing
- Order flow orchestration

**Conversation Flow:**
1. Greeting → Menu buttons
2. Product selection → Quantity input
3. Address collection → Payment options
4. Payment processing → Receipt

---

### Services (`src/services/`)

#### `ghalaService.js`
Ghala API integration:
- `createPaymentOrder()` - Create payment in Ghala
- `getPaymentStatus()` - Check payment status
- `sendWhatsAppMessage()` - Send text messages
- `sendInteractiveButtons()` - Send button menus
- `sendInteractiveList()` - Send list menus

#### `whatsappService.js`
WhatsApp messaging functions:
- `sendGreeting()` - Welcome message
- `sendProductCatalog()` - Product list
- `sendPromotions()` - Promotion messages
- `sendPaymentOptions()` - Payment method selection
- `sendPaymentReceipt()` - Order receipt
- `sendPaymentFailure()` - Failure notification

#### `paymentService.js`
Payment processing logic:
- `initiatePayment()` - Start payment process
- `handlePaymentSuccess()` - Process successful payment
- `handlePaymentFailure()` - Handle failed payment
- Database payment record management

---

### Models (`src/models/`)

#### `orderModel.js`
Order database operations:
- `createOrder()` - Insert new order
- `getOrderById()` - Fetch order details
- `updateOrderStatus()` - Update order state
- `getAllOrders()` - List orders with pagination
- `getOrdersByCustomer()` - Customer order history

#### `customerModel.js`
Customer database operations:
- `findOrCreateCustomer()` - Get or create customer
- `getCustomerById()` - Fetch customer details
- `updateCustomer()` - Update customer info

---

### Routes (`src/routes/`)

#### `webhookRoutes.js`
Webhook endpoints:
- `POST /api/webhooks/ghala` - Receive Ghala events
- `GET /api/webhooks/health` - Health check

**Security:** Verifies webhook signatures

#### `orderRoutes.js`
Order management endpoints:
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order
- `POST /api/orders/:id/payment` - Process payment

#### `adminRoutes.js`
Admin dashboard endpoints:
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/orders/recent` - Recent orders
- `GET /api/admin/customers` - Customer list

**Security:** Basic authentication required

#### `messageRoutes.js`
Message handling endpoints:
- `POST /api/messages/incoming` - Receive WhatsApp messages
- `GET /api/messages/incoming` - Webhook verification

---

### Utilities (`src/utils/`)

#### `logger.js`
Simple logging utility:
- `logger.info()` - Info messages
- `logger.error()` - Error messages
- `logger.warn()` - Warning messages
- `logger.debug()` - Debug messages (dev only)

#### `webhookVerifier.js`
Webhook security:
- `verifyWebhookSignature()` - HMAC SHA256 verification
- Protects against unauthorized webhook calls

---

### Public Files (`public/`)

#### `admin/index.html`
Admin dashboard UI:
- Real-time statistics display
- Recent orders table
- Customer list
- Auto-refresh every 30 seconds
- Responsive design

**Features:**
- 📊 Revenue tracking
- 📋 Order management
- 👥 Customer insights
- 🔄 Auto-refresh

---

## 🔄 Data Flow

### Order Creation Flow

```
1. Customer sends WhatsApp message
   ↓
2. messageController handles message
   ↓
3. whatsappService sends product catalog
   ↓
4. Customer selects product & quantity
   ↓
5. orderController creates order
   ↓
6. orderModel saves to database
   ↓
7. whatsappService sends payment options
   ↓
8. Customer selects payment method
   ↓
9. paymentService initiates payment via Ghala
   ↓
10. Ghala processes payment
   ↓
11. Webhook receives payment.success event
   ↓
12. webhookController handles event
   ↓
13. paymentService updates order status
   ↓
14. whatsappService sends receipt
```

### Webhook Event Flow

```
1. Ghala sends webhook event
   ↓
2. webhookRoutes receives POST request
   ↓
3. webhookVerifier validates signature
   ↓
4. webhookController routes event
   ↓
5. paymentService processes event
   ↓
6. Database updated
   ↓
7. WhatsApp notification sent
   ↓
8. Response sent to Ghala
```

---

## 🗄️ Database Schema

### Customers Table
```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Orders Table
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_amount REAL NOT NULL,
  currency TEXT DEFAULT 'KES',
  delivery_address TEXT,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  ghala_order_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
)
```

### Payments Table
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  ghala_payment_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'KES',
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_ref TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
)
```

---

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/` | API information |

### Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/ghala` | Receive Ghala events |
| GET | `/api/webhooks/health` | Webhook health check |
| POST | `/api/messages/incoming` | Receive WhatsApp messages |
| GET | `/api/messages/incoming` | Webhook verification |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create new order |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/:id` | Get order details |
| POST | `/api/orders/:id/payment` | Process payment |

### Admin Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/orders/recent` | Recent orders |
| GET | `/api/admin/customers` | Customer list |
| GET | `/admin` | Admin dashboard UI |

---

## 🔐 Security Features

1. **Webhook Signature Verification**
   - HMAC SHA256 validation
   - Prevents unauthorized webhook calls

2. **Basic Authentication**
   - Admin endpoints protected
   - Configurable credentials

3. **SQL Injection Prevention**
   - Parameterized queries
   - No raw SQL concatenation

4. **Environment Variables**
   - Sensitive data in `.env`
   - Not committed to Git

---

## 🚀 Deployment Checklist

- [ ] Set production environment variables
- [ ] Change admin credentials
- [ ] Configure webhook URLs in Ghala
- [ ] Set up HTTPS/SSL
- [ ] Configure database backups
- [ ] Set up monitoring
- [ ] Test webhook endpoints
- [ ] Test payment flow
- [ ] Review security settings

---

## 📚 Additional Resources

- **Ghala API Docs**: https://docs.ghala.io
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Express.js Docs**: https://expressjs.com
- **SQLite Docs**: https://www.sqlite.org/docs.html

---

**Last Updated**: January 16, 2026
