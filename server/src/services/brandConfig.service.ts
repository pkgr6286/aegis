/**
 * Brand Configuration Service
 * 
 * Business logic for managing brand configurations
 */

import { brandConfigRepository } from '../db/repositories/brandConfig.repository';
import { auditLogService } from './auditLog.service';
import type { CreateBrandConfigInput, UpdateBrandConfigInput } from '../validations/brandConfig.validation';

export const brandConfigService = {
  /**
   * List all brand configurations for a tenant
   */
  async listBrandConfigs(tenantId: string, userId: string) {
    return await brandConfigRepository.findByTenant(tenantId);
  },

  /**
   * Get a single brand configuration by ID
   */
  async getBrandConfig(tenantId: string, brandConfigId: string, userId: string) {
    const brandConfig = await brandConfigRepository.findById(tenantId, brandConfigId);
    
    if (!brandConfig) {
      throw new Error('Brand configuration not found');
    }
    
    return brandConfig;
  },

  /**
   * Create a new brand configuration
   */
  async createBrandConfig(tenantId: string, userId: string, data: CreateBrandConfigInput) {
    const brandConfig = await brandConfigRepository.create({
      tenantId,
      ...data,
    });

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'brand_config.created',
      resourceType: 'brand_config',
      resourceId: brandConfig.id,
      changes: { after: brandConfig },
    });

    return brandConfig;
  },

  /**
   * Update a brand configuration
   */
  async updateBrandConfig(
    tenantId: string,
    brandConfigId: string,
    userId: string,
    data: UpdateBrandConfigInput
  ) {
    const before = await brandConfigRepository.findById(tenantId, brandConfigId);
    
    if (!before) {
      throw new Error('Brand configuration not found');
    }

    const after = await brandConfigRepository.update(tenantId, brandConfigId, data);

    if (!after) {
      throw new Error('Failed to update brand configuration');
    }

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'brand_config.updated',
      resourceType: 'brand_config',
      resourceId: brandConfigId,
      changes: { before, after },
    });

    return after;
  },

  /**
   * Delete a brand configuration
   */
  async deleteBrandConfig(tenantId: string, brandConfigId: string, userId: string) {
    const brandConfig = await brandConfigRepository.findById(tenantId, brandConfigId);
    
    if (!brandConfig) {
      throw new Error('Brand configuration not found');
    }

    await brandConfigRepository.delete(tenantId, brandConfigId);

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'brand_config.deleted',
      resourceType: 'brand_config',
      resourceId: brandConfigId,
      changes: { before: brandConfig },
    });

    return brandConfig;
  },
};
