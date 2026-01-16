const crypto = require('crypto');
const logger = require('./logger');

/**
 * Verify Ghala webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Signature from request header
 * @param {string} secret - Webhook secret key
 * @returns {boolean}
 */
const verifyWebhookSignature = (payload, signature, secret) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Webhook signature verification error:', error);
    return false;
  }
};

module.exports = { verifyWebhookSignature };
