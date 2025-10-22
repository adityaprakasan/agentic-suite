# Memories.ai Architecture Fix

## Problem
Cross-schema foreign keys (`basejump.accounts` → `public.knowledge_base_videos`) cause PostgREST schema cache issues, resulting in errors like:
```
Could not find the table 'public.accounts' in the schema cache
```

## Root Cause
- PostgREST has difficulty with cross-schema references
- Schema cache doesn't always reload properly after migrations
- Foreign keys from `public` to `basejump` schema are fragile

## Solution
**Create `public.account_settings` table** instead of adding columns to `basejump.accounts`.

### Benefits
1. ✅ **No cross-schema foreign keys** - everything in `public` schema
2. ✅ **No PostgREST cache issues** - standard table references
3. ✅ **Clean separation** - our custom data separate from basejump core
4. ✅ **Easier to manage** - we control the entire table
5. ✅ **Extensible** - easy to add more settings later

### Schema
```sql
CREATE TABLE public.account_settings (
  account_id UUID PRIMARY KEY,
  memories_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Changes Made

#### 1. Database Migration
- **File**: `backend/supabase/migrations/20251022000001_fix_memories_architecture.sql`
- Creates `public.account_settings` table
- Migrates data from `basejump.accounts.memories_user_id` if exists
- Removes problematic foreign key constraints
- Adds proper RLS policies

#### 2. Code Update
- **File**: `backend/core/tools/memories_tool.py`
- Updated `_get_memories_user_id()` to use `account_settings` table
- Changed from `.single()` to `.maybe_single()` for cleaner handling
- Uses `upsert()` for atomic create-or-update

### Migration Path

```bash
# 1. Apply the new migration
cd backend
supabase db push

# 2. Verify it worked
supabase db execute < verify_memories_schema.sql

# 3. Restart backend services
# (No PostgREST restart needed - this is all in public schema)
```

### Verification Queries

```sql
-- Check account_settings table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'account_settings';

-- Check data was migrated
SELECT account_id, memories_user_id 
FROM public.account_settings 
LIMIT 5;

-- Verify no cross-schema FK constraints remain
SELECT 
  tc.table_name,
  tc.constraint_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema != 'public';
```

### Future Improvements

The `account_settings` table can store other per-account configuration:
- API keys for external services
- Feature flags
- User preferences
- Service-specific IDs (Composio, MCP servers, etc.)

## Testing

After applying:
1. Test `upload-video` tool - should work without schema cache errors
2. Test `search-platform-videos` - should work for all platforms
3. Verify `memories_user_id` is properly created and reused per account
4. Check that different accounts get different `memories_user_id` values

## Rollback (if needed)

```sql
-- If you need to rollback
DROP TABLE IF EXISTS public.account_settings CASCADE;
DROP VIEW IF EXISTS public.account_settings_view;
DROP FUNCTION IF EXISTS update_account_settings_updated_at();
```

