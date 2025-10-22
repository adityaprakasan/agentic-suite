-- ============================================================
-- MEMORIES.AI MIGRATION VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify migration status
-- ============================================================

-- 1. Check if memories_user_id column exists in basejump.accounts
SELECT 
    '1. memories_user_id column check' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'basejump'
            AND table_name = 'accounts'
            AND column_name = 'memories_user_id'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- 2. Check if knowledge_base_videos table exists
SELECT 
    '2. knowledge_base_videos table check' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'knowledge_base_videos'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- 3. Check if memories_chat_sessions table exists
SELECT 
    '3. memories_chat_sessions table check' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'memories_chat_sessions'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- 4. Check which Memories migrations were recorded
SELECT 
    '4. Recorded migrations' as check_name,
    version,
    name
FROM supabase_migrations.schema_migrations
WHERE version LIKE '202510200000%'
ORDER BY version;

-- 5. Show all columns in basejump.accounts (for debugging)
SELECT 
    '5. basejump.accounts columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'basejump'
AND table_name = 'accounts'
ORDER BY ordinal_position;

-- 6. If knowledge_base_videos exists, show its structure
SELECT 
    '6. knowledge_base_videos columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'knowledge_base_videos'
ORDER BY ordinal_position;

-- 7. If memories_chat_sessions exists, show its structure
SELECT 
    '7. memories_chat_sessions columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'memories_chat_sessions'
ORDER BY ordinal_position;

-- 8. Check indexes on knowledge_base_videos
SELECT 
    '8. knowledge_base_videos indexes' as info,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'knowledge_base_videos';

-- 9. Check indexes on memories_chat_sessions
SELECT 
    '9. memories_chat_sessions indexes' as info,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'memories_chat_sessions';

-- 10. Check RLS policies
SELECT 
    '10. RLS policies check' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('knowledge_base_videos', 'memories_chat_sessions')
ORDER BY tablename, policyname;


