/**
 * Tenant User Types
 */

export interface TenantUser {
  id?: string;
  tenantId: string;
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
  createdBy?: string;
  joinedAt?: string;
  // User fields (joined from users table)
  email?: string;
  firstName?: string;
  lastName?: string;
  lastLoginAt?: string | null;
}

export interface InviteUserInput {
  email: string;
  fullName?: string;
  role: 'admin' | 'editor' | 'viewer';
}
