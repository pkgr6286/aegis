/**
 * Create All Database Tables
 * 
 * Executes the complete schema creation SQL.
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function createTables() {
  const sql = neon(DATABASE_URL);
  
  console.log('📦 Creating all database tables and enums...\n');
  
  try {
    // Read the schema creation file
    const schemaPath = join(__dirname, '..', 'migrations', '000_create_all_tables.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf-8');
    
    // Split into individual statements and filter out comments
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*.*\*\/$/s));
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await sql(statement);
        
        // Log significant operations
        if (statement.includes('CREATE TYPE')) {
          const typeName = statement.match(/CREATE TYPE (\w+)/)?.[1];
          console.log(`✅ Created enum: ${typeName}`);
        } else if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE (\w+)/)?.[1];
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.includes('CREATE INDEX')) {
          const indexName = statement.match(/CREATE (?:UNIQUE )?INDEX (\w+)/)?.[1];
          if (indexName && i % 3 === 0) { // Only log every 3rd index to reduce clutter
            console.log(`   Created indexes...`);
          }
        }
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists')) {
          continue;
        }
        console.error(`\n❌ Error executing statement ${i + 1}:`);
        console.error(statement.substring(0, 100) + '...');
        throw error;
      }
    }
    
    console.log('\n🎉 Schema creation completed!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...\n');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`📊 Total tables created: ${tables.length}`);
    console.log('Tables:');
    tables.forEach((table: any, index: number) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    console.log('\n✨ Database schema created successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Schema creation failed:', error);
    process.exit(1);
  }
}

createTables();
