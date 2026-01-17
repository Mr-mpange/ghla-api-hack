const whatsappService = require('../services/whatsappService');
const sarufiService = require('../services/sarufiService');
const logger = require('../utils/logger');

class BotMiddleware {
  constructor() {
    this.primaryBot = process.env.PRIMARY_BOT || 'whatsapp';
    this.fallbackBot = process.env.FALLBACK_BOT || 'sarufi';
    this.failoverEnabled = process.env.BOT_FAILOVER_ENABLED === 'true';
    this.loadBalancing = process.env.BOT_LOAD_BALANCING || 'phone_based';
    this.roundRobinCounter = 0;
    
    // Bot service mapping
    this.botServices = {
      whatsapp: whatsappService,
      sarufi: sarufiService
    };

    // Track bot health
    this.botHealth = {
      whatsapp: { healthy: true, lastCheck: Date.now(), failures: 0 },
      sarufi: { healthy: true, lastCheck: Date.now(), failures: 0 }
    };

    // Health check interval (5 minutes)
    this.healthCheckInterval = 5 * 60 * 1000;
    this.startHealthChecks();
  }

  // Start periodic health checks
  startHealthChecks() {
    setInterval(async () => {
      await this.checkBotHealth();
    }, this.healthCheckInterval);
  }

  // Check health of all bots
  async checkBotHealth() {
    for (const [botName, service] of Object.entries(this.botServices)) {
      try {
        const isConfigured = service.isConfigured();
        let isHealthy = false;

        if (isConfigured) {
          // Test connection if service supports it
          if (typeof service.testConnection === 'function') {
            const testResult = await service.testConnection();
            isHealthy = testResult.success;
          } else {
            // Assume healthy if configured
            isHealthy = true;
          }
        }

        this.botHealth[botName] = {
          healthy: isHealthy,
          lastCheck: Date.now(),
          failures: isHealthy ? 0 : this.botHealth[botName].failures + 1
        };

        logger.info(`Bot health check - ${botName}: ${isHealthy ? 'healthy' : 'unhealthy'}`);
      } catch (error) {
        this.botHealth[botName] = {
          healthy: false,
          lastCheck: Date.now(),
          failures: this.botHealth[botName].failures + 1
        };
        logger.error(`Bot health check failed for ${botName}:`, error.message);
      }
    }
  }

  // Get the best available bot based on strategy
  getBestBot(phoneNumber = null) {
    const availableBots = Object.keys(this.botServices).filter(botName => {
      const service = this.botServices[botName];
      return service.isConfigured() && this.botHealth[botName].healthy;
    });

    if (availableBots.length === 0) {
      logger.error('No healthy bots available');
      return null;
    }

    // If only one bot is available, use it
    if (availableBots.length === 1) {
      return availableBots[0];
    }

    // Apply load balancing strategy
    switch (this.loadBalancing) {
      case 'round_robin':
        this.roundRobinCounter = (this.roundRobinCounter + 1) % availableBots.length;
        return availableBots[this.roundRobinCounter];

      case 'primary_fallback':
        if (availableBots.includes(this.primaryBot)) {
          return this.primaryBot;
        }
        return availableBots[0];

      case 'phone_based':
        // Route based on phone number (e.g., country code)
        if (phoneNumber) {
          const countryCode = this.extractCountryCode(phoneNumber);
          if (countryCode === '255' && availableBots.includes('sarufi')) {
            return 'sarufi'; // Tanzania numbers to Sarufi Bot
          }
          if (countryCode === '254' && availableBots.includes('whatsapp')) {
            return 'whatsapp'; // Kenya numbers to WhatsApp
          }
        }
        return availableBots[0];

      case 'random':
        return availableBots[Math.floor(Math.random() * availableBots.length)];

      default:
        return availableBots[0];
    }
  }

  // Extract country code from phone number
  extractCountryCode(phoneNumber) {
    const cleaned = phoneNumber.replace(/[^\d]/g, '');
    if (cleaned.startsWith('255')) return '255'; // Tanzania
    if (cleaned.startsWith('254')) return '254'; // Kenya
    if (cleaned.startsWith('256')) return '256'; // Uganda
    return null;
  }

