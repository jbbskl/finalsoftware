#!/bin/bash

# Paranoid development startup script
set -e

echo "🚀 Starting paranoid development environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root. Run from bots-control-plane directory."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start dev server in background
echo "🔧 Starting Next.js dev server..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Server is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Server failed to start within 30 seconds"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Run smoke tests
echo "🧪 Running smoke tests..."
node tools/paranoid/smoke-web.mjs

echo "🎉 Development environment ready!"
echo "   Server running on http://localhost:3000"
echo "   PID: $DEV_PID"
echo "   To stop: kill $DEV_PID"
