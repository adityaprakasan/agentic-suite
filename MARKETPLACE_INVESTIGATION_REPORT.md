# Marketplace Template Visibility Investigation Report

## Executive Summary
I've completed a deep dive into why public agents/templates aren't showing up in the marketplace for other users. **The database is working correctly** - there are 4 public templates that should be visible. The issue appears to be in the application logic.

## What I Found

### ✅ Database Level (WORKING CORRECTLY)
Using direct database queries, I confirmed:
- **4 public templates exist** in the `agent_templates` table
- All have `is_public = TRUE`
- All have `marketplace_published_at` timestamps
- All have `is_kortix_team = FALSE`
- **Direct queries return all 4 templates successfully**

Templates in database:
1. "New Agent" - creator: 2fe114eb-...
2. "Adentic" - creator: 2fe114eb-...
3. "Adentic 2" - creator: 5dfc9702-...
4. "lol" - creator: fd9db8cf-...

### ✅ RLS Policies (WORKING CORRECTLY)
The Row Level Security policy is:
```sql
CREATE POLICY "Users can view public templates or their own templates" ON agent_templates
    FOR SELECT USING (
        is_public = true OR 
        creator_id = (auth.jwt() ->> 'sub')::uuid
    );
```

This correctly allows:
- Any user to see templates where `is_public = true`
- Users to see their own templates regardless of public status

### 🔍 Application Flow

#### Frontend (agents/page.tsx)
1. `marketplaceFilter` defaults to `'all'` (line 75)
2. When filter is `'all'`:
   - No `is_kortix_team` parameter
   - No `mine` parameter
   - Should show ALL public templates

3. Query params built at lines 133-152:
```typescript
const params: any = {
  page: marketplacePage,
  limit: marketplacePageSize,
  search: marketplaceSearchQuery || undefined,
  tags: marketplaceSelectedTags.length > 0 ? marketplaceSelectedTags.join(',') : undefined,
  sort_by: "download_count",
  sort_order: "desc"
};

if (marketplaceFilter === 'kortix') {
  params.is_kortix_team = true;
} else if (marketplaceFilter === 'community') {
  params.is_kortix_team = false;
} else if (marketplaceFilter === 'mine') {
  params.mine = true;
}
```

#### Backend API (templates/api.py)
Lines 428-475: `/templates/marketplace` endpoint
- Receives filter parameters
- Creates `MarketplaceFilters` object
- Calls `MarketplaceService.get_marketplace_templates_paginated()`

#### Backend Service (marketplace_service.py)
**⚠️ POTENTIAL ISSUE AREA** - Lines 61-78:

```python
if filters.creator_id is not None:
    logger.debug(f"Filtering by creator_id: {filters.creator_id}")
    templates = [t for t in templates if t.creator_id == filters.creator_id]
    # This would filter OUT all templates from other creators!
```

## Diagnostic Steps Added

I've added comprehensive debug logging to `backend/core/templates/services/marketplace_service.py`. These logs will show:
- What filters are being received
- How many templates are returned from the database
- Whether creator_id filtering is being applied
- How many templates are returned to the frontend

## How to Verify the Issue

### Step 1: Check Backend Logs
1. Start your backend with logging enabled
2. Open the marketplace page in the frontend
3. Look for lines starting with `[MARKETPLACE DEBUG]` in the backend logs

You should see output like:
```
[MARKETPLACE DEBUG] Fetching marketplace templates with filters: {'search': None, 'tags': [], 'is_kortix_team': None, 'creator_id': None, 'sort_by': 'download_count', 'sort_order': 'desc'}
[MARKETPLACE DEBUG] Pagination params: page=1, page_size=20
[MARKETPLACE DEBUG] get_public_templates returned 4 templates
[MARKETPLACE DEBUG]   - New Agent (creator: 2fe114eb...)
[MARKETPLACE DEBUG]   - Adentic (creator: 2fe114eb...)
[MARKETPLACE DEBUG]   - Adentic 2 (creator: 5dfc9702...)
[MARKETPLACE DEBUG]   - lol (creator: fd9db8cf...)
[MARKETPLACE DEBUG] No creator_id filter (filters.creator_id is None)
[MARKETPLACE DEBUG] Returning 4 templates to frontend
[MARKETPLACE DEBUG] Total items in count: 4
```

### Step 2: Check Frontend Network Tab
1. Open browser DevTools → Network tab
2. Filter for "marketplace"
3. Check the request to `/templates/marketplace`
4. Verify the query parameters
5. Check the response - how many templates are returned?

### Step 3: Check Browser Console
Look for any React Query errors or warnings that might prevent the data from rendering.

## Potential Root Causes

### Theory 1: Frontend Filter State Issue
- The `marketplaceFilter` state might be persisting from a previous session
- Or getting set to 'mine' somehow
- **Check**: Look at browser localStorage/sessionStorage

### Theory 2: Creator ID Being Set Unintentionally  
- The `mine` parameter might be getting set even when filter is 'all'
- **Check**: Backend logs will show if creator_id is being passed

### Theory 3: Frontend Not Rendering Data
- Data is being returned but not displayed
- **Check**: Add console.log in the `allMarketplaceItems` useMemo (line 191)

### Theory 4: React Query Caching Issue
- Old empty results are cached
- **Fix**: Clear cache or add a refetch

## Recommended Fixes

### Fix 1: Add Frontend Debugging
Add this to `agents/page.tsx` around line 191:

```typescript
const allMarketplaceItems = useMemo(() => {
  console.log('[DEBUG] marketplaceTemplates:', marketplaceTemplates);
  console.log('[DEBUG] marketplaceFilter:', marketplaceFilter);
  
  const items: MarketplaceTemplate[] = [];
  if (marketplaceTemplates?.templates) {
    console.log('[DEBUG] Templates count:', marketplaceTemplates.templates.length);
    marketplaceTemplates.templates.forEach(template => {
      // ... existing code
    });
  }
  
  console.log('[DEBUG] Final allMarketplaceItems:', items.length);
  return items;
}, [marketplaceTemplates]);
```

### Fix 2: Force Refetch on Mount
Add to `agents/page.tsx`:

```typescript
const { data: marketplaceTemplates, isLoading: marketplaceLoading, refetch: refetchMarketplace } = useMarketplaceTemplates(marketplaceQueryParams);

useEffect(() => {
  refetchMarketplace();
}, []);
```

### Fix 3: Clear React Query Cache
If caching is the issue, clear it:

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['secure-mcp', 'marketplace-templates'] });
```

## Next Steps

1. **Run the backend** and check logs when loading the marketplace
2. **Share the `[MARKETPLACE DEBUG]` log output** with me
3. **Check the browser console** for any errors
4. **Check the Network tab** to see the actual API response

This will tell us exactly where in the flow the templates are being filtered out.

## Files Modified

1. `backend/core/templates/services/marketplace_service.py` - Added debug logging
2. `debug_marketplace.py` - Database diagnostic script (can be deleted after)
3. `debug_api.py` - API testing script (can be deleted after)

---

**Status**: Investigation complete, debug logging added, awaiting runtime verification.

