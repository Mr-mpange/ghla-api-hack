# Briq Voice & WhatsApp Setup Guide

## Current Status

✅ **SMS**: Working perfectly
⚠️ **Voice Calls**: Requires developer app setup
⚠️ **WhatsApp**: May require account upgrade

---

## SMS (Working ✅)

SMS notifications are working and being sent successfully to customers.

**Configuration:**
```env
BRIQ_API_KEY=your_api_key
BRIQ_API_URL=https://karibu.briq.tz
BRIQ_SENDER_ID=BRIQ
```

---

## Voice Calls Setup (Required)

Voice calls in Briq require a **Developer App** to be created in your Briq dashboard.

### Steps to Enable Voice Calls:

1. **Login to Briq Dashboard**
   - Go to: https://briq.tz/dashboard
   - Login with your credentials

2. **Create a Developer App**
   - Navigate to: Developer Apps section
   - Click "Create New App"
   - Give it a name: `CarRental Pro Voice`
   - Copy the generated `app_key`

3. **Add to Environment Variables**
   ```env
   BRIQ_DEVELOPER_APP_KEY=your_developer_app_key_here
   ```

4. **Restart Server**
   ```bash
   node src/server.js
   ```

### How Voice Calls Work:

- Uses Briq's OTP API with `delivery_method: "call"`
- Sends automated voice message to customer's phone
- Customer receives a phone call with the congratulations message
- If voice fails, automatically falls back to SMS

### API Endpoint:
```
POST https://karibu.briq.tz/v1/otp/request
Headers:
  X-API-Key: {API_KEY}
  Content-Type: application/json
Body:
  {
    "phone_number": "+255683859574",
    "app_key": "your_developer_app_key",
    "delivery_method": "call",
    "sender_id": "BRIQ",
    "message_template": "Your voice message here",
    "otp_length": 4,
    "minutes_to_expire": 5
  }
```

---

## WhatsApp Setup (May Require Upgrade)

WhatsApp messaging through Briq may require:
1. Account upgrade to business plan
2. WhatsApp Business API access
3. Contact Briq support to enable WhatsApp

### Current Behavior:

- API accepts `channel: "whatsapp"` parameter
- Messages are queued successfully
- **BUT**: They may be delivered as SMS instead of WhatsApp
- This is because WhatsApp requires special account permissions

### Steps to Enable WhatsApp:

1. **Contact Briq Support**
   - Email: [email protected]
   - Phone: +255 788 344 348
   - Request: "Enable WhatsApp messaging for my account"

2. **Verify Account Type**
   - Check if your account has WhatsApp enabled
   - May require business plan upgrade

3. **Test WhatsApp**
   ```bash
   node test-briq-whatsapp-channels.js
   ```

### Alternative: Use Your Existing WhatsApp (Ghala)

Since you already have WhatsApp working through Ghala, you can:
- Keep using Ghala for WhatsApp messages (already working)
- Use Briq only for SMS and Voice calls
- This gives you the best of both worlds

**Current Setup:**
- Ghala WhatsApp: ✅ Working (for booking flow)
- Briq SMS: ✅ Working (for notifications)
- Briq Voice: ⚠️ Needs developer app
- Briq WhatsApp: ⚠️ May need account upgrade

---

## Recommended Configuration

### Option 1: SMS Only (Current - Working)
```env
BRIQ_API_KEY=3Orys0634DQ3gfToRVWGAonxcfXO3ovilUZQEfNtrrI
BRIQ_API_URL=https://karibu.briq.tz
BRIQ_SENDER_ID=BRIQ
```

**Result:**
- ✅ SMS notifications sent
- ⚠️ Voice falls back to SMS
- ⚠️ WhatsApp falls back to SMS

### Option 2: SMS + Voice (Recommended)
```env
BRIQ_API_KEY=3Orys0634DQ3gfToRVWGAonxcfXO3ovilUZQEfNtrrI
BRIQ_API_URL=https://karibu.briq.tz
BRIQ_SENDER_ID=BRIQ
BRIQ_DEVELOPER_APP_KEY=your_developer_app_key_here
```

**Result:**
- ✅ SMS notifications sent
- ✅ Voice calls made
- ⚠️ WhatsApp falls back to SMS

### Option 3: Full Multi-Channel (Future)
```env
BRIQ_API_KEY=3Orys0634DQ3gfToRVWGAonxcfXO3ovilUZQEfNtrrI
BRIQ_API_URL=https://karibu.briq.tz
BRIQ_SENDER_ID=BRIQ
BRIQ_DEVELOPER_APP_KEY=your_developer_app_key_here
# WhatsApp enabled by Briq support
```

**Result:**
- ✅ SMS notifications sent
- ✅ Voice calls made
- ✅ WhatsApp messages sent

---

## Testing

### Test SMS (Working)
```bash
node test-briq-notifications.js
```

### Test Voice Call (After setup)
```bash
node test-briq-voice-call.js
```

### Test WhatsApp Channels
```bash
node test-briq-whatsapp-channels.js
```

---

## What Happens Now?

**Current Behavior:**
1. Customer completes payment
2. System sends congratulations via Briq:
   - ✅ SMS: Delivered successfully
   - ⚠️ Voice: Sent as SMS (fallback)
   - ⚠️ WhatsApp: Sent as SMS (fallback)

**After Voice Setup:**
1. Customer completes payment
2. System sends congratulations via Briq:
   - ✅ SMS: Delivered successfully
   - ✅ Voice: Phone call received
   - ⚠️ WhatsApp: Sent as SMS (fallback)

**After Full Setup:**
1. Customer completes payment
2. System sends congratulations via Briq:
   - ✅ SMS: Delivered successfully
   - ✅ Voice: Phone call received
   - ✅ WhatsApp: Message in WhatsApp app

---

## Support

**Briq Support:**
- Email: [email protected]
- Phone: +255 788 344 348
- Dashboard: https://briq.tz/dashboard
- Docs: https://docs.briq.tz

**Questions to Ask Briq:**
1. "How do I create a developer app for voice calls?"
2. "Does my account have WhatsApp messaging enabled?"
3. "What plan do I need for WhatsApp integration?"

---

## Summary

✅ **SMS is working** - Customers receive SMS notifications
⚠️ **Voice needs setup** - Create developer app in Briq dashboard
⚠️ **WhatsApp needs verification** - Contact Briq support or use Ghala

The system is functional with SMS. Voice and WhatsApp are optional enhancements.
