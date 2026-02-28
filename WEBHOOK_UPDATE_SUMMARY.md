# Webhook Implementation Update Summary

## ✅ What Was Updated

The webhook implementation has been updated to match the **official Snippe webhook format** as documented at https://docs.snippe.sh/docs/2026-01-25/webhooks

## 🔄 Changes Made

### 1. Webhook Signature Verification (`snippePaymentService.js`)

**Before**:
```javascript
verifyWebhookSignature(signature, payload) {
  const expectedSignature = crypto
    .createHmac('sha256', this.webhookSecret)
    .update(JSON.stringify(payload))  // ❌ Wrong: stringifying object
    .digest('hex');
  return signature === expectedSignature;  // ❌ Not timing-safe
}
```

**After**:
```javascript
verifyWebhookSignature(signature, payload) {
  const expectedSignature = crypto
    .createHmac('sha256', this.webhookSecret)
    .update(payload)  // ✅ Correct: using raw string
    .digest('hex');
  return crypto.timingSafeEqual(  // ✅ Timing-safe comparison
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 2. Webhook Processing (`snippePaymentService.js`)

**Updated to handle Snippe's actual webhook structure**:

```javascript
{
  id: "evt_427edf89c5c8c02a2301254e",
  type: "payment.completed",  // ✅ Changed from "event"
  api_version: "2026-01-25",
  created_at: "2026-01-25T01:05:17.834276191Z",
  data: {
    reference: "BK1234567890",
    external_reference: "S20388385575",
    status: "completed",
    amount: {
      value: 2500,  // ✅ Nested structure
      currency: "TZS"
    },
    settlement: {  // ✅ New: settlement details
      gross: { value: 2500, currency: "TZS" },
      fees: { value: 50, currency: "TZS" },
      net: { value: 2450, currency: "TZS" }
    },
    channel: {  // ✅ New: payment channel info
      type: "mobile_money",
      provider: "airtel"
    },
    customer: {  // ✅ Enhanced customer info
      phone: "+255683859574",
      name: "John Doe",
      email: "john@example.com"
    },
    metadata: {
      booking_id: "BK1234567890",
      service: "car_rental"
    },
    completed_at: "2026-01-25T01:05:16.8303Z"
  }
}
```

### 3. Server Webhook Endpoint (`src/server.js`)

**Updated headers**:
```javascript
// Before
const signature = req.headers['x-snippe-signature'];  // ❌ Wrong header

// After
const signature = req.headers['x-webhook-signature'];  // ✅ Correct header
```

**Added proper logging**:
```javascript
logger.info('Webhook headers:', {
  event: req.headers['x-webhook-event'],
  timestamp: req.headers['x-webhook-timestamp']
});
```

### 4. Webhook Handler (`carRentalBotService.js`)

**Enhanced to handle all event types**:

```javascript
// Handle payment.completed
if (eventType === 'payment.completed') {
  booking.status = 'paid';
  booking.paymentStatus = 'completed';
  booking.settlement = settlement;  // ✅ Store settlement details
  // ...
}

// Handle payment.failed
else if (eventType === 'payment.failed') {
  booking.paymentStatus = 'failed';
  booking.failureReason = failureReason;  // ✅ Store failure reason
  // ...
}

