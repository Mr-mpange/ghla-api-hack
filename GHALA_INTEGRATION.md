# 🚀 Ghala API Integration Guide

Complete guide for integrating Ghala API for WhatsApp messaging and mobile payments.

---

## 📋 What is Ghala?

Ghala is an all-in-one API platform that provides:
- ✅ **WhatsApp Business API** - Send and receive WhatsApp messages
- ✅ **M-Pesa Payments** - STK Push and payment processing
- ✅ **Airtel Money** - Mobile money payments
- ✅ **Card Payments** - Credit/Debit card processing
- ✅ **Webhooks** - Real-time payment notifications

**One API Key = Everything You Need!**

---

## 🔑 Getting Started with Ghala

### Step 1: Create Ghala Account

1. Visit [https://ghala.io](https://ghala.io)
2. Click "Sign Up" or "Get Started"
3. Fill in your business details:
   - Business name
   - Email address
   - Phone number
   - Business type

### Step 2: Complete KYC Verification

Ghala requires KYC (Know Your Customer) verification:

**Required Documents:**
- Business registration certificate
- ID/Passport of business owner
- KRA PIN certificate
- Bank account details

**Verification Time:** Usually 1-3 business days

### Step 3: Get Your API Credentials

Once verified:

1. Login to [Ghala Dashboard](https://dashboard.ghala.io)
2. Navigate to **Settings → API Keys**
3. Click **"Generate API Key"**
4. Copy your credentials:
   - `API Key` - Your authentication key
   - `Webhook Secret` - For webhook verification

**⚠️ Important:** Keep your API key secure! Never commit it to Git.

---

## ⚙️ Configuration

### 1. Add Credentials to .env

```bash
# Copy example file
cp .env.example .env
```

Edit `.env`:

```env
# Ghala API Configuration
GHALA_API_KEY=ghl_live_abc123def456...
GHALA_API_URL=https://api.ghala.io/v1
GHALA_WEBHOOK_SECRET=whsec_xyz789...

# Your WhatsApp Business Number
WHATSAPP_BUSINESS_NUMBER=+254700123456

# Your public URL (for webhooks)
APP_URL=https://your-domain.com
```

### 2. Configure WhatsApp Business Number

In Ghala Dashboard:

1. Go to **WhatsApp → Settings**
2. Connect your WhatsApp Business Account
3. Verify your phone number
4. Set display name and profile picture

---

## 💳 Payment Methods Supported

### 1. M-Pesa (Safaricom)

**How it works:**
- Customer receives STK Push on their phone
- Enters M-Pesa PIN
- Payment processed instantly
- Webhook notification sent to your server

**Payment Flow:**
```
Your App → Ghala API → M-Pesa → Customer Phone
Customer enters PIN → M-Pesa processes → Webhook → Your App
```

**Supported:**
- ✅ STK Push (Lipa Na M-Pesa)
- ✅ Paybill payments
- ✅ Till Number payments

### 2. Airtel Money

**How it works:**
- Customer receives payment prompt
- Enters Airtel Money PIN
- Payment processed
- Webhook notification sent

**Supported:**
- ✅ Push payments
- ✅ Instant notifications

### 3. Card Payments

**How it works:**
- Customer redirected to secure payment page
- Enters card details
- 3D Secure verification
- Payment processed
- Webhook notification sent

**Supported Cards:**
- ✅ Visa
- ✅ Mastercard
- ✅ American Express

---

## 🔔 Webhook Configuration

### Step 1: Set Webhook URL

In Ghala Dashboard:

1. Go to **Settings → Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/ghala`
3. Copy the webhook secret
4. Add secret to your `.env` file

### Step 2: Subscribe to Events

Enable these webhook events:

- ✅ `order.created` - When payment order is created
- ✅ `payment.success` - When payment succeeds
- ✅ `payment.failed` - When payment fails
- ✅ `payment.pending` - When payment is pending
- ✅ `message.received` - When WhatsApp message is received

### Step 3: Test Webhooks

Ghala provides a webhook testing tool:

1. Go to **Settings → Webhooks → Test**
2. Select event type
3. Click "Send Test Event"
4. Check your server logs

---

## 📱 WhatsApp Message Types

### 1. Text Messages

```javascript
await ghalaService.sendWhatsAppMessage(
  '+254700123456',
  'Hello! Welcome to our store.'
);
```

### 2. Interactive Buttons

```javascript
await ghalaService.sendInteractiveButtons(
  '+254700123456',
  'Choose an option:',
  [
    { id: 'option1', title: 'View Products' },
    { id: 'option2', title: 'View Promotions' }
  ]
);
```

### 3. Interactive Lists

```javascript
await ghalaService.sendInteractiveList(
  '+254700123456',
  'Select a product:',
  'View Products',
  [{
    title: 'Available Products',
    rows: [
      { id: 'prod1', title: 'Coffee', description: 'KES 1500' },
      { id: 'prod2', title: 'Honey', description: 'KES 800' }
    ]
  }]
);
```

---

## 💰 Payment Processing

### Create Payment Order

```javascript
const order = await ghalaService.createPaymentOrder({
  orderId: 'ORD-123',
  amount: 3000,
  currency: 'KES',
  customerPhone: '+254700123456',
  paymentMethod: 'mpesa', // or 'airtel', 'card'
  description: 'Payment for Premium Coffee x2'
});
```

### Check Payment Status

```javascript
const status = await ghalaService.getPaymentStatus('ghala_order_id');
console.log(status.payment_status); // 'pending', 'success', 'failed'
```

---

## 🔐 Security Best Practices

### 1. Webhook Signature Verification

Our app automatically verifies webhook signatures:

```javascript
// In webhookRoutes.js
const signature = req.headers['x-ghala-signature'];
const isValid = verifyWebhookSignature(
  req.body,
  signature,
  process.env.GHALA_WEBHOOK_SECRET
);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### 2. API Key Protection

- ✅ Never commit `.env` to Git
- ✅ Use environment variables
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/production

### 3. HTTPS Required

- ✅ Webhooks require HTTPS
- ✅ Use SSL certificate (Let's Encrypt)
- ✅ No self-signed certificates

---

## 🧪 Testing

### Test Mode

Ghala provides test credentials:

```env
# Test Mode
GHALA_API_KEY=ghl_test_abc123...
GHALA_API_URL=https://api.ghala.io/v1
```

### Test Phone Numbers

Use these for testing (no real money):
- M-Pesa: `+254700000000`
- Airtel: `+254700000001`

### Test Cards

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVV: Any 3 digits
```

---

## 💵 Pricing & Fees

### WhatsApp Messages

- **Session Messages:** KES 0.50 per message
- **Template Messages:** KES 1.00 per message
- **Free tier:** First 1,000 messages/month

### Payment Processing

**M-Pesa:**
- Transaction fee: 1.5% + KES 10
- Minimum: KES 10
- Maximum: KES 150,000 per transaction

**Airtel Money:**
- Transaction fee: 1.5% + KES 10
- Minimum: KES 10
- Maximum: KES 150,000 per transaction

**Card Payments:**
- Transaction fee: 3.5% + KES 20
- International cards: 4.5% + KES 30

**Settlement:**
- Daily settlements to your bank account
- T+1 settlement (next business day)

---

## 📊 Monitoring & Analytics

### Ghala Dashboard

Access real-time analytics:

1. **Transactions:** View all payments
2. **Messages:** WhatsApp message logs
3. **Analytics:** Revenue, success rates
4. **Customers:** Customer database
5. **Reports:** Export CSV/PDF reports

### API Logs

Monitor API calls:
- Request/response logs
- Error tracking
- Performance metrics
- Webhook delivery status

---

## 🚨 Common Issues & Solutions

### Issue 1: Webhook Not Receiving Events

**Problem:** Webhooks not being delivered

**Solutions:**
1. Verify webhook URL is publicly accessible
2. Check HTTPS is configured
3. Verify webhook secret matches
4. Check firewall settings
5. Review Ghala webhook logs

### Issue 2: M-Pesa STK Push Not Appearing

**Problem:** Customer not receiving payment prompt

**Solutions:**
1. Verify phone number format (+254...)
2. Check customer has M-Pesa registered
3. Verify sufficient balance
4. Check M-Pesa service status
5. Try different phone number

### Issue 3: WhatsApp Messages Not Sending

**Problem:** Messages not delivered

**Solutions:**
1. Verify WhatsApp Business number is active
2. Check API key is valid
3. Verify customer number is on WhatsApp
4. Check message format is correct
5. Review API credits balance

### Issue 4: Payment Failing

**Problem:** Payments consistently failing

**Solutions:**
1. Check payment method is enabled
2. Verify amount is within limits
3. Check customer has sufficient balance
4. Review error messages in webhook
5. Contact Ghala support

---

## 📞 Support

### Ghala Support Channels

**Email:** support@ghala.io
**Phone:** +254 700 000 000
**WhatsApp:** +254 700 000 001
**Dashboard:** Live chat in dashboard

**Support Hours:**
- Monday - Friday: 8:00 AM - 6:00 PM EAT
- Saturday: 9:00 AM - 1:00 PM EAT
- Sunday: Closed

### Documentation

- **API Docs:** [https://docs.ghala.io](https://docs.ghala.io)
- **Postman Collection:** Available in dashboard
- **Code Examples:** GitHub repository
- **Video Tutorials:** YouTube channel

---

## 🎯 Quick Reference

### API Endpoints

```
Base URL: https://api.ghala.io/v1

POST   /orders                    # Create payment order
GET    /orders/:id                # Get order status
POST   /whatsapp/messages         # Send WhatsApp message
GET    /whatsapp/messages/:id     # Get message status
POST   /payments/verify           # Verify payment
```

### Webhook Events

```
order.created       # Payment order created
payment.success     # Payment successful
payment.failed      # Payment failed
payment.pending     # Payment pending
message.received    # WhatsApp message received
message.delivered   # Message delivered
message.read        # Message read
```

### Payment Methods

```
mpesa    # M-Pesa (Safaricom)
airtel   # Airtel Money
card     # Credit/Debit Card
```

---

## ✅ Integration Checklist

Before going live:

- [ ] Ghala account created and verified
- [ ] API key generated and added to `.env`
- [ ] WhatsApp Business number connected
- [ ] Webhook URL configured
- [ ] Webhook secret added to `.env`
- [ ] Test payments completed successfully
- [ ] Test WhatsApp messages sent
- [ ] Webhook events tested
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] HTTPS/SSL configured
- [ ] Production environment variables set
- [ ] Bank account for settlements added
- [ ] Terms and conditions accepted

---

## 🚀 Going Live

### Pre-Launch

1. **Test Everything:**
   - Create test orders
   - Process test payments
   - Send test messages
   - Verify webhooks work

2. **Switch to Production:**
   ```env
   GHALA_API_KEY=ghl_live_...  # Use live key
   NODE_ENV=production
   ```

3. **Monitor First Transactions:**
   - Watch dashboard closely
   - Check webhook delivery
   - Verify settlements

### Post-Launch

1. **Monitor Daily:**
   - Transaction success rates
   - Webhook delivery rates
   - Error logs
   - Customer feedback

2. **Optimize:**
   - Review failed payments
   - Improve error messages
   - Add retry logic
   - Enhance user experience

---

**You're now ready to use Ghala for WhatsApp messaging and mobile payments! 🎉**

For questions or issues, refer to [Ghala Documentation](https://docs.ghala.io) or contact their support team.
