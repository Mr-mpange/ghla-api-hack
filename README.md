# WhatsApp Micro-Sales Assistant

A fully functional Node.js backend for a WhatsApp-based sales assistant using Ghala API and webhooks.

## Features

- 🛍️ Interactive product catalog in WhatsApp
- 💳 In-chat payment (M-Pesa, Airtel Money & Card) via Ghala API
- 📱 Automated receipts and confirmations
- 🔔 Webhook handling for payment events
- 📊 Simple admin dashboard
- 💾 SQLite database for orders and customers

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required configuration:
- `GHALA_API_KEY`: Your Ghala API key
- `GHALA_WEBHOOK_SECRET`: Secret key for webhook verification
- `WHATSAPP_BUSINESS_NUMBER`: Your WhatsApp Business number

### 3. Run the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3000`

### 4. Configure Webhook

Set your Ghala webhook URL to:
```
https://your-domain.com/api/webhooks/ghala
```

Events to subscribe:
- `order.created`
- `payment.success`
- `payment.failed`

### 5. Test the Flow

1. Send a message to your WhatsApp Business number
2. Receive greeting with interactive buttons
3. Browse products and select items
4. Enter quantity and delivery address
5. Choose payment method (M-Pesa or Card)
6. Receive instant payment confirmation and receipt

## Project Structure

```
├── src/
│   ├── server.js              # Express server setup
│   ├── config/
│   │   └── database.js        # SQLite database configuration
│   ├── controllers/
│   │   ├── webhookController.js    # Webhook event handlers
│   │   └── orderController.js      # Order management
│   ├── services/
│   │   ├── ghalaService.js         # Ghala API integration
│   │   ├── whatsappService.js      # WhatsApp messaging
│   │   └── paymentService.js       # Payment processing
│   ├── models/
│   │   ├── orderModel.js           # Order database operations
│   │   └── customerModel.js        # Customer database operations
│   ├── utils/
│   │   ├── webhookVerifier.js      # Webhook signature verification
│   │   └── logger.js               # Logging utility
│   └── routes/
│       ├── webhookRoutes.js        # Webhook endpoints
│       ├── orderRoutes.js          # Order endpoints
│       └── adminRoutes.js          # Admin dashboard endpoints
├── public/
│   └── admin/
│       └── index.html              # Admin dashboard
├── data/                           # SQLite database files
├── package.json
├── .env.example
└── README.md
```

## API Endpoints

### Webhooks
- `POST /api/webhooks/ghala` - Receive Ghala webhook events

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders` - List all orders

### Admin
- `GET /admin` - Admin dashboard
- `GET /api/admin/stats` - Get sales statistics

## Webhook Events

### order.created
Triggered when a new order is created. Sends order confirmation to customer.

### payment.success
Triggered when payment is successful. Sends receipt and thank you message.

### payment.failed
Triggered when payment fails. Sends retry instructions to customer.

## Product Catalog

Edit products in `src/config/products.js`:

```javascript
{
  id: 'prod_001',
  name: 'Product Name',
  price: 1000,
  currency: 'KES',
  description: 'Product description'
}
```

## Troubleshooting

### Webhook not receiving events
- Verify webhook URL is publicly accessible
- Check webhook secret matches Ghala dashboard
- Review server logs for errors

### WhatsApp messages not sending
- Verify Ghala API key is valid
- Check WhatsApp Business number is correct
- Ensure sufficient API credits

### Database errors
- Ensure `data/` directory exists
- Check file permissions
- Verify SQLite3 is installed

## Support

For issues or questions, refer to:
- [Ghala API Documentation](https://docs.ghala.io)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

## License

MIT
