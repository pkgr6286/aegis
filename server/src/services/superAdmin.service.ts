import { tenantRepository } from '../db/repositories/tenant.repository';
import { userRepository } from '../db/repositories/user.repository';
import { tenantUserRepository } from '../db/repositories/tenantUser.repository';
import { auditLogService } from './auditLog.service';
import type { CreateTenantInput, UpdateTenantLicenseInput, InviteTenantAdminInput } from '../validations/superAdmin.validation';

/**
 * Super Admin Service
 * 
 * Handles all operations that can only be performed by platform super admins.
 * This includes tenant management, licensing, and tenant admin invitations.
 */
export class SuperAdminService {
  /**
   * Get all tenants in the system
   */
  async getAllTenants(options?: { limit?: number; offset?: number }) {
    return await tenantRepository.findAll(options);
  }

  /**
   * Get a single tenant by ID with additional metadata
   */
  async getTenantById(tenantId: string) {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get additional tenant statistics
    const userCount = await tenantRepository.getUserCount(tenantId);
    const admins = await tenantRepository.findTenantUsers(tenantId, { role: 'admin' });

    return {
      ...tenant,
      stats: {
        userCount,
        adminCount: admins.length,
      },
    };
  }

  /**
   * Create a new tenant
   * This is a critical operation that requires audit logging
   */
  async createTenant(data: CreateTenantInput, createdByUserId: string) {
    // Create the tenant
    const tenant = await tenantRepository.create({
      name: data.name,
      status: data.status || 'trial',
      metadata: data.metadata,
    });

    // Create audit log for tenant creation
    // Note: Since this is a new tenant, we use the tenant's own ID for the audit log
    await auditLogService.createAuditLog({
      tenantId: tenant.id,
      userId: createdByUserId,
      action: 'tenant.create',
      entityType: 'Tenant',
      entityId: tenant.id,
      changes: {
        new: {
          name: tenant.name,
          status: tenant.status,
        },
      },
    });

    return tenant;
  }

  /**
   * Update a tenant's license information
   * License details are stored in the metadata field
   */
  async updateTenantLicense(
    tenantId: string,
    licenseData: UpdateTenantLicenseInput,
    updatedByUserId: string
  ) {
    // Get current tenant to compare changes
    const currentTenant = await tenantRepository.findById(tenantId);
    if (!currentTenant) {
      throw new Error('Tenant not found');
    }

    // Merge license data into metadata
    const newMetadata = {
      ...(currentTenant.metadata || {}),
      license: {
        type: licenseData.licenseType,
        maxUsers: licenseData.maxUsers,
        maxPrograms: licenseData.maxPrograms,
        expiresAt: licenseData.expiresAt,
        features: licenseData.features || [],
        ...licenseData.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    // Update tenant
    const updatedTenant = await tenantRepository.updateMetadata(tenantId, newMetadata);

    // Create audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId: updatedByUserId,
      action: 'tenant.license.update',
      entityType: 'Tenant',
      entityId: tenantId,
      changes: {
        old: currentTenant.metadata,
        new: newMetadata,
      },
    });

    return updatedTenant;
  }

