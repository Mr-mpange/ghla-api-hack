# WhatsApp Business API Setup Guide

This guide will help you get the correct WhatsApp Business API credentials to fix the "Object with ID does not exist" error.

## 🚨 Current Error

```
Graph API error: Unsupported post request. Object with ID '910852788786740' does not exist, cannot be loaded due to missing permissions, or does not support this operation.
```

This error occurs because the `WHATSAPP_PHONE_NUMBER_ID` in your `.env` file doesn't exist or you don't have access to it.

## 📋 Step-by-Step Setup

### Step 1: Access Meta Business Manager

1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Log in with your Facebook account
3. Select your business account (or create one if needed)

### Step 2: Create/Access WhatsApp Business App

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Click "Create App" or select your existing app
3. Choose "Business" as the app type
4. Add "WhatsApp" product to your app

### Step 3: Get Your Credentials

#### A. Access Token
1. In your app dashboard, go to **WhatsApp > API Setup**
2. Copy the **Temporary Access Token** (starts with `EAA...`)
3. For production, generate a **Permanent Access Token**

#### B. Phone Number ID
1. In **WhatsApp > API Setup**, look for **Phone Numbers**
2. You'll see a list of phone numbers with their IDs
3. Copy the **Phone Number ID** (numeric, like `123456789012345`)

#### C. Business Account ID
1. In **WhatsApp > API Setup**, look for **Business Account ID**
2. Copy the **WhatsApp Business Account ID** (numeric)

### Step 4: Update Your .env File

Replace the placeholder values in your `.env` file:

```bash
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=EAAGamym1bj8BQRQK3og7vGrZBF9QFzHfj8Og5DgSAwt2g2ezqhK4UeYq2eZBrcyV70K0r4DFojtDzFmFWaIRVvnyciICa2QxYukrZBF9QFzHfj8Og5DgSAwt2g2ezqhK4UeYq2eZBrcyV70K0r4DFojtDzFmFWaIRVvnyciICa2QxYukrZBZBBF6MttYUek6Er7t540lE6pIQ20ZCP9ZAYKFONrDscL7P7sF9ZCfgTJOKZAZCU12Kq9HMYbxxJicZChZCS8NlxGKFuiCUrD860DDbQvqpwvXUKfC7nH3nc86swglLFmao5H3ozvJQJZCtdyDr5trdDZAisDopFwLBqZCoZCMMBFbA0RkH8bcL51NpjMMS2hSq0XLVcOT
WHATSAPP_PHONE_NUMBER_ID=your_actual_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_actual_business_account_id_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=carrentalpro_verify_2024
WHATSAPP_CALLBACK_URL=https://carrentalpro.com/webhook/whatsapp
WHATSAPP_BUSINESS_NUMBER=+255683859574
```

### Step 5: Set Up Webhook in Meta

1. In **WhatsApp > Configuration**, find **Webhook**
2. Set **Callback URL**: `https://carrentalpro.com/webhook/whatsapp`
3. Set **Verify Token**: `carrentalpro_verify_2024` (must match your .env)
4. Subscribe to webhook fields:
   - `messages`
   - `message_deliveries`
   - `message_reads`
   - `message_reactions`

## 🔧 For Ghala Rails Integration

Since you're using Ghala Rails, you might need to:

### Option 1: Use Ghala's WhatsApp Integration
If Ghala provides WhatsApp integration, use their credentials:

```bash
# Use Ghala's WhatsApp credentials instead
WHATSAPP_ACCESS_TOKEN=your_ghala_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_ghala_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_ghala_business_account_id
```

### Option 2: Configure Your Own WhatsApp Business API
Follow the steps above to set up your own WhatsApp Business API account.

## 🧪 Testing Your Setup

After updating your credentials, test the integration:

```bash
# Run the bot integration test
npm run test:bots

# Or test directly
node test-bot-integration.js
```

## 🚨 Common Issues & Solutions

### Issue 1: "Object does not exist"
- **Cause**: Wrong Phone Number ID
- **Solution**: Get the correct Phone Number ID from Meta Business Manager

### Issue 2: "Missing permissions"
- **Cause**: Access token doesn't have required permissions
- **Solution**: Generate a new token with `whatsapp_business_messaging` permission

### Issue 3: "Webhook verification failed"
- **Cause**: Verify token mismatch
- **Solution**: Ensure verify token in Meta matches your `.env` file

### Issue 4: "HTTPS required"
- **Cause**: Webhook URL must use HTTPS
- **Solution**: Use `https://` in your callback URL (or `localhost` for development)

## 📞 Phone Number Requirements

Your WhatsApp Business phone number must be:
- ✅ Verified with Meta
- ✅ Not used with regular WhatsApp
- ✅ Able to receive SMS for verification
- ✅ Associated with your business

## 🔐 Security Best Practices

1. **Never commit real tokens** to version control
2. **Use environment variables** for all credentials
3. **Rotate access tokens** regularly
4. **Use webhook verification** to secure endpoints
5. **Implement rate limiting** on webhook endpoints

## 📚 Additional Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Manager](https://business.facebook.com/)
- [WhatsApp Business API Setup](https://developers.facebook.com/docs/whatsapp/getting-started)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/webhooks)

## 🆘 Still Having Issues?

If you're still getting errors:

1. **Check Meta Business Manager** for any pending verifications
2. **Verify your phone number** is properly set up
3. **Test with Meta's API Explorer** first
4. **Check webhook logs** in Meta Business Manager
5. **Contact Meta Support** if credentials are correct but still failing

---

**Next Steps:**
1. Get your actual WhatsApp Business API credentials
2. Update your `.env` file with the real values
3. Test the integration again
4. Set up the webhook in Meta Business Manager