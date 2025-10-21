/**
 * Database Migration Runner
 * 
 * Executes SQL migration files against the database.
 * Usage: npm run migration:run
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function runMigration() {
  const sql = neon(DATABASE_URL);
  
  console.log('🔄 Running database migration: 001_enable_rls_policies.sql\n');
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'migrations', '001_enable_rls_policies.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    // Note: Neon doesn't support multi-statement execution in a single query
    // So we split by semicolons and execute each statement separately
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comment-only blocks
      if (statement.match(/^\/\*.*\*\/$/s)) {
        continue;
      }
      
      try {
        await sql(statement);
        
        // Log significant operations
        if (statement.includes('ALTER TABLE') && statement.includes('ENABLE ROW LEVEL SECURITY')) {
          const tableName = statement.match(/ALTER TABLE (\w+)/)?.[1];
          console.log(`✅ Enabled RLS on: ${tableName}`);
        } else if (statement.includes('CREATE POLICY')) {
          const tableName = statement.match(/ON (\w+)/)?.[1];
          console.log(`✅ Created policy on: ${tableName}`);
        }
      } catch (error: any) {
        // Ignore "policy already exists" errors
        if (error.message?.includes('already exists')) {
          continue;
        }
        throw error;
      }
    }
    
    console.log('\n🎉 Migration completed successfully!\n');
    
    // Verify RLS is enabled
    console.log('🔍 Verifying RLS status...\n');
    const tables = await sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN (
          'tenant_users', 'audit_logs', 'brand_configs', 'drug_programs',
          'screener_versions', 'screening_sessions', 'verification_codes',
          'ehr_consents', 'partners', 'partner_api_keys', 'partner_configs'
        )
      ORDER BY tablename
    `;
    
    console.log('RLS Status:');
    console.log('┌─────────────────────────┬──────────────┐');
    console.log('│ Table Name              │ RLS Enabled  │');
    console.log('├─────────────────────────┼──────────────┤');
    tables.forEach((table: any) => {
      const name = table.tablename.padEnd(23);
      const status = table.rowsecurity ? '✅ Yes' : '❌ No';
      console.log(`│ ${name} │ ${status.padEnd(12)} │`);
    });
    console.log('└─────────────────────────┴──────────────┘');
    
    const allEnabled = tables.every((t: any) => t.rowsecurity);
    if (allEnabled) {
      console.log('\n✅ All tenant-scoped tables have RLS enabled!');
    } else {
      console.log('\n⚠️  Warning: Some tables do not have RLS enabled!');
    }
    
    // Show policy count
    const policies = await sql`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public'
    `;
    
    console.log(`\n📊 Total RLS policies created: ${policies[0].count}`);
    
    console.log('\n✨ Database migration completed successfully!');
    console.log('📖 See server/migrations/README.md for testing instructions\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
