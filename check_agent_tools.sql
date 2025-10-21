-- Check agent tool configurations
-- Tools are stored in the config JSONB column under 'tools' key

SELECT 
  agent_id,
  name,
  config->'tools' as tools_config,
  config->'tools'->'memories_tool' as memories_tool_config,
  created_at,
  updated_at
FROM agents
WHERE account_id IN (
  -- Get your account(s) - adjust as needed
  SELECT id FROM basejump.accounts 
  ORDER BY created_at DESC 
  LIMIT 5
)
ORDER BY updated_at DESC
LIMIT 10;

-- This will show:
-- 1. All tool configurations for each agent
-- 2. Specifically the memories_tool config (if exists)
-- 
-- Expected for memories_tool to work:
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
--
-- If memories_tool is missing or false, the tool won't be registered for that agent!

