import { Router } from 'express';
import authRoutes from './auth.routes';
import accountRoutes from './account.routes';
import superAdminRoutes from './superAdmin.routes';
import brandConfigRoutes from './brandConfig.routes';
import drugProgramRoutes from './drugProgram.routes';
import pharmaAdminRoutes from './pharmaAdmin.routes';
import analyticsRoutes from './analytics.routes';
import clinicianRoutes from './clinician.routes';
import publicRoutes from './public.routes';
import ehrRoutes from './ehr.routes';
import verificationRoutes from './verification.routes';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { publicApiRateLimit, verificationRateLimit } from '../middleware/rateLimit.middleware';

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
router.use('/v1/auth', authRoutes);

// Mount account routes (protected - requires authentication)
router.use('/v1/account', accountRoutes);

// Mount super admin routes (protected)
// All routes under /api/v1/superadmin require authentication and super_admin role
// CRITICAL: authenticateToken MUST come before requireRole
router.use('/v1/superadmin', authenticateToken, requireRole('super_admin'), superAdminRoutes);

// Mount Pharma Admin routes (protected)
// All Pharma Admin routes require authentication, tenant context, and appropriate tenant roles
// Middleware chain: authenticateToken → setTenantContext → requireTenantRole (handled in route files)
router.use('/v1/admin/brand-configs', brandConfigRoutes);
router.use('/v1/admin/drug-programs', drugProgramRoutes);
router.use('/v1/admin/analytics', analyticsRoutes);
router.use('/v1/admin', pharmaAdminRoutes);

// Mount Clinician routes (protected)
// All Clinician routes require authentication, tenant context, and clinician role (or admin)
// Middleware chain: authenticateToken → setTenantContext → requireTenantRole (handled in route file)
router.use('/v1/clinician', clinicianRoutes);

// Mount Public Consumer routes (rate-limited)
// These endpoints power the consumer screening flow (QR code → screening → verification code)
// Protected by session JWT (where applicable) and rate limiting
router.use('/v1/public', publicApiRateLimit, publicRoutes);

// Mount EHR Integration routes (rate-limited)
// EHR "Fast Path" OAuth flow: connect → callback → fetch data
// Protected by session JWT (where applicable) and rate limiting
router.use('/v1/public', publicApiRateLimit, ehrRoutes);

// Mount Verification API (rate-limited)
// Partner API for validating consumer codes at POS/ecommerce checkout
// Protected by API key authentication and rate limiting
router.use('/v1/verify', verificationRateLimit, verificationRoutes);

export default router;
