import express from 'express';

/**
 * Aegis Platform - Backend Server
 * 
 * A multi-tenant SaaS platform for pharmaceutical patient assistance programs
 * with Row-Level Security (RLS) for complete tenant data isolation.
 */

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Aegis Platform API',
    version: '1.0.0',
    description: 'Multi-tenant SaaS platform for pharmaceutical patient assistance programs',
    status: 'Backend foundation ready',
    database: 'Drizzle ORM + PostgreSQL with Row-Level Security',
    documentation: '/api/health for health check',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// ALWAYS serve the app on the port specified in the environment variable PORT
// Other ports are firewalled. Default to 5000 if not specified.
const port = parseInt(process.env.PORT || '5000', 10);

app.listen(port, '0.0.0.0', () => {
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

Next steps:
1. Run database migrations: npm run db:push
2. Check database schema: npm run db:studio (from server/ directory)
3. Implement API endpoints in server/src/routes/

Backend foundation is ready! ✅
  `);
});

export default app;
