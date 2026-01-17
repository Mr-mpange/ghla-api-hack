#!/usr/bin/env node

/**
 * Setup ngrok for WhatsApp Webhook Testing
 * This helps you connect your local backend to Ghala Rails via ngrok
 */

require('dotenv').config();

function setupNgrokWebhook() {
  console.log('🌐 Setting up ngrok for WhatsApp Webhook Testing\n');
  console.log('This will help you connect your local backend to Ghala Rails\n');
  console.log('═'.repeat(80));
  console.log('');

  const port = process.env.PORT || 3000;
  
  console.log('📋 Step-by-Step Setup:\n');
  
  console.log('**Step 1: Install ngrok**');
  console.log('If you don\'t have ngrok installed:');
  console.log('• Download from: https://ngrok.com/download');
  console.log('• Or install via npm: npm install -g ngrok');
  console.log('• Or install via chocolatey: choco install ngrok');
  console.log('');
  
  console.log('**Step 2: Start Your Backend Server**');
  console.log('In one terminal, run:');
  console.log(`   npm start`);
  console.log(`   # This starts your server on port ${port}`);
  console.log('');
  
  console.log('**Step 3: Start ngrok Tunnel**');
  console.log('In another terminal, run:');
  console.log(`   ngrok http ${port}`);
  console.log('   # This creates a public URL for your local server');
  console.log('');
  
  console.log('**Step 4: Copy ngrok URL**');
  console.log('ngrok will show something like:');
  console.log('   Forwarding: https://abc123.ngrok.io -> http://localhost:3000');
  console.log('   Copy the https://abc123.ngrok.io URL');
  console.log('');
  
  console.log('**Step 5: Configure Ghala Rails Webhook**');
  console.log('In your Ghala Rails dashboard:');
  console.log('• Set Callback URL: https://your-ngrok-url.ngrok.io/webhook/ghala');
  console.log('• Set Verify Token: carrentalpro_verify_2024');
  console.log('• Save the webhook configuration');
  console.log('');
  
  console.log('🧪 **Step 6: Test the Connection**');
  console.log('1. Send "Hi" to your WhatsApp: +255683859574');
  console.log('2. Check your terminal for webhook logs');
  console.log('3. Triple Jay should get an automatic response!');
  console.log('');
  
  console.log('📱 **Expected Flow:**');
  console.log('Customer texts WhatsApp → Ghala Rails → ngrok → Your Backend → Response');
  console.log('');
  
  console.log('🔧 **Webhook Endpoints Available:**');
  console.log(`• Ghala Webhook: http://localhost:${port}/webhook/ghala`);
  console.log(`• Sarufi Webhook: http://localhost:${port}/webhook/sarufi`);
  console.log(`• WhatsApp Webhook: http://localhost:${port}/webhook/whatsapp`);
  console.log(`• Health Check: http://localhost:${port}/health`);
  console.log('');
  
  console.log('🌐 **ngrok URLs (replace abc123 with your actual ngrok subdomain):**');
  console.log('• Ghala Webhook: https://abc123.ngrok.io/webhook/ghala');
  console.log('• Sarufi Webhook: https://abc123.ngrok.io/webhook/sarufi');
  console.log('• Health Check: https://abc123.ngrok.io/health');
  console.log('');
  
  console.log('📊 **Monitoring Your Webhooks:**');
  console.log('• ngrok Web Interface: http://localhost:4040');
  console.log('• View all HTTP requests and responses');
  console.log('• Debug webhook calls in real-time');
  console.log('');
  
  console.log('🚨 **Troubleshooting:**');
  console.log('');
  console.log('**Issue: ngrok tunnel not working**');
  console.log('• Check if port 3000 is available');
  console.log('• Make sure your server is running first');
  console.log('• Try a different port: ngrok http 3001');
  console.log('');
  console.log('**Issue: Webhook verification fails**');
  console.log('• Check verify token matches in .env file');
  console.log('• Ensure webhook URL ends with /webhook/ghala');
  console.log('• Check ngrok URL is accessible');
  console.log('');
  console.log('**Issue: No response to WhatsApp messages**');
  console.log('• Check terminal logs for webhook calls');
  console.log('• Verify WhatsApp Business API credentials');
  console.log('• Test webhook endpoint manually');
  console.log('');
  
  console.log('🎯 **Quick Test Commands:**');
  console.log('');
  console.log('# Test webhook locally');
  console.log(`curl -X POST http://localhost:${port}/webhook/ghala/test \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"phone_number": "+255756645935", "message": "Hi", "name": "Triple Jay"}\'');
  console.log('');
  console.log('# Test via ngrok (replace with your ngrok URL)');
  console.log('curl -X POST https://abc123.ngrok.io/webhook/ghala/test \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"phone_number": "+255756645935", "message": "Hi", "name": "Triple Jay"}\'');
  console.log('');
  
  console.log('✅ **Success Indicators:**');
  console.log('• ngrok shows "Session Status: online"');
  console.log('• Your server logs show incoming webhook requests');
  console.log('• WhatsApp messages get automatic responses');
  console.log('• ngrok web interface shows HTTP 200 responses');
  console.log('');
  
  console.log('🎉 **Once Working:**');
  console.log('• Triple Jay will get instant responses');
  console.log('• All customers get 24/7 car rental assistance');
  console.log('• You can see all interactions in real-time');
  console.log('• Perfect for testing and development');
}

// Run the setup guide
if (require.main === module) {
  setupNgrokWebhook();
  console.log('\n🚀 Ready to set up ngrok webhook connection!');
  console.log('Follow the steps above to connect your backend to Ghala Rails');
  process.exit(0);
}

module.exports = { setupNgrokWebhook };