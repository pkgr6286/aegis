/**
 * Brand Configuration Routes
 * 
 * RESTful API endpoints for managing brand configurations
 */

import { Router } from 'express';
import { brandConfigService } from '../services/brandConfig.service';
import { authenticateToken, setTenantContextMiddleware, requireTenantRole } from '../middleware/auth.middleware';
import { createBrandConfigSchema, updateBrandConfigSchema } from '../validations/brandConfig.validation';
import { z } from 'zod';

const router = Router();

// All routes require authentication, tenant context, and admin role
router.use(authenticateToken);
router.use(setTenantContextMiddleware);
router.use(requireTenantRole('admin', 'editor'));

/**
 * GET /api/v1/admin/brand-configs
 * List all brand configurations for the tenant
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const brandConfigs = await brandConfigService.listBrandConfigs(tenantId, userId);

    res.json({
      success: true,
      data: brandConfigs,
    });
  } catch (error) {
    console.error('Error listing brand configs:', error);
    res.status(500).json({
      error: 'Failed to list brand configurations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/admin/brand-configs
 * Create a new brand configuration
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    // Validate request body
    const data = createBrandConfigSchema.parse(req.body);

    const brandConfig = await brandConfigService.createBrandConfig(tenantId, userId, data);

    res.status(201).json({
      success: true,
      data: brandConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating brand config:', error);
    res.status(500).json({
      error: 'Failed to create brand configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/brand-configs/:id
 * Get a single brand configuration by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const brandConfig = await brandConfigService.getBrandConfig(tenantId, id, userId);

    res.json({
      success: true,
      data: brandConfig,
    });
  } catch (error) {
    console.error('Error getting brand config:', error);
    
    if (error instanceof Error && error.message === 'Brand configuration not found') {
      return res.status(404).json({
        error: 'Brand configuration not found',
      });
    }

    res.status(500).json({
      error: 'Failed to get brand configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/v1/admin/brand-configs/:id
 * Update a brand configuration
 */
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    // Validate request body
    const data = updateBrandConfigSchema.parse(req.body);

    const brandConfig = await brandConfigService.updateBrandConfig(tenantId, id, userId, data);

    res.json({
      success: true,
      data: brandConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message === 'Brand configuration not found') {
      return res.status(404).json({
        error: 'Brand configuration not found',
      });
    }

    console.error('Error updating brand config:', error);
    res.status(500).json({
      error: 'Failed to update brand configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/v1/admin/brand-configs/:id
 * Delete a brand configuration
 */
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const brandConfig = await brandConfigService.deleteBrandConfig(tenantId, id, userId);

    res.json({
      success: true,
      data: brandConfig,
      message: 'Brand configuration deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Brand configuration not found') {
      return res.status(404).json({
        error: 'Brand configuration not found',
      });
    }

    console.error('Error deleting brand config:', error);
    res.status(500).json({
      error: 'Failed to delete brand configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
