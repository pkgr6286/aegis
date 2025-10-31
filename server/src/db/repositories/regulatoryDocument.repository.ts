import { db } from '../index';
import { regulatoryDocuments } from '../schema/programs';
import { eq, and, ilike, or, sql, inArray } from 'drizzle-orm';

export const regulatoryDocumentRepository = {
  /**
   * Find all documents for a tenant with optional filtering
   */
  async findByTenant(
    tenantId: string,
    filters?: {
      category?: string;
      accessLevel?: string;
      tags?: string[];
      searchTerm?: string;
    }
  ) {
    let conditions = [eq(regulatoryDocuments.tenantId, tenantId)];

    if (filters?.category) {
      conditions.push(eq(regulatoryDocuments.category, filters.category as any));
    }

    if (filters?.accessLevel) {
      conditions.push(eq(regulatoryDocuments.accessLevel, filters.accessLevel as any));
    }

    if (filters?.tags && filters.tags.length > 0) {
      // Filter documents that contain any of the specified tags
      conditions.push(
        sql`${regulatoryDocuments.tags}::jsonb ?| array[${sql.join(
          filters.tags.map(tag => sql`${tag}`),
          sql`, `
        )}]`
      );
    }

    if (filters?.searchTerm) {
      conditions.push(
        or(
          ilike(regulatoryDocuments.title, `%${filters.searchTerm}%`),
          ilike(regulatoryDocuments.description, `%${filters.searchTerm}%`)
        )!
      );
    }

    return await db.query.regulatoryDocuments.findMany({
      where: and(...conditions),
      orderBy: (regulatoryDocuments, { desc }) => [desc(regulatoryDocuments.createdAt)],
      with: {
        creator: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  /**
   * Find a document by ID
   */
  async findById(tenantId: string, documentId: string) {
    return await db.query.regulatoryDocuments.findFirst({
      where: and(
        eq(regulatoryDocuments.id, documentId),
        eq(regulatoryDocuments.tenantId, tenantId)
      ),
      with: {
        creator: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  /**
   * Find multiple documents by IDs (for submission packet builder)
   */
  async findByIds(tenantId: string, documentIds: string[]) {
    return await db.query.regulatoryDocuments.findMany({
      where: and(
        inArray(regulatoryDocuments.id, documentIds),
        eq(regulatoryDocuments.tenantId, tenantId)
      ),
    });
  },

  /**
   * Create a new document
   */
  async create(data: {
    tenantId: string;
    userId: string;
    title: string;
    category: string;
    description?: string;
    tags: string[];
    accessLevel: string;
    fileUrl: string;
    metadata?: any;
  }) {
    const [document] = await db
      .insert(regulatoryDocuments)
      .values({
        tenantId: data.tenantId,
        title: data.title,
        category: data.category as any,
        description: data.description,
        tags: data.tags,
        accessLevel: data.accessLevel as any,
        fileUrl: data.fileUrl,
        metadata: data.metadata,
        createdBy: data.userId,
        updatedBy: data.userId,
      })
      .returning();

    return document;
  },

  /**
   * Update a document
   */
  async update(
    tenantId: string,
    documentId: string,
    userId: string,
    data: {
      title?: string;
      category?: string;
      description?: string;
      tags?: string[];
      accessLevel?: string;
      fileUrl?: string;
      metadata?: any;
    }
  ) {
    const [updated] = await db
      .update(regulatoryDocuments)
      .set({
        ...data,
        category: data.category as any,
        accessLevel: data.accessLevel as any,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(regulatoryDocuments.id, documentId),
          eq(regulatoryDocuments.tenantId, tenantId)
        )
      )
      .returning();

    return updated;
  },

  /**
   * Delete a document (soft delete by setting deletedAt)
   */
  async delete(tenantId: string, documentId: string, userId: string) {
    const [deleted] = await db
      .update(regulatoryDocuments)
      .set({
        deletedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(regulatoryDocuments.id, documentId),
          eq(regulatoryDocuments.tenantId, tenantId)
        )
      )
      .returning();

    return deleted;
  },
};
