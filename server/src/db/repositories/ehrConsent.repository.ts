/**
 * EHR Consent Repository
 * 
 * Data access layer for EHR consent records
 */

import { db } from '../index';
import { ehrConsents } from '../schema/consumer';
import { eq, and } from 'drizzle-orm';

export const ehrConsentRepository = {
  /**
   * Create a new EHR consent record
   */
  async create(data: {
    tenantId: string;
    screeningSessionId: string;
    status: 'granted' | 'revoked' | 'failed';
    providerName?: string;
    scopesGranted?: string[];
    accessToken?: string;
    tokenExpiresAt?: Date;
  }) {
    const results = await db
      .insert(ehrConsents)
      .values(data)
      .returning();
    
    return results[0];
  },

  /**
   * Find EHR consent by screening session ID
   */
  async findBySessionId(sessionId: string) {
    const results = await db
      .select()
      .from(ehrConsents)
      .where(eq(ehrConsents.screeningSessionId, sessionId))
      .orderBy(ehrConsents.createdAt)
      .limit(1);
    
    return results[0] || null;
  },

  /**
   * Find EHR consent by ID
   */
  async findById(id: string) {
    const results = await db
      .select()
      .from(ehrConsents)
      .where(eq(ehrConsents.id, id));
    
    return results[0] || null;
  },

  /**
   * Update consent status (e.g., granted → revoked)
   */
  async updateStatus(id: string, status: 'granted' | 'revoked' | 'failed') {
    const results = await db
      .update(ehrConsents)
      .set({ status })
      .where(eq(ehrConsents.id, id))
      .returning();
    
    return results[0] || null;
  },

  /**
   * Check if a session has an active (granted) consent
   */
  async hasActiveConsent(sessionId: string): Promise<boolean> {
    const results = await db
      .select({ id: ehrConsents.id })
      .from(ehrConsents)
      .where(and(
        eq(ehrConsents.screeningSessionId, sessionId),
        eq(ehrConsents.status, 'granted')
      ))
      .limit(1);
    
    return results.length > 0;
  },
};
