-- ============================================================
-- FIX: Avoid cross-schema foreign keys that cause PostgREST issues
-- Instead of adding memories_user_id to basejump.accounts,
-- create a public.account_settings table
-- ============================================================

-- 1. Create account_settings table in public schema
CREATE TABLE IF NOT EXISTS public.account_settings (
  account_id UUID PRIMARY KEY,
  memories_user_id TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own account settings
CREATE POLICY account_settings_access ON public.account_settings
  FOR ALL USING (
    account_id IN (
      SELECT account_id 
      FROM basejump.account_user 
      WHERE user_id = auth.uid()
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_account_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER account_settings_updated_at_trigger
  BEFORE UPDATE ON public.account_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_account_settings_updated_at();

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_account_settings_memories_user_id 
  ON public.account_settings(memories_user_id);

-- 2. Migrate existing data from basejump.accounts if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'basejump'
    AND table_name = 'accounts'
    AND column_name = 'memories_user_id'
  ) THEN
    -- Copy data from basejump.accounts to public.account_settings
    INSERT INTO public.account_settings (account_id, memories_user_id, created_at)
    SELECT id, memories_user_id, NOW()
    FROM basejump.accounts
    WHERE memories_user_id IS NOT NULL
    ON CONFLICT (account_id) DO UPDATE
      SET memories_user_id = EXCLUDED.memories_user_id;
    
    -- Drop the column from basejump.accounts (we don't own that schema)
    -- Actually, let's keep it for backward compatibility but not use it
    -- ALTER TABLE basejump.accounts DROP COLUMN IF EXISTS memories_user_id;
  END IF;
END $$;

-- 3. Update knowledge_base_videos to remove cross-schema FK
-- Drop the old foreign key constraint if it exists
DO $$
BEGIN
  ALTER TABLE public.knowledge_base_videos 
    DROP CONSTRAINT IF EXISTS knowledge_base_videos_account_id_fkey;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Recreate without explicit foreign key (we rely on RLS instead)
-- This avoids PostgREST schema cache issues

-- 4. Same for memories_chat_sessions
DO $$
BEGIN
  ALTER TABLE public.memories_chat_sessions 
    DROP CONSTRAINT IF EXISTS memories_chat_sessions_account_id_fkey;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 5. Create a view for easier querying
CREATE OR REPLACE VIEW public.account_settings_view AS
SELECT 
  s.account_id,
  s.memories_user_id,
  a.name as account_name,
  a.slug as account_slug,
  s.created_at,
  s.updated_at
FROM public.account_settings s
LEFT JOIN basejump.accounts a ON s.account_id = a.id;

-- Grant access to the view
GRANT SELECT ON public.account_settings_view TO authenticated;

-- Comments
COMMENT ON TABLE public.account_settings IS 'Account-level settings and external service IDs (avoids cross-schema FK issues)';
COMMENT ON COLUMN public.account_settings.memories_user_id IS 'Unique user ID for memories.ai API - isolates video libraries per account';
COMMENT ON VIEW public.account_settings_view IS 'Enriched view of account settings with basejump account info';

