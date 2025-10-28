import { Request, Response, NextFunction } from 'express';
import { sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * 
 * This middleware will:
 * 1. Validate JWT tokens with signature verification
 * 2. Extract user information
 * 3. Set the tenant context for RLS (Row-Level Security)
 * 
 * CRITICAL FOR MULTI-TENANCY:
 * Before every database query, you must execute:
 * SET app.current_tenant_id = '...tenant-uuid...';
 * 
 * This ensures Row-Level Security policies automatically filter queries
 * to only show data belonging to the current tenant.
 */

// Extend Express Request type to include user, tenant, and roles
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        systemRoles?: string[]; // For super_admin, support_staff
        tenantRole?: 'admin' | 'editor' | 'viewer' | 'clinician' | 'auditor';
      };
      tenantId?: string;
    }
  }
}

type SystemRole = 'super_admin' | 'support_staff';
type TenantRole = 'admin' | 'editor' | 'viewer' | 'clinician' | 'auditor';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Get JWT secret from environment
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set');
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'JWT_SECRET not configured'
    });
  }

  try {
    // Verify JWT signature and decode payload
    // This prevents forged tokens and ensures cryptographic authenticity
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      systemRoles?: string[];
      tenantRole?: 'admin' | 'editor' | 'viewer' | 'clinician' | 'auditor';
      tenantId?: string;
    };
    
    // Attach verified user information to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      systemRoles: payload.systemRoles || [],
      tenantRole: payload.tenantRole,
    };
    
    req.tenantId = payload.tenantId;
    
    next();
  } catch (error) {
    // Handle different JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Token verification failed' });
  }
};

export const requireTenant = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Ensure tenant context is set
  // This middleware ensures that the request has a valid tenant ID
  // before allowing access to tenant-scoped resources
  
  if (!req.tenantId) {
    return res.status(403).json({ error: 'Tenant context required' });
  }
  
  next();
};

/**
 * Middleware to require a specific system-level role
 * Use this to protect super admin and support staff routes
 */
export const requireSystemRole = (...roles: SystemRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.user.systemRoles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
      });
    }

    next();
  };
};

/**
 * Middleware to require a specific tenant-level role
 * Use this to protect tenant admin, editor, and viewer routes
 */
export const requireTenantRole = (...roles: TenantRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    const userRole = req.user.tenantRole;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient tenant permissions',
        required: roles,
        current: userRole,
      });
    }

    next();
  };
};

/**
 * Alias for requireSystemRole for better semantics
 */
export const requireRole = requireSystemRole;

/**
 * Set the PostgreSQL session variable for RLS
 * This MUST be called before any tenant-scoped database queries
 */
export async function setTenantContext(db: any, tenantId: string) {
  // Execute: SET app.current_tenant_id = 'tenant-uuid';
  // This activates Row-Level Security policies
  
  // Validate tenantId is a valid UUID to prevent SQL injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    throw new Error('Invalid tenant ID format');
  }
  
  // Use raw SQL for SET command (PostgreSQL doesn't support parameters in SET)
  // Safe because we validated UUID format above
  await db.execute(sql.raw(`SET app.current_tenant_id = '${tenantId}'`));
}

/**
 * Express middleware to set tenant context for RLS enforcement
 * This middleware must be used AFTER authenticateToken
 * and is REQUIRED for all tenant-scoped routes
 */
export const setTenantContextMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.tenantId) {
    return res.status(403).json({ error: 'Tenant context required' });
  }

  try {
    // Import db dynamically to avoid circular dependency
    const { db } = await import('../db/index');
    await setTenantContext(db, req.tenantId);
    next();
  } catch (error) {
    console.error('Failed to set tenant context:', error);
    return res.status(500).json({ error: 'Failed to set tenant context' });
  }
};

/**
 * Middleware to enforce read-only access for auditor role
 * Auditors can perform GET, HEAD, OPTIONS requests but not write operations
 * This middleware should be used AFTER authenticateToken
 */
export const enforceReadOnlyForAuditor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if user is an auditor
  if (req.user?.tenantRole === 'auditor') {
    // Allow read operations (GET, HEAD, OPTIONS)
    const readOnlyMethods = ['GET', 'HEAD', 'OPTIONS'];
    
    if (!readOnlyMethods.includes(req.method)) {
      return res.status(403).json({ 
        error: 'Auditors have read-only access',
        message: 'You do not have permission to perform write operations'
      });
    }
  }
  
  next();
};
