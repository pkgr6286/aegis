import type { User } from '@/types/api';

export function getUserType(user: User | null): 'superadmin' | 'pharma-admin' | 'none' {
  if (!user) return 'none';
  
  // Super Admin has system role (check both singular and plural for compatibility)
  if (user.systemRole || (user.systemRoles && user.systemRoles.length > 0)) {
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
      // Route clinicians to their review queue
      if (user?.tenantRole === 'clinician') {
        return '/clinician/review-queue';
      }
      // All other tenant users go to admin dashboard
      return '/admin/dashboard';
    default:
      return '/login';
  }
}
