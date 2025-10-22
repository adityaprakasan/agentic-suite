-- Create memories.ai chat sessions table
-- Stores session IDs for multi-turn conversations with Video Marketer Chat and Video Chat

CREATE TABLE IF NOT EXISTS memories_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
  
  -- memories.ai session tracking
  session_id TEXT NOT NULL,
  memories_user_id TEXT NOT NULL,
  
  -- Session metadata
  session_type TEXT NOT NULL CHECK (session_type IN ('video_chat', 'marketer_chat', 'personal_chat')),
  title TEXT,
  last_prompt TEXT,
  
  -- Video Chat specific (optional)
  video_ids TEXT[], -- Array of video IDs discussed in this session
  
  -- Marketer Chat specific (optional)
  platform TEXT CHECK (platform IN ('TIKTOK', 'YOUTUBE', 'INSTAGRAM')),
  
  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE memories_chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own account's sessions
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'memories_sessions_account_access' AND tablename = 'memories_chat_sessions') THEN
        CREATE POLICY memories_sessions_account_access ON memories_chat_sessions
            FOR ALL USING (basejump.has_role_on_account(account_id) = true);
    END IF;
END $$;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_memories_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memories_sessions_updated_at_trigger
  BEFORE UPDATE ON memories_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_memories_sessions_updated_at();

-- Unique constraint: One session_id per account (enforces data integrity)
CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_sessions_unique_account_session 
  ON memories_chat_sessions(account_id, session_id);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_memories_sessions_type ON memories_chat_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_memories_sessions_last_message ON memories_chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_sessions_account_type ON memories_chat_sessions(account_id, session_type);

-- Composite index for finding recent sessions by type
CREATE INDEX IF NOT EXISTS idx_memories_sessions_account_type_recent 
  ON memories_chat_sessions(account_id, session_type, last_message_at DESC);

-- Comments
COMMENT ON TABLE memories_chat_sessions IS 'Chat sessions for memories.ai - maintains conversation context across multiple messages';
COMMENT ON COLUMN memories_chat_sessions.session_id IS 'Session ID from memories.ai API for conversation continuity';
COMMENT ON COLUMN memories_chat_sessions.session_type IS 'Type of chat: video_chat (specific videos), marketer_chat (trending content), personal_chat (personal media)';
COMMENT ON COLUMN memories_chat_sessions.video_ids IS 'Array of video IDs being discussed (for video_chat type)';
COMMENT ON COLUMN memories_chat_sessions.platform IS 'Platform for marketer_chat (TIKTOK, YOUTUBE, INSTAGRAM)';
COMMENT ON COLUMN memories_chat_sessions.last_message_at IS 'Timestamp of last message in this session (for sorting recent conversations)';


