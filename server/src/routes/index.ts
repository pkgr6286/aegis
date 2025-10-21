import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

/**
 * Main API Router
 * All routes are prefixed with /api
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount auth routes
router.use('/auth', authRoutes);

// TODO: Add more route modules here
// router.use('/tenants', tenantRoutes);
// router.use('/programs', programRoutes);
// router.use('/screeners', screenerRoutes);
// router.use('/sessions', sessionRoutes);
// router.use('/partners', partnerRoutes);

export default router;
