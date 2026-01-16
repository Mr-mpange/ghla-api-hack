// Product catalog configuration
const products = [
  {
    id: 'prod_001',
    name: 'Premium Coffee Beans 1kg',
    price: 1500,
    currency: 'KES',
    description: 'Freshly roasted Arabica coffee beans',
    emoji: '☕'
  },
  {
    id: 'prod_002',
    name: 'Organic Honey 500g',
    price: 800,
    currency: 'KES',
    description: 'Pure organic honey from local farms',
    emoji: '🍯'
  },
  {
    id: 'prod_003',
    name: 'Handmade Soap Set',
    price: 600,
    currency: 'KES',
    description: 'Natural handmade soap - 3 pieces',
    emoji: '🧼'
  },
  {
    id: 'prod_004',
    name: 'Fresh Avocados (6 pcs)',
    price: 400,
    currency: 'KES',
    description: 'Farm-fresh avocados delivered to your door',
    emoji: '🥑'
  },
  {
    id: 'prod_005',
    name: 'Artisan Bread',
    price: 250,
    currency: 'KES',
    description: 'Freshly baked sourdough bread',
    emoji: '🍞'
  }
];

// Current promotions
const promotions = [
  {
    id: 'promo_001',
    title: 'Weekend Special',
    description: 'Buy 2 Coffee Beans, Get 1 Honey Free!',
    emoji: '🎉',
    validUntil: '2026-01-31'
  },
  {
    id: 'promo_002',
    title: 'New Customer Discount',
    description: '10% off your first order',
    emoji: '🎁',
    validUntil: '2026-02-28'
  }
];

module.exports = { products, promotions };
