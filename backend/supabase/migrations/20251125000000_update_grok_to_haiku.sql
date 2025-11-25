-- Migration: Update agent versions from Grok to Haiku 4.5
-- Date: 2025-11-25
-- Purpose: Change default model from Grok 4 Fast to Claude Haiku 4.5 (Bedrock)
-- 
-- This migration is SAFE and NON-DESTRUCTIVE:
-- - Only updates rows where model is explicitly set to Grok
-- - Uses transaction for atomicity
-- - Can be rolled back if needed

BEGIN;

-- First, let's see what we're about to change (preview query)
-- Uncomment to preview: 
-- SELECT 
--     av.version_id,
--     av.agent_id,
--     av.version_name,
--     av.config->>'model' as current_model,
--     a.name as agent_name
-- FROM agent_versions av
-- JOIN agents a ON a.agent_id = av.agent_id
-- WHERE av.config->>'model' = 'xai/grok-4-fast-non-reasoning';

-- Update agent_versions where model is set to Grok 4 Fast
-- Changes to Bedrock Haiku 4.5
UPDATE agent_versions
SET 
    config = jsonb_set(
        config, 
        '{model}', 
        '"bedrock/converse/arn:aws:bedrock:us-west-2:905357846920:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0"'
    ),
    updated_at = NOW()
WHERE config->>'model' = 'xai/grok-4-fast-non-reasoning';

-- Also update any that have the old non-reasoning variant
UPDATE agent_versions
SET 
    config = jsonb_set(
        config, 
        '{model}', 
        '"bedrock/converse/arn:aws:bedrock:us-west-2:905357846920:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0"'
    ),
    updated_at = NOW()
WHERE config->>'model' = 'xai/grok-4-fast';

-- Log how many rows were affected
DO $$
DECLARE
    rows_updated INTEGER;
BEGIN
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % agent versions from Grok to Haiku 4.5', rows_updated;
END $$;

COMMIT;

-- To rollback (if needed, run manually):
-- BEGIN;
-- UPDATE agent_versions
-- SET 
--     config = jsonb_set(config, '{model}', '"xai/grok-4-fast-non-reasoning"'),
--     updated_at = NOW()
-- WHERE config->>'model' = 'bedrock/converse/arn:aws:bedrock:us-west-2:905357846920:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0';
-- COMMIT;

