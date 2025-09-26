#!/bin/bash

# Paranoid type checking and linting
set -e

echo "🔍 Running type check and lint..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Type check
echo "🔍 Type checking..."
npm run typecheck

# Lint check
echo "🔍 Linting..."
npm run lint

# Build check
echo "🔍 Build check..."
npm run build

echo "🎉 All type, lint, and build checks passed!"
