-- First, let's see what columns exist in the agents table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agents'
ORDER BY ordinal_position;

-- Then check the actual agent configuration
-- (Uncomment the query that works based on column names above)

-- Option 1: If tools are in a different column
-- SELECT 
--   agent_id,
--   name,
--   tool_config,
--   created_at,
--   updated_at
-- FROM agents
-- ORDER BY updated_at DESC
-- LIMIT 5;

-- Option 2: If you want to see all columns
-- SELECT * 
-- FROM agents 
-- ORDER BY updated_at DESC 
-- LIMIT 3;

