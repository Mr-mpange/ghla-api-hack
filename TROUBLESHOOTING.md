# 🔧 Troubleshooting Guide

Common issues and solutions for the WhatsApp Micro-Sales Assistant.

---

## 🚨 Common Issues

### 1. Server Won't Start

#### Error: "Cannot find module 'express'"

**Problem:** Dependencies not installed

**Solution:**
```bash
npm install
```

#### Error: "Port 3000 is already in use"

**Problem:** Another process is using port 3000

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Or change port in .env
PORT=3001
```

#### Error: "GHALA_API_KEY is not defined"

**Problem:** Environment variables not loaded

**Solution:**
1. Ensure `.env` file exists
2. Check `.env` has correct values
3. Restart the server

```bash
cp .env.example .env
# Edit .env with your credentials
npm start
```

---

### 2. Database Issues

#### Error: "SQLITE_CANTOPEN: unable to open database file"

**Problem:** Data directory doesn't exist or no write permissions

**Solution:**
```bash
# Create data directory
mkdir data

# Check permissions (Linux/Mac)
chmod 755 data

# Windows - ensure folder is not read-only
```

#### Error: "Database is locked"

**Problem:** Multiple processes accessing database

**Solution:**
```bash
# Stop all processes
pm2 stop all

# Delete lock file
rm data/sales_assistant.db-journal

# Restart
npm start
```

#### Database Corruption

**Problem:** Database file is corrupted

**Solution:**
```bash
# Backup current database
cp data/sales_assistant.db data/sales_assistant.db.backup

# Delete corrupted database
rm data/sales_assistant.db

# Restart server (will create new database)
npm start
```

---

### 3. Webhook Issues

#### Webhooks Not Receiving Events

**Problem:** Webhook URL not accessible or signature verification failing

**Checklist:**
- [ ] Server is running
- [ ] Webhook URL is publicly accessible
- [ ] HTTPS is configured (required for production)
- [ ] Webhook secret matches Ghala dashboard
- [ ] Firewall allows incoming connections

**Test webhook accessibility:**
```bash
curl https://your-domain.com/api/webhooks/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Webhook endpoint is healthy"
}
```

#### Error: "Invalid signature"

**Problem:** Webhook secret mismatch

**Solution:**
1. Check `GHALA_WEBHOOK_SECRET` in `.env`
2. Verify it matches Ghala dashboard
3. Regenerate webhook secret if needed
4. Update both `.env` and Ghala dashboard

#### Webhook Events Not Processing

**Problem:** Event handler errors

**Solution:**
```bash
# Check server logs
pm2 logs whatsapp-sales

# Look for error messages
# Common issues:
# - Database connection errors
# - Invalid order IDs
# - WhatsApp API errors
```

---

### 4. WhatsApp Message Issues

#### Messages Not Sending

**Problem:** Ghala API errors or invalid credentials

**Checklist:**
- [ ] `GHALA_API_KEY` is correct
- [ ] API key has WhatsApp permissions
- [ ] Sufficient API credits
- [ ] Phone number format is correct (+254...)
- [ ] WhatsApp Business number is verified

**Test API connection:**
```bash
curl https://api.ghala.io/v1/account \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Error: "Invalid phone number"

**Problem:** Phone number format incorrect

**Solution:**
- Use international format: `+254700123456`
- Include country code
- No spaces or special characters
- Example: `+254700123456` ✅
- Wrong: `0700123456` ❌

#### Interactive Buttons Not Working

**Problem:** WhatsApp API version or format issues

**Solution:**
1. Check Ghala API documentation for latest format
2. Verify WhatsApp Business account is approved
3. Test with simple text messages first
4. Review server logs for API errors

---

### 5. Payment Issues

#### Payment Not Initiating

**Problem:** Order not found or Ghala API errors

**Checklist:**
- [ ] Order exists in database
- [ ] Order status is 'pending'
- [ ] Payment method is valid ('mpesa' or 'card')
- [ ] Customer phone number is correct

