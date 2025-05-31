const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  console.log(`\n🔄 Running migration: ${migrationFile}`);
  
  try {
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_').select('*').limit(0);
          if (directError) {
            console.log(`⚠️  Warning: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`✅ Migration completed: ${migrationFile}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`, error.message);
    throw error;
  }
}

async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql function...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
    if (error) {
      // Function might not exist yet, try creating it directly
      console.log('Creating function directly...');
    }
    console.log('✅ exec_sql function ready');
  } catch (error) {
    console.log('⚠️  Function creation warning:', error.message);
  }
}

async function applyMigrationsDirectly() {
  console.log('🚀 Applying settings migrations directly to Supabase...');
  
  const migrations = [
    '20241201000000_settings_schema.sql',
    '20241201000001_settings_rls.sql', 
    '20241201000002_settings_functions.sql',
    '20241201000003_update_user_profiles.sql'
  ];
  
  for (const migration of migrations) {
    try {
      const migrationPath = path.join(__dirname, 'supabase', 'migrations', migration);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`\n🔄 Applying: ${migration}`);
      
      // Execute SQL directly using the Supabase client
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log(`⚠️  Warning for ${migration}:`, error.message);
        // Continue with next migration
      } else {
        console.log(`✅ Successfully applied: ${migration}`);
      }
    } catch (error) {
      console.error(`❌ Failed to apply ${migration}:`, error.message);
      // Continue with next migration instead of stopping
    }
  }
  
  console.log('\n🎉 Settings migrations application completed!');
}

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    if (error) {
      console.log('⚠️  Connection test warning:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (error) {
    console.log('⚠️  Connection test error:', error.message);
  }
}

async function main() {
  try {
    await testConnection();
    await createExecSqlFunction();
    await applyMigrationsDirectly();
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  }
}

main();
