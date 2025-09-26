#!/bin/bash

# Fanvue Bots Production VPS Setup Script
# This script sets up the 4 specific Fanvue bots (Fleur & Floortje) for production deployment

set -e

echo "🚀 Setting up Fanvue Bots Production Environment on VPS..."

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Get current directory
SCRIPT_DIR=$(pwd)
VPS_BOT_DIR="/home/$USER/fanvue_bots"

print_status "Setting up Fanvue Bots in: $VPS_BOT_DIR"

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python 3 and pip if not already installed
print_status "Installing Python 3 and pip..."
sudo apt install -y python3 python3-pip python3-venv

# Install Node.js and npm for PM2
print_status "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# Install system dependencies for Playwright
print_status "Installing system dependencies for Playwright..."
sudo apt install -y \
    libnss3 \
    libnspr4 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    libatspi2.0-0 \
    libgtk-3-0

# Create VPS bot directory
print_status "Creating bot directory..."
sudo mkdir -p "$VPS_BOT_DIR"
sudo chown $USER:$USER "$VPS_BOT_DIR"

# Create log directory
print_status "Creating log directory..."
sudo mkdir -p /var/log/fanvue
sudo chown $USER:$USER /var/log/fanvue

# Copy bot files to VPS directory
print_status "Copying bot files..."
cp -r "$SCRIPT_DIR"/* "$VPS_BOT_DIR/"

# Set up Python virtual environment
print_status "Setting up Python virtual environment..."
cd "$VPS_BOT_DIR"
python3 -m venv fanvue_bots_env
source fanvue_bots_env/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Install Playwright browsers
print_status "Installing Playwright browsers..."
playwright install chromium

# Update PM2 ecosystem config with correct paths
print_status "Updating PM2 ecosystem configuration..."
sed -i "s|/root/fanvue_bots|$VPS_BOT_DIR|g" fanvue_bots_ecosystem.config.js

# Set up PM2
print_status "Setting up PM2..."
chmod +x setup_pm2.sh
./setup_pm2.sh

# Create monitoring and management scripts
print_status "Creating monitoring scripts..."

# Create comprehensive monitoring script
cat > monitor_bots.sh << 'EOF'
#!/bin/bash

echo "🤖 Fanvue Bots Status Monitor"
echo "=============================="
echo ""

echo "PM2 Status:"
pm2 status
echo ""

echo "System Resources:"
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h
echo ""
echo "CPU Load:"
uptime
echo ""

echo "Recent Logs (last 10 lines each):"
echo "--------------------------------"

# Check each bot
for bot in fleur-posting fleur-massdm floortje-posting floortje-massdm; do
    echo "📊 $bot:"
    pm2 logs "$bot" --lines 10 --nostream 2>/dev/null || echo "  No logs available"
    echo ""
done

echo "Error Summary (last 24 hours):"
echo "------------------------------"
find /var/log/fanvue -name "*error*" -mtime -1 -exec grep -l "ERROR\|FAILED\|Exception" {} \; 2>/dev/null | while read logfile; do
    echo "🚨 Errors in: $logfile"
    tail -3 "$logfile" 2>/dev/null | sed 's/^/  /'
    echo ""
done

echo "Bot Schedule Status:"
echo "-------------------"
echo "Fleur Posting: 4:10, 6:10, 8:10, 10:10, 12:10, 14:10, 16:10, 18:10, 20:10, 22:10"
echo "Fleur Mass DM: 02:00, 08:00, 13:00, 16:00, 18:00, 21:00"
echo "Floortje Posting: 4:20, 6:20, 8:20, 10:20, 12:20, 14:20, 16:20, 18:20, 20:20, 22:20"
echo "Floortje Mass DM: 02:00, 08:00, 13:00, 16:00, 18:00, 21:00"
echo ""
echo "Next scheduled runs:"
echo "Current time: $(date)"
EOF

chmod +x monitor_bots.sh

# Create restart script
cat > restart_bots.sh << 'EOF'
#!/bin/bash

echo "🔄 Restarting all Fanvue bots..."

pm2 restart fleur-posting
pm2 restart fleur-massdm
pm2 restart floortje-posting
pm2 restart floortje-massdm

echo "✅ All bots restarted successfully"
pm2 status
EOF

chmod +x restart_bots.sh

# Create stop script
cat > stop_bots.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping all Fanvue bots..."

pm2 stop fleur-posting
pm2 stop fleur-massdm
pm2 stop floortje-posting
pm2 stop floortje-massdm

echo "✅ All bots stopped"
pm2 status
EOF

chmod +x stop_bots.sh

# Create start script
cat > start_bots.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting all Fanvue bots..."

# Activate virtual environment
source fanvue_bots_env/bin/activate

# Start all bots using PM2 ecosystem
pm2 start fanvue_bots_ecosystem.config.js

echo "✅ All bots started"
pm2 status
EOF

chmod +x start_bots.sh

# Create test script
cat > test_bots.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing Fanvue bots in test mode..."

# Activate virtual environment
source fanvue_bots_env/bin/activate

echo "Testing Fleur Posting Bot..."
cd fleur_posting
python3 main.py --test-mode
cd ..

echo "Testing Fleur Mass DM Bot..."
cd fleur_massdm
python3 main.py --test-mode
cd ..

echo "Testing Floortje Posting Bot..."
cd floortje_posting
python3 main.py --test-mode
cd ..

echo "Testing Floortje Mass DM Bot..."
cd floortje_massdm
python3 main.py --test-mode
cd ..

echo "✅ All tests completed"
EOF

chmod +x test_bots.sh

# Create cookie update script
cat > update_cookies.sh << 'EOF'
#!/bin/bash

echo "🍪 Fanvue Cookie Update Helper"
echo "=============================="
echo ""
echo "This script helps you update cookies for all bots."
echo ""

read -p "Enter path to new cookies file (or press Enter to skip): " cookie_file

if [ -n "$cookie_file" ] && [ -f "$cookie_file" ]; then
    echo "Updating cookies for all bots..."
    
    # Copy to each bot directory
    cp "$cookie_file" fleur_posting/fanvue-cookies.json
    cp "$cookie_file" fleur_massdm/fanvue-cookies.json
    cp "$cookie_file" floortje_posting/fanvue-cookies.json
    cp "$cookie_file" floortje_massdm/fanvue-cookies.json
    
    echo "✅ Cookies updated for all bots"
    echo "🔄 Restarting bots to use new cookies..."
    pm2 restart all
else
    echo "⚠️ No cookie file provided or file not found"
    echo ""
    echo "To update cookies manually:"
    echo "1. Export fresh cookies from browser after logging into Fanvue"
    echo "2. Save as 'fanvue-cookies.json'"
    echo "3. Copy to each bot directory:"
    echo "   - fleur_posting/fanvue-cookies.json"
    echo "   - fleur_massdm/fanvue-cookies.json"
    echo "   - floortje_posting/fanvue-cookies.json"
    echo "   - floortje_massdm/fanvue-cookies.json"
    echo "4. Restart bots: pm2 restart all"
fi
EOF

chmod +x update_cookies.sh

# Create content management script
cat > manage_content.sh << 'EOF'
#!/bin/bash

echo "📝 Fanvue Content Management Helper"
echo "==================================="
echo ""
echo "Choose an option:"
echo "1. Update posting captions"
echo "2. Update mass DM messages"
echo "3. Check content status"
echo "4. Backup content files"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "📝 Updating posting captions..."
        echo "Files to update:"
        echo "  - fleur_posting/fanvuepostingcaptions.xlsx"
        echo "  - floortje_posting/fanvuepostingcaptions.xlsx"
        echo ""
        echo "Please update these files with your captions and restart the bots."
        ;;
    2)
        echo "📨 Updating mass DM messages..."
        echo "Files to update for each bot:"
        echo "  - 2.xlsx (02:00 phase)"
        echo "  - 13.xlsx (08:00 phase)"
        echo "  - 17.xlsx (13:00 phase - bundle)"
        echo "  - 18.xlsx (18:00 phase - photo)"
        echo "  - 21.xlsx (16:00 phase)"
        echo "  - 22.xlsx (21:00 phase)"
        echo ""
        echo "Bot directories:"
        echo "  - fleur_massdm/"
        echo "  - floortje_massdm/"
        ;;
    3)
        echo "📊 Content Status:"
        echo ""
        for bot_dir in fleur_posting floortje_posting; do
            echo "$bot_dir captions:"
            if [ -f "$bot_dir/fanvuepostingcaptions.xlsx" ]; then
                echo "  ✅ Captions file exists"
                echo "  📊 Captions count: $(python3 -c "import pandas as pd; df=pd.read_excel('$bot_dir/fanvuepostingcaptions.xlsx'); print(len(df))" 2>/dev/null || echo "Unknown")"
            else
                echo "  ❌ Captions file missing"
            fi
            echo ""
        done
        
        for bot_dir in fleur_massdm floortje_massdm; do
            echo "$bot_dir messages:"
            for phase in 2 13 17 18 21 22; do
                if [ -f "$bot_dir/${phase}.xlsx" ]; then
                    echo "  ✅ Phase $phase: ${phase}.xlsx"
                else
                    echo "  ❌ Phase $phase: ${phase}.xlsx missing"
                fi
            done
            echo ""
        done
        ;;
    4)
        echo "💾 Backing up content files..."
        backup_dir="content_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        # Backup posting captions
        cp fleur_posting/fanvuepostingcaptions.xlsx "$backup_dir/" 2>/dev/null || echo "No fleur posting captions"
        cp floortje_posting/fanvuepostingcaptions.xlsx "$backup_dir/" 2>/dev/null || echo "No floortje posting captions"
        
        # Backup mass DM messages
        for bot_dir in fleur_massdm floortje_massdm; do
            mkdir -p "$backup_dir/$bot_dir"
            cp "$bot_dir"/*.xlsx "$backup_dir/$bot_dir/" 2>/dev/null || echo "No $bot_dir messages"
        done
        
        echo "✅ Backup created: $backup_dir"
        ;;
    *)
        echo "Invalid choice"
        ;;
esac
EOF

chmod +x manage_content.sh

# Set up log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/fanvue-bots > /dev/null << EOF
/var/log/fanvue/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create system health check script
cat > health_check.sh << 'EOF'
#!/bin/bash

echo "🏥 Fanvue Bots Health Check"
echo "============================"
echo ""

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status
echo ""

# Check disk space
echo "💾 Disk Space:"
df -h | grep -E "(/$|/home|/var)"
echo ""

# Check memory usage
echo "🧠 Memory Usage:"
free -h
echo ""

# Check for errors in logs
echo "🚨 Recent Errors (last hour):"
find /var/log/fanvue -name "*error*" -mmin -60 -exec grep -l "ERROR\|FAILED\|Exception" {} \; 2>/dev/null | while read logfile; do
    echo "Error in: $logfile"
    tail -2 "$logfile" 2>/dev/null | sed 's/^/  /'
    echo ""
done

# Check bot file locks
echo "🔒 File Locks:"
for bot_dir in fleur_posting fleur_massdm floortje_posting floortje_massdm; do
    if [ -f "$bot_dir/.lock" ]; then
        echo "  ⚠️ $bot_dir has a lock file (bot may be running or crashed)"
    else
        echo "  ✅ $bot_dir no lock file"
    fi
done
echo ""

# Check cron jobs
echo "⏰ Cron Jobs:"
crontab -l 2>/dev/null | grep -E "(fanvue|restart)" || echo "  No fanvue cron jobs found"
echo ""

# Check network connectivity
echo "🌐 Network Check:"
if ping -c 1 fanvue.com >/dev/null 2>&1; then
    echo "  ✅ Fanvue.com is reachable"
else
    echo "  ❌ Cannot reach fanvue.com"
fi
EOF

chmod +x health_check.sh

print_success "VPS setup completed successfully!"
echo ""
print_status "🎯 What's been set up:"
echo "✅ Python environment with all dependencies"
echo "✅ PM2 process management for all 4 bots"
echo "✅ Log rotation and monitoring"
echo "✅ Management scripts for easy operation"
echo "✅ Content and cookie management tools"
echo "✅ Health check and monitoring"
echo ""
print_status "📋 Next steps:"
echo "1. Update authentication cookies: ./update_cookies.sh"
echo "2. Add content files (captions and messages)"
echo "3. Test the bots: ./test_bots.sh"
echo "4. Start production: ./start_bots.sh"
echo "5. Monitor: ./monitor_bots.sh"
echo ""
print_status "🛠 Available commands:"
echo "  ./start_bots.sh        - Start all bots"
echo "  ./stop_bots.sh         - Stop all bots"
echo "  ./restart_bots.sh      - Restart all bots"
echo "  ./monitor_bots.sh      - Monitor bot status and logs"
echo "  ./test_bots.sh         - Test all bots"
echo "  ./update_cookies.sh    - Update authentication cookies"
echo "  ./manage_content.sh    - Manage content files"
echo "  ./health_check.sh      - System health check"
echo ""
print_status "📁 Bot directories:"
echo "  $VPS_BOT_DIR/fleur_posting/"
echo "  $VPS_BOT_DIR/fleur_massdm/"
echo "  $VPS_BOT_DIR/floortje_posting/"
echo "  $VPS_BOT_DIR/floortje_massdm/"
echo ""
print_status "⏰ Bot schedules:"
echo "  Fleur Posting: 4:10, 6:10, 8:10, 10:10, 12:10, 14:10, 16:10, 18:10, 20:10, 22:10"
echo "  Fleur Mass DM: 02:00, 08:00, 13:00, 16:00, 18:00, 21:00"
echo "  Floortje Posting: 4:20, 6:20, 8:20, 10:20, 12:20, 14:20, 16:20, 18:20, 20:20, 22:20"
echo "  Floortje Mass DM: 02:00, 08:00, 13:00, 16:00, 18:00, 21:00"
echo ""
print_status "📁 Log files: /var/log/fanvue/"
echo "🔄 Daily restart: 23:30 (1 hour after last bot activity)"
echo ""
print_warning "Important: Update cookies and content files before starting production!"
echo ""
print_success "Your Fanvue bots are ready for production! 🚀"

