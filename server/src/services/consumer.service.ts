/**
 * Consumer Service
 * 
 * Manages the complete consumer screening lifecycle:
 * 1. Fetch drug program and active screener
 * 2. Create screening session
 * 3. Submit answers and calculate outcome
 * 4. Generate verification code
 */

import { drugProgramRepository } from '../db/repositories/drugProgram.repository';
import { screenerVersionRepository } from '../db/repositories/screenerVersion.repository';
import { brandConfigRepository } from '../db/repositories/brandConfig.repository';
import { screeningSessionRepository } from '../db/repositories/screeningSession.repository';
import { verificationCodeRepository } from '../db/repositories/verificationCode.repository';
import { screenerEngineService } from './screenerEngine.service';
import type { CreateSessionInput, SubmitAnswersInput, GenerateCodeInput } from '../validations/consumer.validation';

export const consumerService = {
  /**
   * Fetch drug program by slug with active screener and brand config
   * This is the entry point for consumers scanning a QR code
   * 
   * NOTE: Bypasses RLS by using globally unique slug lookup
   */
  async getProgramBySlug(slug: string) {
    // Find program by slug (globally unique, no RLS filter needed)
    const program = await drugProgramRepository.findBySlug(slug);
    
    if (!program) {
      throw new Error('Drug program not found');
    }

    // Check if program has slug set
    if (!program.slug) {
      throw new Error('Program does not have a public slug configured');
    }

    // Get the active screener version
    if (!program.activeScreenerVersionId) {
      throw new Error('No active screener version for this program');
    }

    const screenerVersion = await screenerVersionRepository.findById(
      program.tenantId,
      program.activeScreenerVersionId
    );

    if (!screenerVersion) {
      throw new Error('Active screener version not found');
    }

    // Get brand configuration if applicable
    let brandConfig = null;
    if (program.brandConfigId) {
      brandConfig = await brandConfigRepository.findById(program.tenantId, program.brandConfigId);
    }

    return {
      program,
      screenerVersion,
      brandConfig,
      tenantId: program.tenantId, // Return tenant ID for session creation
    };
  },

  /**
   * Fetch drug program details with active screener (requires tenant ID)
   */
  async getProgramDetails(tenantId: string, programId: string) {
    // Get the drug program
    const program = await drugProgramRepository.findById(tenantId, programId);
    if (!program) {
      throw new Error('Drug program not found');
    }

    // Get the active screener version
    if (!program.activeScreenerVersionId) {
      throw new Error('No active screener version for this program');
    }

    const screenerVersion = await screenerVersionRepository.findById(
      tenantId,
      program.activeScreenerVersionId
    );

    if (!screenerVersion) {
      throw new Error('Active screener version not found');
    }

    // Get brand configuration if applicable
    let brandConfig = null;
    if (program.brandConfigId) {
      brandConfig = await brandConfigRepository.findById(tenantId, program.brandConfigId);
    }

    return {
      program,
      screenerVersion,
      brandConfig,
    };
  },

  /**
   * Create a new screening session
   */
  async createSession(tenantId: string, programId: string, data: CreateSessionInput) {
    // Get program details to ensure it exists and has an active screener
    const { program, screenerVersion } = await this.getProgramDetails(tenantId, programId);

    // Create the session
    const session = await screeningSessionRepository.create({
      tenantId,
      drugProgramId: programId,
      screenerVersionId: screenerVersion.id,
      path: data.path,
    });

    return {
      session,
      screenerJson: screenerVersion.screenerJson,
    };
  },

  /**
   * Submit answers and calculate outcome
   */
  async submitAnswers(sessionId: string, data: SubmitAnswersInput) {
    // Get the session
    const session = await screeningSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Screening session not found');
    }

    if (session.status === 'completed') {
      throw new Error('Session already completed');
    }

    // Get the screener version used for this session
    const screenerVersion = await screenerVersionRepository.findById(
      session.tenantId,
      session.screenerVersionId
    );

    if (!screenerVersion) {
      throw new Error('Screener version not found');
    }

    // Evaluate answers using the screener engine
    const evaluation = screenerEngineService.evaluate(
      screenerVersion.screenerJson as any,
      data.answers
    );

    // Check for validation errors
    if (evaluation.missingRequired || evaluation.validationErrors) {
      return {
        success: false,
        evaluation,
        message: 'Please complete all required questions correctly',
      };
    }

    // Update session with answers and outcome
    const updatedSession = await screeningSessionRepository.submitAnswers(sessionId, {
      answersJson: data.answers,
      outcome: evaluation.outcome,
    });

    return {
      success: true,
      session: updatedSession,
      evaluation,
      message: screenerEngineService.getOutcomeSummary(evaluation),
    };
  },

  /**
   * Generate verification code for a successful session
   */
  async generateCode(sessionId: string, data: GenerateCodeInput) {
    // Get the session
    const session = await screeningSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Screening session not found');
    }

    // Check if session is eligible for code generation
    const isEligible = await screeningSessionRepository.isEligibleForCode(sessionId);
    if (!isEligible) {
      throw new Error('Session is not eligible for code generation (must be completed with ok_to_use outcome)');
    }

    // Check if code already exists for this session
    const existingCode = await verificationCodeRepository.findBySessionId(sessionId);
    if (existingCode) {
      // Return existing code instead of creating a new one
      return {
        code: existingCode,
        isNew: false,
      };
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + data.expiresInHours);

    // Create new verification code
    const code = await verificationCodeRepository.create({
      tenantId: session.tenantId,
      screeningSessionId: sessionId,
      type: data.codeType,
      expiresAt,
    });

    return {
      code,
      isNew: true,
    };
  },
};
