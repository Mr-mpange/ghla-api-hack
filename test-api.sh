#!/bin/bash

# WhatsApp Micro-Sales Assistant - API Test Script
# This script tests all major endpoints

BASE_URL="http://localhost:3000"

echo "🧪 Testing WhatsApp Micro-Sales Assistant API"
echo "=============================================="
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
curl -s "$BASE_URL/health" | json_pp
echo ""
echo ""

# Test 2: Webhook Health
echo "2️⃣ Testing Webhook Health..."
curl -s "$BASE_URL/api/webhooks/health" | json_pp
echo ""
echo ""

# Test 3: Create Order
echo "3️⃣ Testing Order Creation..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254700123456",
    "productId": "prod_001",
    "quantity": 2,
    "deliveryAddress": "123 Test Street, Nairobi",
    "customerName": "Test Customer"
  }')

echo "$ORDER_RESPONSE" | json_pp
ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo ""
echo "Created Order ID: $ORDER_ID"
echo ""
echo ""

# Test 4: Get Order
if [ ! -z "$ORDER_ID" ]; then
  echo "4️⃣ Testing Get Order..."
  curl -s "$BASE_URL/api/orders/$ORDER_ID" | json_pp
  echo ""
  echo ""
fi

# Test 5: Get All Orders
echo "5️⃣ Testing Get All Orders..."
curl -s "$BASE_URL/api/orders?limit=5" | json_pp
echo ""
echo ""

# Test 6: Admin Stats (requires authentication)
echo "6️⃣ Testing Admin Stats..."
curl -s "$BASE_URL/api/admin/stats" \
  -u "admin:changeme123" | json_pp
echo ""
echo ""

echo "✅ API Tests Complete!"
echo ""
echo "📝 Notes:"
echo "- Make sure the server is running on $BASE_URL"
echo "- Some tests may fail if database is empty"
echo "- Admin endpoints require authentication"
echo ""
