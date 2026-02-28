require('dotenv').config();

console.log('\n👀 WATCHING FOR WEBHOOKS\n');
console.log('='.repeat(60));
console.log('\n📱 Send a WhatsApp message to: +255 683 859 574');
console.log('📝 Type: "Hello"');
console.log('\n⏳ Waiting for webhook...');
console.log('   (Press Ctrl+C to stop)');
console.log('\n💡 If you see logs below, webhook is working!');
console.log('   If nothing appears, webhook is not configured correctly.');
console.log('\n' + '='.repeat(60));
console.log('\nServer logs will appear below:\n');

// Keep process running
setInterval(() => {}, 1000);
