/**
 * Pharma Admin Routes
 * 
 * RESTful API endpoints for tenant admin operations:
 * - User Management
 * - Partner Management
 * - Audit Log Access
 */

import { Router } from 'express';
import { pharmaAdminService } from '../services/pharmaAdmin.service';
import { authenticateToken, setTenantContextMiddleware, requireTenantRole } from '../middleware/auth.middleware';
import { 
  inviteUserSchema, 
  createPartnerSchema, 
  generateApiKeySchema,
  auditLogQuerySchema 
} from '../validations/pharmaAdmin.validation';
import { z } from 'zod';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(setTenantContextMiddleware);

/**
 * GET /api/v1/admin/me
 * Get the current authenticated pharma admin user
 * This endpoint does NOT require admin role - any tenant user can access it
 */
router.get('/me', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    res.json({
      success: true,
      user: req.user,
      tenantId: req.tenantId,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      error: 'Failed to fetch current user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// Dashboard Stats Routes (require any authenticated tenant user)
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/stats
 * Get dashboard statistics for the tenant
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const stats = await pharmaAdminService.getDashboardStats(tenantId, userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// All remaining routes require admin role
router.use(requireTenantRole('admin'));

// ============================================================================
// User Management Routes
// ============================================================================

/**
 * GET /api/v1/admin/users
 * List all users in the tenant
 */
router.get('/users', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const users = await pharmaAdminService.listTenantUsers(tenantId, userId);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error listing tenant users:', error);
    res.status(500).json({
      error: 'Failed to list tenant users',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/admin/users/invite
 * Invite a new user to the tenant
 */
router.post('/users/invite', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    // Validate request body
    const data = inviteUserSchema.parse(req.body);

    const result = await pharmaAdminService.inviteUser(tenantId, userId, data);

    res.status(201).json({
      success: true,
      data: result,
      message: `User ${data.email} invited successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error inviting user:', error);
    res.status(500).json({
      error: 'Failed to invite user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/v1/admin/users/:userId
 * Remove a user from the tenant
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const adminUserId = req.user!.id;
    const { userId } = req.params;

    await pharmaAdminService.removeUser(tenantId, adminUserId, userId);

    res.json({
      success: true,
      message: 'User removed from tenant successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found in tenant') {
        return res.status(404).json({ error: 'User not found in tenant' });
      }
      if (error.message === 'Cannot remove yourself from the tenant') {
        return res.status(400).json({ error: 'Cannot remove yourself from the tenant' });
      }
    }

    console.error('Error removing user:', error);
    res.status(500).json({
      error: 'Failed to remove user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// Partner Management Routes
// ============================================================================

/**
 * GET /api/v1/admin/partners
 * List all B2B partners for the tenant
 */
router.get('/partners', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const partners = await pharmaAdminService.listPartners(tenantId, userId);

    res.json({
      success: true,
      data: partners,
    });
  } catch (error) {
    console.error('Error listing partners:', error);
    res.status(500).json({
      error: 'Failed to list partners',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/admin/partners
 * Create a new partner
 */
router.post('/partners', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    // Validate request body
    const data = createPartnerSchema.parse(req.body);

    const partner = await pharmaAdminService.createPartner(tenantId, userId, data);

    res.status(201).json({
      success: true,
      data: partner,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating partner:', error);
    res.status(500).json({
      error: 'Failed to create partner',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/admin/partners/:partnerId/keys
 * Generate a new API key for a partner
 */
router.post('/partners/:partnerId/keys', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { partnerId } = req.params;

    // Validate request body
    const data = generateApiKeySchema.parse(req.body);

    const result = await pharmaAdminService.generatePartnerApiKey(tenantId, partnerId, userId, data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'API key generated successfully. Save the rawKey - it will not be shown again!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message === 'Partner not found') {
      return res.status(404).json({ error: 'Partner not found' });
    }

    console.error('Error generating API key:', error);
    res.status(500).json({
      error: 'Failed to generate API key',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/v1/admin/partners/:partnerId/keys/:keyId
 * Revoke a partner's API key
 */
router.delete('/partners/:partnerId/keys/:keyId', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { partnerId, keyId } = req.params;

    await pharmaAdminService.revokePartnerApiKey(tenantId, partnerId, keyId, userId);

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Partner not found') {
        return res.status(404).json({ error: 'Partner not found' });
      }
      if (error.message === 'API key not found for this partner') {
        return res.status(404).json({ error: 'API key not found for this partner' });
      }
    }

    console.error('Error revoking API key:', error);
    res.status(500).json({
      error: 'Failed to revoke API key',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// Audit Log Routes
// ============================================================================

/**
 * GET /api/v1/admin/audit-logs
 * View audit logs for the tenant
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    // Validate query parameters
    const query = auditLogQuerySchema.parse(req.query);

    const logs = await pharmaAdminService.getAuditLogs(tenantId, userId, query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        limit: query.limit,
        offset: query.offset,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }

    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
