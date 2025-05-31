-- Check the structure of the units table
SELECT column_name, data_type, is_nullable, column_default, 
       (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = c.oid AND contype = 'c' AND conkey @> ARRAY[c.ordinal_position]) as check_constraint
FROM information_schema.columns c
WHERE table_schema = 'public' 
AND table_name = 'units'
ORDER BY ordinal_position;
