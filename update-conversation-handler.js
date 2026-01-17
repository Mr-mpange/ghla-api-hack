#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the conversation handler file
const filePath = path.join(__dirname, 'src/handlers/carRentalConversationHandler.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all whatsappService calls with botMiddleware calls
content = content.replace(/whatsappService\.sendMessage/g, 'botMiddleware.sendMessage');
content = content.replace(/whatsappService\.sendInteractiveButtons/g, 'botMiddleware.sendInteractiveButtons');
content = content.replace(/whatsappService\.sendInteractiveList/g, 'botMiddleware.sendInteractiveList');
content = content.replace(/whatsappService\.sendImage/g, 'botMiddleware.sendImage');
content = content.replace(/whatsappService\.sendDocument/g, 'botMiddleware.sendDocument');
content = content.replace(/whatsappService\.sendLocation/g, 'botMiddleware.sendLocation');
content = content.replace(/whatsappService\.sendTemplate/g, 'botMiddleware.sendTemplate');

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('✅ Updated carRentalConversationHandler.js to use botMiddleware');

// Also update the workflow automation service
const workflowPath = path.join(__dirname, 'src/services/workflowAutomationService.js');
let workflowContent = fs.readFileSync(workflowPath, 'utf8');

// Replace whatsappService with botMiddleware in workflow automation
workflowContent = workflowContent.replace(/const whatsappService = require\('\.\/whatsappService'\);/g, 
  "const botMiddleware = require('../middleware/botMiddleware');");
workflowContent = workflowContent.replace(/whatsappService\.sendMessage/g, 'botMiddleware.sendMessage');

fs.writeFileSync(workflowPath, workflowContent);

console.log('✅ Updated workflowAutomationService.js to use botMiddleware');

console.log('🎉 All services updated to use bot middleware with Safuri Bot integration!');