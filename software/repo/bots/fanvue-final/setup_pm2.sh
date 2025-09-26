#!/bin/bash
# Fanvue Bots PM2 Setup Script

echo "🚀 Setting up Fanvue Bots with PM2..."

# Create log directory
sudo mkdir -p /var/log/fanvue
sudo chown $USER:$USER /var/log/fanvue

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
playwright install chromium

# Stop any existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop all
pm2 delete all

# Start all bots with PM2
echo "🚀 Starting Fanvue bots with PM2..."
pm2 start fanvue_bots_ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Setup daily restart cron job
echo "⏰ Setting up daily restart cron job..."
# Restart at 23:30 daily (1 hour after last bot activity)
(crontab -l 2>/dev/null; echo "30 23 * * * /root/fanvue_bots/daily_restart_cron.sh >> /var/log/fanvue/daily_restart.log 2>&1") | crontab -

# Make restart script executable
chmod +x daily_restart_cron.sh

echo "✅ PM2 setup complete!"
echo ""
echo "📋 PM2 Commands:"
echo "  pm2 status          - Check bot status"
echo "  pm2 logs            - View all logs"
echo "  pm2 logs fleur-posting - View specific bot logs"
echo "  pm2 restart all     - Restart all bots"
echo "  pm2 stop all        - Stop all bots"
echo "  pm2 monit           - Monitor bots in real-time"
echo ""
echo "📁 Log files location: /var/log/fanvue/"
echo "📁 Bot directories: /root/fanvue_bots/"
echo ""
echo "⏰ Bot schedules:"
echo "  Fleur Posting: 4:10, 6:10, 8:10, 10:10, 12:10, 14:10, 16:10, 18:10, 20:10, 22:10"
echo "  Fleur Mass DM: 02:00, 08:00, 13:00, 16:00, 18:00, 21:00"
echo "  Floortje Posting: 4:20, 6:20, 8:20, 10:20, 12:20, 14:20, 16:20, 18:20, 20:20, 22:20"
echo "  Floortje Mass DM: 02:00, 08:00, 13:00, 16:00, 18:00, 21:00"
echo ""
echo "🔄 Daily restart: 23:30 (1 hour after last bot activity)"
echo "📁 Daily restart log: /var/log/fanvue/daily_restart.log"