  // Send message with automatic bot selection and failover
  async sendMessage(to, text, variables = {}) {
    const botName = this.getBestBot(to);
    if (!botName) {
      return { success: false, error: 'No healthy bots available' };
    }

    let result = await this.botServices[botName].sendMessage(to, text, variables);

    // Try failover if enabled and primary failed
    if (!result.success && this.failoverEnabled) {
      const fallbackBots = Object.keys(this.botServices).filter(name => 
        name !== botName && 
        this.botServices[name].isConfigured() && 
        this.botHealth[name].healthy
      );

      for (const fallbackBot of fallbackBots) {
        logger.warn(`Trying fallback bot ${fallbackBot} after ${botName} failed`);
        result = await this.botServices[fallbackBot].sendMessage(to, text, variables);
        if (result.success) {
          result.usedBot = fallbackBot;
          result.failedBot = botName;
          break;
        }
      }
    }

    if (result.success) {
      result.usedBot = result.usedBot || botName;
    }

    return result;
  }

  // Send interactive buttons with automatic bot selection and failover
  async sendInteractiveButtons(to, text, buttons, header = null, footer = null, variables = {}) {
    const botName = this.getBestBot(to);
    if (!botName) {
      return { success: false, error: 'No healthy bots available' };
    }

    let result = await this.botServices[botName].sendInteractiveButtons(to, text, buttons, header, footer, variables);

    // Try failover if enabled and primary failed
    if (!result.success && this.failoverEnabled) {
      const fallbackBots = Object.keys(this.botServices).filter(name => 
        name !== botName && 
        this.botServices[name].isConfigured() && 
        this.botHealth[name].healthy
      );

      for (const fallbackBot of fallbackBots) {
        logger.warn(`Trying fallback bot ${fallbackBot} after ${botName} failed`);
        result = await this.botServices[fallbackBot].sendInteractiveButtons(to, text, buttons, header, footer, variables);
        if (result.success) {
          result.usedBot = fallbackBot;
          result.failedBot = botName;
          break;
        }
      }
    }

    if (result.success) {
      result.usedBot = result.usedBot || botName;
    }

    return result;
  }

  // Send interactive list with automatic bot selection and failover
  async sendInteractiveList(to, text, buttonText, sections, header = null, footer = null, variables = {}) {
    const botName = this.getBestBot(to);
    if (!botName) {
      return { success: false, error: 'No healthy bots available' };
    }

    let result = await this.botServices[botName].sendInteractiveList(to, text, buttonText, sections, header, footer, variables);

    // Try failover if enabled and primary failed
    if (!result.success && this.failoverEnabled) {
      const fallbackBots = Object.keys(this.botServices).filter(name => 
        name !== botName && 
        this.botServices[name].isConfigured() && 
        this.botHealth[name].healthy
      );

      for (const fallbackBot of fallbackBots) {
        logger.warn(`Trying fallback bot ${fallbackBot} after ${botName} failed`);
        result = await this.botServices[fallbackBot].sendInteractiveList(to, text, buttonText, sections, header, footer, variables);
        if (result.success) {
          result.usedBot = fallbackBot;
          result.failedBot = botName;
          break;
        }
      }
    }

    if (result.success) {
      result.usedBot = result.usedBot || botName;
    }

    return result;
  }

  // Send image with automatic bot selection and failover
  async sendImage(to, imageUrl, caption = '', variables = {}) {
    const botName = this.getBestBot(to);
    if (!botName) {
      return { success: false, error: 'No healthy bots available' };
    }

    let result = await this.botServices[botName].sendImage(to, imageUrl, caption, variables);

    // Try failover if enabled and primary failed
    if (!result.success && this.failoverEnabled) {
      const fallbackBots = Object.keys(this.botServices).filter(name => 
        name !== botName && 
        this.botServices[name].isConfigured() && 
        this.botHealth[name].healthy
      );

      for (const fallbackBot of fallbackBots) {
        logger.warn(`Trying fallback bot ${fallbackBot} after ${botName} failed`);
        result = await this.botServices[fallbackBot].sendImage(to, imageUrl, caption, variables);
        if (result.success) {
          result.usedBot = fallbackBot;
          result.failedBot = botName;
          break;
        }
      }
    }

    if (result.success) {
      result.usedBot = result.usedBot || botName;
    }

    return result;
  }

