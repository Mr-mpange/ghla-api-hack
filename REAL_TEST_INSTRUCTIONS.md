# 📱 Real WhatsApp Test Instructions

## ✅ Configuration Complete!

You've configured:
- ✅ Webhook callback URL in Ghala
- ✅ Verify token in Ghala  
- ✅ WABA ID updated
- ✅ Server running on port 3000
- ✅ ngrok tunnel active

---

## 🧪 TEST NOW: Send Real WhatsApp Message

### Step 1: Open WhatsApp on Your Phone

### Step 2: Send Message to Your Business Number
**Number**: `+255 683 859 574`

### Step 3: Send This Message
```
Hello
```

### Step 4: Watch Your Server Terminal
You should see logs like:
```
Received WhatsApp webhook
Message from: 255683859574
Message text: Hello
Processing message...
Bot response generated
```

---

## 📊 What to Expect

### ✅ If Webhook is Configured Correctly:
1. You send "Hello" on WhatsApp
2. Ghala forwards webhook to your server
3. Your server logs show message received
4. Bot processes the message
5. Bot generates welcome response
6. Bot tries to send response (may fail due to token issue)

### ❌ If Webhook is NOT Configured:
1. You send "Hello" on WhatsApp
2. Nothing happens in your server logs
3. No webhook received
4. Message goes to Ghala's default webhook

---

## 🔍 Debugging

### Check Server Logs
Look for these in your terminal:
```
INFO: Received WhatsApp webhook
INFO: Message from: 255683859574
INFO: Processing message...
```

### Check ngrok Logs
Open ngrok web interface:
- Go to: http://localhost:4040
- Check if POST requests are coming to `/webhook/whatsapp`

### Check Ghala Dashboard
- Verify webhook override is saved
- Check webhook delivery logs (if available)

---

## 💡 Next Steps Based on Results

### If You See Webhook Logs ✅
**Great!** Webhook is working. The issue is only with sending responses.

**Solution**: 
- Contact Ghala support for correct way to send messages
- Or we can implement Ghala's send API

### If You DON'T See Webhook Logs ❌
**Issue**: Webhook override not active in Ghala

**Solution**:
1. Double-check Ghala dashboard
2. Ensure "Save Override" was clicked
3. Try refreshing/regenerating webhook
4. Contact Ghala support

---

## 📞 Test Commands

```bash
# Check server health
curl http://localhost:3000/health

# Check ngrok tunnel
curl https://5194-197-186-19-148.ngrok-free.app/health

# Simulate webhook (for testing)
npm run test:flow
```

---

## 🎯 Success Criteria

✅ **Webhook Working**: You see logs in terminal when you send WhatsApp message

✅ **Bot Processing**: Logs show bot is processing the message

⚠️ **Sending Blocked**: Bot can't send response (token issue - separate problem)

---

**GO AHEAD AND SEND A WHATSAPP MESSAGE NOW!** 📱

Then tell me what you see in your server terminal logs.
