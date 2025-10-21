-- Check agent tool configurations
-- Tools are stored in agent_versions table in the config JSONB column

-- First, get agents and their current versions
SELECT 
  a.agent_id,
  a.name,
  a.current_version_id,
  av.version_name,
  av.config->'tools' as all_tools_config,
  av.config->'tools'->'agentpress' as agentpress_tools,
  av.config->'tools'->'agentpress'->'memories_tool' as memories_tool_config,
  a.created_at,
  a.updated_at
FROM agents a
LEFT JOIN agent_versions av ON a.current_version_id = av.version_id
WHERE a.account_id IN (
  -- Get your account(s)
  SELECT id FROM basejump.accounts 
  ORDER BY created_at DESC 
  LIMIT 5
)
ORDER BY a.updated_at DESC
LIMIT 10;

-- This will show:
-- 1. All agentpress tool configurations for each agent
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
-- If memories_tool is missing, null, or false, the tool won't be registered for that agent!

