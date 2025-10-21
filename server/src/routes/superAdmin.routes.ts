import { Router } from 'express';
import { superAdminService } from '../services/superAdmin.service';
import { validateRequest, validateParams } from '../middleware/validation.middleware';
import {
  createTenantSchema,
  updateTenantLicenseSchema,
  inviteTenantAdminSchema,
  tenantIdParamSchema,
} from '../validations/superAdmin.validation';

const router = Router();

/**
 * GET /api/v1/superadmin/me
 * Get the current authenticated user
 */
router.get('/me', async (req, res, next) => {
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
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/superadmin/tenants
 * Get all tenants in the system
 */
router.get('/tenants', async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

    const tenants = await superAdminService.getAllTenants({ limit, offset });
    
    res.json({
      success: true,
      data: tenants,
      count: tenants.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/superadmin/tenants/:id
 * Get a specific tenant with detailed information
 */
router.get('/tenants/:id', validateParams(tenantIdParamSchema), async (req, res, next) => {
  try {
    const tenant = await superAdminService.getTenantById(req.params.id);
    
    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/superadmin/tenants
 * Create a new tenant
 */
router.post('/tenants', validateRequest(createTenantSchema), async (req, res, next) => {
  try {
    // TODO: Get the actual super admin user ID from the JWT token
    // For now, we'll use a placeholder
    const createdByUserId = req.user?.id || 'system';

    const tenant = await superAdminService.createTenant(req.body, createdByUserId);
    
    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/superadmin/tenants/:id/license
 * Update a tenant's license information
 */
router.put(
  '/tenants/:id/license',
  validateParams(tenantIdParamSchema),
  validateRequest(updateTenantLicenseSchema),
  async (req, res, next) => {
    try {
      // TODO: Get the actual super admin user ID from the JWT token
      const updatedByUserId = req.user?.id || 'system';

      const tenant = await superAdminService.updateTenantLicense(
        req.params.id,
        req.body,
        updatedByUserId
      );
      
      res.json({
        success: true,
        message: 'Tenant license updated successfully',
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/superadmin/tenants/:id/invite
 * Invite a user to be a tenant admin
 */
router.post(
  '/tenants/:id/invite',
  validateParams(tenantIdParamSchema),
  validateRequest(inviteTenantAdminSchema),
  async (req, res, next) => {
    try {
      // TODO: Get the actual super admin user ID from the JWT token
      const invitedByUserId = req.user?.id || 'system';

      const result = await superAdminService.inviteTenantAdmin(
        req.params.id,
        req.body,
        invitedByUserId
      );
      
      res.status(201).json({
        success: true,
        message: 'Tenant admin invited successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/superadmin/tenants/:id/status
 * Update tenant status (activate, suspend, etc.)
 */
router.put(
  '/tenants/:id/status',
  validateParams(tenantIdParamSchema),
  validateRequest(createTenantSchema.pick({ status: true })),
  async (req, res, next) => {
    try {
      const updatedByUserId = req.user?.id || 'system';

      const tenant = await superAdminService.updateTenantStatus(
        req.params.id,
        req.body.status,
        updatedByUserId
      );
      
      res.json({
        success: true,
        message: 'Tenant status updated successfully',
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/superadmin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await superAdminService.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/superadmin/users
 * Get all system users with pagination
 */
router.get('/users', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await superAdminService.getAllUsers({ page, limit });
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/superadmin/users/invite
 * Invite a new system user
 */
router.post('/users/invite', async (req, res, next) => {
  try {
    const { email, firstName, lastName, role } = req.body;

    const user = await superAdminService.inviteSystemUser({
      email,
      firstName,
      lastName,
      role,
    });
    
    res.status(201).json({
      success: true,
      message: 'System user invited successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/superadmin/users/:id/role
 * Revoke a system role from a user
 */
router.delete('/users/:id/role', async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = req.query.role as 'super_admin' | 'support_staff';

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role query parameter is required',
      });
    }

    await superAdminService.revokeSystemRole(id, role);
    
    res.json({
      success: true,
      message: 'System role revoked successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/superadmin/audit-logs
 * Get audit logs with filtering
 */
router.get('/audit-logs', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const tenantId = req.query.tenantId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await superAdminService.getAuditLogs({
      page,
      limit,
      tenantId,
      startDate,
      endDate,
    });
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
