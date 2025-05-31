-- SQL to check the actual schema of the leases table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'leases'
ORDER BY 
  ordinal_position;
