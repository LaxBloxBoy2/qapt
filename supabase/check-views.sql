-- Check for views that depend on the property_id column
SELECT 
  v.viewname, 
  v.definition
FROM 
  pg_views v
WHERE 
  v.schemaname = 'public' AND
  v.definition LIKE '%property_id%';

-- Check for rules that depend on the property_id column
SELECT 
  r.rulename,
  r.definition
FROM 
  pg_rules r
WHERE 
  r.schemaname = 'public' AND
  r.definition LIKE '%property_id%';
