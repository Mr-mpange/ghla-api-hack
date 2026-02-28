# Snippe Webhook Integration Guide

## Overview

Snippe sends webhooks to your specified URL when payment or payout status changes. This guide explains how to handle these webhooks in your car rental system.

## Webhook Configuration

### Endpoint URL
```
https://carrentalpro.com/webhook/snippe/payment
```

### Required Headers
All webhooks from Snippe include these headers:

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `User-Agent` | `Snippe-Webhook/1.0` |
| `X-Webhook-Event` | Event type (e.g., `payment.completed`) |
| `X-Webhook-Timestamp` | Unix timestamp when webhook was sent |
| `X-Webhook-Signature` | HMAC-SHA256 signature for verification |

## Event Types

### Payment Events

#### 1. payment.completed
Sent when a payment is successfully completed.

**Trigger**: Customer completes payment via mobile money, card, or QR code  
**Action**: Mark booking as paid, send confirmation to customer

**Example Payload**:
```json
{
  "id": "evt_427edf89c5c8c02a2301254e",
  "type": "payment.completed",
  "api_version": "2026-01-25",
  "created_at": "2026-01-25T01:05:17.834276191Z",
  "data": {
    "reference": "BK1234567890",
    "external_reference": "S20388385575",
    "status": "completed",
    "amount": {
      "value": 2500,
      "currency": "TZS"
    },
    "settlement": {
      "gross": { "value": 2500, "currency": "TZS" },
      "fees": { "value": 50, "currency": "TZS" },
      "net": { "value": 2450, "currency": "TZS" }
    },
    "channel": {
      "type": "mobile_money",
      "provider": "airtel"
    },
    "customer": {
      "phone": "+255683859574",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "metadata": {
      "booking_id": "BK1234567890",
      "service": "car_rental"
    },
    "completed_at": "2026-01-25T01:05:16.8303Z"
  }
}
```

#### 2. payment.failed
Sent when a payment fails.

**Trigger**: Payment declined, insufficient funds, or other failure  
**Action**: Notify customer, offer retry option

**Example Payload**:
```json
{
  "id": "evt_a1b2c3d4e5f6g7h8i9j0k1l2",
  "type": "payment.failed",
  "api_version": "2026-01-25",
  "created_at": "2026-01-25T01:05:17.834276191Z",
  "data": {
    "reference": "BK1234567890",
    "external_reference": "S20388385575",
    "status": "failed",
    "amount": {
      "value": 2500,
      "currency": "TZS"
    },
    "channel": {
      "type": "mobile_money",
      "provider": "airtel"
    },
    "customer": {
      "phone": "+255683859574",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "metadata": {
      "booking_id": "BK1234567890"
    },
    "failure_reason": "Insufficient funds",
    "completed_at": "2026-01-25T01:05:16.8303Z"
  }
}
```

## Webhook Signature Verification

**IMPORTANT**: Always verify webhook signatures in production to ensure requests are from Snippe.

### Verification Process

1. Get the `X-Webhook-Signature` header from the request
2. Get the raw request body as a string
3. Compute HMAC-SHA256 hash using your webhook secret
4. Compare signatures using timing-safe comparison

