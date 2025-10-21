/**
 * Partner Repository
 * 
 * Data access layer for partners, API keys, and configurations
 */

import { db } from '../index';
import { partners, partnerApiKeys, partnerConfigs } from '../schema/partners';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const partnerRepository = {
  /**
   * Find all partners for a tenant
   */
  async findByTenant(tenantId: string) {
    return await db
      .select()
      .from(partners)
      .where(eq(partners.tenantId, tenantId))
      .orderBy(partners.createdAt);
  },

  /**
   * Find a partner by ID within a tenant
   */
  async findById(tenantId: string, id: string) {
    const results = await db
      .select()
      .from(partners)
      .where(and(
        eq(partners.id, id),
        eq(partners.tenantId, tenantId)
      ));
    
    return results[0] || null;
  },

  /**
   * Create a new partner
   */
  async create(data: {
    tenantId: string;
    name: string;
    type: 'ecommerce' | 'retail_pos';
    status?: 'active' | 'inactive';
  }) {
    const results = await db
      .insert(partners)
      .values(data)
      .returning();
    
    return results[0];
  },

  /**
   * Update a partner
   */
  async update(tenantId: string, id: string, data: {
    name?: string;
    type?: 'ecommerce' | 'retail_pos';
    status?: 'active' | 'inactive';
  }) {
    const results = await db
      .update(partners)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(partners.id, id),
        eq(partners.tenantId, tenantId)
      ))
      .returning();
    
    return results[0] || null;
  },

  /**
   * Delete a partner
   */
  async delete(tenantId: string, id: string) {
    const results = await db
      .delete(partners)
      .where(and(
        eq(partners.id, id),
        eq(partners.tenantId, tenantId)
      ))
      .returning();
    
    return results[0] || null;
  },

  // ============================================================================
  // API Key Management
  // ============================================================================

  /**
   * Find all API keys for a partner
   */
  async findApiKeysByPartner(tenantId: string, partnerId: string) {
    return await db
      .select()
      .from(partnerApiKeys)
      .where(and(
        eq(partnerApiKeys.partnerId, partnerId),
        eq(partnerApiKeys.tenantId, tenantId)
      ))
      .orderBy(partnerApiKeys.createdAt);
  },

  /**
   * Find an API key by ID
   */
  async findApiKeyById(tenantId: string, keyId: string) {
    const results = await db
      .select()
      .from(partnerApiKeys)
      .where(and(
        eq(partnerApiKeys.id, keyId),
        eq(partnerApiKeys.tenantId, tenantId)
      ));
    
    return results[0] || null;
  },

  /**
   * Create a new API key
   * Note: The caller must hash the key before passing it here
   */
  async createApiKey(data: {
    tenantId: string;
    partnerId: string;
    keyPrefix: string;
    hashedKey: string;
    expiresAt?: Date;
  }) {
    const results = await db
      .insert(partnerApiKeys)
      .values(data)
      .returning();
    
    return results[0];
  },

  /**
   * Revoke an API key
   */
  async revokeApiKey(tenantId: string, keyId: string) {
    const results = await db
      .update(partnerApiKeys)
      .set({
        status: 'revoked',
        updatedAt: new Date(),
      })
      .where(and(
        eq(partnerApiKeys.id, keyId),
        eq(partnerApiKeys.tenantId, tenantId)
      ))
      .returning();
    
    return results[0] || null;
  },

  /**
   * Generate a unique key prefix
   */
  generateKeyPrefix(partnerName: string): string {
    const sanitized = partnerName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 4);
    const random = nanoid(6);
    return `${sanitized}_${random}`;
  },

  // ============================================================================
  // Partner Configuration
  // ============================================================================

  /**
   * Find partner configuration
   */
  async findConfig(tenantId: string, partnerId: string) {
    const results = await db
      .select()
      .from(partnerConfigs)
      .where(and(
        eq(partnerConfigs.partnerId, partnerId),
        eq(partnerConfigs.tenantId, tenantId)
      ));
    
    return results[0] || null;
  },

  /**
   * Upsert partner configuration
   */
  async upsertConfig(data: {
    tenantId: string;
    partnerId: string;
    config: Record<string, any>;
  }) {
    const results = await db
      .insert(partnerConfigs)
      .values(data)
      .onConflictDoUpdate({
        target: partnerConfigs.partnerId,
        set: {
          config: data.config,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return results[0];
  },
};
