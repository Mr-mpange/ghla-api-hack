# 🚀 Ghala WhatsApp Integration Setup Guide

## 📋 What is Ghala?

Ghala is a WhatsApp Business API service that simplifies WhatsApp integration. Instead of dealing directly with Meta's API, you use Ghala's infrastructure.

---

## ✅ Current Configuration

From your Ghala dashboard, you have:
- **Phone Number ID**: `994495747086170`
- **Webhook URL**: `https://api.ghala.io/webhook/pjA_lRZrvcQgw86_x85zutj2HUFQL7m-ZRwVp8cI_lY`
- **Verify Token**: `ghala_lVAYbylobepVtN9O_ajsG8XpEvSIuLZBR-eTXLpyl8c`

---

## 🔧 Setup Steps

### Step 1: Get Access Token from Ghala

You need to get the WhatsApp access token from Ghala dashboard:

1. **Login to Ghala Dashboard**
   - Go to: https://ghala.io (or your Ghala dashboard URL)
   - Login with your credentials

2. **Find API Credentials**
   - Look for "API Keys" or "Credentials" section
   - Find "WhatsApp Access Token" or "API Token"
   - Copy the entire token

3. **Update .env File**
   ```env
   WHATSAPP_ACCESS_TOKEN=your_ghala_access_token_here
   ```

### Step 2: Configure Webhook Override in Ghala

In your Ghala dashboard (Webhook Configuration page):

1. **Enable Advanced Settings**
   - Look for "Advanced Settings" or "Forward webhooks to your own server"

2. **Set Webhook Override**
   - **Callback URL**: `https://5194-197-186-19-148.ngrok-free.app/webhook/whatsapp`
   - **Verify Token**: `carrentalpro_verify_2024`

3. **Click "Save Override"**

### Step 3: Restart Server

```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
```

### Step 4: Test

```bash
npm run test:send
```

---

## 🔍 Alternative: Use Ghala's API Directly

If you can't get the Meta access token, you can use Ghala's API instead:

### Option A: Use Ghala's Send Message API

Update `src/services/whatsappResponseService.js` to use Ghala's API:

```javascript
// Instead of Meta's Graph API
const response = await axios.post(
  'https://api.ghala.io/v1/messages/send',
  {
    phone_number_id: process.env.GHALA_PHONE_NUMBER_ID,
    to: to,
    type: 'text',
    text: { body: message }
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.GHALA_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);
```

---

## 📝 What You Need from Ghala Dashboard

Look for these in your Ghala dashboard:

1. **API Key / Access Token**
   - Usually in "Settings" → "API Keys"
   - Starts with something like `ghl_` or `EAA`

2. **Phone Number ID**
   - ✅ You have: `994495747086170`

3. **Webhook Secret** (optional)
   - For verifying webhook signatures
   - Usually in webhook configuration

---

## 🧪 Test Webhook Configuration

After setting up webhook override in Ghala:

```bash
# Test webhook locally
npm run test:webhook

# Test ngrok tunnel
npm run test:ngrok
```

---

## 📞 Where to Find Ghala Information

### Ghala Dashboard Sections to Check:

1. **API Keys / Credentials**
   - Access tokens
   - API keys
   - Webhook secrets

2. **Phone Numbers**
   - Phone number ID
   - Phone number status
   - Connected numbers

3. **Webhooks**
   - Webhook URL
   - Verify token
   - Override settings

4. **Documentation**
   - API endpoints
   - Authentication
   - Message formats

---

## 🔄 Current vs Required Configuration

### Current (in .env):
```env
GHALA_PHONE_NUMBER_ID=994495747086170
WHATSAPP_PHONE_NUMBER_ID=994495747086170
WHATSAPP_ACCESS_TOKEN=<expired_token>
```

### What You Need:
```env
GHALA_API_KEY=<from_ghala_dashboard>
GHALA_PHONE_NUMBER_ID=994495747086170
WHATSAPP_ACCESS_TOKEN=<fresh_token_from_ghala>
WHATSAPP_PHONE_NUMBER_ID=994495747086170
```

---

## 💡 Quick Fix Options

### Option 1: Get Fresh Token from Ghala (Recommended)
1. Login to Ghala dashboard
2. Find API credentials section
3. Copy access token
4. Update `.env`
5. Restart server

### Option 2: Use Ghala's API Wrapper
1. Get Ghala API key
2. Update service to use Ghala's endpoints
3. No need for Meta access token

### Option 3: Contact Ghala Support
- Email: support@ghala.io
- Ask for: "WhatsApp access token for phone number 994495747086170"

---

## 🎯 Next Steps

1. **Find your Ghala access token** in the dashboard
2. **Update `.env`** with the token
3. **Configure webhook override** in Ghala
4. **Restart server** and test

---

## 📚 Useful Links

- **Ghala Dashboard**: https://ghala.io
- **Ghala Docs**: https://docs.ghala.io (if available)
- **Support**: support@ghala.io

---

**Status**: Waiting for Ghala access token  
**Webhook**: Configured with ngrok  
**Server**: Running and ready  
**Payment**: Fully integrated  

Once you get the access token from Ghala, everything will work! 🚀
