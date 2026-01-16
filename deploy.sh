#!/bin/bash

# WhatsApp Micro-Sales Assistant - Deployment Script
# This script helps deploy the application to production

echo "🚀 WhatsApp Micro-Sales Assistant - Deployment"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data
echo "✅ Data directory ready"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 is not installed. Installing PM2..."
    npm install -g pm2
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install PM2"
        exit 1
    fi
    echo "✅ PM2 installed"
fi
echo ""

# Stop existing process
echo "🛑 Stopping existing process..."
pm2 stop whatsapp-sales 2>/dev/null || true
pm2 delete whatsapp-sales 2>/dev/null || true
echo ""

# Start application
echo "🚀 Starting application..."
pm2 start src/server.js --name whatsapp-sales
if [ $? -ne 0 ]; then
    echo "❌ Failed to start application"
    exit 1
fi
echo ""

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save
echo ""

# Setup PM2 startup
echo "🔧 Setting up PM2 startup..."
pm2 startup
echo ""

# Show status
echo "📊 Application Status:"
pm2 status
echo ""

# Show logs
echo "📝 Recent Logs:"
pm2 logs whatsapp-sales --lines 20 --nostream
echo ""

echo "✅ Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure webhooks in Ghala Dashboard"
echo "2. Test the API: curl http://localhost:3000/health"
echo "3. Access admin dashboard: http://localhost:3000/admin"
echo "4. Monitor logs: pm2 logs whatsapp-sales"
echo ""
echo "🔗 Useful Commands:"
echo "- View logs: pm2 logs whatsapp-sales"
echo "- Restart: pm2 restart whatsapp-sales"
echo "- Stop: pm2 stop whatsapp-sales"
echo "- Monitor: pm2 monit"
echo ""
