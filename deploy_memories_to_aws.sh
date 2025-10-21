#!/bin/bash
# Deploy Memories.ai Integration to AWS
# Run this ON YOUR AWS SERVER

set -e  # Exit on error

echo "🚀 Deploying Memories.ai Video Intelligence to AWS"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check we're in the right directory
if [ ! -f "backend/api.py" ]; then
    echo -e "${RED}❌ Error: Not in agentic-suite directory${NC}"
    echo "Run: cd ~/agentic-suite"
    exit 1
fi

echo -e "${GREEN}✓ In correct directory${NC}"

# Step 2: Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "memories-ai" ]; then
    echo -e "${YELLOW}⚠  Switching to memories-ai branch...${NC}"
    git fetch origin memories-ai
    git checkout memories-ai
fi

# Step 3: Pull latest code
echo ""
echo "📥 Pulling latest code..."
git pull origin memories-ai

LATEST_COMMIT=$(git log --oneline -1)
echo -e "${GREEN}✓ Latest commit: $LATEST_COMMIT${NC}"

# Should be: 8f7079c6 fix(platform): upload_video_file now works with sandbox files
if [[ ! "$LATEST_COMMIT" =~ "8f7079c6" ]] && [[ ! "$LATEST_COMMIT" =~ "sandbox files" ]]; then
    echo -e "${YELLOW}⚠  Warning: May not be on latest commit${NC}"
fi

# Step 4: Check environment variables
echo ""
echo "🔍 Checking environment variables..."
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env not found${NC}"
    exit 1
fi

if grep -q "MEMORIES_AI_API_KEY=sk-ae20837ce042b37ff907225b15c9210d" backend/.env; then
    echo -e "${GREEN}✓ MEMORIES_AI_API_KEY configured${NC}"
else
    echo -e "${RED}❌ Error: MEMORIES_AI_API_KEY not set in backend/.env${NC}"
    echo "Add: MEMORIES_AI_API_KEY=sk-ae20837ce042b37ff907225b15c9210d"
    exit 1
fi

# Step 5: Clear Python cache
echo ""
echo "🧹 Clearing Python cache..."
find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find backend -name "*.pyc" -delete 2>/dev/null || true
echo -e "${GREEN}✓ Cache cleared${NC}"

# Step 6: Stop old backend processes
echo ""
echo "🛑 Stopping old backend processes..."
pkill -9 -f uvicorn 2>/dev/null || true
pkill -9 -f dramatiq 2>/dev/null || true
sleep 2

# Verify they're dead
if ps aux | grep -E '[u]vicorn|[d]ramatiq' > /dev/null; then
    echo -e "${RED}❌ Error: Processes still running${NC}"
    ps aux | grep -E '[u]vicorn|[d]ramatiq'
    exit 1
fi
echo -e "${GREEN}✓ Old processes stopped${NC}"

# Step 7: Start backend
echo ""
echo "🚀 Starting backend..."
cd backend
nohup uvicorn api:app --host 0.0.0.0 --port 8000 --reload > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 5

# Step 8: Start worker
echo ""
echo "🚀 Starting worker..."
nohup uv run dramatiq --processes 4 --threads 4 run_agent_background > /tmp/worker.log 2>&1 &
WORKER_PID=$!
echo "Worker PID: $WORKER_PID"
sleep 3

cd ..

# Step 9: Check backend logs for tool registration
echo ""
echo "🔍 Checking backend startup..."
if tail -100 /tmp/backend.log | grep -q "Registered Video Intelligence tool"; then
    echo -e "${GREEN}✅ Video Intelligence tool registered successfully!${NC}"
    tail -5 /tmp/backend.log | grep "Video Intelligence"
else
    echo -e "${RED}❌ Video Intelligence tool NOT registered${NC}"
    echo "Last 50 lines of backend log:"
    tail -50 /tmp/backend.log
    exit 1
fi

# Step 10: Rebuild frontend
echo ""
echo "🎨 Rebuilding frontend..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Clear old build
rm -rf .next

# Build production
echo "Building (this takes 2-5 minutes)..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Step 11: Restart frontend
echo ""
echo "🚀 Restarting frontend..."
pkill -f "next start" 2>/dev/null || true
sleep 2

nohup npm run start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd ..

# Step 12: Verify everything is running
echo ""
echo "🔍 Verifying services..."
sleep 5

if ps aux | grep -E "[u]vicorn.*api:app" > /dev/null; then
    echo -e "${GREEN}✓ Backend running${NC}"
else
    echo -e "${RED}❌ Backend not running${NC}"
fi

if ps aux | grep -E "[d]ramatiq" > /dev/null; then
    echo -e "${GREEN}✓ Worker running${NC}"
else
    echo -e "${RED}❌ Worker not running${NC}"
fi

if ps aux | grep -E "[n]ext start" > /dev/null; then
    echo -e "${GREEN}✓ Frontend running${NC}"
else
    echo -e "${RED}❌ Frontend not running${NC}"
fi

# Final summary
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "📊 Status:"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  Logs:     /tmp/backend.log, /tmp/worker.log, /tmp/frontend.log"
echo ""
echo "🧪 Test Now:"
echo '  1. Go to Adentic in your browser'
echo '  2. Clear browser cache (Ctrl+Shift+R)'
echo '  3. Try: "Find top 5 Nike videos on TikTok"'
echo ""
echo "📝 View logs:"
echo "  tail -f /tmp/backend.log    # Backend logs"
echo "  tail -f /tmp/worker.log     # Worker logs"
echo "  tail -f /tmp/frontend.log   # Frontend logs"
echo ""



