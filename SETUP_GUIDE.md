# WhatsApp Micro-Sales Assistant - Complete Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=3000
NODE_ENV=development

# Get these from Ghala Dashboard (https://dashboard.ghala.io)
GHALA_API_KEY=your_ghala_api_key_here
GHALA_API_URL=https://api.ghala.io/v1
GHALA_WEBHOOK_SECRET=your_webhook_secret_here

# Your WhatsApp Business Number
WHATSAPP_BUSINESS_NUMBER=+254700000000

# Your public URL (for webhooks)
APP_URL=https://your-domain.com

# Admin Dashboard Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123

# WhatsApp Webhook Verification
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
```

### Step 3: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3000`

---

## 🔧 Ghala API Setup

### 1. Create Ghala Account
- Visit [https://ghala.io](https://ghala.io)
- Sign up for an account
- Complete KYC verification

### 2. Get API Credentials
- Go to Dashboard → Settings → API Keys
- Generate a new API key
- Copy the API key to your `.env` file

### 3. Configure Webhooks

In Ghala Dashboard:
- Go to Settings → Webhooks
- Add webhook URL: `https://your-domain.com/api/webhooks/ghala`
- Generate webhook secret and add to `.env`
- Subscribe to these events:
  - ✅ `order.created`
  - ✅ `payment.success`
  - ✅ `payment.failed`

### 4. Configure WhatsApp Messages Webhook

For incoming WhatsApp messages:
- Add webhook URL: `https://your-domain.com/api/messages/incoming`
- Set verify token in `.env` as `WHATSAPP_VERIFY_TOKEN`

---

## 🌐 Deploy to Production

### Option 1: Deploy to Heroku

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Set environment variables
heroku config:set GHALA_API_KEY=your_key
heroku config:set GHALA_WEBHOOK_SECRET=your_secret
heroku config:set WHATSAPP_BUSINESS_NUMBER=+254700000000
heroku config:set APP_URL=https://your-app-name.herokuapp.com

# Deploy
git push heroku main

# Open app
heroku open
```

### Option 2: Deploy to Railway

1. Visit [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables in Railway dashboard
5. Deploy!

### Option 3: Deploy to VPS (DigitalOcean, AWS, etc.)

```bash
# SSH into your server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/your-repo.git
cd your-repo

# Install dependencies
npm install

# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start src/server.js --name whatsapp-sales

# Setup PM2 to start on boot
pm2 startup
pm2 save

# Setup Nginx reverse proxy (optional)
# Configure SSL with Let's Encrypt
```

---

## 📱 Testing the Flow

### 1. Test Webhook Connection

```bash
curl http://localhost:3000/api/webhooks/health
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook endpoint is healthy",
  "timestamp": "2026-01-16T..."
}
```

### 2. Test Order Creation

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254700000000",
    "productId": "prod_001",
    "quantity": 2,
    "deliveryAddress": "123 Main St, Nairobi",
    "customerName": "John Doe"
  }'
```

### 3. Test WhatsApp Flow

Send a message to your WhatsApp Business number:
1. Send "Hi" → Receive greeting with buttons
2. Click "View Products" → See product catalog
3. Select a product → Enter quantity
4. Provide delivery address → Choose payment method
5. Complete payment → Receive receipt

---

## 🎨 Customize Products

Edit `src/config/products.js`:

```javascript
{
  id: 'prod_006',
  name: 'Your Product Name',
  price: 1000,
  currency: 'KES',
  description: 'Product description',
  emoji: '🎁'
}
```

---

## 📊 Admin Dashboard

Access the admin dashboard at: `http://localhost:3000/admin`

Default credentials:
- Username: `admin`
- Password: `changeme123`

**⚠️ IMPORTANT:** Change these credentials in production!

Dashboard features:
- 📈 Real-time statistics
- 📋 Recent orders list
- 👥 Customer management
- 💰 Revenue tracking

---

## 🔍 Monitoring & Logs

### View Logs

```bash
# Development
npm run dev

# Production (with PM2)
pm2 logs whatsapp-sales

# View specific lines
pm2 logs whatsapp-sales --lines 100
```

