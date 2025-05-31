-- Diagnostic script to check auth.users table structure

-- Check if auth schema exists
SELECT EXISTS (
  SELECT FROM information_schema.schemata
  WHERE schema_name = 'auth'
) AS auth_schema_exists;

-- Check if auth.users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'auth' AND table_name = 'users'
) AS auth_users_table_exists;

-- Get column information for auth.users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- Check primary key of auth.users
SELECT a.attname AS column_name
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
WHERE i.indrelid = 'auth.users'::regclass
AND i.indisprimary;

-- Check if any other tables reference auth.users
SELECT
  tc.table_schema AS referencing_schema,
  tc.table_name AS referencing_table,
  kcu.column_name AS referencing_column,
  ccu.table_schema AS referenced_schema,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users';

-- Try a simple test table with a foreign key to auth.users
DO $test$
BEGIN
  -- Drop the test table if it exists
  DROP TABLE IF EXISTS public.test_auth_users_fk;
  
  -- Create a test table with a foreign key to auth.users
  CREATE TABLE public.test_auth_users_fk (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT now()
  );
  
  -- Drop the test table
  DROP TABLE public.test_auth_users_fk;
  
  RAISE NOTICE 'Test table with foreign key to auth.users created and dropped successfully';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating test table: %', SQLERRM;
END
$test$;
