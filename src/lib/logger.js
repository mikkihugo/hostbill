/**
 * Structured logging system for production deployment
 * Provides different log levels, formatting, and output options
 */

/* eslint-disable no-console, no-magic-numbers */

/**
 * Log levels in order of severity
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

/**
 * Color codes for console output
 */
const COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m', // Yellow
  info: '\x1b[36m', // Cyan
  http: '\x1b[35m', // Magenta
  debug: '\x1b[90m', // Gray
  reset: '\x1b[0m'
};

/**
 * Logger class with structured logging
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    this.enableColors = options.enableColors !== false && process.stdout.isTTY;
    this.enableTimestamp = options.enableTimestamp !== false;
    this.service = options.service || 'cloud-iq';
    this.version = options.version || '1.0.0';
  }

  /**
   * Check if log level is enabled
   */
  isLevelEnabled(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.enableTimestamp ? new Date().toISOString() : null;

    const logEntry = {
      timestamp,
      level,
      service: this.service,
      version: this.version,
      message,
      ...meta
    };

    // Remove null/undefined values
    Object.keys(logEntry).forEach(key => {
      if (logEntry[key] === null || logEntry[key] === undefined) {
        delete logEntry[key];
      }
    });

    return logEntry;
  }

  /**
   * Format for console output
   */
  formatConsole(logEntry) {
    const { timestamp, level, message, ...meta } = logEntry;

    let output = '';

    if (this.enableColors) {
      output += COLORS[level] || '';
    }

    if (timestamp) {
      output += `[${timestamp}] `;
    }

    output += `${level.toUpperCase().padEnd(5)} `;
    output += message;

    if (this.enableColors) {
      output += COLORS.reset;
    }

    // Add metadata if present
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      output += ` ${JSON.stringify(meta)}`;
    }

    return output;
  }

  /**
   * Write log entry
   */
  write(level, message, meta = {}) {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const logEntry = this.formatMessage(level, message, meta);

    if (process.env.NODE_ENV === 'production') {
      // Production: JSON format for log aggregation
      console.log(JSON.stringify(logEntry));
    } else {
      // Development: Human-readable format
      console.log(this.formatConsole(logEntry));
    }
  }

  /**
   * Log methods
   */
  error(message, meta = {}) {
    this.write('error', message, meta);
  }

  warn(message, meta = {}) {
    this.write('warn', message, meta);
  }

  info(message, meta = {}) {
    this.write('info', message, meta);
  }

  http(message, meta = {}) {
    this.write('http', message, meta);
  }

  debug(message, meta = {}) {
    this.write('debug', message, meta);
  }
}

/**
 * Request logging middleware
 */
export function createRequestLogger(logger) {
  return {
    /**
     * Log incoming request
     */
    logRequest(request) {
      const startTime = Date.now();

      logger.http('Incoming request', {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.headers['x-forwarded-for'] || 'unknown',
        requestId: this.generateRequestId()
      });

      return startTime;
    },

    /**
     * Log response
     */
    logResponse(request, response, startTime, error = null) {
      const duration = Date.now() - startTime;

      const logData = {
        method: request.method,
        url: request.url,
        statusCode: response.status || (error ? 500 : 200),
        duration: `${duration}ms`,
        responseSize: response.body ? response.body.length : 0
      };

      if (error) {
        logger.error('Request failed', {
          ...logData,
          error: error.message,
          stack: error.stack
        });
      } else if (response.status >= 400) {
        logger.warn('Request completed with error status', logData);
      } else {
        logger.http('Request completed', logData);
      }
    },

    /**
     * Generate unique request ID
     */
    generateRequestId() {
      return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  };
}

/**
 * Application logger configuration
 */
export function createAppLogger(config = {}) {
  return new Logger({
    level:
      config.logLevel ||
      process.env.LOG_LEVEL ||
      (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    service: 'cloud-iq-hostbill',
    version: '1.0.0',
    ...config
  });
}

/**
 * Database operation logger
 */
export function createDbLogger(appLogger) {
  return {
    logQuery(operation, params = {}) {
      appLogger.debug('Database operation', {
        operation,
        params: Object.keys(params).reduce((safe, key) => {
          // Exclude sensitive data from logs
          if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
            safe[key] = '[REDACTED]';
          } else {
            safe[key] = params[key];
          }
          return safe;
        }, {})
      });
    },

    logError(operation, error) {
      appLogger.error('Database operation failed', {
        operation,
        error: error.message,
        stack: error.stack
      });
    }
  };
}

/**
 * Sync operation logger
 */
export function createSyncLogger(appLogger) {
  return {
    logSyncStart(type) {
      appLogger.info('Sync operation started', { type });
    },

    logSyncComplete(type, result) {
      appLogger.info('Sync operation completed', {
        type,
        success: result.success,
        syncedCount: result.syncedCount,
        errorCount: result.errorCount,
        duration: result.duration
      });
    },

    logSyncError(type, error) {
      appLogger.error('Sync operation failed', {
        type,
        error: error.message,
        stack: error.stack
      });
    },

    logItemSync(item, status) {
      appLogger.debug('Item sync result', {
        itemId: item.id,
        itemType: item.type,
        status
      });
    }
  };
}

/**
 * API client logger
 */
export function createApiLogger(appLogger, serviceName) {
  return {
    logRequest(endpoint, method = 'GET') {
      appLogger.debug('External API request', {
        service: serviceName,
        endpoint,
        method
      });
    },

    logResponse(endpoint, statusCode, duration) {
      appLogger.debug('External API response', {
        service: serviceName,
        endpoint,
        statusCode,
        duration: `${duration}ms`
      });
    },

    logError(endpoint, error) {
      appLogger.error('External API error', {
        service: serviceName,
        endpoint,
        error: error.message
      });
    },

    logAuth(success) {
      if (success) {
        appLogger.info('External API authentication successful', { service: serviceName });
      } else {
        appLogger.error('External API authentication failed', { service: serviceName });
      }
    }
  };
}

/**
 * Error tracking for production
 */
export function createErrorTracker(appLogger) {
  return {
    /**
     * Track application errors
     */
    trackError(error, context = {}) {
      appLogger.error('Application error', {
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      });
    },

    /**
     * Track unhandled errors
     */
    setupErrorHandlers() {
      process.on('uncaughtException', error => {
        this.trackError(error, { type: 'uncaughtException' });
        console.error('Uncaught Exception:', error);

        // Give time for logs to be written then exit
        setTimeout(() => process.exit(1), 1000);
      });

      process.on('unhandledRejection', (reason, promise) => {
        this.trackError(new Error(reason), {
          type: 'unhandledRejection',
          promise: promise.toString()
        });
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      });
    }
  };
}

// Create and export default logger instance
export const logger = createAppLogger();
export const requestLogger = createRequestLogger(logger);
export const dbLogger = createDbLogger(logger);
export const syncLogger = createSyncLogger(logger);
export const errorTracker = createErrorTracker(logger);

// Initialize error handlers
errorTracker.setupErrorHandlers();
