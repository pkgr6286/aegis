/**
 * Verification Code Repository
 * 
 * Data access layer for verification codes with atomic operations
 */

import { db } from '../index';
import { verificationCodes } from '../schema/consumer';
import { eq, and, lt, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const verificationCodeRepository = {
  /**
   * Find a verification code by code string
   */
  async findByCode(code: string) {
    const results = await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.code, code));
    
    return results[0] || null;
  },

  /**
   * Find verification code by screening session ID
   */
  async findBySessionId(sessionId: string) {
    const results = await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.screeningSessionId, sessionId));
    
    return results[0] || null;
  },

  /**
   * Generate a unique verification code
   * Uses nanoid for URL-safe, collision-resistant codes
   */
  generateCode(length: number = 8): string {
    // Generate uppercase alphanumeric code (easier to read/scan)
    const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes I, O for clarity
    return nanoid(length, alphabet);
  },

  /**
   * Create a new verification code
   */
  async create(data: {
    tenantId: string;
    screeningSessionId: string;
    type?: 'pos_barcode' | 'ecommerce_jwt';
    expiresAt: Date;
  }) {
    // Generate unique code with retry logic
    let code: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      code = this.generateCode();
      const existing = await this.findByCode(code);
      
      if (!existing) {
        break;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique verification code');
      }
    } while (attempts < maxAttempts);

    const results = await db
      .insert(verificationCodes)
      .values({
        ...data,
        code,
        status: 'unused',
      })
      .returning();
    
    return results[0];
  },

  /**
   * Atomically verify and mark a code as used
   * This prevents race conditions when multiple partners verify the same code
   * Returns the code if successfully marked as used, null if already used/expired
   */
  async verifyAndMarkUsed(code: string): Promise<typeof verificationCodes.$inferSelect | null> {
    // Use a PostgreSQL UPDATE ... WHERE ... RETURNING pattern for atomicity
    // This ensures only ONE partner can successfully verify the code
    const results = await db
      .update(verificationCodes)
      .set({
        status: 'used',
        usedAt: new Date(),
      })
      .where(and(
        eq(verificationCodes.code, code),
        eq(verificationCodes.status, 'unused'),
        // Also check expiration
        sql`${verificationCodes.expiresAt} > NOW()`
      ))
      .returning();
    
    // If no rows were updated, the code was either:
    // 1. Already used
    // 2. Expired
    // 3. Doesn't exist
    return results[0] || null;
  },

  /**
   * Mark expired codes (for cleanup job)
   */
  async markExpiredCodes(tenantId: string, batchSize: number = 1000): Promise<number> {
    const results = await db
      .update(verificationCodes)
      .set({
        status: 'expired',
      })
      .where(and(
        eq(verificationCodes.tenantId, tenantId),
        eq(verificationCodes.status, 'unused'),
        lt(verificationCodes.expiresAt, new Date())
      ))
      .returning();
    
    return results.length;
  },

  /**
   * Get code usage statistics for analytics
   */
  async getCodeStats(tenantId: string) {
    const results = await db
      .select({
        totalCodes: sql<number>`COUNT(*)`,
        unusedCodes: sql<number>`COUNT(*) FILTER (WHERE ${verificationCodes.status} = 'unused')`,
        usedCodes: sql<number>`COUNT(*) FILTER (WHERE ${verificationCodes.status} = 'used')`,
        expiredCodes: sql<number>`COUNT(*) FILTER (WHERE ${verificationCodes.status} = 'expired')`,
      })
      .from(verificationCodes)
      .where(eq(verificationCodes.tenantId, tenantId));
    
    return results[0];
  },
};
