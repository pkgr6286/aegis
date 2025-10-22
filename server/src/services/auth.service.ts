import { userRepository } from '../db/repositories/user.repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { userSystemRoles, passwordResetTokens, invitationTokens, users } from '../db/schema/public';
import { tenantUsers } from '../db/schema/core';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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
   * Request a password reset
   * Generates a token and returns it (in production, send via email)
   */
  async forgotPassword(email: string): Promise<{ message: string; token?: string }> {
    // Find user by email
    const user = await userRepository.findByEmail(email);
    
    // For security, return success even if user not found
    // In production, you would send email only if user exists
    if (!user) {
      return { message: 'If an account exists with this email, a reset link will be sent.' };
    }

    // Invalidate any existing active reset tokens for this user
    await db
      .update(passwordResetTokens)
      .set({ status: 'expired' })
      .where(and(
        eq(passwordResetTokens.userId, user.id),
        eq(passwordResetTokens.status, 'active')
      ));

    // Generate secure token (32 characters)
    const token = nanoid(32);
    
    // Create expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to database
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      status: 'active',
      expiresAt,
    });

    // In production: Send email with reset link
    // For development: Return token directly
    return {
      message: 'If an account exists with this email, a reset link will be sent.',
      token, // Remove this in production
    };
  }

  /**
   * Reset password using a valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Find active token
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.status, 'active')
      ),
    });

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      // Mark as expired
      await db
        .update(passwordResetTokens)
        .set({ status: 'expired' })
        .where(eq(passwordResetTokens.id, resetToken.id));
      
      throw new Error('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update user password
    await db
      .update(users)
      .set({ 
        hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, resetToken.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ status: 'used' })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return { message: 'Password reset successful' };
  }

  /**
   * Create an invitation token for a user
   */
  async inviteUserToTenant(data: {
    email: string;
    tenantId: string;
    role: 'admin' | 'editor' | 'viewer';
    invitedBy: string;
  }): Promise<{ message: string; token: string }> {
    // Check if user already has an active invitation
    const existingInvite = await db.query.invitationTokens.findFirst({
      where: and(
        eq(invitationTokens.email, data.email),
        eq(invitationTokens.tenantId, data.tenantId),
        eq(invitationTokens.status, 'active')
      ),
    });

    if (existingInvite) {
      throw new Error('User already has a pending invitation for this tenant');
    }

    // Check if user already exists and is a member of this tenant
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      const membership = await db.query.tenantUsers.findFirst({
        where: and(
          eq(tenantUsers.userId, existingUser.id),
          eq(tenantUsers.tenantId, data.tenantId)
        ),
      });

      if (membership) {
        throw new Error('User is already a member of this tenant');
      }
    }

    // Generate secure token (32 characters)
    const token = nanoid(32);
    
    // Create expiration time (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save invitation token
    await db.insert(invitationTokens).values({
      email: data.email,
      token,
      tenantId: data.tenantId,
      role: data.role,
      invitedBy: data.invitedBy,
      status: 'active',
      expiresAt,
    });

    // In production: Send email with invitation link
    return {
      message: 'Invitation sent successfully',
      token, // Include for development
    };
  }

  /**
   * Accept an invitation and create/link user account
   */
  async acceptInvite(data: {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    // Find active invitation token
    const invitation = await db.query.invitationTokens.findFirst({
      where: and(
        eq(invitationTokens.token, data.token),
        eq(invitationTokens.status, 'active')
      ),
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if token is expired
    if (new Date() > invitation.expiresAt) {
      await db
        .update(invitationTokens)
        .set({ status: 'expired' })
        .where(eq(invitationTokens.id, invitation.id));
      
      throw new Error('Invitation has expired');
    }

    // Check if user already exists
    let user = await userRepository.findByEmail(invitation.email);

    if (!user) {
      // Create new user account
      const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);
      user = await userRepository.create({
        email: invitation.email,
        hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      });
    }

    // Add user to tenant with specified role
    await db.insert(tenantUsers).values({
      userId: user.id,
      tenantId: invitation.tenantId,
      role: invitation.role as 'admin' | 'editor' | 'viewer',
      createdBy: invitation.invitedBy,
      updatedBy: invitation.invitedBy,
    });

    // Mark invitation as used
    await db
      .update(invitationTokens)
      .set({ status: 'used' })
      .where(eq(invitationTokens.id, invitation.id));

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate JWT token for auto-login
    const tenantMembership = await db.query.tenantUsers.findFirst({
      where: and(
        eq(tenantUsers.userId, user.id),
        eq(tenantUsers.tenantId, invitation.tenantId)
      ),
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        systemRoles: [],
        tenantId: invitation.tenantId,
        tenantRole: invitation.role,
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const { hashedPassword: _, ...userWithoutPassword } = user;

    return {
      token,
      user: {
        ...userWithoutPassword,
        systemRoles: [],
        tenantRole: invitation.role,
        tenantId: invitation.tenantId,
      },
    };
  }
}

export const authService = new AuthService();
