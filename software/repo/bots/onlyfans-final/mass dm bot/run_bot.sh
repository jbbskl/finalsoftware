#!/bin/bash

echo "🚀 OnlyFans Mass DM Bot - Production Runner"
echo "=========================================="

# Check if config exists
if [ ! -f "of_dm_config.yaml" ]; then
    echo "❌ Configuration file not found: of_dm_config.yaml"
    echo "💡 Please create your configuration file first"
    exit 1
fi

# Check if dependencies are installed
if ! python -c "import playwright" 2>/dev/null; then
    echo "❌ Dependencies not installed"
    echo "💡 Run: ./setup.sh"
    exit 1
fi

# Check if browser is installed
if ! python -c "from playwright.sync_api import sync_playwright; sync_playwright().start().chromium.executable_path()" 2>/dev/null; then
    echo "❌ Chromium browser not installed"
    echo "💡 Run: playwright install chromium"
    exit 1
fi

# Check test mode
TEST_MODE=$(python -c "import yaml; print(yaml.safe_load(open('of_dm_config.yaml'))['test_mode'])" 2>/dev/null || echo "false")

if [ "$TEST_MODE" = "True" ]; then
    echo "🧪 Running in TEST MODE (safe - no messages sent)"
else
    echo "⚠️  Running in PRODUCTION MODE (will send real messages!)"
    echo "🛑 Press Ctrl+C within 5 seconds to cancel..."
    sleep 5
fi

echo "🤖 Starting bot..."
python of_dm_main.py

echo "✅ Bot execution completed"
