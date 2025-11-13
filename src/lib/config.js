/**
 * Configuration validator for production environment
 * Ensures all required environment variables are properly configured
 */

/* eslint-disable no-console, no-magic-numbers */

/**
 * Required environment variables for production deployment
 */
const REQUIRED_ENV_VARS = {
  // Server configuration
  PORT: { type: 'number', default: 8000, min: 1000, max: 65535 },
  NODE_ENV: {
    type: 'string',
    default: 'development',
    allowed: ['development', 'production', 'test']
  },

  // API credentials (required for production)
  CRAYON_CLIENT_ID: { type: 'string', required: true, minLength: 10 },
  CRAYON_CLIENT_SECRET: { type: 'string', required: true, minLength: 20 },
  CRAYON_TENANT_ID: { type: 'string', required: true },

  HOSTBILL_URL: { type: 'url', required: true },
  HOSTBILL_API_ID: { type: 'string', required: true },
  HOSTBILL_API_KEY: { type: 'string', required: true, minLength: 10 },

  // Optional configurations
  CRAYON_DYNAMIC_AUTH: { type: 'boolean', default: false },
  CRAYON_USERNAME: { type: 'string', required: false },

  ENABLE_GENAI: { type: 'boolean', default: false },
  GENAI_API_KEY: { type: 'string', required: false },
  GENAI_MODEL: { type: 'string', default: 'gpt-4' },

  SYNC_INTERVAL_MINUTES: { type: 'number', default: 60, min: 5, max: 1440 },
  DATABASE_PATH: { type: 'string', default: './data/cloudiq.json' },

  // Security settings
  RATE_LIMIT_WINDOW_MS: { type: 'number', default: 900000 }, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: { type: 'number', default: 100 },
  CORS_ORIGIN: { type: 'string', default: '*' },
  TRUST_PROXY: { type: 'boolean', default: false }
};

/**
 * Configuration validation errors
 */
export class ConfigValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ConfigValidationError';
    this.errors = errors;
  }
}

/**
 * Validate and parse configuration from environment variables
 */
export function validateConfig() {
  const config = {};
  const errors = [];
  const warnings = [];

  for (const [key, schema] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];

    try {
      const parsed = validateEnvironmentVariable(key, value, schema);
      config[key] = parsed;
    } catch (error) {
      if (schema.required) {
        errors.push(`${key}: ${error.message}`);
      } else {
        warnings.push(`${key}: ${error.message}, using default: ${schema.default}`);
        config[key] = schema.default;
      }
    }
  }

  // Production-specific validations
  if (config.NODE_ENV === 'production') {
    const productionErrors = validateProductionConfig(config);
    errors.push(...productionErrors);
  }

  if (errors.length > 0) {
    throw new ConfigValidationError(
      `Configuration validation failed with ${errors.length} error(s)`,
      errors
    );
  }

  if (warnings.length > 0) {
    warnings.forEach(warning => console.warn(`⚠️  ${warning}`));
  }

  return transformConfig(config);
}

/**
 * Validate individual environment variable
 */
function validateEnvironmentVariable(key, value, schema) {
  // Handle missing values
  if (!value || value.trim() === '') {
    if (schema.required) {
      throw new Error('is required but not provided');
    }
    return schema.default;
  }

  // Type validation
  switch (schema.type) {
    case 'string':
      return validateString(value, schema);
    case 'number':
      return validateNumber(value, schema);
    case 'boolean':
      return validateBoolean(value);
    case 'url':
      return validateUrl(value);
    default:
      throw new Error(`Unknown schema type: ${schema.type}`);
  }
}

/**
 * Validate string value
 */
function validateString(value, schema) {
  if (schema.minLength && value.length < schema.minLength) {
    throw new Error(`must be at least ${schema.minLength} characters long`);
  }

  if (schema.maxLength && value.length > schema.maxLength) {
    throw new Error(`must be no more than ${schema.maxLength} characters long`);
  }

  if (schema.allowed && !schema.allowed.includes(value)) {
    throw new Error(`must be one of: ${schema.allowed.join(', ')}`);
  }

  return value;
}

/**
 * Validate number value
 */
