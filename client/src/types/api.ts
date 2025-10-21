/**
 * API Types for Aegis Platform Super Admin UI
 * These types match the backend API responses
 */

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  systemRole: 'super_admin' | 'support_staff' | null;
  tenantRole: 'admin' | 'editor' | 'viewer' | null;
  lastLoginAt: string | null;
  createdAt: string;
}

// Tenants
export interface Tenant {
  id: string;
  companyName: string;
  status: 'active' | 'inactive' | 'suspended';
  maxDrugPrograms: number | null;
  ehrIntegrationEnabled: boolean;
  activeUsersCount?: number;
  createdAt: string;
}

export interface CreateTenantRequest {
  companyName: string;
}

export interface UpdateLicenseRequest {
  status: 'active' | 'inactive' | 'suspended';
  maxDrugPrograms?: number | null;
  ehrIntegrationEnabled?: boolean;
}

export interface InviteAdminRequest {
  email: string;
}

// System Users
export interface SystemUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  systemRole: 'super_admin' | 'support_staff';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface InviteSystemUserRequest {
  email: string;
  role: 'super_admin' | 'support_staff';
}

// Dashboard Stats
export interface DashboardStats {
  totalTenants: number;
  activeUsers: number;
  apiCalls24h: number;
  newTenantsThisMonth: Array<{
    date: string;
    count: number;
  }>;
}

// Audit Logs
export interface AuditLog {
  id: string;
  timestamp: string;
  tenantId: string | null;
  tenantName?: string;
  userId: string | null;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

export interface AuditLogFilters {
  tenantId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Pagination
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
