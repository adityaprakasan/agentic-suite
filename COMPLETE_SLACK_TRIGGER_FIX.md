# Complete Slack Trigger Fix - All Locations

## Deep Dive Summary

I searched EVERY file in the backend and found **THREE** locations where Composio triggers are created. All three were missing the `webhook_url` parameter!

## Root Cause

When creating triggers via Composio's `/api/v3/trigger_instances/{slug}/upsert` endpoint, the system was NOT including `webhook_url` in the request body. This caused Composio to either:
1. Use a default/fallback URL
2. Use a previously stored URL
3. Construct an incorrect URL

Result: Webhooks sent to `/api/billing/webhook/api/triggers/{id}/webhook` instead of `/api/composio/webhook`

## All Three Locations Fixed

### 1. Main API Endpoint (`backend/core/composio_integration/api.py`)
**Lines 703-756**

**Before:**
```python
body = {
    "user_id": composio_user_id,
    "trigger_config": coerced_config,
    # ❌ webhook_url missing!
}
```

**After:**
```python
# Build webhook URL for Composio
webhook_url = req.webhook_url or f"{base_url}/api/composio/webhook"

body = {
    "user_id": composio_user_id,
    "trigger_config": coerced_config,
    "webhook_url": webhook_url,  # ✅ Tell Composio where to send webhooks
}
```

### 2. Agent Builder Tool (`backend/core/tools/agent_builder_tools/trigger_tool.py`)
**Lines 502-511**

**Before:**
```python
body = {
    "user_id": composio_user_id,
    "trigger_config": coerced_config,
    # ❌ webhook_url missing!
}
```

**After:**
```python
# Build webhook URL for Composio
base_url = os.getenv("WEBHOOK_BASE_URL", "http://localhost:8000").rstrip("/")
webhook_url = f"{base_url}/api/composio/webhook"

body = {
    "user_id": composio_user_id,
    "trigger_config": coerced_config,
    "webhook_url": webhook_url,  # ✅ Tell Composio where to send webhooks
}
```

### 3. Template Installation Service (`backend/core/templates/installation_service.py`)
**Lines 703-714**

**Before:**
```python
body = {
    "user_id": composio_user_id,
    "trigger_config": trigger_specific_config or {},
    # ❌ webhook_url missing!
}
```

**After:**
```python
# Build webhook URL for Composio
webhook_url = f"{base_url}/api/composio/webhook"

body = {
    "user_id": composio_user_id,
    "trigger_config": trigger_specific_config or {},
    "webhook_url": webhook_url,  # ✅ Tell Composio where to send webhooks
}
```

## Your .env is PERFECT

```bash
WEBHOOK_BASE_URL=https://workspace.tryadentic.com  ✅ CORRECT
```

**DO NOT CHANGE THIS!**

## What You Need to Do

1. **Deploy these code fixes** (all 3 files)
2. **Delete ALL existing Composio triggers** (they have wrong webhooks stored)
3. **Recreate your Slack reaction trigger**

The new trigger will correctly register:
```
https://workspace.tryadentic.com/api/composio/webhook
```

## Testing Verification

After deploying and recreating the trigger, when you add a Slack reaction, you should see:

```bash
✅ POST /api/composio/webhook HTTP/1.1 200 OK
```

NOT:
```bash
❌ POST /api/billing/webhook/api/triggers/{id}/webhook HTTP/1.1 404 Not Found
```

## Why This Was So Hard to Find

The bug existed in THREE different locations:
1. Main API endpoint (most commonly used)
2. Agent builder tool (used when agents create their own triggers)
3. Template installation (used when installing agent templates)

All three were independently broken, which is why the issue persisted across different trigger creation methods.

## Files Changed

1. `backend/core/composio_integration/api.py` - Lines 712-756
2. `backend/core/tools/agent_builder_tools/trigger_tool.py` - Lines 502-511
3. `backend/core/templates/installation_service.py` - Lines 703-715

## Summary

- ✅ All 3 trigger creation locations fixed
- ✅ webhook_url now sent to Composio in all cases
- ✅ Your .env is correct - no changes needed
- ❌ Old triggers must be deleted and recreated
- ✅ New triggers will work correctly

