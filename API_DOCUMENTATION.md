# 📡 API Documentation

Complete API reference for the WhatsApp Micro-Sales Assistant.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

---

## 🔓 Public Endpoints

### Health Check

Check if the server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp Micro-Sales Assistant is running",
  "timestamp": "2026-01-16T10:30:00.000Z",
  "version": "1.0.0"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

---

### API Information

Get API information and available endpoints.

**Endpoint:** `GET /`

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp Micro-Sales Assistant API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "webhooks": "/api/webhooks/ghala",
    "messages": "/api/messages/incoming",
    "orders": "/api/orders",
    "admin": "/api/admin/stats",
    "dashboard": "/admin"
  }
}
```

---

## 📦 Order Endpoints

### Create Order

Create a new order for a customer.

**Endpoint:** `POST /api/orders`

**Request Body:**
```json
{
  "phoneNumber": "+254700123456",
  "productId": "prod_001",
  "quantity": 2,
  "deliveryAddress": "123 Main Street, Nairobi",
  "customerName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "ORD-1705401234567-abc123",
    "customerId": 1,
    "productId": "prod_001",
    "productName": "Premium Coffee Beans 1kg",
    "quantity": 2,
    "unitPrice": 1500,
    "totalAmount": 3000,
    "currency": "KES",
    "deliveryAddress": "123 Main Street, Nairobi"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254700123456",
    "productId": "prod_001",
    "quantity": 2,
    "deliveryAddress": "123 Main Street, Nairobi",
    "customerName": "John Doe"
  }'
```

---

### Get Order

Retrieve order details by ID.

**Endpoint:** `GET /api/orders/:orderId`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ORD-1705401234567-abc123",
    "customer_id": 1,
    "product_id": "prod_001",
    "product_name": "Premium Coffee Beans 1kg",
    "quantity": 2,
    "unit_price": 1500,
    "total_amount": 3000,
    "currency": "KES",
    "delivery_address": "123 Main Street, Nairobi",
    "status": "pending",
    "payment_method": null,
    "payment_status": "pending",
    "phone_number": "+254700123456",
    "customer_name": "John Doe",
    "created_at": "2026-01-16 10:30:00",
    "updated_at": "2026-01-16 10:30:00"
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/orders/ORD-1705401234567-abc123
```

---

### List Orders

Get all orders with pagination.

**Endpoint:** `GET /api/orders`

**Query Parameters:**
- `limit` (optional): Number of orders to return (default: 50)
- `offset` (optional): Number of orders to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-1705401234567-abc123",
      "customer_id": 1,
      "product_name": "Premium Coffee Beans 1kg",
      "quantity": 2,
      "total_amount": 3000,
      "status": "completed",
      "payment_status": "paid",
      "phone_number": "+254700123456",
      "customer_name": "John Doe",
      "created_at": "2026-01-16 10:30:00"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/orders?limit=10&offset=0"
```

---

### Process Payment

Initiate payment for an order.

**Endpoint:** `POST /api/orders/:orderId/payment`

**Request Body:**
```json
{
  "paymentMethod": "mpesa",
  "phoneNumber": "+254700123456"
}
```

**Payment Methods:**
- `mpesa` - M-Pesa payment
- `card` - Card payment

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "id": "ghala_order_123",
    "status": "pending",
    "payment_url": "https://pay.ghala.io/..."
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/orders/ORD-123/payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "mpesa",
    "phoneNumber": "+254700123456"
  }'
```

---

## 🔔 Webhook Endpoints

### Ghala Webhook

Receive webhook events from Ghala.

**Endpoint:** `POST /api/webhooks/ghala`

**Headers:**
- `x-ghala-signature`: HMAC SHA256 signature for verification

**Request Body:**
```json
{
  "event": "payment.success",
  "data": {
    "order_id": "ghala_order_123",
    "transaction_reference": "MPESA123456",
    "amount": 3000,
    "currency": "KES",
    "status": "completed"
  }
}
```

