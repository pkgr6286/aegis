/**
 * Verification Routes
 * 
 * Partner API for verifying consumer codes at POS/ecommerce checkout.
 * All endpoints require API key authentication.
 */

import { Router } from 'express';
import { verificationService } from '../services/verification.service';
import { authenticateApiKey } from '../middleware/apiKeyAuth.middleware';
import { verifyCodeSchema } from '../validations/verification.validation';
import { z } from 'zod';

const router = Router();

// All routes require API key authentication
router.use(authenticateApiKey);

/**
 * POST /api/v1/verify
 * Verify and mark a code as used
 * 
 * CRITICAL: This is an atomic operation to prevent race conditions
 */
router.post('/', async (req, res) => {
  try {
    // Partner and tenant IDs come from the authenticated API key
    if (!req.partner) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Partner authentication required',
      });
    }

    // Validate verification data
    const data = verifyCodeSchema.parse(req.body);

    // Verify the code (atomic operation)
    // Partner ID and Tenant ID are derived from the authenticated API key
    const result = await verificationService.verifyCode(
      req.partner.id,
      req.partner.tenantId,
      data
    );

    res.json({
      success: true,
      data: {
        valid: result.valid,
        code: {
          id: result.code.id,
          type: result.code.type,
          usedAt: result.code.usedAt,
        },
        session: result.session ? {
          id: result.session.id,
          outcome: result.session.outcome,
          completedAt: result.session.completedAt,
        } : undefined,
      },
      message: result.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error verifying code:', error);

    // Return specific error messages for different failure scenarios
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          valid: false,
          error: 'Code not found',
          message: error.message,
        });
      }
      if (error.message.includes('already been used')) {
        return res.status(400).json({
          valid: false,
          error: 'Code already used',
          message: error.message,
        });
      }
      if (error.message.includes('expired')) {
        return res.status(400).json({
          valid: false,
          error: 'Code expired',
          message: error.message,
        });
      }
    }

    res.status(500).json({
      error: 'Failed to verify code',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/verify/:code
 * Check code validity without marking as used (preview)
 * Useful for UI validation before final checkout
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await verificationService.checkCode(code);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking code:', error);
    res.status(500).json({
      error: 'Failed to check code',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
