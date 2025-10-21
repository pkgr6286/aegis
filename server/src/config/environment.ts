/**
 * Environment Configuration
 * 
 * Loads and validates environment variables for the application.
 */

export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

/**
 * Validate critical environment variables
 */
export function validateEnvironment(): void {
  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required for production');
    if (process.env.NODE_ENV === 'production') {
      errors.push('FATAL: JWT_SECRET must be set in production');
    } else {
      console.warn('WARNING: JWT_SECRET not set. Using development default.');
      process.env.JWT_SECRET = 'development-secret-DO-NOT-USE-IN-PRODUCTION';
    }
  }

  if (errors.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}

// Run validation on import
validateEnvironment();
