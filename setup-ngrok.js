/**
 * Setup Guide for ngrok to expose local server
 * 
 * ngrok creates a secure tunnel to your localhost,
 * making it accessible from the internet for webhook testing
 */

console.log('\n🌐 NGROK SETUP GUIDE FOR WHATSAPP WEBHOOKS\n');
console.log('='.repeat(60));

console.log('\n📋 Step 1: Install ngrok');
console.log('-'.repeat(60));
console.log('Option A - Download from website:');
console.log('   1. Go to: https://ngrok.com/download');
console.log('   2. Download for Windows');
console.log('   3. Extract ngrok.exe to a folder');
console.log('   4. Add to PATH or run from folder');
console.log('');
console.log('Option B - Using Chocolatey (if installed):');
console.log('   choco install ngrok');
console.log('');
console.log('Option C - Using npm:');
console.log('   npm install -g ngrok');

console.log('\n📋 Step 2: Create ngrok Account (Free)');
console.log('-'.repeat(60));
console.log('   1. Go to: https://dashboard.ngrok.com/signup');
console.log('   2. Sign up for free account');
console.log('   3. Get your authtoken from dashboard');
console.log('   4. Run: ngrok config add-authtoken YOUR_TOKEN');

console.log('\n📋 Step 3: Start Your Server');
console.log('-'.repeat(60));
console.log('   npm run dev');
console.log('   (Server should be running on port 3000)');

console.log('\n📋 Step 4: Start ngrok Tunnel');
console.log('-'.repeat(60));
console.log('Open a NEW terminal and run:');
console.log('   ngrok http 3000');
console.log('');
console.log('You will see output like:');
console.log('   Forwarding: https://abc123.ngrok.io -> http://localhost:3000');
console.log('');
console.log('⚠️  IMPORTANT: Copy the https URL (e.g., https://abc123.ngrok.io)');

console.log('\n📋 Step 5: Update .env File');
console.log('-'.repeat(60));
console.log('Replace APP_URL with your ngrok URL:');
console.log('   APP_URL=https://abc123.ngrok.io');
console.log('');
console.log('Also update:');
console.log('   WHATSAPP_CALLBACK_URL=https://abc123.ngrok.io/webhook/whatsapp');

console.log('\n📋 Step 6: Configure WhatsApp Webhook');
console.log('-'.repeat(60));
console.log('1. Go to: https://developers.facebook.com/apps');
console.log('2. Select your app → WhatsApp → Configuration');
console.log('3. Click "Edit" next to Webhook');
console.log('4. Enter:');
console.log('   Callback URL: https://abc123.ngrok.io/webhook/whatsapp');
console.log('   Verify Token: carrentalpro_verify_2024');
console.log('5. Click "Verify and Save"');
console.log('6. Subscribe to "messages" webhook field');

console.log('\n📋 Step 7: Test the Webhook');
console.log('-'.repeat(60));
console.log('   npm run test:send');
console.log('');
console.log('Or send a WhatsApp message to your business number');

console.log('\n💡 IMPORTANT NOTES:');
console.log('-'.repeat(60));
console.log('• Free ngrok URLs change every time you restart ngrok');
console.log('• You need to update webhook URL in Meta each time');
console.log('• For production, use a permanent domain');
console.log('• Keep both terminals open (server + ngrok)');

console.log('\n🚀 PRODUCTION DEPLOYMENT:');
console.log('-'.repeat(60));
console.log('For production, deploy to:');
console.log('• Heroku: https://heroku.com');
console.log('• Railway: https://railway.app');
console.log('• Render: https://render.com');
console.log('• DigitalOcean: https://digitalocean.com');
console.log('• AWS/Azure/GCP');
console.log('');
console.log('Then use your permanent domain in webhook configuration');

console.log('\n📞 TROUBLESHOOTING:');
console.log('-'.repeat(60));
console.log('If webhook verification fails:');
console.log('1. Ensure server is running (check http://localhost:3000/health)');
console.log('2. Ensure ngrok is running and showing "online"');
console.log('3. Test ngrok URL in browser: https://abc123.ngrok.io/health');
console.log('4. Check verify token matches exactly: carrentalpro_verify_2024');
console.log('5. Check server logs for incoming requests');

console.log('\n✅ QUICK START COMMANDS:');
console.log('-'.repeat(60));
console.log('Terminal 1:');
console.log('   npm run dev');
console.log('');
console.log('Terminal 2:');
console.log('   ngrok http 3000');
console.log('');
console.log('Then copy the ngrok URL and update .env and Meta webhook config');

console.log('\n' + '='.repeat(60));
console.log('📚 For more info: https://ngrok.com/docs');
console.log('='.repeat(60));
console.log('');
