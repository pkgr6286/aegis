import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    expiresIn: '7d',
  },
};
