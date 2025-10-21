import { userRepository } from '../db/repositories/user.repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { userSystemRoles } from '../db/schema/public';
import { tenantUsers } from '../db/schema/core';
import { eq } from 'drizzle-orm';

/**
 * Authentication Service
 * 
 * Handles business logic for:
 * - User registration
 * - User login
 * - Password hashing
 * - JWT token generation
 * - Tenant user management
 */
export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly SALT_ROUNDS = 10;
  private readonly JWT_EXPIRES_IN = '7d'; // 7 days

  constructor() {
    // Get JWT secret from environment (fallback to SESSION_SECRET)
    this.JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || '';
    if (!this.JWT_SECRET) {
      throw new Error('CRITICAL: JWT_SECRET or SESSION_SECRET environment variable must be set');
    }
  }

  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    // 1. Check if user already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // 2. Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // 3. Create user in database
    const user = await userRepository.create({
      email: data.email,
      hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    // 4. Return user (without password)
    const { hashedPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Login a user
   */
  async login(email: string, password: string) {
    // 1. Find user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user has a password set
    if (!user.hashedPassword) {
      throw new Error('Invalid email or password');
    }

    // 2. Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // 3. Get user's system roles
    const systemRoles = await db
      .select()
      .from(userSystemRoles)
      .where(eq(userSystemRoles.userId, user.id));

    const roles = systemRoles.map(r => r.role);

    // 4. Get user's tenant memberships (if any)
    const tenantMemberships = await db
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userId, user.id));

    // For pharma admin users, include the first tenant in the JWT
    // (In the future, you might want to support multi-tenant switching)
    const firstTenant = tenantMemberships[0];

    // 5. Generate JWT token
    const tokenPayload: any = {
      userId: user.id,
      email: user.email,
      systemRoles: roles,
    };

    // Include tenant info if user belongs to a tenant
    if (firstTenant) {
      tokenPayload.tenantId = firstTenant.tenantId;
      tokenPayload.tenantRole = firstTenant.role;
    }

    const token = jwt.sign(
      tokenPayload,
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_EXPIRES_IN,
      }
    );

    // 6. Update last login timestamp
    await userRepository.updateLastLogin(user.id);

    // 7. Return token and user info (without password)
    const { hashedPassword: _, ...userWithoutPassword } = user;
    
    return {
      token,
      user: {
        ...userWithoutPassword,
        systemRoles: roles,
        tenantRole: firstTenant?.role,
        tenantId: firstTenant?.tenantId,
      },
    };
  }

  /**
   * Invite a user to a tenant
   */
  async inviteUserToTenant(data: {
    email: string;
    tenantId: string;
    role: 'admin' | 'editor' | 'viewer';
    invitedBy: string;
  }) {
    // TODO: Implement tenant invitation
    // 1. Check if user exists, create if not
    // 2. Create tenant_users record with role
    // 3. Send invitation email (optional)
    // 4. Return tenant user record
    
    throw new Error('Not implemented');
  }
}

export const authService = new AuthService();
