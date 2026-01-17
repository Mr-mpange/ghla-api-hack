# CarRental Pro - WhatsApp Bot

🚗 **Complete Car Rental WhatsApp Bot with Auto-Processing**

## 🚀 Features

- **Complete Car Rental Flow**: Browse → Select → Book → Pay
- **Interactive WhatsApp Elements**: Buttons, lists, and rich responses
- **Auto-Processing**: Automatic message handling and responses
- **Session Management**: Tracks customer conversations
- **Multiple Payment Options**: M-Pesa, Bank Transfer, Cash
- **Real-time Booking**: Instant booking confirmations

## � ProWject Structure

```
ghala/
├── auto-process-messages.js          # Main auto-processing server
├── send-demo-to-triple-jay.js        # Demo sender
├── src/
│   ├── services/
│   │   ├── carRentalBotService.js    # Core bot logic
│   │   └── whatsappResponseService.js # WhatsApp API integration
│   └── utils/
│       └── logger.js                 # Logging utility
├── .env                              # Environment variables
├── package.json                      # Dependencies
└── README.md                         # This file
```

## 🔧 Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Add your WhatsApp Business API credentials
   - Set webhook verify token

3. **Start Auto-Processing Server**:
   ```bash
   npm run auto:process
   ```

4. **Setup ngrok** (for webhook):
   ```bash
   ngrok http 3000
   ```

5. **Configure Ghala Rails Webhook**:
   - URL: `https://your-ngrok-url.ngrok.io/webhook/auto`
   - Verify Token: `carrentalpro_verify_2024`

## 🎯 How It Works

1. **Customer sends message** → WhatsApp → Ghala Rails → Your webhook
2. **Auto-processing server** receives and processes the message
3. **Car rental bot** generates intelligent response
4. **WhatsApp API** sends response back to customer
5. **Complete flow** from browsing to payment completion

## 📱 Customer Experience

- **Welcome**: "Hi" → Welcome message with main menu
- **Browse Cars**: Interactive car categories and selection
- **Car Details**: Detailed information with booking options
- **Quick Booking**: Same day, weekend, or weekly options
- **Payment**: M-Pesa, bank transfer, or cash instructions
- **Confirmation**: Booking confirmation and pickup details

## 🛠 Commands

- `npm run auto:process` - Start auto-processing server
- `npm start` - Alternative start command
- `npm test` - Run tests

## 📞 Support

- **WhatsApp**: +255683859574
- **Email**: support@carrentalpro.com

## 🎉 Ready to Use!

Your complete car rental WhatsApp bot is ready for customers!