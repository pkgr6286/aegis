import type { User } from '@/types/api';

export function getUserType(user: User | null): 'superadmin' | 'pharma-admin' | 'none' {
  if (!user) return 'none';
  
  // Super Admin has system role
  if (user.systemRole) {
    return 'superadmin';
  }
  
  // Pharma Admin has tenant role
  if (user.tenantRole) {
    return 'pharma-admin';
  }
  
  return 'none';
}

export function getDefaultRoute(user: User | null): string {
  const userType = getUserType(user);
  
  switch (userType) {
    case 'superadmin':
      return '/superadmin/dashboard';
    case 'pharma-admin':
      return '/admin/dashboard';
    default:
      return '/login';
  }
}
