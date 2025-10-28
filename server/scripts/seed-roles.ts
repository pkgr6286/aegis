#!/usr/bin/env tsx
/**
 * Seed Script: Create Test Users for Clinician and Auditor Roles
 * 
 * This script creates test users for the clinician and auditor roles.
 * It will create a test tenant and assign users to it.
 * Run with: npx tsx server/scripts/seed-roles.ts
 */

import { authService } from '../src/services/auth.service';
import { db } from '../src/db';
import { tenants } from '../src/db/schema/public';
import { tenantUsers } from '../src/db/schema/core';
import { eq } from 'drizzle-orm';

const TEST_TENANT_NAME = 'Test Pharma Corp';

const CLINICIAN_EMAIL = 'clinician@test.com';
const CLINICIAN_PASSWORD = 'clinician123';

const AUDITOR_EMAIL = 'auditor@test.com';
const AUDITOR_PASSWORD = 'auditor123';

const PHARMA_ADMIN_EMAIL = 'pharma-admin@test.com';
const PHARMA_ADMIN_PASSWORD = 'pharma123';

async function seedRoleUsers() {
  try {
    console.log('🌱 Seeding Clinician and Auditor test users...\n');

    // 1. Create or get test tenant
    console.log('📦 Creating test tenant...');
    let tenant;
    try {
      const existingTenants = await db
        .select()
        .from(tenants)
        .where(eq(tenants.name, TEST_TENANT_NAME))
        .limit(1);

      if (existingTenants.length > 0) {
        tenant = existingTenants[0];
        console.log(`⚠️  Tenant "${TEST_TENANT_NAME}" already exists`);
      } else {
        const [newTenant] = await db.insert(tenants).values({
          name: TEST_TENANT_NAME,
          status: 'active',
        }).returning();
        tenant = newTenant;
        console.log(`✅ Tenant "${TEST_TENANT_NAME}" created successfully`);
      }
    } catch (error: any) {
      console.error('❌ Error creating tenant:', error);
      throw error;
    }

    console.log(`   Tenant ID: ${tenant.id}\n`);

    // 2. Create Pharma Admin user (so tenant has an admin)
    console.log('👤 Creating Pharma Admin user...');
    console.log(`   📧 Email: ${PHARMA_ADMIN_EMAIL}`);
    console.log(`   🔑 Password: ${PHARMA_ADMIN_PASSWORD}`);
    
    let adminUser;
    try {
      adminUser = await authService.register({
        email: PHARMA_ADMIN_EMAIL,
        password: PHARMA_ADMIN_PASSWORD,
        firstName: 'Pharma',
        lastName: 'Admin',
      });
      console.log('✅ Pharma Admin user created successfully');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Pharma Admin user already exists');
        const { userRepository } = await import('../src/db/repositories/user.repository');
        adminUser = await userRepository.findByEmail(PHARMA_ADMIN_EMAIL);
        if (!adminUser) {
          throw new Error('User exists but could not be found');
        }
      } else {
        throw error;
      }
    }

    // Assign admin role to tenant
    try {
      await db.insert(tenantUsers).values({
        tenantId: tenant.id,
        userId: adminUser.id,
        role: 'admin',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      });
      console.log('✅ Admin role assigned to tenant\n');
    } catch (error: any) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        console.log('⚠️  Admin already assigned to tenant\n');
      } else {
        throw error;
      }
    }

    // 3. Create Clinician user
    console.log('🩺 Creating Clinician user...');
    console.log(`   📧 Email: ${CLINICIAN_EMAIL}`);
    console.log(`   🔑 Password: ${CLINICIAN_PASSWORD}`);
    
    let clinicianUser;
    try {
      clinicianUser = await authService.register({
        email: CLINICIAN_EMAIL,
        password: CLINICIAN_PASSWORD,
        firstName: 'Clinical',
        lastName: 'Reviewer',
      });
      console.log('✅ Clinician user created successfully');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Clinician user already exists');
        const { userRepository } = await import('../src/db/repositories/user.repository');
        clinicianUser = await userRepository.findByEmail(CLINICIAN_EMAIL);
        if (!clinicianUser) {
          throw new Error('User exists but could not be found');
        }
      } else {
        throw error;
      }
    }

    // Assign clinician role to tenant
    try {
      await db.insert(tenantUsers).values({
        tenantId: tenant.id,
        userId: clinicianUser.id,
        role: 'clinician',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      });
      console.log('✅ Clinician role assigned to tenant\n');
    } catch (error: any) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        console.log('⚠️  Clinician already assigned to tenant\n');
      } else {
        throw error;
      }
    }

    // 4. Create Auditor user
    console.log('📋 Creating Auditor user...');
    console.log(`   📧 Email: ${AUDITOR_EMAIL}`);
    console.log(`   🔑 Password: ${AUDITOR_PASSWORD}`);
    
    let auditorUser;
    try {
      auditorUser = await authService.register({
        email: AUDITOR_EMAIL,
        password: AUDITOR_PASSWORD,
        firstName: 'Compliance',
        lastName: 'Auditor',
      });
      console.log('✅ Auditor user created successfully');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Auditor user already exists');
        const { userRepository } = await import('../src/db/repositories/user.repository');
        auditorUser = await userRepository.findByEmail(AUDITOR_EMAIL);
        if (!auditorUser) {
          throw new Error('User exists but could not be found');
        }
      } else {
        throw error;
      }
    }

    // Assign auditor role to tenant
    try {
      await db.insert(tenantUsers).values({
        tenantId: tenant.id,
        userId: auditorUser.id,
        role: 'auditor',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      });
      console.log('✅ Auditor role assigned to tenant\n');
    } catch (error: any) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        console.log('⚠️  Auditor already assigned to tenant\n');
      } else {
        throw error;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Role Users Setup Complete!\n');
    console.log(`Tenant: ${TEST_TENANT_NAME} (${tenant.id})\n`);
    console.log('Test Users Created:\n');
    console.log('1. Pharma Admin:');
    console.log(`   📧 Email:    ${PHARMA_ADMIN_EMAIL}`);
    console.log(`   🔑 Password: ${PHARMA_ADMIN_PASSWORD}\n`);
    console.log('2. Clinician (Clinical Reviewer):');
    console.log(`   📧 Email:    ${CLINICIAN_EMAIL}`);
    console.log(`   🔑 Password: ${CLINICIAN_PASSWORD}\n`);
    console.log('3. Auditor (Compliance Auditor):');
    console.log(`   📧 Email:    ${AUDITOR_EMAIL}`);
    console.log(`   🔑 Password: ${AUDITOR_PASSWORD}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  SECURITY REMINDER: Change passwords after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding role users:', error);
    process.exit(1);
  }
}

// Run the seed function
seedRoleUsers();
