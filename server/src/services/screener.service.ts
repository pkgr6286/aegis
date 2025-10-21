/**
 * Screener Service
 * 
 * Business logic for managing screener versions
 */

import { screenerVersionRepository } from '../db/repositories/screenerVersion.repository';
import { drugProgramRepository } from '../db/repositories/drugProgram.repository';
import { auditLogService } from './auditLog.service';
import type { CreateScreenerVersionInput } from '../validations/screener.validation';

export const screenerService = {
  /**
   * List all screener versions for a drug program
   */
  async listScreenerVersions(tenantId: string, programId: string, userId: string) {
    // Verify program exists and belongs to tenant
    const program = await drugProgramRepository.findById(tenantId, programId);
    if (!program) {
      throw new Error('Drug program not found');
    }

    return await screenerVersionRepository.findByProgram(tenantId, programId);
  },

  /**
   * Get a specific screener version
   */
  async getScreenerVersion(tenantId: string, versionId: string, userId: string) {
    const version = await screenerVersionRepository.findById(tenantId, versionId);
    
    if (!version) {
      throw new Error('Screener version not found');
    }
    
    return version;
  },

  /**
   * Create a new screener version
   */
  async createScreenerVersion(
    tenantId: string,
    programId: string,
    userId: string,
    data: CreateScreenerVersionInput
  ) {
    // Verify program exists and belongs to tenant
    const program = await drugProgramRepository.findById(tenantId, programId);
    if (!program) {
      throw new Error('Drug program not found');
    }

    // Get next version number
    const versionNumber = await screenerVersionRepository.getNextVersionNumber(tenantId, programId);

    // Create the version
    const version = await screenerVersionRepository.create({
      tenantId,
      drugProgramId: programId,
      version: versionNumber,
      screenerJson: data.screenerJson,
      createdBy: userId,
    });

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'screener_version.created',
      resourceType: 'screener_version',
      resourceId: version.id,
      changes: {
        after: {
          id: version.id,
          programId,
          versionNumber,
        },
      },
    });

    return version;
  },

  /**
   * Publish a screener version (set as active for the drug program)
   */
  async publishScreenerVersion(
    tenantId: string,
    programId: string,
    versionId: string,
    userId: string
  ) {
    // Verify program exists and belongs to tenant
    const program = await drugProgramRepository.findById(tenantId, programId);
    if (!program) {
      throw new Error('Drug program not found');
    }

    // Verify version exists and belongs to this program
    const version = await screenerVersionRepository.findById(tenantId, versionId);
    if (!version) {
      throw new Error('Screener version not found');
    }

    if (version.drugProgramId !== programId) {
      throw new Error('Screener version does not belong to this drug program');
    }

    // Update the drug program's active screener version
    const updatedProgram = await drugProgramRepository.setActiveScreenerVersion(
      tenantId,
      programId,
      versionId
    );

    if (!updatedProgram) {
      throw new Error('Failed to publish screener version');
    }

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'screener_version.published',
      resourceType: 'screener_version',
      resourceId: versionId,
      changes: {
        before: { activeVersionId: program.activeScreenerVersionId },
        after: { activeVersionId: versionId },
      },
    });

    return {
      version,
      program: updatedProgram,
    };
  },
};
