# Next Steps: Fix Memories.ai Tool

## Summary of Issues

1. **Agent is hallucinating** - Not using the `search_platform_videos` tool
2. **Runtime error** - `can only concatenate str (not "list") to str` during billing
3. **No registration log** - Missing `✅ Registered Video Intelligence tool` in AWS logs

## What We've Done

✅ Fixed `super().__init__()` in `MemoriesTool.__init__()`  
✅ Improved function descriptions for better LLM selection  
✅ Added `memories_tool` to `tool_groups.py` as fallback  
✅ Committed and pushed changes to `memories-ai` branch  

## What You Need to Do on AWS

### Step 1: Run Diagnostic Script

```bash
# Copy test script to AWS
scp test_on_aws.sh ubuntu@your-aws-ip:/tmp/

# Run it
ssh ubuntu@your-aws-ip 'bash /tmp/test_on_aws.sh'
```

This will tell us:
- If the tool can be imported
- If schemas are being generated
- If there's a specific error preventing registration

### Step 2: Deploy Latest Code

```bash
ssh ubuntu@your-aws-ip

cd /home/ubuntu/agentic-suite

# Pull latest code
git fetch origin
git checkout memories-ai
git pull origin memories-ai

# Verify you have commit 2f8a3a17 or later
git log --oneline -1

# Restart services
sudo systemctl restart adentic-backend adentic-worker

# Watch logs for tool registration
sudo journalctl -u adentic-backend -f | grep -i "video\|memories"
```

**Expected output in logs:**
```
✅ Registered Video Intelligence tool (memories_tool) with 12 methods
```

If you DON'T see this, the tool is crashing during registration.

### Step 3: Create Fresh Agent

Old agents may have cached configs. Create a new agent:

1. Go to **Dashboard → Agents → Create New Agent**
2. In agent config, go to **Tools** tab
3. Find **"Video Intelligence"**
4. Make sure it's **enabled** with **all 12 methods enabled**
5. Save agent

### Step 4: Test

In a **NEW chat with the new agent**, ask:

> "Find top 10 Nike videos on TikTok"

**If working correctly**, you should see in logs:
```
[info] Calling tool: search_platform_videos
[info] Tool args: {"platform": "tiktok", "query": "Nike", "limit": 10}
```

And the agent should show actual API results (not hallucinated data).

## If Still Not Working

### Option A: Check Tool Enable Status

The tool might be in the config but not actually enabled. In Supabase SQL editor:

```sql
-- Check agent configuration
SELECT 
  agent_id,
  name,
  agentpress_tools->'memories_tool' as memories_config
FROM agents
WHERE account_id = 'YOUR_ACCOUNT_ID'
ORDER BY updated_at DESC
LIMIT 5;
```

Look for:
- `memories_config` should be `true` or `{enabled: true, methods: {...}}`
- If it's `false` or `{enabled: false}`, the tool is disabled

### Option B: Get Full Error Stack Trace

If there's still a `can only concatenate str (not "list") to str` error:

```bash
ssh ubuntu@your-aws-ip
sudo journalctl -u adentic-backend -u adentic-worker --since "10 minutes ago" > /tmp/full_logs.txt
cat /tmp/full_logs.txt | grep -B 50 "can only concatenate"
```

Send the full stack trace.

### Option C: Nuclear Option - Reset Tool Config

```sql
-- Remove memories_tool from all agents
UPDATE agents
SET agentpress_tools = agentpress_tools - 'memories_tool'
WHERE account_id = 'YOUR_ACCOUNT_ID';

-- Then re-enable via UI
```

## Root Cause Theories

Given the symptoms:

1. **Tool shows in UI** → `tool_groups.py` static definition is working
2. **Tool not used by LLM** → Either:
   - Not being registered at runtime (crashes before registration)
   - Registered but schemas are empty/malformed
   - LLM doesn't understand when to use it (fixed by description improvements)
3. **String concatenation error** → Something in tool code or framework is trying to concatenate a string with a list

Most likely: **The tool is crashing during registration**, which means the LLM never gets the schemas, so it hallucinates.

## Expected Timeline

- Diagnostic script: 2 minutes
- Deploy + restart: 3 minutes  
- Test: 1 minute

**Total: ~5 minutes to know if it's fixed**

## Contact

If diagnostic shows:
- ✅ Tool imports successfully
- ✅ Schemas are generated
- ❌ Still not working

Then the issue is in the agent orchestration layer, not the tool itself.

---

**Quick Summary:**
1. Run `test_on_aws.sh` on AWS → See if tool works
2. Deploy latest code (`git pull` + restart) → Get the fixes
3. Create fresh agent with tool enabled → Avoid cached config
4. Test with "Find Nike videos on TikTok" → Should use the tool now

