/**
 * Drug Program Service
 * 
 * Business logic for managing drug programs
 */

import { drugProgramRepository } from '../db/repositories/drugProgram.repository';
import { auditLogService } from './auditLog.service';
import type { CreateDrugProgramInput, UpdateDrugProgramInput } from '../validations/drugProgram.validation';

export const drugProgramService = {
  /**
   * List all drug programs for a tenant
   */
  async listDrugPrograms(tenantId: string, userId: string) {
    return await drugProgramRepository.findByTenant(tenantId);
  },

  /**
   * Get a single drug program by ID
   */
  async getDrugProgram(tenantId: string, programId: string, userId: string) {
    const program = await drugProgramRepository.findById(tenantId, programId);
    
    if (!program) {
      throw new Error('Drug program not found');
    }
    
    return program;
  },

  /**
   * Create a new drug program
   */
  async createDrugProgram(tenantId: string, userId: string, data: CreateDrugProgramInput) {
    // Generate a slug from the program name if not provided
    const slug = data.slug || data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const program = await drugProgramRepository.create({
      tenantId,
      ...data,
      slug,
      createdBy: userId,
      updatedBy: userId,
    });

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'drug_program.created',
      entityType: 'drug_program',
      entityId: program.id,
      changes: { after: program },
    });

    return program;
  },

  /**
   * Update a drug program
   */
  async updateDrugProgram(
    tenantId: string,
    programId: string,
    userId: string,
    data: UpdateDrugProgramInput
  ) {
    const before = await drugProgramRepository.findById(tenantId, programId);
    
    if (!before) {
      throw new Error('Drug program not found');
    }

    const after = await drugProgramRepository.update(tenantId, programId, {
      ...data,
      updatedBy: userId,
    } as any);

    if (!after) {
      throw new Error('Failed to update drug program');
    }

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'drug_program.updated',
      entityType: 'drug_program',
      entityId: programId,
      changes: { before, after },
    });

    return after;
  },

  /**
   * Delete a drug program
   */
  async deleteDrugProgram(tenantId: string, programId: string, userId: string) {
    const program = await drugProgramRepository.findById(tenantId, programId);
    
    if (!program) {
      throw new Error('Drug program not found');
    }

    await drugProgramRepository.delete(tenantId, programId);

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'drug_program.deleted',
      entityType: 'drug_program',
      entityId: programId,
      changes: { before: program },
    });

    return program;
  },
};
