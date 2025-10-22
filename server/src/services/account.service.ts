import { userRepository } from '../db/repositories/user.repository';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '../db/schema/public';
import { eq } from 'drizzle-orm';

/**
 * Account Service
 * 
 * Handles business logic for:
 * - User profile management
 * - Password changes
 * - Account settings
 */
export class AccountService {
  private readonly SALT_ROUNDS = 10;

  /**
   * Get user profile information
   */
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Return user without password
    const { hashedPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user profile information
   */
  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
  }) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: data.firstName !== undefined ? data.firstName : user.firstName,
        lastName: data.lastName !== undefined ? data.lastName : user.lastName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error('Failed to update profile');
    }

    // Return user without password
    const { hashedPassword: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, data: {
    currentPassword: string;
    newPassword: string;
  }) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.hashedPassword) {
      throw new Error('Cannot change password for this account');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.hashedPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Ensure new password is different from current
    const isSamePassword = await bcrypt.compare(data.newPassword, user.hashedPassword);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, this.SALT_ROUNDS);

    // Update password
    await db
      .update(users)
      .set({
        hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { message: 'Password changed successfully' };
  }
}

export const accountService = new AccountService();
