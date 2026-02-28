# How to Edit Car Rental Prices

## Location
File: `src/services/carRentalBotService.js`

Function: `initializeCarCatalog()` (starts around line 14)

## Current Prices

### Economy Cars
- **Toyota Vitz**: TZS 2,500/day (line 22)
- **Nissan March**: TZS 2,800/day (line 30)
- **Suzuki Swift**: TZS 3,000/day (line 38)

### SUV Cars
- **Toyota RAV4**: TZS 4,500/day
- **Honda CR-V**: TZS 5,000/day
- **Nissan X-Trail**: TZS 5,500/day

### Luxury Cars
- **Mercedes C-Class**: TZS 10,000/day
- **BMW 5 Series**: TZS 12,000/day
- **Audi A6**: TZS 10,000/day

### Vans
- **Toyota Hiace**: TZS 8,000/day
- **Nissan Urvan**: TZS 7,500/day
- **Mercedes Vito**: TZS 9,000/day

## How to Change Prices

### Step 1: Open the File
Open `src/services/carRentalBotService.js` in your editor

### Step 2: Find the Car
Search for the car name (e.g., "Toyota Vitz")

### Step 3: Change the Price
Find the line with `price: 2500,` and change the number

### Example:
```javascript
{
  id: 'eco_001',
  name: 'Toyota Vitz',
  price: 2500,  // ← Change this number
  features: ['Automatic', 'AC', 'Fuel Efficient', '4 Seats'],
  available: true,
  location: 'Nairobi, Dar es Salaam'
}
```

To change Toyota Vitz to TZS 3,000/day:
```javascript
{
  id: 'eco_001',
  name: 'Toyota Vitz',
  price: 3000,  // ← Changed from 2500 to 3000
  features: ['Automatic', 'AC', 'Fuel Efficient', '4 Seats'],
  available: true,
  location: 'Nairobi, Dar es Salaam'
}
```

### Step 4: Save the File
Save the file after making changes

### Step 5: Restart the Server
```bash
# Stop the server (Ctrl+C)
# Then restart it
node src/server.js
```

## Important Notes

1. **Price Format**: Enter prices as numbers without commas
   - ✅ Correct: `price: 5000`
   - ❌ Wrong: `price: 5,000`
   - ❌ Wrong: `price: "5000"`

2. **Currency**: All prices are in TZS (Tanzanian Shillings)

3. **Daily Rate**: Prices are per day

4. **Payment Calculation**: 
   - Total = Price × Number of Days
   - Deposit = 50% of Total (calculated automatically)

## Quick Reference - Line Numbers

Economy Cars start around line 17
SUV Cars start around line 50
Luxury Cars start around line 85
Vans start around line 120

## Testing After Changes

1. Restart the server
2. Send "hello" to the WhatsApp bot
3. Click "Browse Cars"
4. Select a category
5. Verify the new prices are showing correctly

## Example: Changing All Economy Car Prices

```javascript
economy: [
  {
    id: 'eco_001',
    name: 'Toyota Vitz',
    price: 3500,  // Changed from 2500
    // ... rest of the car details
  },
  {
    id: 'eco_002',
    name: 'Nissan March',
    price: 3800,  // Changed from 2800
    // ... rest of the car details
  },
  {
    id: 'eco_003',
    name: 'Suzuki Swift',
    price: 4000,  // Changed from 3000
    // ... rest of the car details
  }
]
```

That's it! The new prices will be reflected in:
- Car catalog listings
- Booking confirmations
- Payment amounts
- "My Bookings" display
