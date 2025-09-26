#!/bin/bash

# Fanvue Bots Crontab Setup Script
# Replaces PM2 with proper crontab scheduling

echo "🚀 Setting up Fanvue Bots with Crontab..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get current directory
SCRIPT_DIR=$(pwd)
BOTS_DIR="$SCRIPT_DIR"

print_status "Setting up crontab for Fanvue bots in: $BOTS_DIR"

# Stop and remove PM2 processes
print_status "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete fanvue1-floortje-massdm fanvue2-floortje-posting fanvue3-fleur-massdm fanvue4-fleur-posting 2>/dev/null || true

# Create log directory
print_status "Creating log directory..."
mkdir -p logs

LOG_DIR="$BOTS_DIR/logs"
print_status "Using log directory: $LOG_DIR"

# Backup existing crontab
print_status "Backing up existing crontab..."
crontab -l > crontab_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "# No existing crontab" > crontab_backup_$(date +%Y%m%d_%H%M%S)

# Create new crontab
print_status "Creating crontab entries..."
cat > fanvue_crontab << EOF
# Fanvue Bots Crontab Schedule
# Generated on $(date)

# Fleur Posting Bot - 10 times per day
10 4,6,8,10,12,14,16,18,20,22 * * * cd $BOTS_DIR/fleur_posting && source venv/bin/activate && python main.py >> $LOG_DIR/fleur_posting.log 2>&1

# Floortje Posting Bot - 10 times per day (20 min after Fleur)
20 4,6,8,10,12,14,16,18,20,22 * * * cd $BOTS_DIR/floortje_posting && source venv/bin/activate && python main.py >> $LOG_DIR/floortje_posting.log 2>&1

# Fleur Mass DM Bot - 6 times per day
0 2,8,13,16,18,21 * * * cd $BOTS_DIR/fleur_massdm && source venv/bin/activate && python main.py >> $LOG_DIR/fleur_massdm.log 2>&1

# Floortje Mass DM Bot - 6 times per day
0 2,8,13,16,18,21 * * * cd $BOTS_DIR/floortje_massdm && source venv/bin/activate && python main.py >> $LOG_DIR/floortje_massdm.log 2>&1

# Daily cleanup at midnight - reset progress files
0 0 * * * find $BOTS_DIR -name "daily_progress.json" -exec rm {} \; >> $LOG_DIR/cleanup.log 2>&1

EOF

# Install new crontab
crontab fanvue_crontab

print_success "Crontab installed successfully!"
echo ""
print_status "📋 Crontab Schedule:"
echo "  Fleur Posting:    4:10, 6:10, 8:10, 10:10, 12:10, 14:10, 16:10, 18:10, 20:10, 22:10"
echo "  Floortje Posting: 4:20, 6:20, 8:20, 10:20, 12:20, 14:20, 16:20, 18:20, 20:20, 22:20"
echo "  Fleur Mass DM:    02:00, 08:00, 13:00, 16:00, 18:00, 21:00"
echo "  Floortje Mass DM: 02:00, 08:00, 13:00, 16:00, 18:00, 21:00"
echo "  Daily Reset:      00:00 (midnight cleanup)"
echo ""
print_status "📁 Log Files:"
echo "  Fleur Posting:    $LOG_DIR/fleur_posting.log"
echo "  Floortje Posting: $LOG_DIR/floortje_posting.log" 
echo "  Fleur Mass DM:    $LOG_DIR/fleur_massdm.log"
echo "  Floortje Mass DM: $LOG_DIR/floortje_massdm.log"
echo "  Cleanup:          $LOG_DIR/cleanup.log"
echo ""
print_status "🔧 Management Commands:"
echo "  crontab -l                           - View current crontab"
echo "  tail -f $LOG_DIR/fleur_posting.log   - Monitor Fleur posting"
echo "  tail -f $LOG_DIR/floortje_massdm.log - Monitor Floortje mass DM"
echo "  crontab -e                           - Edit crontab"
echo "  ./monitor_logs.sh                    - View all logs"
echo ""
print_warning "Important: Each bot creates exactly 1 post/DM per cron execution"
print_warning "Daily progress tracking ensures 10 unique posts and 6 unique DM phases per day"
echo ""
print_success "Fanvue bots are now ready for crontab operation! 🚀"
