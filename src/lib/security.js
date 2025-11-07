/**
 * Security middleware for production deployment
 * Implements rate limiting, input validation, and security headers
 */

/**
 * Rate limiter implementation
 */
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 900000; // 15 minutes
    this.maxRequests = options.maxRequests || 100;
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs / 4);
  }

  /**
   * Check if request is within rate limit
   */
  isAllowed(clientId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }

    const clientRequests = this.requests.get(clientId);

    // Remove old requests outside the window
    while (clientRequests.length > 0 && clientRequests[0] < windowStart) {
      clientRequests.shift();
    }

    if (clientRequests.length >= this.maxRequests) {
      return false;
    }

    clientRequests.push(now);
    return true;
  }

  /**
   * Get rate limit info for client
   */
  getLimitInfo(clientId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const clientRequests = this.requests.get(clientId) || [];

    const validRequests = clientRequests.filter(time => time > windowStart);

    return {
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - validRequests.length),
      resetTime: now + this.windowMs,
      retryAfter: validRequests.length >= this.maxRequests ? this.windowMs / 1000 : null
    };
  }

  /**
   * Clean up old requests
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [clientId, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > windowStart);

      if (validRequests.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, validRequests);
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}

/**
 * Input validation utilities
 */
export const validator = {
  /**
   * Validate and sanitize string input
   */
  sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[<>'"&]/g, char => {
        const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
        return entities[char] || char;
      });
  },

  /**
   * Validate UUID format
   */
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Validate integer within range
   */
  validateInteger(value, min = -Infinity, max = Infinity) {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error('Invalid integer');
    }
    if (num < min || num > max) {
      throw new Error(`Integer must be between ${min} and ${max}`);
    }
    return num;
  },

  /**
   * Validate JSON payload
   */
  validateJSON(data, schema = {}) {
    const errors = [];

    for (const [key, rules] of Object.entries(schema)) {
      if (rules.required && !(key in data)) {
        errors.push(`Missing required field: ${key}`);
        continue;
      }

      if (key in data) {
        const value = data[key];

        if (rules.type && typeof value !== rules.type) {
          errors.push(`Field ${key} must be of type ${rules.type}`);
        }

        if (rules.type === 'string' && rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Field ${key} exceeds maximum length of ${rules.maxLength}`);
        }

        if (rules.type === 'number' && (rules.min !== undefined || rules.max !== undefined)) {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`Field ${key} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push(`Field ${key} must be no more than ${rules.max}`);
          }
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`Field ${key} must be one of: ${rules.enum.join(', ')}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }

    return data;
  }
};

/**
 * Create security middleware
 */
export function createSecurityMiddleware(config) {
  const rateLimiter = new RateLimiter(config.security.rateLimit);

  return {
    rateLimiter,

    /**
     * Apply security headers to response
     */
    applySecurityHeaders(response) {
      const headers = response.headers || new Map();

      // Security headers
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-XSS-Protection', '1; mode=block');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.tailwindcss.com unpkg.com; style-src 'self' 'unsafe-inline' cdn.tailwindcss.com; img-src 'self' data:; connect-src 'self'"
      );

      // HSTS for HTTPS
      if (config.server.nodeEnv === 'production') {
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }

      return { ...response, headers };
    },

    /**
     * Rate limiting middleware
     */
    applyRateLimit(request) {
      const clientId = this.getClientId(request);

      if (!rateLimiter.isAllowed(clientId)) {
        const limitInfo = rateLimiter.getLimitInfo(clientId);

        return {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': limitInfo.retryAfter.toString(),
            'X-RateLimit-Limit': limitInfo.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitInfo.resetTime.toString()
          },
          body: JSON.stringify({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${limitInfo.retryAfter} seconds.`,
            retryAfter: limitInfo.retryAfter
          })
        };
      }

      const limitInfo = rateLimiter.getLimitInfo(clientId);
      return {
        headers: {
          'X-RateLimit-Limit': limitInfo.limit.toString(),
          'X-RateLimit-Remaining': limitInfo.remaining.toString(),
          'X-RateLimit-Reset': limitInfo.resetTime.toString()
        }
      };
    },

    /**
     * Get client identifier for rate limiting
     */
    getClientId(request) {
      // Use X-Forwarded-For in production with trusted proxies
      if (config.server.trustProxy && request.headers['x-forwarded-for']) {
        return request.headers['x-forwarded-for'].split(',')[0].trim();
      }

      // Fallback to connection remote address
      return request.connection?.remoteAddress || request.socket?.remoteAddress || 'unknown';
    },

    /**
     * Validate API request payload
     */
    validateRequest(request, endpoint) {
      const schemas = this.getValidationSchemas();
      const schema = schemas[endpoint];

      if (!schema) {
        return request; // No validation required
      }

      try {
        if (request.method === 'POST' || request.method === 'PUT') {
          // Validate JSON body
          const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
          validator.validateJSON(body, schema);
        }

        return request;
      } catch (error) {
        throw new Error(`Request validation failed: ${error.message}`);
      }
    },

    /**
     * Get validation schemas for different endpoints
     */
    getValidationSchemas() {
      return {
        '/api/sync/manual': {},
        '/api/agents/tasks': {
          type: {
            type: 'string',
            required: true,
            enum: ['analysis', 'billing-review', 'customer-support', 'sync-monitoring']
          },
          priority: { type: 'string', required: false, enum: ['low', 'medium', 'high', 'urgent'] },
          payload: { type: 'object', required: false }
        },
        '/api/agents/workflow': {
          name: { type: 'string', required: true, maxLength: 100 },
          steps: { type: 'object', required: true }
        },
        '/api/genai/execute': {
          prompt: { type: 'string', required: true, maxLength: 10000 },
          model: { type: 'string', required: false },
          maxTokens: { type: 'number', required: false, min: 1, max: 4000 },
          temperature: { type: 'number', required: false, min: 0, max: 2 }
        }
      };
    },

    /**
     * Clean up resources
     */
    destroy() {
      rateLimiter.destroy();
    }
  };
}

