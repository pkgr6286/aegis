import { Router } from 'express';
import authRoutes from './auth.routes';
import superAdminRoutes from './superAdmin.routes';
import brandConfigRoutes from './brandConfig.routes';
import drugProgramRoutes from './drugProgram.routes';
import pharmaAdminRoutes from './pharmaAdmin.routes';
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

// Mount Pharma Admin routes (protected)
// All Pharma Admin routes require authentication, tenant context, and appropriate tenant roles
// Middleware chain: authenticateToken → setTenantContext → requireTenantRole (handled in route files)
router.use('/v1/admin/brand-configs', brandConfigRoutes);
router.use('/v1/admin/drug-programs', drugProgramRoutes);
router.use('/v1/admin', pharmaAdminRoutes);

// TODO: Add more route modules here
// router.use('/v1/consumer', consumerRoutes); // Patient screening sessions
// router.use('/v1/partner', partnerRoutes);   // B2B partner API

export default router;
