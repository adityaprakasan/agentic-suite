#!/bin/bash
# Verification script to ensure memories.ai integration is properly deployed
# Run this AFTER deploying to AWS

echo "🔍 Memories.ai Integration Verification"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

# 1. Check git commit
echo ""
echo "1️⃣  Checking Git Commit..."
CURRENT_COMMIT=$(git log --oneline -1)
if [[ "$CURRENT_COMMIT" =~ "96896fb1" ]] || [[ "$CURRENT_COMMIT" =~ "8f7079c6" ]]; then
    echo -e "${GREEN}✅ On latest commit: $CURRENT_COMMIT${NC}"
else
    echo -e "${RED}❌ Not on latest commit!${NC}"
    echo "Current: $CURRENT_COMMIT"
    echo "Expected: 8f7079c6 or later"
    FAILED=1
fi

# 2. Check environment variable
echo ""
echo "2️⃣  Checking Environment Variables..."
if [ -f "backend/.env" ]; then
    if grep -q "MEMORIES_AI_API_KEY=sk-ae20837ce042b37ff907225b15c9210d" backend/.env; then
        echo -e "${GREEN}✅ MEMORIES_AI_API_KEY configured${NC}"
    else
        echo -e "${RED}❌ MEMORIES_AI_API_KEY missing or incorrect${NC}"
        FAILED=1
    fi
else
    echo -e "${RED}❌ backend/.env not found${NC}"
    FAILED=1
fi

# 3. Check if backend is running
echo ""
echo "3️⃣  Checking Backend Process..."
if ps aux | grep -E "[u]vicorn.*api:app" > /dev/null; then
    PID=$(ps aux | grep -E "[u]vicorn.*api:app" | awk '{print $2}' | head -1)
    echo -e "${GREEN}✅ Backend running (PID: $PID)${NC}"
    
    # Check if it's using new code
    START_TIME=$(ps -o lstart= -p $PID)
    echo "   Started: $START_TIME"
else
    echo -e "${RED}❌ Backend not running${NC}"
    FAILED=1
fi

# 4. Check if worker is running
echo ""
echo "4️⃣  Checking Worker Process..."
if ps aux | grep -E "[d]ramatiq.*run_agent_background" > /dev/null; then
    PID=$(ps aux | grep -E "[d]ramatiq.*run_agent_background" | awk '{print $2}' | head -1)
    echo -e "${GREEN}✅ Worker running (PID: $PID)${NC}"
else
    echo -e "${RED}❌ Worker not running${NC}"
    FAILED=1
fi

# 5. Check backend logs for tool registration
echo ""
echo "5️⃣  Checking Tool Registration..."
if [ -f "/tmp/backend.log" ]; then
    if grep -q "Registered Video Intelligence tool" /tmp/backend.log; then
        METHODS=$(grep "Registered Video Intelligence tool" /tmp/backend.log | tail -1)
        echo -e "${GREEN}✅ $METHODS${NC}"
    else
        if grep -q "Video Intelligence tool not registered" /tmp/backend.log; then
            ERROR=$(grep "Video Intelligence tool not registered" /tmp/backend.log | tail -1)
            echo -e "${RED}❌ $ERROR${NC}"
            FAILED=1
        else
            echo -e "${YELLOW}⚠️  No tool registration log found${NC}"
            echo "Last 10 lines of backend.log:"
            tail -10 /tmp/backend.log
            FAILED=1
        fi
    fi
else
    echo -e "${RED}❌ /tmp/backend.log not found${NC}"
    FAILED=1
fi

# 6. Check Python file is updated
echo ""
echo "6️⃣  Checking Python Files..."
if [ -f "backend/core/tools/memories_tool.py" ]; then
    if grep -q "import os" backend/core/tools/memories_tool.py; then
        echo -e "${GREEN}✅ memories_tool.py has latest changes (import os)${NC}"
    else
        echo -e "${RED}❌ memories_tool.py missing 'import os'${NC}"
        FAILED=1
    fi
    
    if grep -q "get_sandbox" backend/core/tools/memories_tool.py; then
        echo -e "${GREEN}✅ memories_tool.py has sandbox integration${NC}"
    else
        echo -e "${RED}❌ memories_tool.py missing sandbox integration${NC}"
        FAILED=1
    fi
    
    if grep -q 'schema\("basejump"\)' backend/core/tools/memories_tool.py; then
        echo -e "${GREEN}✅ memories_tool.py uses basejump schema correctly${NC}"
    else
        echo -e "${RED}❌ memories_tool.py not using basejump schema${NC}"
        FAILED=1
    fi
else
    echo -e "${RED}❌ memories_tool.py not found${NC}"
    FAILED=1
fi

# 7. Check database migrations
echo ""
echo "7️⃣  Checking Database Migrations..."
MIGRATIONS=(
    "20251020000001_add_memories_user_id.sql"
    "20251020000002_create_kb_videos.sql"
    "20251020000003_add_video_indexes.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "backend/supabase/migrations/$migration" ]; then
        echo -e "${GREEN}✅ $migration exists${NC}"
    else
        echo -e "${RED}❌ $migration missing${NC}"
        FAILED=1
    fi
done

# 8. Check frontend files
echo ""
echo "8️⃣  Checking Frontend Files..."
FRONTEND_FILES=(
    "frontend/src/components/thread/renderers/MemoriesToolRenderer.tsx"
    "frontend/src/components/thread/tool-views/MemoriesToolView.tsx"
    "frontend/src/components/thread/tool-views/wrapper/ToolViewRegistry.tsx"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $(basename $file) exists${NC}"
    else
        echo -e "${RED}❌ $(basename $file) missing${NC}"
        FAILED=1
    fi
done

# 9. Check if frontend is built
echo ""
echo "9️⃣  Checking Frontend Build..."
if [ -d "frontend/.next" ]; then
    BUILD_TIME=$(stat -f %Sm frontend/.next 2>/dev/null || stat -c %y frontend/.next 2>/dev/null)
    echo -e "${GREEN}✅ Frontend built: $BUILD_TIME${NC}"
else
    echo -e "${RED}❌ Frontend not built (.next folder missing)${NC}"
    FAILED=1
fi

# 10. Check if frontend is running
echo ""
echo "🔟 Checking Frontend Process..."
if ps aux | grep -E "[n]ext start" > /dev/null; then
    PID=$(ps aux | grep -E "[n]ext start" | awk '{print $2}' | head -1)
    echo -e "${GREEN}✅ Frontend running (PID: $PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not running (may be using different method)${NC}"
fi

# Summary
echo ""
echo "========================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "🧪 Ready to test! Try:"
    echo '   "Find top 5 Nike videos on TikTok"'
    echo ""
    echo "If you still get errors, the backend wasn't properly restarted."
    echo "Force restart:"
    echo "   pkill -9 -f uvicorn && pkill -9 -f dramatiq"
    echo "   cd backend && uvicorn api:app --host 0.0.0.0 --port 8000 --reload &"
    echo "   uv run dramatiq --processes 4 --threads 4 run_agent_background &"
else
    echo -e "${RED}❌ SOME CHECKS FAILED!${NC}"
    echo ""
    echo "Run the deployment script:"
    echo "   bash deploy_memories_to_aws.sh"
fi
echo "========================================"

