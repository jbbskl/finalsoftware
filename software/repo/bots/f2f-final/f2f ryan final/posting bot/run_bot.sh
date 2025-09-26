#!/bin/bash
# F2F Posting Bot Runner Script
# This ensures proper environment setup for crontab execution

# Set the working directory
cd "/Users/julianbik/Desktop/clients/f2f final/f2f ryan final/posting bot"

# Set up environment (adjust Python path if needed)
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Log start time
echo "$(date): F2F Posting Bot Started" >> bot_runs.log

# Run the bot and capture output
python3 main.py >> bot_runs.log 2>&1

# Log completion
echo "$(date): F2F Posting Bot Finished" >> bot_runs.log
echo "----------------------------------------" >> bot_runs.log