### Implementation (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(signature, rawBody, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage in Express
app.post('/webhook/snippe/payment', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const rawBody = JSON.stringify(req.body);
  
  if (!verifyWebhookSignature(signature, rawBody, process.env.SNIPPE_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
  res.status(200).json({ success: true });
});
```

## Webhook Processing Flow

### 1. Receive Webhook
```javascript
app.post('/webhook/snippe/payment', async (req, res) => {
  // Verify signature
  const signature = req.headers['x-webhook-signature'];
  const rawBody = JSON.stringify(req.body);
  
  if (!verifySignature(signature, rawBody)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  const { type, data } = req.body;
  
  // Handle different event types
  if (type === 'payment.completed') {
    await handlePaymentCompleted(data);
  } else if (type === 'payment.failed') {
    await handlePaymentFailed(data);
  }
  
  // Respond quickly (within 30 seconds)
  res.status(200).json({ success: true });
});
```

### 2. Handle Payment Completed
```javascript
async function handlePaymentCompleted(data) {
  const { reference, amount, settlement, customer } = data;
  
  // Find booking
  const booking = await findBooking(reference);
  
  // Update booking status
  booking.status = 'paid';
  booking.paymentStatus = 'completed';
  booking.paidAmount = amount.value;
  booking.settlement = settlement;
  booking.paymentDate = new Date().toISOString();
  
  await saveBooking(booking);
  
  // Send confirmation to customer
  await sendWhatsAppConfirmation(customer.phone, booking);
  
  // Log for monitoring
  logger.info(`Payment completed for booking ${reference}`);
}
```

### 3. Handle Payment Failed
```javascript
async function handlePaymentFailed(data) {
  const { reference, failure_reason, customer } = data;
  
  // Find booking
  const booking = await findBooking(reference);
  
  // Update booking status
  booking.paymentStatus = 'failed';
  booking.failureReason = failure_reason;
  
  await saveBooking(booking);
  
  // Notify customer
  await sendWhatsAppNotification(customer.phone, {
    message: `Payment failed: ${failure_reason}. Please try again.`,
    bookingId: reference
  });
  
  // Log for monitoring
  logger.warn(`Payment failed for booking ${reference}: ${failure_reason}`);
}
```

## Best Practices

### 1. Respond Quickly
- Return `200 OK` within 30 seconds
- Process webhooks asynchronously
- Don't perform long-running operations in webhook handler

```javascript
app.post('/webhook/snippe/payment', async (req, res) => {
  // Verify signature
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Respond immediately
  res.status(200).json({ success: true });
  
  // Process asynchronously
  processWebhookAsync(req.body).catch(error => {
    logger.error('Webhook processing error:', error);
  });
});
```

### 2. Handle Duplicates
- Use event `id` to deduplicate
- You may receive the same event multiple times
- Make your webhook handler idempotent

```javascript
const processedEvents = new Set();

async function processWebhook(webhookData) {
  const { id } = webhookData;
  
  // Check if already processed
  if (processedEvents.has(id)) {
    logger.info(`Event ${id} already processed, skipping`);
    return;
  }
  
  // Process event
  await handleEvent(webhookData);
  
  // Mark as processed
  processedEvents.add(id);
}
```

### 3. Implement Retries
- Snippe retries failed webhooks with exponential backoff
- Ensure your endpoint is idempotent
- Handle temporary failures gracefully

### 4. Monitor Webhook Health
- Log all webhook events
- Track processing times
- Alert on failures
- Monitor signature verification failures

```javascript
async function processWebhook(webhookData) {
  const startTime = Date.now();
  
  try {
    await handleEvent(webhookData);
    
    const duration = Date.now() - startTime;
    logger.info(`Webhook processed in ${duration}ms`);
    
    // Track metrics
    metrics.recordWebhookSuccess(duration);
  } catch (error) {
    logger.error('Webhook processing failed:', error);
    metrics.recordWebhookFailure();
    throw error;
  }
}
```

## Testing Webhooks

### 1. Test Signature Verification
```javascript
const crypto = require('crypto');

function testSignatureVerification() {
  const payload = JSON.stringify({
    id: 'evt_test123',
    type: 'payment.completed',
    data: { reference: 'BK123' }
  });
  
  const secret = 'your_webhook_secret';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  console.log('Test Signature:', signature);
  console.log('Valid:', verifyWebhookSignature(signature, payload, secret));
}
```

### 2. Test Webhook Handler
```bash
# Send test webhook
curl -X POST http://localhost:3000/webhook/snippe/payment \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Event: payment.completed" \
  -H "X-Webhook-Signature: your_signature_here" \
  -d '{
    "id": "evt_test123",
    "type": "payment.completed",
    "data": {
      "reference": "BK1234567890",
      "status": "completed",
      "amount": { "value": 2500, "currency": "TZS" }
    }
  }'
```

### 3. Use Snippe Test Mode
- Snippe provides test mode for development
- Test webhooks are sent to your configured URL
- No real money is processed

## Troubleshooting

### Webhook Not Received
1. Check webhook URL is publicly accessible
2. Verify HTTPS is configured
3. Check firewall allows incoming requests
4. Review Snippe dashboard webhook logs

### Signature Verification Fails
1. Ensure webhook secret matches
2. Use raw request body (not parsed JSON)
3. Check for extra whitespace or encoding issues
4. Verify HMAC-SHA256 algorithm

### Duplicate Events
1. Implement idempotency using event ID
2. Store processed event IDs
3. Skip already processed events

### Slow Processing
1. Respond with 200 immediately
2. Process webhook asynchronously
3. Use job queue for long operations
4. Monitor processing times

## Monitoring

### Key Metrics
- Webhook delivery rate
- Processing time
- Failure rate
- Signature verification failures
- Duplicate events

### Logging
```javascript
logger.info('Webhook received', {
  eventId: webhookData.id,
  eventType: webhookData.type,
  reference: webhookData.data.reference,
  timestamp: new Date().toISOString()
});
```

### Alerts
- Alert on signature verification failures
- Alert on processing errors
- Alert on slow processing (> 30s)
- Alert on high failure rate

## Security Checklist

- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced
- [ ] Webhook secret stored securely
- [ ] Rate limiting configured
- [ ] Logging enabled
- [ ] Monitoring configured
- [ ] Error handling implemented
- [ ] Idempotency implemented

## Support

### Snippe Support
- **Dashboard**: https://www.snippe.sh/dashboard
- **Documentation**: https://docs.snippe.sh
- **Email**: support@snippe.sh

### CarRental Pro Support
- **Phone**: +255683859574
- **Email**: support@carrentalpro.com

---

**Last Updated**: January 2024  
**API Version**: 2026-01-25
