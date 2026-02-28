# 🔍 Check ngrok Traffic

## Step 1: Open ngrok Web Interface

1. Open your browser
2. Go to: **http://localhost:4040**
3. This shows all HTTP requests coming through ngrok

## Step 2: Send WhatsApp Message Again

1. Send "Hello" to +255 683 859 574
2. Immediately check http://localhost:4040
3. Look for POST requests to `/webhook/whatsapp`

## What to Look For

### ✅ If You See Requests:
- POST /webhook/whatsapp
- Status: 200
- **Meaning**: Ghala IS sending webhooks, but server might not be logging

### ❌ If You DON'T See Requests:
- No POST requests at all
- **Meaning**: Ghala is NOT sending webhooks to your server
- **Reason**: Webhook override not saved/active in Ghala

---

## 🔧 Fix: Verify Ghala Configuration

### In Ghala Dashboard:

1. **Go to Webhook Configuration page**

2. **Look for "Advanced Settings" section**

3. **Check if there's a toggle/checkbox**:
   - "Forward webhooks to your own server"
   - "Use custom webhook"
   - "Override default webhook"
   
4. **Make sure it's ENABLED/CHECKED** ✅

5. **Verify the fields**:
   ```
   Callback URL: https://5194-197-186-19-148.ngrok-free.app/webhook/whatsapp
   Verify Token: carrentalpro_verify_2024
   ```

6. **Click "Save Override" or "Save Changes"**

7. **Look for confirmation message**:
   - "Webhook override saved"
   - "Configuration updated"

---

## 🎯 Common Issues

### Issue 1: Override Not Saved
- You entered the URL but didn't click Save
- **Fix**: Click the Save button

### Issue 2: Override Not Enabled
- There's a toggle/switch that's OFF
- **Fix**: Turn it ON, then Save

### Issue 3: Wrong URL Format
- Ghala might require specific format
- **Fix**: Try without trailing slash: `https://5194-197-186-19-148.ngrok-free.app/webhook/whatsapp`

### Issue 4: Verification Failed
- Ghala tried to verify but failed
- **Fix**: Make sure server is running, then click "Verify" or "Test" button

---

## 📸 What to Look For in Ghala Dashboard

The page should look something like:

```
┌─────────────────────────────────────────────────┐
│ Webhook Configuration                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Your Webhook Endpoint                           │
│ Callback URL: https://api.ghala.io/webhook/... │
│ Verify Token: ghala_...                         │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ ☑ Advanced Settings                         │ │
│ │                                             │ │
│ │ Forward webhooks to your own server         │ │
│ │ instead of using GhalaRails                 │ │
│ │                                             │ │
│ │ Phone Number: 994495747086170               │ │
│ │                                             │ │
│ │ Current Override: [Refresh]                 │ │
│ │ https://5194-197-186-19-148.ngrok-free.app  │ │
│ │                                             │ │
│ │ Callback URL: [________________]            │ │
│ │ Verify Token:  [________________]           │ │
│ │                                             │ │
│ │ [Save Override]  ← CLICK THIS!              │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Alternative Test

If Ghala has a "Test Webhook" button:

1. Click "Test Webhook" or "Send Test Message"
2. Check if your server receives it
3. Check ngrok interface (http://localhost:4040)

---

## 📞 If Still Not Working

### Contact Ghala Support:

**Email**: support@ghala.io

**Message**:
```
Hi,

I'm trying to configure a custom webhook for my WhatsApp number 
(Phone Number ID: 994495747086170).

I've entered:
- Callback URL: https://5194-197-186-19-148.ngrok-free.app/webhook/whatsapp
- Verify Token: carrentalpro_verify_2024

But messages are not being forwarded to my server. 

Can you help me verify:
1. Is the webhook override active?
2. Are there any errors in webhook delivery?
3. Do I need to enable anything else?

Thank you!
```

---

## 🎯 Quick Checklist

Before contacting support, verify:

- [ ] Server is running (`npm run dev`)
- [ ] ngrok is running (`ngrok http 3000`)
- [ ] ngrok URL is correct in Ghala
- [ ] Verify token matches exactly
- [ ] "Save Override" button was clicked
- [ ] No error messages in Ghala dashboard
- [ ] Webhook override toggle/checkbox is ON

---

**Check http://localhost:4040 now and tell me if you see any POST requests!**
