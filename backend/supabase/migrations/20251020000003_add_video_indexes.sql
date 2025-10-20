-- Add performance indexes for knowledge_base_videos

-- Index for account-based queries (most common lookup)
CREATE INDEX IF NOT EXISTS idx_kb_videos_account ON knowledge_base_videos(account_id);

-- Index for folder-based queries (for KB UI)
CREATE INDEX IF NOT EXISTS idx_kb_videos_folder ON knowledge_base_videos(folder_id);

-- Index for entry-based queries (for KB integration)
CREATE INDEX IF NOT EXISTS idx_kb_videos_entry ON knowledge_base_videos(entry_id);

-- Index for platform filtering
CREATE INDEX IF NOT EXISTS idx_kb_videos_platform ON knowledge_base_videos(platform) WHERE platform IS NOT NULL;

-- Index for created_at ordering (for recent videos)
CREATE INDEX IF NOT EXISTS idx_kb_videos_created_at ON knowledge_base_videos(created_at DESC);

-- Composite index for account + folder queries
CREATE INDEX IF NOT EXISTS idx_kb_videos_account_folder ON knowledge_base_videos(account_id, folder_id);

-- GIN index for JSONB analysis_data searches
CREATE INDEX IF NOT EXISTS idx_kb_videos_analysis_data ON knowledge_base_videos USING gin(analysis_data);