**Debug:**
```bash
# Check order exists
curl http://localhost:3000/api/orders/ORDER_ID

# Check server logs
pm2 logs whatsapp-sales --lines 50
```

#### Payment Success But No Receipt

**Problem:** Webhook not received or processing error

**Solution:**
1. Check webhook logs
2. Verify `payment.success` event is subscribed
3. Test webhook manually:

```bash
curl -X POST http://localhost:3000/api/webhooks/ghala \
  -H "Content-Type: application/json" \
  -H "x-ghala-signature: test" \
  -d '{
    "event": "payment.success",
    "data": {
      "order_id": "YOUR_ORDER_ID",
      "transaction_reference": "TEST123"
    }
  }'
```

#### M-Pesa Payment Failing

**Problem:** M-Pesa configuration or customer issues

**Common Causes:**
- Insufficient balance
- Wrong PIN
- M-Pesa service down
- Invalid phone number
- Transaction limits exceeded

**Solution:**
- Ask customer to retry
- Verify phone number
- Check M-Pesa service status
- Review Ghala dashboard for error details

---

### 6. Admin Dashboard Issues

#### Dashboard Not Loading

**Problem:** Static files not served or authentication issues

**Solution:**
```bash
# Check public folder exists
ls public/admin/index.html

# Verify server is running
curl http://localhost:3000/health

# Access dashboard
# URL: http://localhost:3000/admin
```

#### Error: "Authentication required"

**Problem:** Invalid credentials

**Solution:**
1. Check credentials in `.env`:
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=changeme123
   ```
2. Use correct format in browser:
   - Username: `admin`
   - Password: `changeme123`

#### Dashboard Shows No Data

**Problem:** No orders in database or API errors

**Solution:**
1. Create test order:
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254700123456",
    "productId": "prod_001",
    "quantity": 1
  }'
```

2. Check browser console for errors (F12)
3. Verify API endpoints are accessible

---

### 7. Deployment Issues

#### PM2 Not Starting

**Problem:** PM2 not installed or configuration error

**Solution:**
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start src/server.js --name whatsapp-sales

# Check status
pm2 status

# View logs
pm2 logs whatsapp-sales
```

#### Application Crashes on Startup

**Problem:** Missing dependencies or configuration errors

**Solution:**
```bash
# Check PM2 logs
pm2 logs whatsapp-sales --lines 100

# Common issues:
# - Missing .env file
# - Invalid environment variables
# - Database permission errors
# - Port already in use

# Restart with fresh install
pm2 delete whatsapp-sales
rm -rf node_modules
npm install
pm2 start src/server.js --name whatsapp-sales
```

#### HTTPS/SSL Issues

**Problem:** SSL certificate errors

**Solution:**
1. Use Let's Encrypt for free SSL:
```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure Nginx or use in Node.js
```

2. Or use Cloudflare for free SSL
3. Or deploy to Heroku/Railway (SSL included)

---

### 8. Performance Issues

#### Slow Response Times

**Problem:** Database queries or API calls taking too long

**Solution:**
1. Add database indexes:
```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_payments_order ON payments(order_id);
```

2. Implement caching with Redis
3. Optimize database queries
4. Use connection pooling

#### High Memory Usage

**Problem:** Memory leaks or too many concurrent requests

**Solution:**
```bash
# Monitor memory
pm2 monit

# Restart if needed
pm2 restart whatsapp-sales

# Set memory limit
pm2 start src/server.js --name whatsapp-sales --max-memory-restart 500M
```

#### Database Growing Too Large

**Problem:** Too many old records

**Solution:**
```sql
-- Archive old orders (older than 6 months)
DELETE FROM orders WHERE created_at < date('now', '-6 months');

