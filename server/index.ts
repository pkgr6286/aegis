import express from 'express';
import { createServer } from 'http';
import { setupVite, log } from './vite';
import routes from './src/routes';
import session from 'express-session';

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for authentication)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'aegis-platform-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Request logging middleware
app.use((req, res, next) => {
  if (!req.path.startsWith('/src') && !req.path.startsWith('/@')) {
    log(`${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Setup Vite in development mode
if (process.env.NODE_ENV !== 'production') {
  setupVite(app, server);
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// ALWAYS serve the app on the port specified in the environment variable PORT
// Other ports are firewalled. Default to 5000 if not specified.
const port = parseInt(process.env.PORT || '5000', 10);

server.listen(port, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                    AEGIS PLATFORM - BACKEND                    ║
║                                                                ║
║  Multi-Tenant SaaS Platform for Patient Assistance Programs   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

🚀 Server running on port ${port}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🗄️  Database: PostgreSQL with Drizzle ORM
🔒 Security: Row-Level Security (RLS) enabled
📚 API Docs: http://localhost:${port}/api/health

Frontend: http://localhost:${port}
Backend API: http://localhost:${port}/api

Ready! ✅
  `);
});

export default app;