  // Send document with automatic bot selection and failover
  async sendDocument(to, documentUrl, filename, caption = '', variables = {}) {
    const botName = this.getBestBot(to);
    if (!botName) {
      return { success: false, error: 'No healthy bots available' };
    }

    let result = await this.botServices[botName].sendDocument(to, documentUrl, filename, caption, variables);

    // Try failover if enabled and primary failed
    if (!result.success && this.failoverEnabled) {
      const fallbackBots = Object.keys(this.botServices).filter(name => 
        name !== botName && 
        this.botServices[name].isConfigured() && 
        this.botHealth[name].healthy
      );

      for (const fallbackBot of fallbackBots) {
        logger.warn(`Trying fallback bot ${fallbackBot} after ${botName} failed`);
        result = await this.botServices[fallbackBot].sendDocument(to, documentUrl, filename, caption, variables);
        if (result.success) {
          result.usedBot = fallbackBot;
          result.failedBot = botName;
          break;
        }
      }
    }

    if (result.success) {
      result.usedBot = result.usedBot || botName;
    }

    return result;
  }

  // Send location with automatic bot selection and failover
  async sendLocation(to, latitude, longitude, name = '', address = '', variables = {}) {
    const botName = this.getBestBot(to);
    if (!botName) {
      return { success: false, error: 'No healthy bots available' };
    }

    let result = await this.botServices[botName].sendLocation(to, latitude, longitude, name, address, variables);

    // Try failover if enabled and primary failed
    if (!result.success && this.failoverEnabled) {
      const fallbackBots = Object.keys(this.botServices).filter(name => 
        name !== botName && 
        this.botServices[name].isConfigured() && 
        this.botHealth[name].healthy
      );

      for (const fallbackBot of fallbackBots) {
        logger.warn(`Trying fallback bot ${fallbackBot} after ${botName} failed`);
        result = await this.botServices[fallbackBot].sendLocation(to, latitude, longitude, name, address, variables);
        if (result.success) {
          result.usedBot = fallbackBot;
          result.failedBot = botName;
          break;
        }
      }
    }

    if (result.success) {
      result.usedBot = result.usedBot || botName;
    }

    return result;
  }

  // Send template with automatic bot selection and failover
  async sendTemplate(to, templateName, languageCode = 'en', components = [], variables = {}) {
    const botName = this.getBestBot(to);
    if (!botName) {
      return { success: false, error: 'No healthy bots available' };
    }

    let result = await this.botServices[botName].sendTemplate(to, templateName, languageCode, components, variables);

    // Try failover if enabled and primary failed
    if (!result.success && this.failoverEnabled) {
      const fallbackBots = Object.keys(this.botServices).filter(name => 
        name !== botName && 
        this.botServices[name].isConfigured() && 
        this.botHealth[name].healthy
      );

      for (const fallbackBot of fallbackBots) {
        logger.warn(`Trying fallback bot ${fallbackBot} after ${botName} failed`);
        result = await this.botServices[fallbackBot].sendTemplate(to, templateName, languageCode, components, variables);
        if (result.success) {
          result.usedBot = fallbackBot;
          result.failedBot = botName;
          break;
        }
      }
    }

    if (result.success) {
      result.usedBot = result.usedBot || botName;
    }

    return result;
  }

  // Get bot statistics
  getBotStatistics() {
    return {
      primaryBot: this.primaryBot,
      fallbackBot: this.fallbackBot,
      failoverEnabled: this.failoverEnabled,
      loadBalancing: this.loadBalancing,
      botHealth: this.botHealth,
      availableBots: Object.keys(this.botServices).filter(botName => {
        const service = this.botServices[botName];
        return service.isConfigured() && this.botHealth[botName].healthy;
      }),
      botStatus: Object.keys(this.botServices).reduce((status, botName) => {
        const service = this.botServices[botName];
        status[botName] = {
          configured: service.isConfigured(),
          healthy: this.botHealth[botName].healthy,
          failures: this.botHealth[botName].failures,
          lastCheck: this.botHealth[botName].lastCheck
        };
        return status;
      }, {})
    };
  }

  // Force health check
  async forceHealthCheck() {
    await this.checkBotHealth();
    return this.getBotStatistics();
  }

  // Reset bot health
  resetBotHealth(botName = null) {
    if (botName && this.botHealth[botName]) {
      this.botHealth[botName] = {
        healthy: true,
        lastCheck: Date.now(),
        failures: 0
      };
    } else {
      // Reset all bots
      Object.keys(this.botHealth).forEach(name => {
        this.botHealth[name] = {
          healthy: true,
          lastCheck: Date.now(),
          failures: 0
        };
      });
    }
  }

  // Get specific bot service
  getBotService(botName) {
    return this.botServices[botName];
  }

  // Check if any bot is available
  hasAvailableBot() {
    return Object.keys(this.botServices).some(botName => {
      const service = this.botServices[botName];
      return service.isConfigured() && this.botHealth[botName].healthy;
    });
  }
}

module.exports = new BotMiddleware();