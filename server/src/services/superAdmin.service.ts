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
}

export const superAdminService = new SuperAdminService();