function validateNumber(value, schema) {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    throw new Error('must be a valid number');
  }

  if (schema.min !== undefined && num < schema.min) {
    throw new Error(`must be at least ${schema.min}`);
  }

  if (schema.max !== undefined && num > schema.max) {
    throw new Error(`must be no more than ${schema.max}`);
  }

  return num;
}

/**
 * Validate boolean value
 */
function validateBoolean(value) {
  const lowered = value.toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(lowered)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(lowered)) {
    return false;
  }
  throw new Error('must be a valid boolean (true/false, 1/0, yes/no, on/off)');
}

/**
 * Validate URL value
 */
function validateUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('must use HTTP or HTTPS protocol');
    }
    return value;
  } catch {
    throw new Error('must be a valid URL');
  }
}

/**
 * Production-specific configuration validation
 */
function validateProductionConfig(config) {
  const errors = [];

  // Ensure HTTPS in production
  if (!config.HOSTBILL_URL.startsWith('https://')) {
    errors.push('HOSTBILL_URL: Must use HTTPS in production environment');
  }

  // Ensure proper CORS configuration
  if (config.CORS_ORIGIN === '*') {
    errors.push('CORS_ORIGIN: Should not be "*" in production. Specify allowed origins.');
  }

  // Ensure rate limiting is reasonable
  if (config.RATE_LIMIT_MAX_REQUESTS > 1000) {
    errors.push('RATE_LIMIT_MAX_REQUESTS: Should be limited in production environment');
  }

  // Warn about missing optional but recommended configs
  if (!config.GENAI_API_KEY && config.ENABLE_GENAI) {
    errors.push('GENAI_API_KEY: Required when ENABLE_GENAI is true');
  }

  return errors;
}

/**
 * Transform flat config to structured object
 */
function transformConfig(config) {
  return {
    server: {
      port: config.PORT,
      nodeEnv: config.NODE_ENV,
      trustProxy: config.TRUST_PROXY
    },
    crayon: {
      clientId: config.CRAYON_CLIENT_ID,
      clientSecret: config.CRAYON_CLIENT_SECRET,
      tenantId: config.CRAYON_TENANT_ID,
      dynamicAuth: config.CRAYON_DYNAMIC_AUTH,
      username: config.CRAYON_USERNAME
    },
    hostbill: {
      apiUrl: config.HOSTBILL_URL,
      apiId: config.HOSTBILL_API_ID,
      apiKey: config.HOSTBILL_API_KEY
    },
    genAi: {
      enabled: config.ENABLE_GENAI,
      apiKey: config.GENAI_API_KEY,
      model: config.GENAI_MODEL
    },
    sync: {
      intervalMinutes: config.SYNC_INTERVAL_MINUTES,
      databasePath: config.DATABASE_PATH
    },
    security: {
      rateLimit: {
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        maxRequests: config.RATE_LIMIT_MAX_REQUESTS
      },
      cors: {
        origin: config.CORS_ORIGIN
      }
    }
  };
}

/**
 * Get configuration with validation
 */
export function getConfig() {
  try {
    const config = validateConfig();
    console.log('✅ Configuration validation successful');

    // Log configuration summary (without sensitive data)
    console.log('📋 Configuration Summary:');
    console.log(`   Environment: ${config.server.nodeEnv}`);
    console.log(`   Port: ${config.server.port}`);
    console.log(`   GenAI Enabled: ${config.genAi.enabled}`);
    console.log(`   Sync Interval: ${config.sync.intervalMinutes} minutes`);
    console.log(
      `   Rate Limit: ${config.security.rateLimit.maxRequests} requests per ${config.security.rateLimit.windowMs / 1000 / 60} minutes`
    );

    return config;
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      console.error('❌ Configuration validation failed:');
      error.errors.forEach((err, index) => {
        console.error(`   ${index + 1}. ${err}`);
      });

      if (process.env.NODE_ENV === 'production') {
        console.error(
          '\n💡 In production, all required environment variables must be properly configured.'
        );
        console.error('   Check your .env file or deployment configuration.');
      } else {
        console.error(
          '\n💡 For development, copy .env.example to .env and configure required values.'
        );
      }

      // Don't exit during tests
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      } else {
        throw error; // Re-throw for test handling
      }
    }

    throw error;
  }
}
