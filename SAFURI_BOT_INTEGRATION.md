# Sarufi Bot Integration

This document outlines the integration of Sarufi bot service with the car rental automation system.

## Overview

Sarufi is integrated as a service within your backend to automate car rental operations. The integration is simplified - Sarufi only needs:

1. **Backend Base URL** - Your backend API endpoint
2. **Backend API Key** - For authentication with your backend
3. **Sarufi API Key** - For Sarufi service authentication

## Configuration

### Environment Variables

```bash
# Sarufi Bot Configuration
SARUFI_API_KEY=your_sarufi_api_key_here
BACKEND_BASE_URL=https://your-backend-domain.com
BACKEND_API_KEY=your_backend_api_key_here

# WhatsApp Business API Configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
WHATSAPP_CALLBACK_URL=https://your-domain.com/webhook/whatsapp
```

### Sarufi Setup

1. **Configure Sarufi Bot**:
   - Set webhook URL: `https://your-backend-domain.com/webhook/sarufi`
   - Provide your backend API key for authentication
   - Set verify token for webhook verification

2. **WhatsApp Integration**:
   - Set callback URL: `https://your-domain.com/webhook/whatsapp`
   - Configure verify token (8-64 characters)
   - Must use HTTPS (or localhost for development)

## How It Works

### Message Flow

1. **Customer sends message** → WhatsApp → Sarufi
2. **Sarufi processes message** → Sends to your backend webhook
3. **Your backend processes** → Car rental logic, database operations
4. **Backend responds** → Sarufi formats and sends to customer

### Integration Points

#### 1. Webhook Endpoint
```
POST /webhook/sarufi
```
Receives messages from Sarufi with payload:
```json
{
  "phone_number": "+255683859574",
  "message": "I want to rent a car",
  "message_type": "text",
  "timestamp": "2024-01-17T10:30:00Z"
}
```

#### 2. Message Processing
Your backend processes the message through:
```
POST /api/chat/process
```

#### 3. Response Handling
Sarufi automatically handles sending responses back to customers.

## Service Architecture

### SarufiService Class

```javascript
const sarufiService = require('./services/sarufiService');

// Configure Sarufi with backend
await sarufiService.configureSarufiBot();

// Process incoming message
const result = await sarufiService.processMessage(phoneNumber, message);

// Health check
const health = await sarufiService.healthCheck();
```

### Key Methods

- `configureSarufiBot()` - Sets up Sarufi with backend webhook
- `processMessage()` - Processes incoming messages through backend
- `sendResponse()` - Formats responses for Sarufi
- `healthCheck()` - Checks service configuration
- `testConnection()` - Tests backend connectivity

## Bot Middleware Integration

The bot middleware automatically routes messages based on phone numbers:
- **Tanzania (+255)** → Sarufi Bot
- **Kenya (+254)** → WhatsApp Business API

### Routing Logic

```javascript
// Phone-based routing
if (phoneNumber.startsWith('+255')) {
  // Route to Sarufi for Tanzania
  return await sarufiService.processMessage(phoneNumber, message);
} else if (phoneNumber.startsWith('+254')) {
  // Route to WhatsApp Business API for Kenya
  return await whatsappService.sendMessage(phoneNumber, message);
}
```

## Webhook Verification

For WhatsApp webhook verification:

```javascript
// GET /webhook/sarufi
// Verifies webhook with challenge response
if (mode === 'subscribe' && token === verifyToken) {
  res.status(200).send(challenge);
}
```

## Health Monitoring

Monitor Sarufi service health:

```bash
GET /webhook/sarufi/health
```

Response:
```json
{
  "status": "healthy",
  "service": "sarufi",
  "config": {
    "api_key_configured": true,
    "backend_url_configured": true,
    "backend_api_key_configured": true,
    "enabled": true
  }
}
```

## Error Handling

The service includes comprehensive error handling:

- **Configuration errors** - Missing API keys or URLs
- **Network errors** - Backend connectivity issues
- **Webhook errors** - Invalid payloads or verification failures
- **Processing errors** - Message processing failures

## Testing

Test the integration:

```javascript
// Test backend connection
const connectionTest = await sarufiService.testConnection();

// Test message processing
const result = await sarufiService.processMessage('+255683859574', 'Hello');

// Check configuration
const config = sarufiService.getConfiguration();
```

## Security

- All API calls use Bearer token authentication
- Webhook verification with verify tokens
- HTTPS required for production webhooks
- Environment variables for sensitive data

## Deployment Notes

1. **Environment Setup**:
   - Configure all required environment variables
   - Ensure backend API is accessible from Sarufi
   - Set up HTTPS for webhook endpoints

2. **Sarufi Configuration**:
   - Set webhook URL in Sarufi dashboard
   - Provide backend API key for authentication
   - Configure WhatsApp Business API settings

3. **Testing**:
   - Test webhook connectivity
   - Verify message processing flow
   - Check error handling and logging

This simplified integration allows Sarufi to work seamlessly with your car rental backend while maintaining clean separation of concerns.