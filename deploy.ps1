# WhatsApp Micro-Sales Assistant - Deployment Script (PowerShell)
# This script helps deploy the application to production

Write-Host "🚀 WhatsApp Micro-Sales Assistant - Deployment" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file from .env.example" -ForegroundColor Yellow
    exit 1
}

# Check Node.js installation
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Create data directory
Write-Host "📁 Creating data directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path data | Out-Null
Write-Host "✅ Data directory ready" -ForegroundColor Green
Write-Host ""

# Check if PM2 is installed
try {
    pm2 --version | Out-Null
    Write-Host "✅ PM2 is installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PM2 is not installed. Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install PM2" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ PM2 installed" -ForegroundColor Green
}
Write-Host ""

# Stop existing process
Write-Host "🛑 Stopping existing process..." -ForegroundColor Yellow
pm2 stop whatsapp-sales 2>$null
pm2 delete whatsapp-sales 2>$null
Write-Host ""

# Start application
Write-Host "🚀 Starting application..." -ForegroundColor Yellow
pm2 start src/server.js --name whatsapp-sales
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start application" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Save PM2 configuration
Write-Host "💾 Saving PM2 configuration..." -ForegroundColor Yellow
pm2 save
Write-Host ""

# Show status
Write-Host "📊 Application Status:" -ForegroundColor Cyan
pm2 status
Write-Host ""

# Show logs
Write-Host "📝 Recent Logs:" -ForegroundColor Cyan
pm2 logs whatsapp-sales --lines 20 --nostream
Write-Host ""

Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure webhooks in Ghala Dashboard"
Write-Host "2. Test the API: curl http://localhost:3000/health"
Write-Host "3. Access admin dashboard: http://localhost:3000/admin"
Write-Host "4. Monitor logs: pm2 logs whatsapp-sales"
Write-Host ""
Write-Host "🔗 Useful Commands:" -ForegroundColor Cyan
Write-Host "- View logs: pm2 logs whatsapp-sales"
Write-Host "- Restart: pm2 restart whatsapp-sales"
Write-Host "- Stop: pm2 stop whatsapp-sales"
Write-Host "- Monitor: pm2 monit"
Write-Host ""
