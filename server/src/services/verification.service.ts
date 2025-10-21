/**
 * Verification Service
 * 
 * Handles partner code verification with:
 * - Atomic database updates (prevents race conditions)
 * - Audit logging for compliance
 * - Real-time validation of codes
 */

import { verificationCodeRepository } from '../db/repositories/verificationCode.repository';
import { screeningSessionRepository } from '../db/repositories/screeningSession.repository';
import { auditLogService } from './auditLog.service';
import type { VerifyCodeInput } from '../validations/verification.validation';

export const verificationService = {
  /**
   * Verify a code and mark it as used (atomic operation)
   * 
   * CRITICAL: This operation must be atomic to prevent race conditions
   * where multiple partners try to verify the same code simultaneously
   */
  async verifyCode(partnerId: string, tenantId: string, data: VerifyCodeInput) {
    const startTime = Date.now();

    // Atomically verify and mark the code as used
    const code = await verificationCodeRepository.verifyAndMarkUsed(data.code);

    // Audit log the attempt
    const success = code !== null;
    const duration = Date.now() - startTime;

    await auditLogService.createAuditLog({
      tenantId,
      userId: partnerId, // Use partner ID as the "user" for audit trail
      action: success ? 'code.verified' : 'code.verification_failed',
      resourceType: 'verification_code',
      resourceId: code?.id || data.code,
      changes: {
        attempt: {
          code: data.code,
          partnerId,
          metadata: data.metadata,
          success,
          duration,
        },
      },
    }).catch(err => {
      // Non-blocking audit log failure
      console.error('Failed to create audit log for code verification:', err);
    });

    if (!code) {
      // Code was not found, already used, or expired
      // Fetch the code to determine the specific reason
      const existingCode = await verificationCodeRepository.findByCode(data.code);

      if (!existingCode) {
        throw new Error('Verification code not found');
      }

      if (existingCode.status === 'used') {
        throw new Error('Verification code has already been used');
      }

      if (existingCode.status === 'expired' || new Date() > existingCode.expiresAt) {
        throw new Error('Verification code has expired');
      }

      // Unknown error
      throw new Error('Verification code is invalid');
    }

    // Get the associated screening session for additional context
    const session = await screeningSessionRepository.findById(code.screeningSessionId);

    return {
      valid: true,
      code,
      session,
      message: 'Verification code successfully validated',
    };
  },

  /**
   * Check code validity without marking as used (preview/lookup)
   */
  async checkCode(code: string) {
    const verificationCode = await verificationCodeRepository.findByCode(code);

    if (!verificationCode) {
      return {
        valid: false,
        reason: 'not_found',
        message: 'Verification code not found',
      };
    }

    if (verificationCode.status === 'used') {
      return {
        valid: false,
        reason: 'already_used',
        message: 'Verification code has already been used',
        usedAt: verificationCode.usedAt,
      };
    }

    if (verificationCode.status === 'expired' || new Date() > verificationCode.expiresAt) {
      return {
        valid: false,
        reason: 'expired',
        message: 'Verification code has expired',
        expiresAt: verificationCode.expiresAt,
      };
    }

    // Code is valid and unused
    return {
      valid: true,
      code: verificationCode,
      expiresAt: verificationCode.expiresAt,
    };
  },
};