-- Vacuum database to reclaim space
VACUUM;
```

---

## 🔍 Debugging Tips

### Enable Debug Logging

Add to `.env`:
```
NODE_ENV=development
```

This enables debug logs in the logger utility.

### Check Server Logs

```bash
# PM2 logs
pm2 logs whatsapp-sales

# Last 100 lines
pm2 logs whatsapp-sales --lines 100

# Follow logs in real-time
pm2 logs whatsapp-sales --lines 0

# Error logs only
pm2 logs whatsapp-sales --err
```

### Test Individual Components

#### Test Database Connection
```bash
node -e "const db = require('./src/config/database'); console.log('Database connected');"
```

#### Test Ghala API
```bash
curl https://api.ghala.io/v1/account \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Test WhatsApp Messaging
```javascript
// Create test script: test-whatsapp.js
require('dotenv').config();
const whatsappService = require('./src/services/whatsappService');

whatsappService.sendGreeting('+254700123456')
  .then(() => console.log('Message sent!'))
  .catch(err => console.error('Error:', err));
```

Run:
```bash
node test-whatsapp.js
```

### Monitor API Requests

Add request logging middleware in `src/server.js`:

```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

---

## 📞 Getting Help

### Before Asking for Help

1. **Check logs:**
   ```bash
   pm2 logs whatsapp-sales --lines 100
   ```

2. **Verify configuration:**
   ```bash
   cat .env
   ```

3. **Test basic functionality:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Review error messages carefully**

### Where to Get Help

1. **Documentation:**
   - `README.md` - Overview
   - `QUICKSTART.md` - Quick setup
   - `SETUP_GUIDE.md` - Detailed setup
   - `API_DOCUMENTATION.md` - API reference

2. **Ghala Support:**
   - [Ghala Documentation](https://docs.ghala.io)
   - Ghala Dashboard support chat
   - Email: support@ghala.io

3. **Community:**
   - GitHub Issues
   - Stack Overflow
   - Developer forums

### Information to Include When Asking for Help

- Operating system and version
- Node.js version (`node --version`)
- Error messages (full stack trace)
- Server logs (last 50 lines)
- Steps to reproduce the issue
- What you've already tried

---

## 🛠️ Maintenance Tasks

### Regular Maintenance

#### Daily
- Monitor server logs
- Check error rates
- Verify webhook delivery

#### Weekly
- Review database size
- Check API usage/credits
- Update dependencies if needed
- Backup database

#### Monthly
- Rotate API keys
- Review security logs
- Update documentation
- Performance optimization

### Backup Database

```bash
# Create backup
cp data/sales_assistant.db backups/sales_assistant_$(date +%Y%m%d).db

# Automated backup script
#!/bin/bash
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR
cp data/sales_assistant.db $BACKUP_DIR/sales_assistant_$(date +%Y%m%d_%H%M%S).db

# Keep only last 7 days
find $BACKUP_DIR -name "sales_assistant_*.db" -mtime +7 -delete
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific package
npm update express

# Test after updating
npm test
npm start
```

---

## 🔐 Security Checklist

- [ ] Changed default admin credentials
- [ ] Using HTTPS in production
- [ ] Webhook signatures verified
- [ ] Environment variables secured
- [ ] Database backed up regularly
- [ ] API keys rotated periodically
- [ ] Rate limiting implemented
- [ ] Error messages don't expose sensitive data
- [ ] Logs don't contain sensitive information
- [ ] Dependencies are up to date

---

## 📊 Health Check Checklist

Run these checks regularly:

```bash
# 1. Server is running
curl http://localhost:3000/health

# 2. Webhook endpoint is accessible
curl http://localhost:3000/api/webhooks/health

# 3. Database is accessible
curl http://localhost:3000/api/orders

# 4. Admin dashboard loads
curl http://localhost:3000/admin -u admin:changeme123

# 5. PM2 status is online
pm2 status

# 6. No errors in logs
pm2 logs whatsapp-sales --lines 50 --err
```

---

**Need more help? Check the other documentation files or create an issue on GitHub!**
