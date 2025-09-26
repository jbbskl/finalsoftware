#!/bin/bash

# F2F Posting Bot Wrapper Script
# This ensures the correct Python environment is used by cron

# Set full environment for cron
export HOME="/Users/julianbik"
export PATH="/Users/julianbik/.pyenv/shims:/Users/julianbik/.pyenv/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export PYENV_ROOT="/Users/julianbik/.pyenv"
export PYENV_VERSION="3.10.11"

# Change to bot directory
cd "/Users/julianbik/Desktop/clients/f2f final/f2f ryan final/posting bot"

# Log start time with environment info
echo "=== Bot Starting at $(date) ===" >> bot_runs.log
echo "Python: $(/Users/julianbik/.pyenv/shims/python3 --version)" >> bot_runs.log
echo "Python path: $(/Users/julianbik/.pyenv/shims/python3 -c 'import sys; print(sys.executable)')" >> bot_runs.log

# Test pandas import first
if /Users/julianbik/.pyenv/shims/python3 -c "import pandas" 2>/dev/null; then
    echo "✅ Pandas import successful" >> bot_runs.log
    # Run the bot
    /Users/julianbik/.pyenv/shims/python3 main.py >> bot_runs.log 2>&1
else
    echo "❌ Pandas import failed" >> bot_runs.log
    /Users/julianbik/.pyenv/shims/python3 -c "import pandas" >> bot_runs.log 2>&1
fi

# Log completion
echo "=== Bot Finished at $(date) ===" >> bot_runs.log
