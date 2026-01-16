# WhatsApp Micro-Sales Assistant - API Test Script (PowerShell)
# This script tests all major endpoints

$BASE_URL = "http://localhost:3000"

Write-Host "🧪 Testing WhatsApp Micro-Sales Assistant API" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
$response | ConvertTo-Json -Depth 10
Write-Host ""

# Test 2: Webhook Health
Write-Host "2️⃣ Testing Webhook Health..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/api/webhooks/health" -Method Get
$response | ConvertTo-Json -Depth 10
Write-Host ""

# Test 3: Create Order
Write-Host "3️⃣ Testing Order Creation..." -ForegroundColor Yellow
$orderData = @{
    phoneNumber = "+254700123456"
    productId = "prod_001"
    quantity = 2
    deliveryAddress = "123 Test Street, Nairobi"
    customerName = "Test Customer"
} | ConvertTo-Json

try {
    $orderResponse = Invoke-RestMethod -Uri "$BASE_URL/api/orders" -Method Post -Body $orderData -ContentType "application/json"
    $orderResponse | ConvertTo-Json -Depth 10
    $orderId = $orderResponse.data.id
    Write-Host "Created Order ID: $orderId" -ForegroundColor Green
} catch {
    Write-Host "Error creating order: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Order
if ($orderId) {
    Write-Host "4️⃣ Testing Get Order..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/orders/$orderId" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
}

# Test 5: Get All Orders
Write-Host "5️⃣ Testing Get All Orders..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/api/orders?limit=5" -Method Get
$response | ConvertTo-Json -Depth 10
Write-Host ""

# Test 6: Admin Stats (requires authentication)
Write-Host "6️⃣ Testing Admin Stats..." -ForegroundColor Yellow
$credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:changeme123"))
$headers = @{
    Authorization = "Basic $credentials"
}
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/admin/stats" -Method Get -Headers $headers
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error getting admin stats: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "✅ API Tests Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Notes:" -ForegroundColor Cyan
Write-Host "- Make sure the server is running on $BASE_URL"
Write-Host "- Some tests may fail if database is empty"
Write-Host "- Admin endpoints require authentication"
Write-Host ""
