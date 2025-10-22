#!/bin/bash
# Reload PostgREST schema cache on AWS
# This is needed after applying database migrations

echo "🔄 Reloading PostgREST schema cache..."

# Method 1: Send SIGUSR1 signal to PostgREST (preferred for self-hosted)
# Find PostgREST process and send reload signal
if pgrep -x "postgrest" > /dev/null; then
    echo "Found PostgREST process, sending reload signal..."
    pkill -SIGUSR1 postgrest
    echo "✅ Schema cache reload signal sent"
else
    echo "❌ PostgREST process not found locally"
fi

# Method 2: Restart PostgREST via Docker (if using docker-compose)
if docker ps | grep -q "supabase.*postgrest"; then
    echo "Found PostgREST container, restarting..."
    docker restart $(docker ps | grep "supabase.*postgrest" | awk '{print $1}')
    echo "✅ PostgREST container restarted"
fi

# Method 3: Use admin endpoint to reload schema (if exposed)
# Uncomment if your PostgREST admin port is accessible
# curl -X POST http://localhost:3001/schema/cache/reload
# echo "✅ Schema cache reloaded via admin endpoint"

echo ""
echo "⏳ Wait 5-10 seconds for schema cache to fully reload..."
sleep 5
echo "✅ Done! Try your upload_video tool again."

