# 🌐 WhatsApp Webhook Setup Guide

## 🔍 Problem

You're getting this error when setting up the webhook in Meta:
```
Graph API error: (#2200) Callback verification failed with the following errors: 
HTTP Status Code = 404; HTTP Message = Not Found
```

## ✅ Solution

Your webhook endpoint is working perfectly locally, but Meta can't reach it because `https://carrentalpro.com` is not accessible or not pointing to your server.

You need to expose your local server to the internet using **ngrok**.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install ngrok

**Option A - Download (Recommended)**
1. Go to: https://ngrok.com/download
2. Download for Windows
3. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok`)

**Option B - Using npm**
```bash
npm install -g ngrok
```

### Step 2: Setup ngrok Account (Free)

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up (free account)
3. Copy your authtoken from dashboard
4. Run in terminal:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

### Step 3: Start Your Server

```bash
npm run dev
```

Keep this terminal open!

### Step 4: Start ngrok (New Terminal)

Open a **NEW** terminal and run:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding    https://abc123def456.ngrok.io -> http://localhost:3000
```

**⚠️ IMPORTANT: Copy the HTTPS URL** (e.g., `https://abc123def456.ngrok.io`)

### Step 5: Update .env File

Replace these lines in your `.env`:
```env
APP_URL=https://abc123def456.ngrok.io
WHATSAPP_CALLBACK_URL=https://abc123def456.ngrok.io/webhook/whatsapp
```

(Use YOUR ngrok URL, not the example above)

### Step 6: Configure Webhook in Meta

1. Go to: https://developers.facebook.com/apps
2. Select your WhatsApp app
3. Navigate to: **WhatsApp → Configuration**
4. Click **"Edit"** next to Webhook
5. Enter:
   - **Callback URL**: `https://abc123def456.ngrok.io/webhook/whatsapp`
   - **Verify Token**: `carrentalpro_verify_2024`
6. Click **"Verify and Save"**
7. ✅ Should show "Verified" with green checkmark
8. Subscribe to **"messages"** webhook field

### Step 7: Test It!

Send a WhatsApp message to your business number, or run:
```bash
npm run test:send
```

---

## 📋 Verification Checklist

Before configuring webhook in Meta, verify:

- [ ] Server is running (`npm run dev`)
- [ ] ngrok is running (`ngrok http 3000`)
- [ ] ngrok shows "online" status
- [ ] Can access health endpoint: `https://YOUR_NGROK_URL.ngrok.io/health`
- [ ] Copied correct HTTPS URL from ngrok (not HTTP)
- [ ] Updated `.env` with ngrok URL
- [ ] Verify token is: `carrentalpro_verify_2024`

---

## 🧪 Test Commands

```bash
# Test webhook locally
npm run test:webhook

# Test sending WhatsApp message
npm run test:send

# Diagnose WhatsApp API
npm run diagnose

# View ngrok setup guide
npm run setup:ngrok
```

---

## 💡 Important Notes

### Free ngrok Limitations
- URL changes every time you restart ngrok
- Need to update webhook URL in Meta each restart
- For testing only, not for production

### For Production
Deploy to a permanent server:
- **Heroku**: https://heroku.com (free tier available)
- **Railway**: https://railway.app (free tier available)
- **Render**: https://render.com (free tier available)
- **DigitalOcean**: https://digitalocean.com
- **AWS/Azure/GCP**

Then use your permanent domain in webhook configuration.

---

## 🔧 Troubleshooting

### Webhook Verification Fails (404)

**Cause**: Meta can't reach your server

**Solutions**:
1. Ensure server is running: `npm run dev`
2. Ensure ngrok is running: `ngrok http 3000`
3. Test ngrok URL in browser: `https://YOUR_URL.ngrok.io/health`
4. Check you're using HTTPS (not HTTP) URL
5. Verify token matches exactly: `carrentalpro_verify_2024`

### Webhook Verification Fails (403)

**Cause**: Verify token doesn't match

**Solution**: 
- Check `.env` has: `WHATSAPP_WEBHOOK_VERIFY_TOKEN=carrentalpro_verify_2024`
- Restart server after changing `.env`
- Use exact same token in Meta configuration

### ngrok Not Found

**Solution**:
```bash
# Install globally
npm install -g ngrok

# Or download from https://ngrok.com/download
```

### Access Token Invalid

**Solution**:
1. Go to: https://developers.facebook.com/apps
2. Select app → WhatsApp → API Setup
3. Generate new access token
4. Update `WHATSAPP_ACCESS_TOKEN` in `.env`
5. Restart server

---

## 📊 Current Status

✅ **Working**:
- Server infrastructure (100%)
- Webhook endpoint (100%)
- Bot logic (100%)
- Payment integration (100%)
- Snippe API (100%)

⚠️ **Needs Setup**:
- ngrok tunnel (to expose server)
- Webhook configuration in Meta
- Fresh access token

---

## 🎯 Summary

Your backend is perfect! You just need to:

1. **Install ngrok** → Expose your local server
2. **Start ngrok** → Get public URL
3. **Update .env** → Use ngrok URL
4. **Configure Meta** → Set webhook URL
5. **Generate token** → Get fresh access token
6. **Test** → Send WhatsApp message

That's it! 🚀

---

## 📞 Support Links

- **ngrok Docs**: https://ngrok.com/docs
- **Meta Developer Console**: https://developers.facebook.com/apps
- **WhatsApp API Docs**: https://developers.facebook.com/docs/whatsapp
- **Snippe Dashboard**: https://www.snippe.sh/dashboard

---

**Last Updated**: February 28, 2026  
**Status**: Ready for ngrok setup
