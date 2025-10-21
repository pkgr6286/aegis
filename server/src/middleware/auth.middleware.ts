import { Request, Response, NextFunction } from 'express';

/**
 * Authentication Middleware
 * 
 * This middleware will:
 * 1. Validate JWT tokens
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

// Extend Express Request type to include user and tenant
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      tenantId?: string;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Implement JWT token validation
  // 1. Extract token from Authorization header
  // 2. Verify token using jsonwebtoken
  // 3. Extract user ID and tenant ID from token
  // 4. Attach to req.user and req.tenantId
  
  next();
};

export const requireTenant = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Ensure tenant context is set
  // This middleware ensures that the request has a valid tenant ID
  // before allowing access to tenant-scoped resources
  
  if (!req.tenantId) {
    return res.status(403).json({ error: 'Tenant context required' });
  }
  
  next();
};

/**
 * Set the PostgreSQL session variable for RLS
 * This MUST be called before any tenant-scoped database queries
 */
export async function setTenantContext(db: any, tenantId: string) {
  // Execute: SET app.current_tenant_id = 'tenant-uuid';
  // This activates Row-Level Security policies
  await db.execute(`SET app.current_tenant_id = '${tenantId}'`);
}
