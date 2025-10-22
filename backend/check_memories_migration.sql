-- Check if memories_user_id column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'basejump'
  AND table_name = 'accounts'
  AND column_name = 'memories_user_id';

-- Check if knowledge_base_videos table exists
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name IN ('knowledge_base_videos', 'memories_chat_sessions');

-- Check if the migrations were recorded
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version LIKE '202510200000%'
ORDER BY version;
