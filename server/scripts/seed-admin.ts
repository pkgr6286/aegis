#!/usr/bin/env tsx
/**
 * Seed Script: Create Initial Super Admin User
 * 
 * This script creates the first Super Admin user for the Aegis platform.
 * Run with: npx tsx server/scripts/seed-admin.ts
 */

import { authService } from '../src/services/auth.service';
import { db } from '../src/db';
import { userSystemRoles } from '../src/db/schema/public';

const ADMIN_EMAIL = 'admin@aegis.com';
const ADMIN_PASSWORD = 'password123';  // Change this in production!

async function seedSuperAdmin() {
  try {
    console.log('🌱 Seeding Super Admin user...\n');

    // 1. Register the admin user
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}\n`);

    let user;
    try {
      user = await authService.register({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        firstName: 'Super',
        lastName: 'Admin',
      });
      console.log('✅ Super Admin user created successfully');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  User already exists, skipping user creation');
        // Find the existing user
        const { userRepository } = await import('../src/db/repositories/user.repository');
        user = await userRepository.findByEmail(ADMIN_EMAIL);
        if (!user) {
          throw new Error('User exists but could not be found');
        }
      } else {
        throw error;
      }
    }

    // 2. Add super_admin role
    try {
      await db.insert(userSystemRoles).values({
        userId: user.id,
        role: 'super_admin',
      });
      console.log('✅ Super Admin role assigned successfully\n');
    } catch (error: any) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        console.log('⚠️  Super Admin role already assigned\n');
      } else {
        throw error;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Super Admin Setup Complete!\n');
    console.log('You can now login to the Super Admin UI:');
    console.log(`   📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  SECURITY REMINDER: Change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
    process.exit(1);
  }
}

// Run the seed function
seedSuperAdmin();
