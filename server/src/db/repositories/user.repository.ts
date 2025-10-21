import { db } from '../index';
import { users } from '../schema/public';
import { eq } from 'drizzle-orm';

/**
 * User Repository
 * Handles all database operations for users
 */
export class UserRepository {
  /**
   * Find a user by ID
   */
  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  /**
   * Create a new user
   */
  async create(userData: {
    email: string;
    hashedPassword: string;
    firstName?: string;
    lastName?: string;
  }) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string) {
    const [user] = await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const userRepository = new UserRepository();