/**
 * Health check utilities
 */
export const healthCheck = {
  /**
   * Check database connectivity
   */
  checkDatabase(db) {
    try {
      db.getStats(); // Simple operation to test database
      return { status: 'healthy', message: 'Database accessible' };
    } catch (error) {
      return { status: 'unhealthy', message: `Database error: ${error.message}` };
    }
  },

  /**
   * Check external API connectivity
   */
  async checkExternalAPIs(crayonClient, hostbillClient) {
    const checks = {};

    try {
      await crayonClient.authenticate();
      checks.crayon = { status: 'healthy', message: 'Crayon API accessible' };
    } catch (error) {
      checks.crayon = { status: 'unhealthy', message: `Crayon API error: ${error.message}` };
    }

    try {
      await hostbillClient.testConnection();
      checks.hostbill = { status: 'healthy', message: 'HostBill API accessible' };
    } catch (error) {
      checks.hostbill = { status: 'unhealthy', message: `HostBill API error: ${error.message}` };
    }

    return checks;
  },

  /**
   * Check system resources
   */
  checkSystemHealth() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      status: 'healthy',
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      nodeVersion: process.version,
      platform: process.platform
    };
  },

  /**
   * Generate comprehensive health report
   */
  async generateHealthReport(db, crayonClient, hostbillClient) {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {}
    };

    // System health
    report.checks.system = this.checkSystemHealth();

    // Database health
    report.checks.database = this.checkDatabase(db);

    // External APIs health
    const apiChecks = await this.checkExternalAPIs(crayonClient, hostbillClient);
    report.checks = { ...report.checks, ...apiChecks };

    // Overall status
    const unhealthyChecks = Object.values(report.checks).filter(
      check => check.status === 'unhealthy'
    );
    if (unhealthyChecks.length > 0) {
      report.status = 'unhealthy';
    }

    return report;
  }
};
