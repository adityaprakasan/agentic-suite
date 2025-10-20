-- Create knowledge_base_videos table to store video metadata
-- Videos are stored in memories.ai, but metadata is tracked here for KB integration

CREATE TABLE IF NOT EXISTS knowledge_base_videos (
  video_id TEXT PRIMARY KEY,
  entry_id UUID REFERENCES knowledge_base_entries(entry_id) ON DELETE CASCADE,
  folder_id UUID REFERENCES knowledge_base_folders(folder_id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
  
  -- Video metadata
  title TEXT NOT NULL,
  url TEXT,
  platform TEXT CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'linkedin', 'upload', 'url')),
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  
  -- memories.ai data
  memories_user_id TEXT NOT NULL,
  transcript TEXT,
  analysis_data JSONB DEFAULT '{}'::jsonb,
  
  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE knowledge_base_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Match basejump pattern from knowledge_base_entries
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kb_videos_account_access' AND tablename = 'knowledge_base_videos') THEN
        CREATE POLICY kb_videos_account_access ON knowledge_base_videos
            FOR ALL USING (basejump.has_role_on_account(account_id) = true);
    END IF;
END $$;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_kb_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_videos_updated_at_trigger
  BEFORE UPDATE ON knowledge_base_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_kb_videos_updated_at();

-- Comments for documentation
COMMENT ON TABLE knowledge_base_videos IS 'Video metadata for memories.ai integration - videos are stored externally but tracked here for KB';
COMMENT ON COLUMN knowledge_base_videos.video_id IS 'memories.ai video ID (external reference)';
COMMENT ON COLUMN knowledge_base_videos.entry_id IS 'Reference to knowledge_base_entries for unified KB integration';
COMMENT ON COLUMN knowledge_base_videos.platform IS 'Source platform: youtube, tiktok, instagram, linkedin, upload, or url';
COMMENT ON COLUMN knowledge_base_videos.memories_user_id IS 'memories.ai user ID for API calls';
COMMENT ON COLUMN knowledge_base_videos.analysis_data IS 'JSON data from video analysis (hooks, CTAs, visual elements, etc.)';
