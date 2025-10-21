-- Check if memories_tool is enabled in your agent configuration
-- Run this in Supabase SQL Editor

SELECT 
  agent_id,
  name,
  agentpress_tools,
  agentpress_tools->'memories_tool' as memories_tool_config,
  created_at,
  updated_at
FROM agents
WHERE account_id = (
  -- Replace with your actual account_id or remove this WHERE clause to see all
  SELECT id FROM basejump.accounts LIMIT 1
)
ORDER BY updated_at DESC
LIMIT 10;

-- This will show you:
-- 1. If 'memories_tool' exists in agentpress_tools
-- 2. If it's enabled (true) or disabled (false)  
-- 3. What methods are configured

-- Expected: agentpress_tools should contain:
-- "memories_tool": true  (all methods enabled)
-- OR
-- "memories_tool": {
--   "enabled": true,
--   "methods": {
--     "search_platform_videos": true,
--     "analyze_creator": true,
--     ...
--   }
-- }

