/**
 * Brand Configuration Repository
 * 
 * Data access layer for brand configurations
 */

import { db } from '../index';
import { brandConfigs } from '../schema/programs';
import { eq, and } from 'drizzle-orm';

export const brandConfigRepository = {
  /**
   * Find all brand configs for a tenant
   */
  async findByTenant(tenantId: string) {
    return await db
      .select()
      .from(brandConfigs)
      .where(eq(brandConfigs.tenantId, tenantId))
      .orderBy(brandConfigs.createdAt);
  },

  /**
   * Find a brand config by ID within a tenant
   */
  async findById(tenantId: string, id: string) {
    const results = await db
      .select()
      .from(brandConfigs)
      .where(and(
        eq(brandConfigs.id, id),
        eq(brandConfigs.tenantId, tenantId)
      ));
    
    return results[0] || null;
  },

  /**
   * Create a new brand config
   */
  async create(data: {
    tenantId: string;
    name: string;
    config: Record<string, any>;
  }) {
    const results = await db
      .insert(brandConfigs)
      .values(data)
      .returning();
    
    return results[0];
  },

  /**
   * Update a brand config
   */
  async update(tenantId: string, id: string, data: {
    name?: string;
    config?: Record<string, any>;
  }) {
    const results = await db
      .update(brandConfigs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(brandConfigs.id, id),
        eq(brandConfigs.tenantId, tenantId)
      ))
      .returning();
    
    return results[0] || null;
  },

  /**
   * Delete a brand config
   */
  async delete(tenantId: string, id: string) {
    const results = await db
      .delete(brandConfigs)
      .where(and(
        eq(brandConfigs.id, id),
        eq(brandConfigs.tenantId, tenantId)
      ))
      .returning();
    
    return results[0] || null;
  },
};
