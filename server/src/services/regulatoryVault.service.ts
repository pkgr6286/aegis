/**
 * Regulatory Vault Service
 * 
 * Business logic for managing regulatory documentation vault
 */

import { regulatoryDocumentRepository } from '../db/repositories/regulatoryDocument.repository';
import { auditLogService } from './auditLog.service';
import type { 
  CreateRegulatoryDocumentInput, 
  UpdateRegulatoryDocumentInput,
  ListRegulatoryDocumentsQuery,
  SubmissionPacketInput
} from '../validations/regulatoryVault.validation';

export const regulatoryVaultService = {
  /**
   * List all regulatory documents with optional filtering
   * Implements role-based access control:
   * - admin/editor: See all documents
   * - viewer/auditor: See all documents (read-only enforced at route level)
   * - Future: external partners would only see 'external' documents
   */
  async listDocuments(
    tenantId: string, 
    userId: string, 
    userRole: string,
    query: ListRegulatoryDocumentsQuery
  ) {
    const filters = {
      category: query.category,
      accessLevel: query.accessLevel,
      tags: query.tags ? query.tags.split(',').map(t => t.trim()) : undefined,
      searchTerm: query.searchTerm,
    };

    // Role-based filtering
    // For now, all tenant users can see all docs within their tenant
    // In future, we can add 'external' user type that only sees external docs
    // Example: if (userRole === 'external') filters.accessLevel = 'external';

    return await regulatoryDocumentRepository.findByTenant(tenantId, filters);
  },

  /**
   * Get a single regulatory document
   */
  async getDocument(tenantId: string, documentId: string, userId: string) {
    const document = await regulatoryDocumentRepository.findById(tenantId, documentId);
    
    if (!document) {
      throw new Error('Regulatory document not found');
    }
    
    return document;
  },

  /**
   * Create a new regulatory document
   */
  async createDocument(tenantId: string, userId: string, data: CreateRegulatoryDocumentInput) {
    const document = await regulatoryDocumentRepository.create({
      tenantId,
      userId,
      ...data,
    });

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'regulatory_document.create',
      entityType: 'RegulatoryDocument',
      entityId: document.id,
      changes: {
        after: {
          title: document.title,
          category: document.category,
          accessLevel: document.accessLevel,
        },
      },
    });

    return document;
  },

  /**
   * Update a regulatory document
   */
  async updateDocument(
    tenantId: string,
    documentId: string,
    userId: string,
    data: UpdateRegulatoryDocumentInput
  ) {
    const existing = await regulatoryDocumentRepository.findById(tenantId, documentId);
    
    if (!existing) {
      throw new Error('Regulatory document not found');
    }

    const updated = await regulatoryDocumentRepository.update(tenantId, documentId, userId, data);

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'regulatory_document.update',
      entityType: 'RegulatoryDocument',
      entityId: documentId,
      changes: {
        before: {
          title: existing.title,
          category: existing.category,
          accessLevel: existing.accessLevel,
        },
        after: {
          title: updated.title,
          category: updated.category,
          accessLevel: updated.accessLevel,
        },
      },
    });

    return updated;
  },

  /**
   * Delete a regulatory document (soft delete)
   */
  async deleteDocument(tenantId: string, documentId: string, userId: string) {
    const existing = await regulatoryDocumentRepository.findById(tenantId, documentId);
    
    if (!existing) {
      throw new Error('Regulatory document not found');
    }

    await regulatoryDocumentRepository.delete(tenantId, documentId, userId);

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'regulatory_document.delete',
      entityType: 'RegulatoryDocument',
      entityId: documentId,
      changes: {
        before: {
          title: existing.title,
          category: existing.category,
        },
      },
    });

    return { success: true };
  },

  /**
   * Get multiple documents for submission packet
   */
  async getSubmissionPacket(tenantId: string, userId: string, data: SubmissionPacketInput) {
    const documents = await regulatoryDocumentRepository.findByIds(tenantId, data.documentIds);
    
    if (documents.length !== data.documentIds.length) {
      throw new Error('Some documents were not found');
    }

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'regulatory_document.submission_packet_generated',
      entityType: 'RegulatoryDocument',
      entityId: undefined,
      changes: {
        documentIds: data.documentIds,
        documentCount: documents.length,
      },
    });

    return documents;
  },

  /**
   * Export documents to CSV format
   */
  async exportToCSV(tenantId: string, userId: string, userRole: string, query: ListRegulatoryDocumentsQuery) {
    const documents = await this.listDocuments(tenantId, userId, userRole, query);
    
    // CSV headers
    const headers = ['Title', 'Category', 'Access Level', 'Tags', 'Description', 'File URL', 'Created At'];
    
    // CSV rows
    const rows = documents.map(doc => [
      doc.title,
      doc.category,
      doc.accessLevel,
      Array.isArray(doc.tags) ? doc.tags.join('; ') : '',
      doc.description || '',
      doc.fileUrl,
      new Date(doc.createdAt).toISOString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Audit log
    await auditLogService.createAuditLog({
      tenantId,
      userId,
      action: 'regulatory_document.export_csv',
      entityType: 'RegulatoryDocument',
      entityId: undefined,
      changes: {
        exportedCount: documents.length,
        filters: query,
      },
    });

    return csvContent;
  },
};
