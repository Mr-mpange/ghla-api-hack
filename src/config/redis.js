const Redis = require('ioredis');
const Queue = require('bull');
require('dotenv').config();

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Create Redis client
const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// Queue configurations
const queueConfig = {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Create queues
const messageQueue = new Queue('message processing', queueConfig);
const paymentQueue = new Queue('payment processing', queueConfig);
const orderQueue = new Queue('order processing', queueConfig);
const notificationQueue = new Queue('notification processing', queueConfig);

// Queue event handlers
const setupQueueEvents = (queue, name) => {
  queue.on('completed', (job) => {
    console.log(`✅ ${name} job ${job.id} completed`);
  });

  queue.on('failed', (job, err) => {
    console.error(`❌ ${name} job ${job.id} failed:`, err.message);
  });

  queue.on('stalled', (job) => {
    console.warn(`⚠️ ${name} job ${job.id} stalled`);
  });
};

setupQueueEvents(messageQueue, 'Message');
setupQueueEvents(paymentQueue, 'Payment');
setupQueueEvents(orderQueue, 'Order');
setupQueueEvents(notificationQueue, 'Notification');

module.exports = {
  redis,
  messageQueue,
  paymentQueue,
  orderQueue,
  notificationQueue,
};