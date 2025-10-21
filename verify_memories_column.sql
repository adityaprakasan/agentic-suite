-- Verify memories_user_id column exists
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'accounts' 
  AND column_name = 'memories_user_id';

-- Check RLS policies on basejump.accounts
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'basejump'
  AND tablename = 'accounts';

-- Test if we can actually query the column
SELECT id, memories_user_id 
FROM basejump.accounts 
LIMIT 1;

