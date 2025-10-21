import express from 'express';
import cors from 'cors';
import { config } from './config/environment';
import routes from './routes';

/**
 * Aegis Platform - Backend Server
 * 
 * A multi-tenant SaaS platform for pharmaceutical patient assistance programs
 * with Row-Level Security (RLS) for complete tenant data isolation.
 */

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount API routes
app.use('/api', routes);

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

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    ...(config.server.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                    AEGIS PLATFORM - BACKEND                    ║
║                                                                ║
║  Multi-Tenant SaaS Platform for Patient Assistance Programs   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
🌍 Environment: ${config.server.nodeEnv}
🗄️  Database: PostgreSQL with Drizzle ORM
🔒 Security: Row-Level Security (RLS) enabled
📚 API Docs: http://localhost:${PORT}/api/health

Next steps:
1. Run database migrations: npm run db:push
2. Check database schema: npm run db:studio
3. Implement API endpoints in src/routes/

Backend foundation is ready! ✅
  `);
});

export default app;