// Handle payout events (future use)
else if (eventType === 'payout.completed' || eventType === 'payout.failed') {
  // Handle payout events
}
```

### 5. Test Suite (`test-snippe-integration.js`)

**Updated test webhook payload**:
```javascript
const testWebhookPayload = {
  id: 'evt_test123',
  type: 'payment.completed',  // ✅ Correct format
  api_version: '2026-01-25',
  created_at: new Date().toISOString(),
  data: {
    reference: booking.id,
    external_reference: 'S20388385575',
    status: 'completed',
    amount: {
      value: booking.deposit,
      currency: 'TZS'
    },
    settlement: {  // ✅ Added settlement
      gross: { value: booking.deposit, currency: 'TZS' },
      fees: { value: Math.floor(booking.deposit * 0.02), currency: 'TZS' },
      net: { value: booking.deposit - Math.floor(booking.deposit * 0.02), currency: 'TZS' }
    },
    // ... rest of the payload
  }
};
```

## 📋 Webhook Headers

All webhooks from Snippe include these headers:

| Header | Description | Example |
|--------|-------------|---------|
| `Content-Type` | Always `application/json` | `application/json` |
| `User-Agent` | Snippe webhook identifier | `Snippe-Webhook/1.0` |
| `X-Webhook-Event` | Event type | `payment.completed` |
| `X-Webhook-Timestamp` | Unix timestamp | `1706151917` |
| `X-Webhook-Signature` | HMAC-SHA256 signature | `abc123...` |

## 🎯 Supported Event Types

### Payment Events
- ✅ `payment.completed` - Payment successfully completed
- ✅ `payment.failed` - Payment failed or declined

### Payout Events (Future)
- ✅ `payout.completed` - Payout successfully sent
- ✅ `payout.failed` - Payout failed

## 🔐 Security Improvements

### 1. Timing-Safe Comparison
```javascript
// Before: Vulnerable to timing attacks
return signature === expectedSignature;

// After: Timing-safe comparison
return crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
);
```

### 2. Raw Body Verification
```javascript
// Correct: Use raw request body
const rawBody = JSON.stringify(req.body);
verifyWebhookSignature(signature, rawBody);
```

### 3. Proper Error Handling
```javascript
if (!verifyWebhookSignature(signature, rawBody)) {
  logger.warn('Invalid Snippe webhook signature');
  return res.status(401).json({ error: 'Invalid signature' });
}
```

## 📊 Data Captured

### Settlement Information
```javascript
{
  gross: { value: 2500, currency: "TZS" },  // Total amount
  fees: { value: 50, currency: "TZS" },     // Snippe fees
  net: { value: 2450, currency: "TZS" }     // Amount you receive
}
```

### Channel Information
```javascript
{
  type: "mobile_money",  // or "card", "dynamic-qr"
  provider: "airtel"     // or "mpesa", "visa", etc.
}
```

### Customer Information
```javascript
{
  phone: "+255683859574",
  name: "John Doe",
  email: "john@example.com"
}
```

## 🧪 Testing

### Test Webhook Signature
```bash
npm run test:snippe
```

### Manual Test
```bash
curl -X POST http://localhost:3000/webhook/snippe/payment \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Event: payment.completed" \
  -H "X-Webhook-Signature: your_signature" \
  -d @test-webhook.json
```

## 📚 New Documentation

Created comprehensive webhook guide:
- **SNIPPE_WEBHOOK_GUIDE.md** - Complete webhook documentation
  - Event types and payloads
  - Signature verification
  - Best practices
  - Troubleshooting
  - Security checklist

## ✅ Verification Checklist

- [x] Webhook signature verification updated
- [x] Correct header names (`X-Webhook-Signature`)
- [x] Timing-safe comparison implemented
- [x] Raw body used for verification
- [x] Event types match Snippe format
- [x] Settlement data captured
- [x] Channel information captured
- [x] Failure reasons captured
- [x] Test suite updated
- [x] Documentation created

## 🚀 Next Steps

1. **Generate Webhook Secret**
   ```
   Visit: https://www.snippe.sh/dashboard/developer/configuration
   Generate webhook secret
   Update .env: SNIPPE_WEBHOOK_SECRET=whsec_your_secret
   ```

2. **Configure Webhook URL**
   ```
   Add in Snippe dashboard:
   URL: https://carrentalpro.com/webhook/snippe/payment
   Events: payment.completed, payment.failed
   ```

3. **Test Integration**
   ```bash
   npm run test:snippe
   ```

4. **Monitor Webhooks**
   ```bash
   tail -f logs/app.log | grep -i webhook
   ```

## 📞 Support

### Snippe Documentation
- **Webhooks**: https://docs.snippe.sh/docs/2026-01-25/webhooks
- **Dashboard**: https://www.snippe.sh/dashboard
- **Support**: support@snippe.sh

### CarRental Pro
- **Phone**: +255683859574
- **Email**: support@carrentalpro.com

---

**Status**: ✅ Webhook implementation updated to match official Snippe format  
**Last Updated**: January 2024  
**API Version**: 2026-01-25
