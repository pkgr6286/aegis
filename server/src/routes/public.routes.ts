/**
 * Public Consumer Routes
 * 
 * Public-facing endpoints for the consumer screening flow.
 * These are accessible without authentication (except where noted).
 */

import { Router } from 'express';
import { consumerService } from '../services/consumer.service';
import { authenticateSession, generateSessionToken } from '../middleware/sessionAuth.middleware';
import { 
  createSessionSchema, 
  submitAnswersSchema, 
  generateCodeSchema 
} from '../validations/consumer.validation';
import { z } from 'zod';

const router = Router();

// Note: Rate limiting is applied at the router mount level in index.ts

/**
 * GET /api/v1/public/programs/:slug
 * Fetch drug program details by slug with active screener and brand config
 * 
 * This is the entry point for consumers scanning a QR code
 */
router.get('/programs/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const programDetails = await consumerService.getProgramBySlug(slug);

    // Sanitize response to remove internal fields
    const { tenantId: _, createdBy: __, updatedBy: ___, ...programSafe } = programDetails.program;
    const { tenantId: _t, createdBy: _cb, updatedBy: _ub, ...screenerSafe } = programDetails.screenerVersion;
    const brandSafe = programDetails.brandConfig ? 
      (({ tenantId, createdBy, updatedBy, ...rest }) => rest)(programDetails.brandConfig) : 
      null;

    res.json({
      success: true,
      data: {
        program: programSafe,
        screenerVersion: screenerSafe,
        brandConfig: brandSafe,
      },
    });
  } catch (error) {
    console.error('Error fetching program details:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Program not found',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to fetch program details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/public/sessions
 * Create a new screening session
 * Returns session details and a session JWT for subsequent requests
 */
router.post('/sessions', async (req, res) => {
  try {
    const { programSlug, ...sessionData } = req.body;

    if (!programSlug) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'programSlug is required',
      });
    }

    // First, fetch program details by slug to get tenant ID and program ID
    const programDetails = await consumerService.getProgramBySlug(programSlug);

    // Validate session data
    const data = createSessionSchema.parse(sessionData);

    // Create session with resolved tenant ID and program ID
    const result = await consumerService.createSession(
      programDetails.tenantId,
      programDetails.program.id,
      data
    );

    // Generate session JWT
    const sessionToken = generateSessionToken(result.session.id);

    res.status(201).json({
      success: true,
      data: {
        session: result.session,
        screener: result.screenerJson,
        sessionToken, // Client must use this for subsequent requests
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating session:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Program not found',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to create session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/v1/public/sessions/:id
 * Submit answers and complete the session
 * Protected by session JWT
 */
router.put('/sessions/:id', authenticateSession, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify session ID matches the JWT
    if (req.sessionId !== id) {
      return res.status(403).json({
        error: 'Session ID mismatch',
        message: 'Token does not match the session being updated',
      });
    }

    // Validate answers
    const data = submitAnswersSchema.parse(req.body);

    // Submit answers and get outcome
    const result = await consumerService.submitAnswers(id, data);

    res.json({
      success: result.success,
      data: {
        session: result.session,
        evaluation: result.evaluation,
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

    console.error('Error submitting answers:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('already completed')) {
        return res.status(400).json({ error: error.message });
      }
    }

    res.status(500).json({
      error: 'Failed to submit answers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/public/sessions/:id/generate-code
 * Generate verification code for a successful session
 * Protected by session JWT
 */
router.post('/sessions/:id/generate-code', authenticateSession, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify session ID matches the JWT
    if (req.sessionId !== id) {
      return res.status(403).json({
        error: 'Session ID mismatch',
        message: 'Token does not match the session',
      });
    }

    // Validate request body
    const data = generateCodeSchema.parse(req.body);

    // Generate code
    const result = await consumerService.generateCode(id, data);

    res.status(result.isNew ? 201 : 200).json({
      success: true,
      data: {
        code: result.code.code,
        expiresAt: result.code.expiresAt,
        type: result.code.type,
      },
      message: result.isNew 
        ? 'Verification code generated successfully'
        : 'Verification code already exists for this session',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error generating code:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('not eligible')) {
        return res.status(400).json({ error: error.message });
      }
    }

    res.status(500).json({
      error: 'Failed to generate verification code',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
