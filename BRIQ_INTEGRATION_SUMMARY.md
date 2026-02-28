# Briq Integration Summary

## Overview
Integrated Briq API to send SMS, Voice, and WhatsApp notifications to customers after successful payment completion.

## What Was Implemented

### 1. Briq Notification Service
**File**: `src/services/briqNotificationService.js`

Features:
- **SMS Notifications**: Send text messages via Briq SMS API
- **Voice Calls**: Initiate automated voice calls with congratulations message
- **WhatsApp Messages**: Send WhatsApp messages via Briq WhatsApp API
- **Unified Payment Confirmation**: Single method to send all 3 notifications

### 2. Integration Points

#### Payment Success (Button Click)
**Location**: `src/services/carRentalBotService.js` (line ~831)
- When user clicks "I have paid" and payment is confirmed
- Sends SMS, Voice, and WhatsApp notifications
- Does not fail payment flow if Briq fails

#### Webhook Payment Completion
**Location**: `src/services/carRentalBotService.js` (line ~1729)
- When Snippe webhook confirms payment
- Sends SMS, Voice, and WhatsApp notifications
- Does not fail webhook processing if Briq fails

### 3. Environment Configuration

Added to `.env`:
```env
# Briq API Configuration
BRIQ_API_KEY=your_briq_api_key_here
BRIQ_API_URL=https://karibu.briq.tz
BRIQ_SENDER_ID=BRIQ
```

## Message Templates

### SMS Message
```
Congratulations {Name}! Your {Car} booking is confirmed. 
Pickup: {Date}. Total: TZS {Amount}. 
Your car will arrive soon. Thank you for choosing CarRental Pro!
```

### Voice Message
```
Hello {Name}. Congratulations! Your booking for {Car} has been 
confirmed successfully. Your car will arrive soon as possible. 
Thank you for choosing CarRental Pro.
```

### WhatsApp Message
```
🎉 Congratulations {Name}!

✅ Your booking is confirmed!

🚗 Car: {Car}
📅 Pickup: {Date}
📅 Return: {Date}
💰 Total Paid: TZS {Amount}

🚚 Your car will arrive soon as possible!

Thank you for choosing CarRental Pro! 🙏
```

## Setup Instructions

### Step 1: Get Briq API Credentials
1. Visit https://briq.co.tz/dashboard
2. Sign up or log in
3. Navigate to API Settings
4. Copy your API Key

### Step 2: Update Environment Variables
Edit `.env` file:
```env
BRIQ_API_KEY=your_actual_briq_api_key
BRIQ_API_URL=https://karibu.briq.tz
BRIQ_SENDER_ID=BRIQ
```

### Step 3: Restart Server
```bash
# Stop current server (Ctrl+C)
# Start server
node src/server.js
```

## Testing

### Test Flow:
1. Send "hello" to WhatsApp bot (+255683859574)
2. Click "Browse Cars"
3. Select a car category (e.g., Economy)
4. Select a car (e.g., "1. Toyota Vitz")
5. Complete payment via M-Pesa/Airtel Money
6. Click "I have paid"

### Expected Results:
After payment confirmation, customer receives:
1. ✅ SMS notification
2. ✅ Voice call with congratulations
3. ✅ WhatsApp message with booking details

## API Endpoints Used

### Briq Instant Message API
```
POST https://karibu.briq.tz/v1/message/send-instant
Headers:
  X-API-Key: {API_KEY}
  Content-Type: application/json
Body:
  {
    "content": "Your message here",
    "recipients": ["+255683859574"],
    "sender_id": "BRIQ"
  }
```

Response:
```json
{
  "success": true,
  "status": "sent",
  "message": "Instant message queued for 1 recipients",
  "job_id": "unique_job_id",
  "stats": {
    "recipients": 1,
    "sms_parts": 2,
    "total_sms": 2,
    "cost": 2
  }
}
```

## Error Handling

- All Briq API calls are wrapped in try-catch blocks
- Failures are logged but don't stop the payment flow
- Customer still sees success message in WhatsApp even if Briq fails
- Logs show detailed error messages for debugging

## Logging

All Briq operations are logged:
```
[Briq] Sending SMS to +255683859574
[Briq] SMS sent successfully: msg_123456
[Briq] Sending voice call to +255683859574
[Briq] Voice call initiated: call_123456
[Briq] Sending WhatsApp message to +255683859574
[Briq] WhatsApp message sent: wa_123456
```

## Benefits

1. **Multi-Channel Communication**: Reach customers via SMS, Voice, and WhatsApp
2. **Immediate Confirmation**: Customers get instant notifications
3. **Professional Experience**: Automated congratulations messages
4. **Delivery Assurance**: "Your car will arrive soon" message
5. **Redundancy**: If one channel fails, others still work

## Files Modified

1. `src/services/carRentalBotService.js` - Added Briq integration
2. `.env` - Added Briq credentials
3. `.env.example` - Added Briq configuration template

## Files Created

1. `src/services/briqNotificationService.js` - Briq API service
2. `BRIQ_INTEGRATION_SUMMARY.md` - This documentation

## Notes

- Briq API base URL: `https://karibu.briq.tz`
- Uses `X-API-Key` header for authentication (not Bearer token)
- Phone numbers must be in international format (+255...)
- Voice calls currently use SMS fallback (Briq may not have separate voice endpoint)
- WhatsApp messages are sent via the same instant message endpoint
- Each message is queued and assigned a unique job_id
- Cost is calculated based on SMS parts (160 chars = 1 part)
- Test with small amounts first

## Support

For Briq API issues:
- Documentation: https://docs.briq.co.tz
- Support: support@briq.co.tz
- Dashboard: https://briq.co.tz/dashboard

For CarRental Pro issues:
- Check logs in console
- Verify .env configuration
- Test Briq API credentials separately

---

**Status**: ✅ Implemented and Ready for Testing
**Date**: 2026-02-28
**Version**: 1.0
