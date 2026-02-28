# Snippe Payment Configuration Status

## ✅ Current Configuration

### Environment Variables Status

| Variable | Status | Value |
|----------|--------|-------|
| `APP_URL` | ✅ Configured | `https://carrentalpro.com` |
| `SNIPPE_API_KEY` | ✅ Configured | `snp_cc6c...` (Hidden for security) |
| `SNIPPE_API_URL` | ✅ Configured | `https://api.snippe.sh` |
| `SNIPPE_WEBHOOK_SECRET` | ⚠️ Needs Update | `your_snippe_webhook_secret_here` |
| `TEST_PHONE_NUMBER` | ✅ Updated | `+255683859574` |

## 🔧 Next Steps

### 1. Generate Webhook Secret

You need to generate a webhook secret in your Snippe dashboard:

1. Go to: https://www.snippe.sh/dashboard/developer/configuration
2. Navigate to "Webhooks" section
3. Click "Generate Secret" or "Create Webhook Secret"
4. Copy the generated secret
5. Update `.env` file:
   ```env
   SNIPPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

### 2. Configure Webhook URL in Snippe Dashboard

Add your webhook endpoint to Snippe:

**Webhook URL**: `https://carrentalpro.com/webhook/snippe/payment`

**Events to Subscribe**:
- ✅ `payment.completed`
- ✅ `payment.failed`
- ✅ `payment.pending`

**Steps**:
1. Login to Snippe Dashboard
2. Go to Developer > Webhooks
3. Click "Add Webhook"
4. Enter URL: `https://carrentalpro.com/webhook/snippe/payment`
5. Select events listed above
6. Save configuration

### 3. Test the Integration

Once webhook secret is configured, test the integration:

```bash
# Run integration tests
npm run test:snippe

# Expected output:
# ✅ Service configured and ready
# ✅ Booking creation works
# ✅ Payment integration functional
# ✅ Webhook processing ready
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Verify Endpoints

Check that all endpoints are accessible:

```bash
# Health check
curl https://carrentalpro.com/health

# Expected response:
# {
#   "status": "healthy",
#   "services": {
#     "whatsapp": { "enabled": true },
#     "payment": { "enabled": true }
#   }
# }
```

## 📋 Configuration Checklist

### Pre-Production
- [x] Snippe API key configured
- [ ] Webhook secret generated and configured
- [ ] Webhook URL added in Snippe dashboard
- [x] APP_URL set to production domain
- [x] Test phone number updated
- [ ] Integration tests passing

### Production
- [ ] Server deployed with HTTPS
- [ ] Webhook endpoint accessible
- [ ] WhatsApp webhook verified
- [ ] First test payment successful
- [ ] Monitoring configured

## 🔐 Security Notes

### API Key Security
Your Snippe API key is configured:
```
SNIPPE_API_KEY=snp_cc6c06d9aa5daf1c4d5c4ad2aff92ede781a2540127dc8352257f036f54c0767
```

**Important**:
- ✅ Never commit this key to version control
- ✅ Keep `.env` file in `.gitignore`
- ✅ Use different keys for development and production
- ✅ Rotate keys periodically

### Webhook Secret
Once you generate the webhook secret:
- Store it securely in `.env`
- Never expose it in logs
- Use it to verify all webhook requests
- Rotate if compromised

## 🧪 Testing Commands

### Test Payment Creation
```bash
curl -X POST http://localhost:3000/api/test-payment \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BK1234567890",
    "phoneNumber": "+255683859574"
  }'
```

### Check Service Health
```bash
curl http://localhost:3000/health
```

### Test via WhatsApp
1. Send message to: +255683859574
2. Browse cars
3. Create booking
4. Click "Pay Now"
5. Complete payment
6. Verify confirmation

## 📊 Webhook Configuration

### Webhook Endpoint
```
URL: https://carrentalpro.com/webhook/snippe/payment
Method: POST
Content-Type: application/json
```

### Webhook Payload Example
```json
{
  "event": "payment.completed",
  "data": {
    "id": "pay_abc123",
    "status": "completed",
    "reference": "BK1234567890",
    "amount": 2500,
    "currency": "TZS",
    "phone_number": "+255683859574",
    "metadata": {
      "booking_id": "BK1234567890",
      "service": "car_rental"
    }
  }
}
```

### Webhook Headers
```
X-Snippe-Signature: sha256=abc123...
Content-Type: application/json
```

## 🚀 Deployment URLs

### Production
- **Application**: https://carrentalpro.com
- **Health Check**: https://carrentalpro.com/health
- **WhatsApp Webhook**: https://carrentalpro.com/webhook/whatsapp
- **Snippe Webhook**: https://carrentalpro.com/webhook/snippe/payment

### Development
- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **WhatsApp Webhook**: http://localhost:3000/webhook/whatsapp
- **Snippe Webhook**: http://localhost:3000/webhook/snippe/payment

## 📞 Support

### Snippe Support
- **Dashboard**: https://www.snippe.sh/dashboard
- **Documentation**: https://docs.snippe.sh
- **Email**: support@snippe.sh

### CarRental Pro Support
- **Phone**: +255683859574
- **Email**: support@carrentalpro.com

## ✅ Quick Verification

Run this checklist before going live:

```bash
# 1. Check environment variables
cat .env | grep SNIPPE

# 2. Test integration
npm run test:snippe

# 3. Start server
npm run dev

# 4. Check health
curl http://localhost:3000/health

# 5. Test payment (development)
curl -X POST http://localhost:3000/api/test-payment \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"BK123","phoneNumber":"+255683859574"}'
```

## 🎯 Current Status

**Configuration**: 80% Complete ✅

**Remaining Tasks**:
1. Generate and configure webhook secret
2. Add webhook URL in Snippe dashboard
3. Run integration tests
4. Deploy to production
5. Test end-to-end flow

**Estimated Time to Complete**: 15-20 minutes

---

**Last Updated**: January 2024  
**Configuration File**: `.env`  
**Status**: Ready for webhook configuration