**Events:**
- `order.created` - Order created in Ghala
- `payment.success` - Payment completed successfully
- `payment.failed` - Payment failed

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "result": {
    "success": true,
    "message": "Payment success event processed"
  }
}
```

---

### Webhook Health Check

Check webhook endpoint status.

**Endpoint:** `GET /api/webhooks/health`

**Response:**
```json
{
  "success": true,
  "message": "Webhook endpoint is healthy",
  "timestamp": "2026-01-16T10:30:00.000Z"
}
```

---

## 💬 Message Endpoints

### Incoming Messages

Receive incoming WhatsApp messages.

**Endpoint:** `POST /api/messages/incoming`

**Request Body:**
```json
{
  "messages": [
    {
      "from": "+254700123456",
      "type": "text",
      "text": {
        "body": "Hi"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Messages processed"
}
```

---

### Webhook Verification

Verify WhatsApp webhook (for initial setup).

**Endpoint:** `GET /api/messages/incoming`

**Query Parameters:**
- `hub.mode`: "subscribe"
- `hub.verify_token`: Your verification token
- `hub.challenge`: Challenge string

**Response:**
Returns the challenge string if verification is successful.

---

## 🔐 Admin Endpoints

All admin endpoints require Basic Authentication.

**Authentication:**
```
Authorization: Basic base64(username:password)
```

Default credentials:
- Username: `admin`
- Password: `changeme123`

---

### Dashboard Statistics

Get dashboard statistics.

**Endpoint:** `GET /api/admin/stats`

**Headers:**
```
Authorization: Basic YWRtaW46Y2hhbmdlbWUxMjM=
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "completedOrders": 120,
    "totalRevenue": 450000,
    "totalCustomers": 75,
    "pendingOrders": 30
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/admin/stats \
  -u admin:changeme123
```

---

### Recent Orders

Get recent orders list.

**Endpoint:** `GET /api/admin/orders/recent`

**Headers:**
```
Authorization: Basic YWRtaW46Y2hhbmdlbWUxMjM=
```

**Query Parameters:**
- `limit` (optional): Number of orders (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-123",
      "customer_name": "John Doe",
      "phone_number": "+254700123456",
      "product_name": "Premium Coffee Beans 1kg",
      "quantity": 2,
      "total_amount": 3000,
      "status": "completed",
      "payment_status": "paid",
      "created_at": "2026-01-16 10:30:00"
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:3000/api/admin/orders/recent?limit=5" \
  -u admin:changeme123
```

---

### Customer List

Get all customers with order statistics.

**Endpoint:** `GET /api/admin/customers`

**Headers:**
```
Authorization: Basic YWRtaW46Y2hhbmdlbWUxMjM=
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "phone_number": "+254700123456",
      "name": "John Doe",
      "order_count": 5,
      "total_spent": 15000,
      "created_at": "2026-01-10 08:00:00"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/api/admin/customers \
  -u admin:changeme123
```

---

## 🎨 Admin Dashboard

### Access Dashboard

**URL:** `http://localhost:3000/admin`

**Features:**
- Real-time statistics
- Recent orders table
- Customer list
- Auto-refresh every 30 seconds

**Login:**
- Username: `admin`
- Password: `changeme123`

---

## ❌ Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: phoneNumber, productId, quantity"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create order",
  "error": "Database connection error"
}
```

---

## 📝 Request Examples

### Using cURL

```bash
# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+254700123456","productId":"prod_001","quantity":2}'

# Get order
curl http://localhost:3000/api/orders/ORD-123

# Admin stats
curl http://localhost:3000/api/admin/stats -u admin:changeme123
```

### Using JavaScript (Axios)

```javascript
const axios = require('axios');

// Create order
const createOrder = async () => {
  const response = await axios.post('http://localhost:3000/api/orders', {
    phoneNumber: '+254700123456',
    productId: 'prod_001',
    quantity: 2,
    deliveryAddress: '123 Main St',
    customerName: 'John Doe'
  });
  console.log(response.data);
};

// Get order
const getOrder = async (orderId) => {
  const response = await axios.get(`http://localhost:3000/api/orders/${orderId}`);
  console.log(response.data);
};

// Admin stats with auth
const getStats = async () => {
  const response = await axios.get('http://localhost:3000/api/admin/stats', {
    auth: {
      username: 'admin',
      password: 'changeme123'
    }
  });
  console.log(response.data);
};
```

### Using Python (Requests)

```python
import requests

# Create order
response = requests.post('http://localhost:3000/api/orders', json={
    'phoneNumber': '+254700123456',
    'productId': 'prod_001',
    'quantity': 2,
    'deliveryAddress': '123 Main St',
    'customerName': 'John Doe'
})
print(response.json())

# Get order
response = requests.get('http://localhost:3000/api/orders/ORD-123')
print(response.json())

# Admin stats with auth
response = requests.get(
    'http://localhost:3000/api/admin/stats',
    auth=('admin', 'changeme123')
)
print(response.json())
```

---

## 🔄 Webhook Integration

### Setting up Ghala Webhooks

1. Login to Ghala Dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://your-domain.com/api/webhooks/ghala`
4. Generate and save webhook secret
5. Subscribe to events:
   - `order.created`
   - `payment.success`
   - `payment.failed`

### Webhook Signature Verification

Webhooks are verified using HMAC SHA256:

```javascript
const crypto = require('crypto');

const verifySignature = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
};
```

---

## 📊 Rate Limits

Currently, there are no rate limits implemented. For production:

- Recommended: 100 requests per minute per IP
- Webhook endpoints: No rate limit
- Admin endpoints: 20 requests per minute

---

## 🔒 Security Best Practices

1. **Always use HTTPS in production**
2. **Verify webhook signatures**
3. **Change default admin credentials**
4. **Use environment variables for secrets**
5. **Implement rate limiting**
6. **Add request validation**
7. **Log all API requests**
8. **Monitor for suspicious activity**

---

## 📞 Support

For API issues or questions:
- Check server logs: `pm2 logs whatsapp-sales`
- Review error responses
- Consult Ghala API documentation
- Create an issue on GitHub

---

**Last Updated**: January 16, 2026
