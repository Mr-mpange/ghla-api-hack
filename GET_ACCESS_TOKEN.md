# 🔑 How to Get WhatsApp Access Token

## ❌ Current Problem

Your access token is expired:
```
Error Code: 100
Error Message: Object with ID '994495747086170' does not exist, 
cannot be loaded due to missing permissions
```

This means the `WHATSAPP_ACCESS_TOKEN` in your `.env` is no longer valid.

---

## ✅ Solution: Get Fresh Access Token

You have **TWO options** depending on your Ghala setup:

---

## 🎯 OPTION 1: Get Token from Ghala Dashboard (Easiest)

### Step 1: Login to Ghala
- Go to your Ghala dashboard (the same place where you configured the webhook)

### Step 2: Look for API Credentials
Check these sections in order:

1. **Settings** → **API Keys** or **Credentials**
2. **Developer** → **API Access**
3. **WhatsApp** → **API Configuration**
4. **Account** → **API Tokens**

### Step 3: Find WhatsApp Access Token
Look for one of these:
- "WhatsApp Access Token"
- "Meta Access Token"
- "Graph API Token"
- "Access Token" (under WhatsApp section)

### Step 4: Copy and Update
```bash
# Copy the ENTIRE token (it's very long, 200-300 characters)
# Update in .env:
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...
```

### Step 5: Restart and Test
```bash
npm run dev
npm run test:send
```

---

## 🎯 OPTION 2: Generate from Meta Developer Console

If Ghala doesn't show the token, generate it directly from Meta:

### Step 1: Go to Meta Developer Console
- Visit: https://developers.facebook.com/apps
- Login with your Facebook account

### Step 2: Find Your App
- Look for your WhatsApp Business app
- Click on it to open

### Step 3: Navigate to WhatsApp API Setup
- Left sidebar: Click **WhatsApp**
- Click **API Setup** or **Getting Started**

### Step 4: Generate Token
- Look for "Temporary access token" section
- Click **"Generate Access Token"** button
- A popup appears → Click **"I Understand"** and **"Continue"**
- Copy the ENTIRE token

### Step 5: Update .env
```env
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...
```

### Step 6: Restart and Test
```bash
npm run dev
npm run test:send
```

---

## 🎯 OPTION 3: Use Ghala's API (If you have Ghala API Key)

If you have a Ghala API key, we can update the code to use Ghala's API instead:

### Step 1: Find Ghala API Key
- In Ghala dashboard, look for "API Key" or "API Token"
- Copy it

### Step 2: Update .env
```env
GHALA_API_KEY=your_ghala_api_key_here
```

### Step 3: Test Ghala API
```bash
npm run test:ghala
```

### Step 4: If it works, I'll update the code
- I'll modify the WhatsApp service to use Ghala's API
- No need for Meta access token

---

## 📸 Visual Guide - Where to Look

### In Ghala Dashboard:
```
┌─────────────────────────────────────┐
│  Settings                           │
│  ├── Profile                        │
│  ├── API Keys  ← LOOK HERE          │
│  ├── Webhooks                       │
│  └── Billing                        │
└─────────────────────────────────────┘

OR

┌─────────────────────────────────────┐
│  WhatsApp                           │
│  ├── Phone Numbers                  │
│  ├── API Configuration ← LOOK HERE  │
│  ├── Webhooks                       │
│  └── Templates                      │
└─────────────────────────────────────┘
```

### In Meta Developer Console:
```
┌─────────────────────────────────────┐
│  WhatsApp                           │
│  ├── Getting Started                │
│  ├── API Setup     ← LOOK HERE      │
│  │   └── Temporary access token     │
│  │       [Generate Access Token]    │
│  ├── Configuration                  │
│  └── Phone Numbers                  │
└─────────────────────────────────────┘
```

---

## ⚠️ Important Notes

### About Access Tokens:
- **Temporary tokens** expire in 24 hours
- **Long-lived tokens** expire in 60 days
- **System User tokens** never expire (recommended for production)

### Token Format:
- Starts with `EAA`
- Very long (200-300 characters)
- No spaces or line breaks
- Copy the ENTIRE thing

### After Updating Token:
1. Save `.env` file
2. Restart server (Ctrl+C, then `npm run dev`)
3. Test: `npm run test:send`

---

## 🆘 Still Can't Find Token?

### Contact Ghala Support:
- **Email**: support@ghala.io
- **Ask**: "Where can I find my WhatsApp access token for phone number 994495747086170?"

### Or Try This:
1. Take a screenshot of your Ghala dashboard
2. Show me the menu/navigation options
3. I'll help you find where the token is

---

## 🧪 Quick Test Commands

```bash
# Test with current token (will fail if expired)
npm run test:send

# Test Ghala API (if you have Ghala API key)
npm run test:ghala

# Test webhook (this works)
npm run test:webhook

# Test ngrok tunnel (this works)
npm run test:ngrok
```

---

## ✅ What's Already Working

- ✅ Server running perfectly
- ✅ Webhook endpoint configured
- ✅ ngrok tunnel active
- ✅ Bot logic ready
- ✅ Payment integration complete
- ✅ Ghala webhook override configured

**Only missing**: Fresh WhatsApp access token!

---

## 🎯 Next Step

**Choose ONE option above and get the access token.**

Once you have it:
1. Update `WHATSAPP_ACCESS_TOKEN` in `.env`
2. Restart server
3. Run `npm run test:send`
4. ✅ Everything will work!

---

**Status**: Waiting for fresh access token  
**Priority**: HIGH - This is the only blocker  
**Time needed**: 2-5 minutes once you find the token
