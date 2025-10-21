import { db } from '../index';
import { tenantUsers } from '../schema/core';
import { eq, and } from 'drizzle-orm';

/**
 * Tenant User Repository
 * Handles tenant membership and role management
 */
export class TenantUserRepository {
  /**
   * Find tenant user by ID
   */
  async findById(id: string) {
    const [tenantUser] = await db
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.id, id));
    return tenantUser || null;
  }

  /**
   * Find tenant user by user ID and tenant ID
   */
  async findByUserAndTenant(userId: string, tenantId: string) {
    const [tenantUser] = await db
      .select()
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.userId, userId),
          eq(tenantUsers.tenantId, tenantId)
        )
      );
    return tenantUser || null;
  }

  /**
   * Get all tenants for a user
   */
  async findTenantsForUser(userId: string) {
    return await db
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userId, userId));
  }

  /**
   * Get all users in a tenant
   */
  async findUsersInTenant(tenantId: string, role?: 'admin' | 'editor' | 'viewer') {
    if (role) {
      return await db
        .select()
        .from(tenantUsers)
        .where(
          and(
            eq(tenantUsers.tenantId, tenantId),
            eq(tenantUsers.role, role)
          )
        );
    }
    
    return await db
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.tenantId, tenantId));
  }

  /**
   * Create a new tenant user relationship
   */
  async create(data: {
    tenantId: string;
    userId: string;
    role: 'admin' | 'editor' | 'viewer';
    createdBy: string;
    metadata?: Record<string, any>;
  }) {
    const [tenantUser] = await db
      .insert(tenantUsers)
      .values({
        tenantId: data.tenantId,
        userId: data.userId,
        role: data.role,
        metadata: data.metadata || null,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      })
      .returning();
    return tenantUser;
  }

  /**
   * Update tenant user role
   */
  async updateRole(id: string, role: 'admin' | 'editor' | 'viewer', updatedBy: string) {
    const [tenantUser] = await db
      .update(tenantUsers)
      .set({ 
        role,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(tenantUsers.id, id))
      .returning();
    return tenantUser;
  }

  /**
   * Soft delete a tenant user
   */
  async softDelete(id: string, deletedBy: string) {
    const [tenantUser] = await db
      .update(tenantUsers)
      .set({ 
        deletedAt: new Date(),
        updatedBy: deletedBy,
        updatedAt: new Date(),
      })
      .where(eq(tenantUsers.id, id))
      .returning();
    return tenantUser;
  }

  /**
   * Check if a user is an admin in a tenant
   */
  async isAdmin(userId: string, tenantId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.userId, userId),
          eq(tenantUsers.tenantId, tenantId),
          eq(tenantUsers.role, 'admin')
        )
      )
      .limit(1);

    return !!result;
  }
}

export const tenantUserRepository = new TenantUserRepository();
