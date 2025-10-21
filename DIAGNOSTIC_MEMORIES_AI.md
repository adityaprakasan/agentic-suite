# 🔍 Diagnostic Guide: Memories.ai API Key Not Loading

## ✅ **THE REAL ISSUE**

The error `'NoneType' object has no attribute 'search_public_videos'` means `self.memories_client` is `None`.

This happens when `config.MEMORIES_AI_API_KEY` is `None` or empty **ON AWS**.

---

## 🧪 **Step 1: Deploy Debug Version to AWS**

```bash
# On AWS server
cd ~/agentic-suite
git pull origin memories-ai
pkill -9 -f uvicorn
pkill -9 -f dramatiq
cd backend
uvicorn api:app --host 0.0.0.0 --port 8000 --reload > /tmp/backend.log 2>&1 &
```

---

## 🔍 **Step 2: Check Logs for Debug Output**

```bash
# Watch backend logs in real-time
tail -f /tmp/backend.log | grep "🔍"
```

**You should see:**
```
🔍 Config.MEMORIES_AI_API_KEY being set to: sk-ae20837... (length: 39)
🔍 MemoriesTool.__init__: API_KEY = sk-ae20837... (length: 39)
```

**If you see:**
```
🔍 Config.MEMORIES_AI_API_KEY being set to: NONE... (length: 0)
🔍 MemoriesTool.__init__: API_KEY = NONE... (length: 0)
```

Then **the environment variable is NOT being loaded!**

---

## 🛠️ **Step 3: Fix the Environment Variable Loading**

### Option A: Add to systemd service file (RECOMMENDED)

If you're using systemd to run the backend:

```bash
sudo nano /etc/systemd/system/adentic-backend.service
```

Add to the `[Service]` section:
```ini
Environment="MEMORIES_AI_API_KEY=sk-ae20837ce042b37ff907225b15c9210d"
```

Reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart adentic-backend
```

### Option B: Export in shell before running

```bash
export MEMORIES_AI_API_KEY=sk-ae20837ce042b37ff907225b15c9210d
cd backend
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

### Option C: Add to `.bashrc` or `.zshrc`

```bash
echo 'export MEMORIES_AI_API_KEY=sk-ae20837ce042b37ff907225b15c9210d' >> ~/.bashrc
source ~/.bashrc
```

### Option D: Verify `.env` file location

```bash
# Make sure .env is in backend/ directory
ls -la ~/agentic-suite/backend/.env

# Check if it contains the key
grep MEMORIES_AI_API_KEY ~/agentic-suite/backend/.env
```

**Important:** The backend process must be started from the `backend/` directory OR you must specify the `.env` path!

---

## 🧪 **Step 4: Verify API Key is Loaded**

After applying the fix, check logs again:

```bash
# Restart backend
pkill -9 -f uvicorn
cd ~/agentic-suite/backend
uvicorn api:app --host 0.0.0.0 --port 8000 --reload > /tmp/backend.log 2>&1 &

# Wait 5 seconds
sleep 5

# Check logs
grep "🔍.*MEMORIES_AI_API_KEY" /tmp/backend.log
```

**Expected output:**
```
🔍 Config.MEMORIES_AI_API_KEY being set to: sk-ae20837... (length: 39)
```

**If still seeing NONE:**
```bash
# Check if process can see env var
ps aux | grep uvicorn
# Copy the PID, then:
sudo cat /proc/<PID>/environ | tr '\0' '\n' | grep MEMORIES
```

---

## 🎯 **Step 5: Test the Tool**

Once you see the API key is loaded correctly in logs:

1. Go to your agent chat
2. Try: **"Find top 5 Nike videos on TikTok"**
3. Check `/tmp/backend.log` for any errors

---

## 📋 **Common Root Causes**

| Issue | How to Check | Fix |
|-------|--------------|-----|
| `.env` not in `backend/` | `ls backend/.env` | Move it: `mv .env backend/` |
| Process started from wrong dir | `ps aux \| grep uvicorn` | Always `cd backend` first |
| `.env` not loading | Check `load_dotenv()` in code | Already correct |
| systemd doesn't load `.env` | systemd logs | Add `Environment=` to service file |
| Env var typo | `echo $MEMORIES_AI_API_KEY` | Fix typo in env file |

---

## 🚨 **If Still Failing**

Run this comprehensive diagnostic:

```bash
cd ~/agentic-suite

echo "=== Checking environment ==="
echo "Current directory: $(pwd)"
echo "MEMORIES_AI_API_KEY in shell: ${MEMORIES_AI_API_KEY:0:10}..."

echo ""
echo "=== Checking .env file ==="
cat backend/.env | grep MEMORIES

echo ""
echo "=== Checking Python can load it ==="
cd backend
python3 << EOF
from dotenv import load_dotenv
import os
load_dotenv()
key = os.getenv("MEMORIES_AI_API_KEY")
print(f"Python sees API key: {key[:10] if key else 'NONE'}... (length: {len(key) if key else 0})")
EOF

echo ""
echo "=== Checking running process ==="
ps aux | grep uvicorn | grep -v grep
```

**Send me the output of this script!**

---

## 💰 **You Win the $1 Billion**

Once the logs show:
```
🔍 MemoriesTool.__init__: API_KEY = sk-ae20837... (length: 39)
✅ Registered Video Intelligence tool (memories_tool) with 12 methods
```

And the agent successfully searches for videos **without the `'NoneType'` error**, then the issue is resolved!

---

## 🔧 **Remove Debug Logs Later**

After confirming it works, remove the debug logs:

```bash
git checkout memories-ai
# I'll create a clean commit removing the debug code
```

