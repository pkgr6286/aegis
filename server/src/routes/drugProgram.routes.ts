/**
 * Drug Program Routes
 * 
 * RESTful API endpoints for managing drug programs and screener versions
 */

import { Router } from 'express';
import { drugProgramService } from '../services/drugProgram.service';
import { screenerService } from '../services/screener.service';
import { authenticateToken, setTenantContextMiddleware, requireTenantRole } from '../middleware/auth.middleware';
import { createDrugProgramSchema, updateDrugProgramSchema } from '../validations/drugProgram.validation';
import { createScreenerVersionSchema, publishScreenerVersionSchema } from '../validations/screener.validation';
import { z } from 'zod';

const router = Router();

// All routes require authentication, tenant context, and admin/editor role
router.use(authenticateToken);
router.use(setTenantContextMiddleware);
router.use(requireTenantRole('admin', 'editor'));

// ============================================================================
// Drug Program CRUD Routes
// ============================================================================

/**
 * GET /api/v1/admin/drug-programs
 * List all drug programs for the tenant
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const programs = await drugProgramService.listDrugPrograms(tenantId, userId);

    res.json({
      success: true,
      data: programs,
    });
  } catch (error) {
    console.error('Error listing drug programs:', error);
    res.status(500).json({
      error: 'Failed to list drug programs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/admin/drug-programs
 * Create a new drug program
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    console.log('Creating drug program - Request body:', JSON.stringify(req.body, null, 2));

    // Validate request body
    const data = createDrugProgramSchema.parse(req.body);

    console.log('Validated data:', JSON.stringify(data, null, 2));

    const program = await drugProgramService.createDrugProgram(tenantId, userId, data);

    res.status(201).json({
      success: true,
      data: program,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating drug program:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating drug program:', error);
    res.status(500).json({
      error: 'Failed to create drug program',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/drug-programs/:id
 * Get a single drug program by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const program = await drugProgramService.getDrugProgram(tenantId, id, userId);

    res.json({
      success: true,
      data: program,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Drug program not found') {
      return res.status(404).json({
        error: 'Drug program not found',
      });
    }

    console.error('Error getting drug program:', error);
    res.status(500).json({
      error: 'Failed to get drug program',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/v1/admin/drug-programs/:id
 * Update a drug program
 */
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    // Validate request body
    const data = updateDrugProgramSchema.parse(req.body);

    const program = await drugProgramService.updateDrugProgram(tenantId, id, userId, data);

    res.json({
      success: true,
      data: program,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message === 'Drug program not found') {
      return res.status(404).json({
        error: 'Drug program not found',
      });
    }

    console.error('Error updating drug program:', error);
    res.status(500).json({
      error: 'Failed to update drug program',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/v1/admin/drug-programs/:id
 * Delete a drug program
 */
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const program = await drugProgramService.deleteDrugProgram(tenantId, id, userId);

    res.json({
      success: true,
      data: program,
      message: 'Drug program deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Drug program not found') {
      return res.status(404).json({
        error: 'Drug program not found',
      });
    }

    console.error('Error deleting drug program:', error);
    res.status(500).json({
      error: 'Failed to delete drug program',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// Screener Version Routes (Nested under Drug Programs)
// ============================================================================

/**
 * GET /api/v1/admin/drug-programs/:programId/screeners
 * List all screener versions for a drug program
 */
router.get('/:programId/screeners', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { programId } = req.params;

    const versions = await screenerService.listScreenerVersions(tenantId, programId, userId);

    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Drug program not found') {
      return res.status(404).json({
        error: 'Drug program not found',
      });
    }

    console.error('Error listing screener versions:', error);
    res.status(500).json({
      error: 'Failed to list screener versions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/admin/drug-programs/:programId/screeners
 * Create a new screener version for a drug program
 */
router.post('/:programId/screeners', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { programId } = req.params;

    // Validate request body
    const data = createScreenerVersionSchema.parse(req.body);

    const version = await screenerService.createScreenerVersion(tenantId, programId, userId, data);

    res.status(201).json({
      success: true,
      data: version,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message === 'Drug program not found') {
      return res.status(404).json({
        error: 'Drug program not found',
      });
    }

    console.error('Error creating screener version:', error);
    res.status(500).json({
      error: 'Failed to create screener version',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/admin/drug-programs/:programId/screeners/:versionId/publish
 * Publish a screener version (set as active for the drug program)
 */
router.post('/:programId/screeners/:versionId/publish', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { programId, versionId } = req.params;

    // Validate request body (requires explicit confirmation)
    publishScreenerVersionSchema.parse(req.body);

    const result = await screenerService.publishScreenerVersion(tenantId, programId, versionId, userId);

    res.json({
      success: true,
      data: result,
      message: `Screener version ${result.version.version} published successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      if (error.message === 'Drug program not found') {
        return res.status(404).json({ error: 'Drug program not found' });
      }
      if (error.message === 'Screener version not found') {
        return res.status(404).json({ error: 'Screener version not found' });
      }
      if (error.message === 'Screener version does not belong to this drug program') {
        return res.status(400).json({ error: 'Screener version does not belong to this drug program' });
      }
    }

    console.error('Error publishing screener version:', error);
    res.status(500).json({
      error: 'Failed to publish screener version',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