### Monitor Performance

```bash
# PM2 monitoring
pm2 monit

# Check status
pm2 status
```

---

## 🐛 Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL is publicly accessible:**
   ```bash
   curl https://your-domain.com/api/webhooks/health
   ```

2. **Verify webhook signature:**
   - Ensure `GHALA_WEBHOOK_SECRET` matches Ghala dashboard
   - Check server logs for signature verification errors

3. **Test webhook manually:**
   ```bash
   curl -X POST https://your-domain.com/api/webhooks/ghala \
     -H "Content-Type: application/json" \
     -H "x-ghala-signature: test_signature" \
     -d '{"event":"payment.success","data":{"order_id":"test"}}'
   ```

### WhatsApp Messages Not Sending

1. **Verify Ghala API key:**
   ```bash
   curl https://api.ghala.io/v1/account \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

2. **Check API credits:**
   - Login to Ghala dashboard
   - Verify you have sufficient credits

3. **Review error logs:**
   ```bash
   pm2 logs whatsapp-sales --err
   ```

### Database Issues

1. **Check database file exists:**
   ```bash
   ls -la data/sales_assistant.db
   ```

2. **Reset database (⚠️ deletes all data):**
   ```bash
   rm data/sales_assistant.db
   npm start  # Will recreate database
   ```

### Payment Not Processing

1. **Verify order exists:**
   ```bash
   curl http://localhost:3000/api/orders/ORDER_ID
   ```

2. **Check Ghala order status:**
   - Login to Ghala dashboard
   - View order details

3. **Test payment manually:**
   ```bash
   curl -X POST http://localhost:3000/api/orders/ORDER_ID/payment \
     -H "Content-Type: application/json" \
     -d '{
       "paymentMethod": "mpesa",
       "phoneNumber": "+254700000000"
     }'
   ```

---

## 🔐 Security Best Practices

### 1. Environment Variables
- Never commit `.env` file to Git
- Use different credentials for dev/staging/production
- Rotate API keys regularly

### 2. Webhook Security
- Always verify webhook signatures
- Use HTTPS in production
- Implement rate limiting

### 3. Admin Dashboard
- Change default admin credentials
- Use strong passwords
- Implement proper authentication (JWT, OAuth)
- Add IP whitelisting for admin routes

### 4. Database
- Regular backups
- Encrypt sensitive data
- Use prepared statements (already implemented)

---

## 📈 Scaling Tips

### 1. Database
- Migrate to PostgreSQL or MySQL for production
- Add database indexes for better performance
- Implement connection pooling

### 2. Caching
- Use Redis for user session state
- Cache product catalog
- Implement rate limiting with Redis

### 3. Queue System
- Use Bull or RabbitMQ for webhook processing
- Implement retry logic for failed messages
- Process payments asynchronously

### 4. Monitoring
- Add application monitoring (New Relic, DataDog)
- Set up error tracking (Sentry)
- Implement health checks
- Monitor API rate limits

---

## 🎯 Next Steps

### Immediate Improvements
- [ ] Add customer name collection
- [ ] Implement order cancellation
- [ ] Add product images
- [ ] Create order tracking
- [ ] Add multiple payment methods

### Advanced Features
- [ ] Inventory management
- [ ] Discount codes
- [ ] Loyalty program
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Automated follow-ups
- [ ] Customer reviews

### Production Readiness
- [ ] Add comprehensive error handling
- [ ] Implement request validation
- [ ] Add API rate limiting
- [ ] Set up monitoring and alerts
- [ ] Create backup strategy
- [ ] Write unit tests
- [ ] Add API documentation (Swagger)

---

## 📞 Support

### Ghala API Documentation
- [https://docs.ghala.io](https://docs.ghala.io)

### WhatsApp Business API
- [https://developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)

### Issues & Questions
- Create an issue on GitHub
- Check existing documentation
- Review server logs

---

## 📄 License

MIT License - Feel free to use this for your hackathon or commercial projects!

---

**Built with ❤️ for hackathons and rapid prototyping**