  /**
   * Invite a user to be a tenant admin
   * This operation:
   * 1. Finds or creates the user in the global users table
   * 2. Creates a tenant_users membership with the specified role
   * 3. Logs the invitation in the audit log
   */
  async inviteTenantAdmin(
    tenantId: string,
    inviteData: InviteTenantAdminInput,
    invitedByUserId: string
  ) {
    // Verify tenant exists
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Find or create user
    let user = await userRepository.findByEmail(inviteData.email);
    
    if (!user) {
      // Create a new user account
      // Note: No password is set here - user will be prompted to set one on first login
      user = await userRepository.create({
        email: inviteData.email,
        hashedPassword: '', // Will be set when user accepts invitation
        firstName: inviteData.firstName,
        lastName: inviteData.lastName,
      });
    }

    // Check if user is already a member of this tenant
    const existingMembership = await tenantUserRepository.findByUserAndTenant(
      user.id,
      tenantId
    );

    if (existingMembership) {
      throw new Error('User is already a member of this tenant');
    }

    // Create tenant membership
    const tenantUser = await tenantUserRepository.create({
      tenantId,
      userId: user.id,
      role: inviteData.role || 'admin',
      createdBy: invitedByUserId,
    });

    // Create audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId: invitedByUserId,
      action: 'tenant.user.invite',
      entityType: 'TenantUser',
      entityId: tenantUser.id,
      changes: {
        new: {
          email: user.email,
          role: tenantUser.role,
          userId: user.id,
        },
      },
    });

    return {
      tenantUser,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      isNewUser: !existingMembership,
    };
  }

  /**
   * Update tenant status (activate, suspend, etc.)
   */
  async updateTenantStatus(
    tenantId: string,
    status: 'active' | 'suspended' | 'trial',
    updatedByUserId: string
  ) {
    const currentTenant = await tenantRepository.findById(tenantId);
    if (!currentTenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant = await tenantRepository.updateStatus(tenantId, status);

    // Create audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId: updatedByUserId,
      action: 'tenant.status.update',
      entityType: 'Tenant',
      entityId: tenantId,
      changes: {
        old: { status: currentTenant.status },
        new: { status },
      },
    });

    return updatedTenant;
  }

  /**
   * Get dashboard statistics for Super Admin
   */
  async getStats() {
    const { db } = await import('../db');
    const { tenants, users, auditLogs } = await import('../db/schema/public');
    const { sql, count, gt, gte } = await import('drizzle-orm');

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total counts
    const [tenantCount] = await db.select({ count: count() }).from(tenants);
    const [userCount] = await db.select({ count: count() }).from(users);
    const [newTenantCount] = await db
      .select({ count: count() })
      .from(tenants)
      .where(gte(tenants.createdAt, thirtyDaysAgo));

    // Get new tenants this month (daily aggregation)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newTenantsThisMonth = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as count
      FROM ${tenants}
      WHERE created_at >= ${startOfMonth}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return {
      totalTenants: tenantCount.count,
      activeUsers: userCount.count,
      apiCalls: 1250000, // Mock value as requested
      newTenants: newTenantCount.count,
      newTenantsThisMonth: newTenantsThisMonth.rows as { date: string; count: number }[],
    };
  }

  /**
   * Get all system users with pagination
   */
  async getAllUsers(options?: { page?: number; limit?: number }) {
    const { db } = await import('../db');
    const { users, userSystemRoles } = await import('../db/schema/public');
    const { eq, sql } = await import('drizzle-orm');

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const offset = (page - 1) * limit;

    // Get users with system roles
    const systemUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        role: userSystemRoles.role,
      })
      .from(users)
      .innerJoin(userSystemRoles, eq(users.id, userSystemRoles.userId))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${users.id})` })
      .from(users)
      .innerJoin(userSystemRoles, eq(users.id, userSystemRoles.userId));

    return {
      data: systemUsers,
      pagination: {
        page,
        limit,
        total: Number(totalResult.count),
        totalPages: Math.ceil(Number(totalResult.count) / limit),
      },
    };
  }

  /**
   * Invite a new system user (super_admin or support_staff)
   */
  async inviteSystemUser(inviteData: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'super_admin' | 'support_staff';
  }) {
    const { db } = await import('../db');
    const { userSystemRoles } = await import('../db/schema/public');
    const { and, eq } = await import('drizzle-orm');

    // Find or create user
    let user = await userRepository.findByEmail(inviteData.email);

    if (!user) {
      // Create new user (no password set - will be set when user accepts invitation)
      user = await userRepository.create({
        email: inviteData.email,
        hashedPassword: '', // Will be set when user accepts invitation
        firstName: inviteData.firstName,
        lastName: inviteData.lastName,
      });
    }

    // Check if user already has this system role
    const existingRole = await db
      .select()
      .from(userSystemRoles)
      .where(
        and(
          eq(userSystemRoles.userId, user.id),
          eq(userSystemRoles.role, inviteData.role)
        )
      )
      .limit(1);

    if (existingRole.length > 0) {
      throw new Error(`User already has the ${inviteData.role} role`);
    }

    // Add system role
    await db.insert(userSystemRoles).values({
      userId: user.id,
      role: inviteData.role,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: inviteData.role,
    };
  }

  /**
   * Revoke a system role from a user
   */
  async revokeSystemRole(userId: string, role: 'super_admin' | 'support_staff') {
    const { db } = await import('../db');
    const { userSystemRoles } = await import('../db/schema/public');
    const { and, eq } = await import('drizzle-orm');

    // Remove the system role
    await db
      .delete(userSystemRoles)
      .where(
        and(
          eq(userSystemRoles.userId, userId),
          eq(userSystemRoles.role, role)
        )
      );

    return { success: true };
  }

  /**
   * Get audit logs with filtering (bypasses RLS for Super Admin)
   */
  async getAuditLogs(options?: {
    page?: number;
    limit?: number;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { db } = await import('../db');
    const { auditLogs } = await import('../db/schema/public');
    const { and, eq, gte, lte, sql } = await import('drizzle-orm');

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (options?.tenantId) {
      conditions.push(eq(auditLogs.tenantId, options.tenantId));
    }
    if (options?.startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(options.startDate)));
    }
    if (options?.endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(options.endDate)));
    }

    // Get audit logs
    const logs = await db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${auditLogs.timestamp} DESC`)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total: Number(totalResult.count),
        totalPages: Math.ceil(Number(totalResult.count) / limit),
      },
    };
  }
}

export const superAdminService = new SuperAdminService();
