import { db } from '../index';
import { tenants, users } from '../schema/public';
import { tenantUsers } from '../schema/core';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Tenant Repository
 * Handles all database operations for tenants
 */
export class TenantRepository {
  /**
   * Find a tenant by ID
   */
  async findById(id: string) {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || null;
  }

  /**
   * Find all tenants
   */
  async findAll(options?: { limit?: number; offset?: number }) {
    let query = db.select().from(tenants).orderBy(tenants.createdAt);

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  /**
   * Create a new tenant
   */
  async create(data: {
    name: string;
    status?: 'active' | 'suspended' | 'trial';
    metadata?: Record<string, any>;
  }) {
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: data.name,
        status: data.status || 'trial',
        metadata: data.metadata || null,
      })
      .returning();
    return tenant;
  }

  /**
   * Update tenant metadata (e.g., license information)
   */
  async updateMetadata(id: string, metadata: Record<string, any>) {
    const [tenant] = await db
      .update(tenants)
      .set({ 
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  /**
   * Update tenant status
   */
  async updateStatus(id: string, status: 'active' | 'suspended' | 'trial') {
    const [tenant] = await db
      .update(tenants)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  /**
   * Soft-delete a tenant (retire)
   */
  async retire(id: string) {
    const [tenant] = await db
      .update(tenants)
      .set({ 
        retiredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  /**
   * Get tenant user count
   */
  async getUserCount(tenantId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenantUsers)
      .where(eq(tenantUsers.tenantId, tenantId));
    
    return Number(result[0]?.count || 0);
  }

  /**
   * Find tenant users by tenant ID
   */
  async findTenantUsers(tenantId: string, options?: { role?: 'admin' | 'editor' | 'viewer' }) {
    // Build conditions array to properly combine filters
    const conditions = [eq(tenantUsers.tenantId, tenantId)];

    if (options?.role) {
      conditions.push(eq(tenantUsers.role, options.role));
    }

    // Join with users table to get email and name information
    const results = await db
      .select()
      .from(tenantUsers)
      .innerJoin(users, eq(tenantUsers.userId, users.id))
      .where(and(...conditions));

    // Map the results to a flatter structure
    return results.map((row) => ({
      userId: row.tenant_users.userId,
      tenantId: row.tenant_users.tenantId,
      role: row.tenant_users.role,
      joinedAt: row.tenant_users.joinedAt,
      createdBy: row.tenant_users.createdBy,
      email: row.users.email,
      firstName: row.users.firstName,
      lastName: row.users.lastName,
      lastLoginAt: row.users.lastLoginAt,
    }));
  }

  /**
   * Add a user to a tenant with a specific role
   */
  async addUserToTenant(data: {
    tenantId: string;
    userId: string;
    role: 'admin' | 'editor' | 'viewer';
    createdBy: string;
  }) {
    const [tenantUser] = await db
      .insert(tenantUsers)
      .values({
        tenantId: data.tenantId,
        userId: data.userId,
        role: data.role,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      })
      .returning();
    return tenantUser;
  }

  /**
   * Check if a user belongs to a tenant
   */
  async isUserInTenant(userId: string, tenantId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.userId, userId),
          eq(tenantUsers.tenantId, tenantId)
        )
      )
      .limit(1);

    return !!result;
  }

  /**
   * Get user's role in a tenant
   */
  async getUserRole(userId: string, tenantId: string): Promise<'admin' | 'editor' | 'viewer' | null> {
    const [result] = await db
      .select({ role: tenantUsers.role })
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.userId, userId),
          eq(tenantUsers.tenantId, tenantId)
        )
      )
      .limit(1);

    return result?.role || null;
  }
}

export const tenantRepository = new TenantRepository();
