-- Add memories.ai user ID to basejump accounts table for multi-tenancy
-- Each account gets a unique user_id for memories.ai API calls

ALTER TABLE basejump.accounts ADD COLUMN IF NOT EXISTS memories_user_id TEXT;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_accounts_memories_user_id ON basejump.accounts(memories_user_id);

-- Comment for documentation
COMMENT ON COLUMN basejump.accounts.memories_user_id IS 'Unique user ID for memories.ai API - isolates video libraries per account';
