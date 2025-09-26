#!/bin/bash

# Paranoid version checker - ensures exact pinned versions
set -e

echo "🔍 Checking versions..."

# Check Node version
NODE_VERSION=$(node --version | sed 's/v//')
EXPECTED_NODE="24.5.0"
if [ "$NODE_VERSION" != "$EXPECTED_NODE" ]; then
    echo "❌ Node version mismatch: expected $EXPECTED_NODE, got $NODE_VERSION"
    echo "   Run: nvm use (or install Node $EXPECTED_NODE)"
    exit 1
fi
echo "✅ Node: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
echo "✅ npm: $NPM_VERSION"

# Check if package.json has exact versions (no ^ or ~)
if grep -q '"[^"]*": "[~^]' package.json; then
    echo "❌ package.json contains version ranges (^ or ~). All versions must be exact."
    echo "   Found ranges:"
    grep -n '"[^"]*": "[~^]' package.json
    exit 1
fi
echo "✅ package.json has exact versions"

# Check TypeScript version
TS_VERSION=$(npx tsc --version | sed 's/Version //')
echo "✅ TypeScript: $TS_VERSION"

echo "🎉 All version checks passed!"
