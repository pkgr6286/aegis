/**
 * Clinician Routes
 * 
 * RESTful API endpoints for clinician role operations:
 * - Review queue management
 * - Session details and clinical review
 */

import { Router } from 'express';
import { clinicianService } from '../services/clinician.service';
import { authenticateToken, setTenantContextMiddleware, requireTenantRole } from '../middleware/auth.middleware';
import { sessionQuerySchema, submitReviewSchema } from '../validations/clinician.validation';
import { z } from 'zod';

const router = Router();

// All routes require authentication, tenant context, and clinician role (or admin)
router.use(authenticateToken);
router.use(setTenantContextMiddleware);
router.use(requireTenantRole('clinician', 'admin'));

/**
 * GET /api/v1/clinician/sessions
 * Get paginated list of screening sessions for review
 * Supports filtering by reviewStatus, drugProgramId, and outcome
 */
router.get('/sessions', async (req, res) => {
  try {
    // Validate query parameters
    const queryResult = sessionQuerySchema.safeParse(req.query);
    
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: queryResult.error.format(),
      });
    }

    const tenantId = req.tenantId!;
    const result = await clinicianService.getSessions(tenantId, queryResult.data);

    res.json({
      success: true,
      data: result.sessions,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/clinician/sessions/:id
 * Get detailed information about a single screening session
 * Includes answers and screener definition for clinical review
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID format',
      });
    }

    const tenantId = req.tenantId!;
    const session = await clinicianService.getSessionById(tenantId, id);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    
    if (error instanceof Error && error.message === 'Session not found') {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch session details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/clinician/sessions/:id/review
 * Submit a clinical review for a screening session
 * Updates reviewStatus, reviewedBy, and reviewedAt
 */
router.post('/sessions/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID format',
      });
    }

    // Validate request body
    const bodyResult = submitReviewSchema.safeParse(req.body);
    
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid review data',
        details: bodyResult.error.format(),
      });
    }

    const tenantId = req.tenantId!;
    const clinicianUserId = req.user!.id;
    
    const updatedSession = await clinicianService.submitReview(
      tenantId,
      id,
      clinicianUserId,
      bodyResult.data
    );

    res.json({
      success: true,
      data: updatedSession,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit review',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
