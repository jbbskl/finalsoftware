#!/bin/bash

# Fanvue Bots Log Monitor
echo "📊 Fanvue Bots Log Monitor"
echo "=========================="
echo ""

LOG_DIR="./logs"

if [ ! -d "$LOG_DIR" ]; then
    echo "❌ Log directory not found: $LOG_DIR"
    exit 1
fi

echo "📅 Current time: $(date)"
echo ""

# Function to show last few lines of a log
show_log_summary() {
    local log_file="$1"
    local bot_name="$2"
    
    if [ -f "$log_file" ]; then
        echo "📋 $bot_name (last 5 lines):"
        tail -5 "$log_file" | sed 's/^/  /'
        echo ""
    else
        echo "📋 $bot_name: No log file found"
        echo ""
    fi
}

# Show summary for each bot
show_log_summary "$LOG_DIR/fleur_posting.log" "Fleur Posting Bot"
show_log_summary "$LOG_DIR/floortje_posting.log" "Floortje Posting Bot"
show_log_summary "$LOG_DIR/fleur_massdm.log" "Fleur Mass DM Bot"
show_log_summary "$LOG_DIR/floortje_massdm.log" "Floortje Mass DM Bot"

# Show daily progress
echo "📊 Daily Progress:"
echo "=================="
for bot_dir in fleur_posting floortje_posting fleur_massdm floortje_massdm; do
    if [ -f "$bot_dir/daily_progress.json" ]; then
        echo "$bot_dir:"
        cat "$bot_dir/daily_progress.json" | python3 -m json.tool 2>/dev/null | sed 's/^/  /' || echo "  Invalid JSON"
    else
        echo "$bot_dir: No progress file (0 completed today)"
    fi
    echo ""
done

# Show recent errors
echo "🚨 Recent Errors (last hour):"
echo "=============================="
find $LOG_DIR -name "*.log" -mmin -60 -exec grep -l "ERROR\|FAILED\|Exception" {} \; 2>/dev/null | while read logfile; do
    echo "Error in: $logfile"
    grep "ERROR\|FAILED\|Exception" "$logfile" | tail -3 | sed 's/^/  /'
    echo ""
done

echo "🔧 Commands:"
echo "  tail -f $LOG_DIR/fleur_posting.log   - Follow Fleur posting log"
echo "  tail -f $LOG_DIR/floortje_massdm.log - Follow Floortje mass DM log"
echo "  crontab -l                           - View crontab schedule"
echo "  ./monitor_logs.sh                    - Refresh this monitor"
