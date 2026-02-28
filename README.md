# CarRental Pro - WhatsApp Bot

A complete car rental booking system with WhatsApp integration, payment processing, and multi-channel notifications.

## Features

- 🚗 **Car Browsing**: Browse cars by category (Economy, SUV, Luxury, Vans)
- 💳 **Payment Integration**: M-Pesa, Airtel Money, Halotel via Snippe API
- 📱 **WhatsApp Bot**: Interactive booking flow via WhatsApp
- 📧 **SMS Notifications**: Booking confirmations via Briq SMS
- 📞 **Voice Calls**: Voice notifications via Briq Voice API
- ✅ **Payment Verification**: Automatic payment status checking

## Tech Stack

- **Backend**: Node.js, Express
- **WhatsApp**: Ghala API
- **Payments**: Snippe API
- **Notifications**: Briq API (SMS & Voice)
- **Webhooks**: ngrok for local development

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

4. Update `.env` with your API keys:
   - `GHALA_PHONE_NUMBER_ID` - WhatsApp phone number ID
   - `WHATSAPP_ACCESS_TOKEN` - WhatsApp access token
   - `SNIPPE_API_KEY` - Snippe payment API key
   - `BRIQ_API_KEY` - Briq notification API key
   - `APP_URL` - Your ngrok URL

## Running the Server

```bash
node src/server.js
```

Server will start on port 3000.

## Configuration

### WhatsApp (Ghala)
- Phone Number ID: Get from Ghala dashboard
- Access Token: Generate from Ghala
- Webhook URL: `{APP_URL}/webhook/whatsapp`

### Payment (Snippe)
- API Key: Get from https://snippe.sh
- Webhook URL: `{APP_URL}/webhook/snippe/payment`
- Minimum payment: 500 TZS

### Notifications (Briq)
- API Key: Get from https://briq.tz
- Base URL: `https://karibu.briq.tz` (Production)
- SMS Endpoint: `/v1/message/send-instant`
- Voice Endpoint: `/v1/voice/calls/tts`

## How It Works

### 1. Customer Flow
1. Customer sends "hello" to WhatsApp bot
2. Bot shows "Browse Cars" button
3. Customer selects car category
4. Customer selects specific car
5. Customer clicks "Pay Now"
6. Payment push sent to customer's phone
7. Customer enters PIN to complete payment
8. Customer clicks "I have paid"
9. System verifies payment
10. Customer receives SMS and voice call confirmation

### 2. Payment Flow
- Snippe creates payment request
- Push notification sent to customer's phone (M-Pesa/Airtel/Halotel)
- Customer completes payment with PIN
- Snippe webhook confirms payment
- Briq sends SMS and voice notifications

### 3. Notification Flow
After successful payment:
- **SMS**: Booking details sent via Briq SMS API
- **Voice Call**: Congratulations call via Briq Voice API
- **WhatsApp**: Confirmation message (sent as SMS if WhatsApp not enabled)

## Car Pricing

All cars are priced at **TZS 500/day**. To change prices, edit `src/services/carRentalBotService.js`:

```javascript
cars: {
  economy: [
    { id: 'car_eco_001', name: 'Toyota Vitz', price: 500, ... }
  ]
}
```

## Project Structure

```
.
├── src/
│   ├── server.js                          # Main server
│   ├── services/
│   │   ├── carRentalBotService.js        # Bot logic & car catalog
│   │   ├── whatsappResponseService.js    # WhatsApp API integration
│   │   ├── snippePaymentService.js       # Payment processing
│   │   └── briqNotificationService.js    # SMS & Voice notifications
│   └── utils/
│       └── logger.js                      # Logging utility
├── .env                                   # Environment variables
├── .env.example                           # Environment template
├── package.json                           # Dependencies
└── README.md                              # This file
```

## API Endpoints

### Health Check
```
GET /health
```

### WhatsApp Webhook
```
GET  /webhook/whatsapp  # Verification
POST /webhook/whatsapp  # Incoming messages
```

### Snippe Payment Webhook
```
POST /webhook/snippe/payment
```

### Briq Voice Proxy
```
POST /api/briq-voice-proxy
```

## Environment Variables

See `.env.example` for all required variables.

### Required
- `PORT` - Server port (default: 3000)
- `APP_URL` - Your ngrok URL
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp API token
- `GHALA_PHONE_NUMBER_ID` - WhatsApp phone number ID
- `SNIPPE_API_KEY` - Snippe payment API key
- `BRIQ_API_KEY` - Briq notification API key

### Optional
- `BRIQ_SENDER_ID` - SMS sender ID (default: BRIQ)
- `BUSINESS_NAME` - Your business name
- `BUSINESS_PHONE` - Support phone number

## Troubleshooting

### Payment push not received
- Verify phone number format (+255...)
- Check Snippe API key is valid
- Ensure customer has sufficient balance

### SMS not received
- Check Briq API key
- Verify SMS API URL: `https://karibu.briq.tz`
- Check Briq account balance

### Voice call not working
- Voice API uses production HTTPS: `https://karibu.briq.tz`
- Check Briq account has voice enabled
- Falls back to SMS if voice fails
- Verify API key has voice permissions

### WhatsApp messages not sending
- Verify WhatsApp access token
- Check phone number ID is correct
- Ensure webhook URL is accessible

## Support

For issues with:
- **Ghala/WhatsApp**: Contact Ghala support
- **Snippe Payments**: https://snippe.sh
- **Briq Notifications**: [email protected] / +255 788 344 348

## License

Private - CarRental Pro

## Version

1.0.0 - Production Ready
