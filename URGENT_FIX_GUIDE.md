# URGENT: Memories.ai Tool Not Working - Diagnostic & Fix

## Problem Summary

1. **Agent is hallucinating** instead of using the `search_platform_videos` tool
2. **Runtime error** during agent execution: `can only concatenate str (not "list") to str`
3. **Tool not being registered** - no `✅ Registered Video Intelligence tool` log on AWS

## Root Cause Hypothesis

The tool is crashing during registration, which means:
- The LLM never receives the tool schemas
- Agent has no choice but to hallucinate
- The string concatenation error might be preventing registration

## Diagnostic Steps for AWS

SSH to your AWS server and run these commands:

```bash
cd /home/ubuntu/agentic-suite

# 1. Check deployed code version
git log --oneline -1
# Should show commit 2f8a3a17 or later

# 2. Verify super().__init__() is present
grep -A 3 "def __init__" backend/core/tools/memories_tool.py | head -6
# Should see: super().__init__()  # Initialize base Tool class

# 3. Check tool_groups.py
grep -A 5 '"memories_tool"' backend/core/utils/tool_groups.py | head -10
# Should see memories_tool definition

# 4. Test tool import manually
cd backend
python3 << 'PYEOF'
import sys
sys.path.insert(0, '.')

try:
    from core.tools.memories_tool import MemoriesTool
    from core.agentpress.tool import Tool
    print("✅ MemoriesTool imports successfully")
    print(f"✅ Is Tool subclass: {issubclass(MemoriesTool, Tool)}")
    
    # Try to get schemas
    class MockThreadManager:
        agent_config = {'account_id': 'test'}
    
    tool = MemoriesTool(thread_manager=MockThreadManager())
    schemas = tool.get_schemas()
    print(f"✅ Tool has {len(schemas)} methods")
    
    # Check for list/string issues in schemas
    for schema in schemas:
        fname = schema['function']['name']
        desc = schema['function']['description']
        if not isinstance(fname, str):
            print(f"❌ {fname} name is not a string: {type(fname)}")
        if not isinstance(desc, str):
            print(f"❌ {fname} description is not a string: {type(desc)}")
    
    print("✅ All schemas are valid")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
PYEOF

# 5. Check for the actual error in full logs
sudo journalctl -u adentic-backend -u adentic-worker --since "10 minutes ago" | grep -A 10 "can only concatenate"
```

## Possible Fixes

### Fix 1: Force-reload the tool class

The tool might be cached. Try this on AWS:

```bash
cd /home/ubuntu/agentic-suite
sudo systemctl stop adentic-backend adentic-worker
sleep 5
sudo systemctl start adentic-backend adentic-worker
sudo journalctl -u adentic-backend -f | grep -i "video\|memories"
```

### Fix 2: Check agent configuration

The tool might be disabled in the agent config. In the UI:
1. Go to Agent Configuration
2. Tools tab
3. Find "Video Intelligence"
4. Make sure ALL 12 methods are enabled (not just the tool itself)

### Fix 3: Create a test agent from scratch

Old agents might have cached configs:
1. Create a NEW agent
2. Enable "Video Intelligence" tool
3. Save
4. Start a new chat
5. Ask "Find top 10 Nike videos on TikTok"

## Expected Behavior After Fix

When you create an agent chat, you should see in backend logs:

```
✅ Registered Video Intelligence tool (memories_tool) with 12 methods
```

Then when you ask about TikTok videos, you should see:

```
[info] Calling tool: search_platform_videos with args: {"platform": "tiktok", "query": "Nike", "limit": 10}
```

## If Still Not Working

The error `can only concatenate str (not "list") to str` suggests there's a bug in how the tool is being serialized. This could be in:

1. **The agent config storage** - The tool config might have malformed data
2. **The tool schema** - One of the @openapi_schema decorators might have invalid data
3. **The agentpress framework** - Something in how tools are registered

### Nuclear Option: Reset Agent Tool Config

In your database (Supabase), run:

```sql
-- Find the agent with video tool issues
SELECT agent_id, agentpress_tools 
FROM agents 
WHERE account_id = 'YOUR_ACCOUNT_ID'
ORDER BY updated_at DESC 
LIMIT 5;

-- If you see malformed agentpress_tools, reset just memories_tool:
UPDATE agents
SET agentpress_tools = agentpress_tools - 'memories_tool'
WHERE agent_id = 'PROBLEM_AGENT_ID';

-- Then re-enable it via UI
```

## Contact Info

If none of this works, we need to:
1. Get the FULL stack trace of the "can only concatenate" error
2. Check if there's a bug in the agentpress tool registry
3. Verify the memories.ai API key is valid

## Quick Test

Try this simpler query first:
- "What video platforms can you search?"

If the agent mentions TikTok, YouTube, Instagram → Tool is registered but not being chosen
If the agent says "I don't have video search" → Tool is not registered at all

