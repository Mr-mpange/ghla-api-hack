# Snippe Payment Integration Guide

## Overview

This car rental system now integrates with **Snippe Payment API** for seamless mobile money and card payments after booking completion.

## Features

✅ **Mobile Money Payments** - M-Pesa, Airtel Money, Halotel, Mixx by Yas  
✅ **Card Payments** - Visa, Mastercard, local debit cards  
✅ **Real-time Payment Status** - Automatic webhook notifications  
✅ **Payment Verification** - Check payment status before confirming booking  
✅ **Secure Transactions** - Webhook signature verification  
✅ **Automatic Confirmation** - Customer receives WhatsApp confirmation after payment  

## Setup Instructions

### 1. Get Snippe API Credentials

1. Visit [Snippe Dashboard](https://www.snippe.sh/dashboard/developer/configuration)
2. Create an account or log in
3. Navigate to Developer > Configuration
4. Copy your API Key
5. Generate a Webhook Secret

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
# Snippe Payment Configuration
SNIPPE_API_KEY=your_snippe_api_key_here
SNIPPE_API_URL=https://api.snippe.sh
SNIPPE_WEBHOOK_SECRET=your_snippe_webhook_secret_here

# Application URL (for webhooks)
APP_URL=https://your-domain.com
```

### 3. Configure Webhook in Snippe Dashboard

1. Go to Snippe Dashboard > Webhooks
2. Add webhook URL: `https://your-domain.com/webhook/snippe/payment`
3. Select events to listen to:
   - `payment.completed`
   - `payment.failed`
   - `payment.pending`
4. Save the webhook configuration

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

## Payment Flow

### 1. Customer Books a Car

```
Customer → Browse Cars → Select Car → Provide Details → Confirm Booking
```

### 2. Payment Initiation

When customer clicks "Pay Now":

1. System creates Snippe payment request
2. Customer receives USSD prompt on their phone
3. Customer enters PIN to authorize payment
4. System shows "Payment Pending" status

### 3. Payment Verification

Customer clicks "Check Payment Status":

1. System queries Snippe API for payment status
2. If completed: Booking confirmed, car reserved
3. If pending: Customer asked to complete payment
4. If failed: Customer can retry payment

### 4. Webhook Notification

When payment completes:

1. Snippe sends webhook to your server
2. Server verifies webhook signature
3. Booking status updated to "paid"
4. Customer receives WhatsApp confirmation
5. Car marked as reserved

## API Endpoints

### Health Check
```
GET /health
```

Returns service status including payment service configuration.

### WhatsApp Webhook
```
GET  /webhook/whatsapp  (verification)
POST /webhook/whatsapp  (incoming messages)
```

### Snippe Payment Webhook
```
POST /webhook/snippe/payment
```

Receives payment status updates from Snippe.

### Test Payment (Development Only)
```
POST /api/test-payment
Body: {
  "bookingId": "BK1234567890",
  "phoneNumber": "+255683859574"
}
```

### Check Payment Status
```
GET /api/payment-status/:paymentId
```

## Code Structure

```
src/
├── services/
│   ├── snippePaymentService.js      # Snippe API integration
│   ├── carRentalBotService.js       # Updated with payment flow
│   └── whatsappResponseService.js   # WhatsApp messaging
├── server.js                         # Express server with webhooks
└── utils/
    └── logger.js                     # Logging utility
```

## Key Functions

### snippePaymentService.js

- `createPayment(paymentData)` - Initiate mobile money payment
- `checkPaymentStatus(paymentId)` - Verify payment status
- `verifyWebhookSignature(signature, payload)` - Secure webhook verification
- `processWebhook(webhookData)` - Handle payment notifications

### carRentalBotService.js

- `initiateSnippePayment(booking, phoneNumber)` - Start payment process
- `handlePaymentWebhook(webhookData)` - Process payment updates
- `generateSnippePaymentInstructions()` - Customer payment instructions
- `generatePaymentPending()` - Pending payment message
- `generatePaymentSuccess()` - Confirmation message

## Testing

### 1. Test Payment Flow

```bash
# Start server
npm run dev

# In another terminal, test payment
curl -X POST http://localhost:3000/api/test-payment \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BK1234567890",
    "phoneNumber": "+255683859574"
  }'
```

### 2. Test Webhook

Use Snippe's test mode to simulate payment events:

1. Create test payment in Snippe dashboard
2. Trigger test webhook
3. Check server logs for webhook processing

### 3. Test via WhatsApp

1. Send message to your WhatsApp Business number
2. Browse cars and create booking
3. Click "Pay Now" button
4. Complete payment on your phone
5. Click "Check Payment Status"
6. Verify confirmation message

## Supported Payment Methods

### Mobile Money
- **M-Pesa** (Vodacom Tanzania)
- **Airtel Money**
- **Halotel**
- **Mixx by Yas**

### Cards
- **Visa**
- **Mastercard**
- **Local debit cards**

### Dynamic QR
- In-store payments
- POS systems

## Security Features

1. **API Key Authentication** - All requests authenticated with Bearer token
2. **Webhook Signature Verification** - HMAC SHA256 signature validation
3. **Idempotency Keys** - Prevent duplicate transactions
4. **HTTPS Only** - Secure communication
5. **Rate Limiting** - 60 requests per minute

## Error Handling

### Payment Errors

```javascript
{
  "success": false,
  "error": "Insufficient balance",
  "errorCode": "insufficient_funds"
}
```

### Common Error Codes

- `insufficient_funds` - Customer has insufficient balance
- `invalid_phone_number` - Phone number format invalid
- `payment_timeout` - Payment request expired
- `payment_cancelled` - Customer cancelled payment
- `network_error` - Network connectivity issue

## Monitoring

### Check Service Status

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-25T10:30:00.000Z",
  "services": {
    "whatsapp": {
      "enabled": true,
      "configured": true
    },
    "payment": {
      "enabled": true,
      "configured": true,
      "features": [
        "Mobile money payments",
        "Card payments",
        "Payment sessions",
        "Webhook notifications"
      ]
    }
  }
}
```

### Logs

Check logs for payment activities:

```bash
tail -f logs/app.log | grep -i payment
```

## Troubleshooting

### Payment Not Initiating

1. Check API key is correct in `.env`
2. Verify phone number format (+255...)
3. Check Snippe API status
4. Review server logs for errors

### Webhook Not Receiving

1. Verify webhook URL is publicly accessible
2. Check webhook secret matches
3. Test webhook signature verification
4. Review Snippe dashboard webhook logs

### Payment Status Not Updating

1. Check webhook is configured correctly
2. Verify signature verification is working
3. Check booking ID matches
4. Review server logs for webhook processing

## Production Checklist

- [ ] Configure production Snippe API key
- [ ] Set up production webhook URL
- [ ] Enable HTTPS for all endpoints
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Test all payment methods
- [ ] Verify webhook signature validation
- [ ] Set up error logging
- [ ] Configure backup payment method
- [ ] Test failure scenarios

## Support

### Snippe Support
- **Documentation**: https://docs.snippe.sh
- **Dashboard**: https://www.snippe.sh/dashboard
- **Email**: support@snippe.sh

### CarRental Pro Support
- **Phone**: +255683859574
- **Email**: support@carrentalpro.com

## License

This integration is part of the CarRental Pro system.

---

**Last Updated**: January 2024  
**Version**: 1.0.0
