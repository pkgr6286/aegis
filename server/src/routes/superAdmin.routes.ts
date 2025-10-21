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

export default router;
