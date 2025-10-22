/**
 * Tenant User Types
 */

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
  updatedAt: string;
  // User fields (joined from users table)
  email?: string;
  firstName?: string;
  lastName?: string;
  lastLoginAt?: string;
}

export interface InviteUserInput {
  email: string;
  fullName?: string;
  role: 'admin' | 'editor' | 'viewer';
}
