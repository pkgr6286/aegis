import { Router } from 'express';
import authRoutes from './auth.routes';
import superAdminRoutes from './superAdmin.routes';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

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

// Mount auth routes (public)
router.use('/auth', authRoutes);

// Mount super admin routes (protected)
// All routes under /api/v1/superadmin require authentication and super_admin role
// CRITICAL: authenticateToken MUST come before requireRole
router.use('/v1/superadmin', authenticateToken, requireRole('super_admin'), superAdminRoutes);

// TODO: Add more route modules here
// router.use('/v1/tenants', authenticateToken, requireTenant, tenantRoutes);
// router.use('/v1/programs', authenticateToken, requireTenant, programRoutes);
// router.use('/v1/screeners', authenticateToken, requireTenant, screenerRoutes);
// router.use('/v1/sessions', authenticateToken, sessionRoutes);
// router.use('/v1/partners', authenticateToken, requireTenant, partnerRoutes);

export default router;
