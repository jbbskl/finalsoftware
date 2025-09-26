#!/bin/bash

# F2F Mass DM Bot Runner
echo "🤖 Starting F2F Mass DM Bot..."

# Check if config file exists
if [ ! -f "dm_config.yaml" ]; then
    echo "❌ dm_config.yaml not found!"
    echo "Please create your configuration file first."
    exit 1
fi

# Check if cookies exist
if [ ! -f "cookies.json" ]; then
    echo "⚠️  No cookies file found at cookies.json"
    echo "The bot will run unauthenticated. Please add your cookies for full functionality."
fi

# Run the bot
python3 dm_main.py
