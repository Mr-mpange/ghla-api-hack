# Quick Start: Snippe Payment Integration

## 🚀 Get Started in 5 Minutes

### Step 1: Get Snippe API Credentials

1. Visit https://www.snippe.sh/dashboard/developer/configuration
2. Sign up or log in
3. Copy your API Key
4. Generate a Webhook Secret

### Step 2: Update .env File

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your Snippe credentials
SNIPPE_API_KEY=your_actual_api_key_here
SNIPPE_WEBHOOK_SECRET=your_actual_webhook_secret_here
APP_URL=https://your-domain.com
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Test the Integration

```bash
npm run test:snippe
```

You should see:
```
✅ Service configured and ready
✅ Booking creation works
✅ Payment integration functional
✅ Webhook processing ready
```

### Step 5: Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Step 6: Configure Webhook in Snippe

1. Go to Snippe Dashboard > Webhooks
2. Add webhook URL: `https://your-domain.com/webhook/snippe/payment`
3. Select events: `payment.completed`, `payment.failed`, `payment.pending`
4. Save configuration

### Step 7: Test via WhatsApp

1. Send a message to your WhatsApp Business number
2. Click "Browse Cars"
3. Select a car category
4. Choose a car
5. Click "Book Now"
6. Provide booking details
7. Click "Pay Now" 💳
8. Complete payment on your phone
9. Click "Check Payment Status"
10. Receive confirmation! 🎉

## 📱 Payment Flow

```
Customer Books Car
       ↓
Click "Pay Now"
       ↓
Snippe sends USSD prompt to phone
       ↓
Customer enters PIN
       ↓
Payment processed
       ↓
Webhook notifies server
       ↓
Booking confirmed
       ↓
WhatsApp confirmation sent
```

## 🧪 Testing

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

### Check Payment Status

```bash
curl http://localhost:3000/api/payment-status/pay_123456
```

## 🔧 Troubleshooting

### "Service not configured" Error

**Solution**: Add SNIPPE_API_KEY to .env file

### "Invalid phone number" Error

**Solution**: Use format +255XXXXXXXXX (Tanzania) or +254XXXXXXXXX (Kenya)

### Webhook not receiving notifications

**Solution**: 
1. Ensure APP_URL is publicly accessible
2. Verify webhook URL in Snippe dashboard
3. Check webhook secret matches

### Payment stuck in "pending"

**Solution**:
1. Customer may not have completed payment
2. Check Snippe dashboard for payment status
3. Customer can retry payment

## 📚 Documentation

- **Full Integration Guide**: See `SNIPPE_PAYMENT_INTEGRATION.md`
- **Snippe API Docs**: https://docs.snippe.sh
- **Snippe Dashboard**: https://www.snippe.sh/dashboard

## 💡 Key Features

✅ **Mobile Money** - M-Pesa, Airtel Money, Halotel  
✅ **Real-time Status** - Instant payment confirmation  
✅ **Secure** - Webhook signature verification  
✅ **Automatic** - No manual confirmation needed  
✅ **WhatsApp Integration** - Seamless customer experience  

## 🎯 Production Checklist

- [ ] Production API key configured
- [ ] Webhook URL is HTTPS
- [ ] Webhook secret is secure
- [ ] Test with real phone number
- [ ] Monitor webhook logs
- [ ] Set up error alerts
- [ ] Test failure scenarios
- [ ] Document support process

## 📞 Support

**Technical Issues**: support@carrentalpro.com  
**Snippe Support**: support@snippe.sh  
**Phone**: +255683859574

---

**Ready to accept payments!** 🚗💳✨
