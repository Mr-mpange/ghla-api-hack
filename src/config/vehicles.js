// Vehicle categories and configurations for car rental system

const VEHICLE_CATEGORIES = {
  ECONOMY: 'Economy',
  COMPACT: 'Compact', 
  SUV: 'SUV',
  LUXURY: 'Luxury',
  VAN: 'Van',
  PICKUP: 'Pickup'
};

const VEHICLE_FEATURES = {
  AIR_CONDITIONING: 'air_conditioning',
  BLUETOOTH: 'bluetooth',
  GPS_NAVIGATION: 'gps_navigation',
  USB_CHARGING: 'usb_charging',
  POWER_STEERING: 'power_steering',
  LEATHER_SEATS: 'leather_seats',
  SUNROOF: 'sunroof',
  PREMIUM_SOUND: 'premium_sound',
  FOUR_WHEEL_DRIVE: '4wd',
  BACKUP_CAMERA: 'backup_camera',
  KEYLESS_ENTRY: 'keyless_entry',
  CRUISE_CONTROL: 'cruise_control'
};

const RENTAL_EXTRAS = {
  INSURANCE: {
    id: 'insurance',
    name: 'Comprehensive Insurance',
    description: 'Full coverage insurance for peace of mind',
    price: 500,
    currency: 'KES',
    unit: 'per day'
  },
  GPS: {
    id: 'gps',
    name: 'GPS Navigation System',
    description: 'Professional GPS device with latest maps',
    price: 200,
    currency: 'KES',
    unit: 'per day'
  },
  CHILD_SEAT: {
    id: 'child_seat',
    name: 'Child Safety Seat',
    description: 'Safety-certified child car seat',
    price: 300,
    currency: 'KES',
    unit: 'per day'
  },
  ADDITIONAL_DRIVER: {
    id: 'additional_driver',
    name: 'Additional Driver',
    description: 'Add another authorized driver',
    price: 400,
    currency: 'KES',
    unit: 'per day'
  },
  FULL_TANK: {
    id: 'full_tank',
    name: 'Full Tank Option',
    description: 'Return with any fuel level',
    price: 3000,
    currency: 'KES',
    unit: 'one-time'
  },
  WIFI_HOTSPOT: {
    id: 'wifi_hotspot',
    name: 'Mobile WiFi Hotspot',
    description: '4G mobile internet hotspot device',
    price: 250,
    currency: 'KES',
    unit: 'per day'
  }
};

const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  MAINTENANCE: 'maintenance',
  OUT_OF_SERVICE: 'out_of_service',
  RESERVED: 'reserved'
};

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

const PAYMENT_TYPES = {
  RENTAL: 'rental',
  DEPOSIT: 'deposit',
  EXTRA: 'extra',
  REFUND: 'refund',
  PENALTY: 'penalty'
};

// Vehicle pricing tiers based on demand
const PRICING_TIERS = {
  LOW: {
    multiplier: 0.8,
    name: 'Low Season'
  },
  NORMAL: {
    multiplier: 1.0,
    name: 'Regular'
  },
  HIGH: {
    multiplier: 1.3,
    name: 'High Season'
  },
  PEAK: {
    multiplier: 1.6,
    name: 'Peak Season'
  }
};

// Sample vehicle templates for easy setup
const SAMPLE_VEHICLES = [
  {
    make: 'Toyota',
    model: 'Vitz',
    category: VEHICLE_CATEGORIES.ECONOMY,
    year: 2020,
    seats: 5,
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    daily_rate: 2500,
    security_deposit: 10000,
    features: [
      VEHICLE_FEATURES.AIR_CONDITIONING,
      VEHICLE_FEATURES.BLUETOOTH,
      VEHICLE_FEATURES.USB_CHARGING,
      VEHICLE_FEATURES.POWER_STEERING
    ]
  },
  {
    make: 'Toyota',
    model: 'Corolla',
    category: VEHICLE_CATEGORIES.COMPACT,
    year: 2021,
    seats: 5,
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    daily_rate: 3200,
    security_deposit: 12000,
    features: [
      VEHICLE_FEATURES.AIR_CONDITIONING,
      VEHICLE_FEATURES.BLUETOOTH,
      VEHICLE_FEATURES.USB_CHARGING,
      VEHICLE_FEATURES.POWER_STEERING,
      VEHICLE_FEATURES.BACKUP_CAMERA
    ]
  },
  {
    make: 'Toyota',
    model: 'RAV4',
    category: VEHICLE_CATEGORIES.SUV,
    year: 2021,
    seats: 7,
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    daily_rate: 4500,
    security_deposit: 15000,
    features: [
      VEHICLE_FEATURES.AIR_CONDITIONING,
      VEHICLE_FEATURES.BLUETOOTH,
      VEHICLE_FEATURES.GPS_NAVIGATION,
      VEHICLE_FEATURES.FOUR_WHEEL_DRIVE,
      VEHICLE_FEATURES.SUNROOF,
      VEHICLE_FEATURES.BACKUP_CAMERA
    ]
  },
  {
    make: 'Mercedes',
    model: 'C-Class',
    category: VEHICLE_CATEGORIES.LUXURY,
    year: 2022,
    seats: 5,
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    daily_rate: 8000,
    security_deposit: 25000,
    features: [
      VEHICLE_FEATURES.AIR_CONDITIONING,
      VEHICLE_FEATURES.BLUETOOTH,
      VEHICLE_FEATURES.GPS_NAVIGATION,
      VEHICLE_FEATURES.LEATHER_SEATS,
      VEHICLE_FEATURES.PREMIUM_SOUND,
      VEHICLE_FEATURES.SUNROOF,
      VEHICLE_FEATURES.KEYLESS_ENTRY,
      VEHICLE_FEATURES.CRUISE_CONTROL
    ]
  },
  {
    make: 'Toyota',
    model: 'Hiace',
    category: VEHICLE_CATEGORIES.VAN,
    year: 2020,
    seats: 14,
    transmission: 'Manual',
    fuel_type: 'Diesel',
    daily_rate: 6000,
    security_deposit: 20000,
    features: [
      VEHICLE_FEATURES.AIR_CONDITIONING,
      VEHICLE_FEATURES.BLUETOOTH,
      VEHICLE_FEATURES.USB_CHARGING,
      VEHICLE_FEATURES.POWER_STEERING
    ]
  }
];

// Utility functions
function formatVehicleName(vehicle) {
  return `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
}

function formatPrice(amount, currency = 'KES') {
  return `${currency} ${amount.toLocaleString()}`;
}

function calculateRentalCost(dailyRate, days, extras = []) {
  const baseAmount = dailyRate * days;
  const extrasAmount = extras.reduce((total, extra) => {
    const extraConfig = RENTAL_EXTRAS[extra.type];
    if (extraConfig) {
      return total + (extraConfig.price * (extra.quantity || 1) * days);
    }
    return total;
  }, 0);
  
  return {
    baseAmount,
    extrasAmount,
    totalAmount: baseAmount + extrasAmount
  };
}

function getVehiclesByCategory(category) {
  return SAMPLE_VEHICLES.filter(vehicle => vehicle.category === category);
}

function getAvailableExtras() {
  return Object.values(RENTAL_EXTRAS);
}

module.exports = {
  VEHICLE_CATEGORIES,
  VEHICLE_FEATURES,
  RENTAL_EXTRAS,
  VEHICLE_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_TYPES,
  PRICING_TIERS,
  SAMPLE_VEHICLES,
  formatVehicleName,
  formatPrice,
  calculateRentalCost,
  getVehiclesByCategory,
  getAvailableExtras
};