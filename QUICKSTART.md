# ⚡ Quick Start Guide

Get your WhatsApp Micro-Sales Assistant running in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Create Environment File

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your Ghala API credentials:

```env
GHALA_API_KEY=your_api_key_here
GHALA_WEBHOOK_SECRET=your_webhook_secret_here
WHATSAPP_BUSINESS_NUMBER=+254700000000
```

## 3. Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3000
📱 WhatsApp Micro-Sales Assistant is ready!
```

## 4. Test the API

Open another terminal and run:

```bash
# Windows PowerShell
.\test-api.ps1

# Linux/Mac
chmod +x test-api.sh
./test-api.sh
```

Or test manually:

```bash
curl http://localhost:3000/health
```

## 5. View Admin Dashboard

Open your browser and go to:
```
http://localhost:3000/admin
```

Login with:
- Username: `admin`
- Password: `changeme123`

## 6. Configure Webhooks

In your Ghala Dashboard:

1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/ghala`
3. Subscribe to events:
   - `order.created`
   - `payment.success`
   - `payment.failed`

For incoming messages:
- Add webhook URL: `https://your-domain.com/api/messages/incoming`

## 🎉 You're Ready!

Your WhatsApp Micro-Sales Assistant is now running!

### What's Next?

1. **Customize Products**: Edit `src/config/products.js`
2. **Deploy to Production**: See `SETUP_GUIDE.md`
3. **Test WhatsApp Flow**: Send "Hi" to your WhatsApp Business number

### Need Help?

- 📖 Full documentation: `SETUP_GUIDE.md`
- 🐛 Troubleshooting: Check server logs
- 💬 Questions: Create an issue on GitHub

---

**Happy Selling! 🛍️**
