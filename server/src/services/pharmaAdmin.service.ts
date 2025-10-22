/**
 * Pharma Admin Service
 * 
 * Business logic for tenant admin operations:
 * - User management
 * - Partner management
 * - Audit log access
 */

import { userRepository } from '../db/repositories/user.repository';
import { tenantRepository } from '../db/repositories/tenant.repository';
import { partnerRepository } from '../db/repositories/partner.repository';
import { auditLogRepository } from '../db/repositories/auditLog.repository';
import { auditLogService } from './auditLog.service';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import type { InviteUserInput, CreatePartnerInput, GenerateApiKeyInput, AuditLogQuery } from '../validations/pharmaAdmin.validation';

export const pharmaAdminService = {
  // ============================================================================
  // User Management
  // ============================================================================

  /**
   * List all users in the admin's tenant
   */
  async listTenantUsers(tenantId: string, adminUserId: string) {
    return await tenantRepository.findTenantUsers(tenantId);
  },

  /**
   * Invite a new user to the tenant by creating an invitation token
   */
  async inviteUser(tenantId: string, adminUserId: string, data: InviteUserInput) {
    const { db } = await import('../db');
    const { invitationTokens } = await import('../db/schema/public');
    const { and, eq } = await import('drizzle-orm');

    // Expire any existing active invitation tokens for this email/tenant
    await db
      .update(invitationTokens)
      .set({ status: 'expired' })
      .where(
        and(
          eq(invitationTokens.email, data.email),
          eq(invitationTokens.tenantId, tenantId),
          eq(invitationTokens.status, 'active')
        )
      );

    // Create new invitation token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invitation] = await db
      .insert(invitationTokens)
      .values({
        email: data.email,
        token,
        tenantId,
        role: data.role,
        invitedBy: adminUserId,
        status: 'active',
        expiresAt,
      })
      .returning();

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId: adminUserId,
      action: 'invitation.created',
      entityType: 'invitation_token',
      entityId: invitation.id,
      changes: {
        after: {
          email: data.email,
          role: data.role,
          expiresAt: invitation.expiresAt,
        },
      },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  },

  /**
   * Remove a user from the tenant
   */
  async removeUser(tenantId: string, adminUserId: string, userId: string) {
    // Verify user is part of tenant
    const tenantUsers = await tenantRepository.findTenantUsers(tenantId);
    const tenantUser = tenantUsers.find(tu => tu.userId === userId);

    if (!tenantUser) {
      throw new Error('User not found in tenant');
    }

    // Don't allow removing yourself
    if (userId === adminUserId) {
      throw new Error('Cannot remove yourself from the tenant');
    }

    // Remove user from tenant
    await tenantRepository.removeUserFromTenant(tenantId, userId);

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId: adminUserId,
      action: 'user.removed',
      resourceType: 'tenant_user',
      resourceId: userId,
      changes: {
        before: {
          userId: userId,
          role: tenantUser.role,
        },
      },
    });

    return { success: true };
  },

  // ============================================================================
  // Partner Management
  // ============================================================================

  /**
   * List all B2B partners for the tenant
   */
  async listPartners(tenantId: string, adminUserId: string) {
    return await partnerRepository.findByTenant(tenantId);
  },

  /**
   * Create a new partner
   */
  async createPartner(tenantId: string, adminUserId: string, data: CreatePartnerInput) {
    const partner = await partnerRepository.create({
      tenantId,
      ...data,
    });

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId: adminUserId,
      action: 'partner.created',
      resourceType: 'partner',
      resourceId: partner.id,
      changes: { after: partner },
    });

    return partner;
  },

  /**
   * Generate a new API key for a partner
   */
  async generatePartnerApiKey(
    tenantId: string,
    partnerId: string,
    adminUserId: string,
    data: GenerateApiKeyInput
  ) {
    // Verify partner exists and belongs to tenant
    const partner = await partnerRepository.findById(tenantId, partnerId);
    if (!partner) {
      throw new Error('Partner not found');
    }

    // Generate a raw API key (should be shown to user only once)
    const rawKey = `aegis_${nanoid(32)}`;

    // Hash the API key using bcrypt (one-way, secure)
    const saltRounds = 10;
    const hashedKey = await bcrypt.hash(rawKey, saltRounds);

    // Generate a key prefix for identification
    const keyPrefix = partnerRepository.generateKeyPrefix(partner.name);

    // Calculate expiration date if specified
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    // Create the API key
    const apiKey = await partnerRepository.createApiKey({
      tenantId,
      partnerId,
      keyPrefix,
      hashedKey,
      expiresAt,
    });

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId: adminUserId,
      action: 'partner_api_key.generated',
      resourceType: 'partner_api_key',
      resourceId: apiKey.id,
      changes: {
        after: {
          partnerId,
          keyPrefix,
          expiresAt,
        },
      },
    });

    // Return the raw key ONLY this once
    return {
      apiKey,
      rawKey, // IMPORTANT: This is the only time the raw key will be visible
    };
  },

  /**
   * Revoke a partner's API key
   */
  async revokePartnerApiKey(
    tenantId: string,
    partnerId: string,
    keyId: string,
    adminUserId: string
  ) {
    // Verify partner exists
    const partner = await partnerRepository.findById(tenantId, partnerId);
    if (!partner) {
      throw new Error('Partner not found');
    }

    // Verify key exists and belongs to this partner
    const apiKey = await partnerRepository.findApiKeyById(tenantId, keyId);
    if (!apiKey || apiKey.partnerId !== partnerId) {
      throw new Error('API key not found for this partner');
    }

    // Revoke the key
    const revokedKey = await partnerRepository.revokeApiKey(tenantId, keyId);

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId: adminUserId,
      action: 'partner_api_key.revoked',
      resourceType: 'partner_api_key',
      resourceId: keyId,
      changes: {
        before: { status: apiKey.status },
        after: { status: 'revoked' },
      },
    });

    return revokedKey;
  },

  // ============================================================================
  // Dashboard Statistics
  // ============================================================================

  /**
   * Get dashboard statistics for the tenant
   */
  async getDashboardStats(tenantId: string, userId: string) {
    const { db } = await import('../db');
    const { screeningSessions } = await import('../db/schema/consumer');
    const { drugPrograms } = await import('../db/schema/programs');
    const { tenantUsers } = await import('../db/schema/core');
    const { sql, count, eq, and, gte } = await import('drizzle-orm');

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total screening sessions count
    const [totalScreenings] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(eq(screeningSessions.tenantId, tenantId));

    // Get successful screenings (completed with 'ok_to_use' outcome)
    const [successfulScreenings] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.status, 'completed'),
          eq(screeningSessions.outcome, 'ok_to_use')
        )
      );

    // Get total completed screenings for success rate calculation
    const [completedScreenings] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.status, 'completed')
        )
      );

    // Calculate success rate
    const successRate = completedScreenings.count > 0
      ? (successfulScreenings.count / completedScreenings.count) * 100
      : 0;

    // Get active programs count
    const [activePrograms] = await db
      .select({ count: count() })
      .from(drugPrograms)
      .where(
        and(
          eq(drugPrograms.tenantId, tenantId),
          eq(drugPrograms.status, 'active')
        )
      );

    // Get team members count
    const [teamMembers] = await db
      .select({ count: count() })
      .from(tenantUsers)
      .where(eq(tenantUsers.tenantId, tenantId));

    // Get daily screening activity for last 30 days
    const dailyActivity = await db
      .select({
        date: sql<string>`DATE(${screeningSessions.createdAt})`,
        count: count(),
      })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          gte(screeningSessions.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`DATE(${screeningSessions.createdAt})`)
      .orderBy(sql`DATE(${screeningSessions.createdAt})`);

    return {
      totalScreenings: totalScreenings.count,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      activePrograms: activePrograms.count,
      teamMembers: teamMembers.count,
      dailyActivity: dailyActivity.map(row => ({
        date: row.date,
        count: row.count,
      })),
    };
  },

  // ============================================================================
  // Audit Log Access
  // ============================================================================

  /**
   * View audit logs for the tenant
   */
  async getAuditLogs(tenantId: string, adminUserId: string, query: AuditLogQuery) {
    return await auditLogRepository.findByTenant(tenantId, {
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      userId: query.userId,
      action: query.action,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
      offset: query.offset,
    });
  },
};
