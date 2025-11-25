-- PREVIEW SCRIPT: See which agent versions will be updated
-- Run this BEFORE the migration to see what will change
-- This script is READ-ONLY and makes NO changes

-- Count of agent versions using Grok
SELECT 
    'Agent versions using Grok 4 Fast' as description,
    COUNT(*) as count
FROM agent_versions
WHERE config->>'model' = 'xai/grok-4-fast-non-reasoning'
   OR config->>'model' = 'xai/grok-4-fast';

-- Detailed list of affected agent versions
SELECT 
    av.version_id,
    av.agent_id,
    av.version_name,
    av.version_number,
    av.config->>'model' as current_model,
    a.name as agent_name,
    a.account_id,
    av.created_at,
    av.updated_at
FROM agent_versions av
JOIN agents a ON a.agent_id = av.agent_id
WHERE av.config->>'model' = 'xai/grok-4-fast-non-reasoning'
   OR av.config->>'model' = 'xai/grok-4-fast'
ORDER BY av.updated_at DESC;

-- Count of agent versions with NULL model (will use default)
SELECT 
    'Agent versions with NULL model (will use system default)' as description,
    COUNT(*) as count
FROM agent_versions
WHERE config->>'model' IS NULL;

-- Summary by model
SELECT 
    COALESCE(config->>'model', 'NULL (uses default)') as model,
    COUNT(*) as count
FROM agent_versions
GROUP BY config->>'model'
ORDER BY count DESC;

