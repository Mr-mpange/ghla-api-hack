# 🔧 Change Webhook Override in Ghala

## ❌ Current Problem

Your webhook override is pointing to Ghala's server:
```
https://api.ghala.io/webhook/DqhvlHM06dPPZpW3xLjp7Q-fCyMpngGxzD60vWns7ao
```

This means messages go to Ghala, not to your server!

---

## ✅ What You Need to Change It To

Change the override URL to YOUR ngrok URL:
```
https://5194-197-186-19-148.ngrok-free.app/webhook/whatsapp
```

---

## 📝 Step-by-Step Instructions

### In Ghala Dashboard:

1. **Find the Override Section**
   - Look for "Advanced Settings"
   - Or "Custom Webhook Override"
   - Or "Forward to your own server"

2. **You Should See**:
   ```
   Current Override:
   https://api.ghala.io/webhook/DqhvlHM06dPPZpW3xLjp7Q-fCyMpngGxzD60vWns7ao
   ```

3. **Change It To**:
   ```
   Callback URL: https://5194-197-186-19-148.ngrok-free.app/webhook/whatsapp
   Verify Token: carrentalpro_verify_2024
   ```

4. **Click "Save Override" or "Update"**

5. **Verify It Changed**:
   - The override should now show YOUR ngrok URL
   - Not Ghala's URL

---

## 🎯 What It Should Look Like After

### BEFORE (Current - Wrong):
```
Override: https://api.ghala.io/webhook/DqhvlHM06dPPZpW3xLjp7Q-fCyMpngGxzD60vWns7ao
```

### AFTER (Correct):
```
Override: https://5194-197-186-19-148.ngrok-free.app/webhook/whatsapp
```

---

## 🔍 How to Find the Field to Change

Look for one of these:

### Option 1: Text Input Field
```
┌─────────────────────────────────────────┐
│ Override Callback URL:                  │
│ [https://api.ghala.io/webhook/...]     │ ← CHANGE THIS
│                                         │
│ Verify Token:                           │
│ [ghala_jGroLQtGxp2L5Vbbkpy7Ae...]      │ ← CHANGE THIS
│                                         │
│ [Save Override]                         │
└─────────────────────────────────────────┘
```

### Option 2: Edit Button
```
Current Override: https://api.ghala.io/webhook/...
[Edit] [Delete] [Refresh]
                 ↑
              Click Edit
```

### Option 3: Regenerate Button
```
Current Override: https://api.ghala.io/webhook/...
[Regenerate]  ← Don't click this!
              Instead, look for Edit or input field
```

---

## ⚠️ Important Notes

### DON'T Click "Regenerate"
- This creates a NEW Ghala webhook
- You want to CHANGE the existing override

### DO Look For:
- "Edit" button
- Input field with the URL
- "Custom webhook" section
- "Override settings"

---

## 🧪 After Changing, Test:

1. **Save the changes in Ghala**

2. **Send WhatsApp message** to: +255 683 859 574

3. **Check your server logs** - you should see:
   ```
   INFO: Received WhatsApp webhook
   INFO: Message from: 255683859574
   ```

4. **Check ngrok** (http://localhost:4040):
   - You should see POST request to `/webhook/whatsapp`

---

## 💡 If You Can't Find Where to Edit

The override URL might be:
- Read-only (can't be changed directly)
- Need to delete and create new
- In a different section

**Try this**:
1. Look for "Delete Override" or "Remove Override"
2. Delete the current override
3. Create new override with YOUR URL
4. Save

---

## 📞 Still Can't Change It?

Contact Ghala Support:

**Email**: support@ghala.io

**Message**:
```
Hi,

I need to change my webhook override for phone number 994495747086170.

Current override: https://api.ghala.io/webhook/DqhvlHM06dPPZpW3xLjp7Q-fCyMpngGxzD60vWns7ao

I want to change it to: https://5194-197-186-19-148.ngrok-free.app/webhook/whatsapp

How can I update the override URL? I don't see an edit option.

Thank you!
```

---

## ✅ Success Criteria

After changing, you should see:
- ✅ Override URL shows YOUR ngrok URL (not Ghala's)
- ✅ WhatsApp messages appear in your server logs
- ✅ POST requests visible in ngrok (http://localhost:4040)

---

**The key is: You need to CHANGE the override from Ghala's URL to YOUR ngrok URL!**
