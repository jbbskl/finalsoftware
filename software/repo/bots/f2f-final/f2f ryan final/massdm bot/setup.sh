#!/bin/bash

# F2F Mass DM Bot Setup Script
# This script installs dependencies and sets up the browser

echo "🚀 Setting up F2F Mass DM Bot..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed. Please install pip3 first."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
python3 -m playwright install chromium

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p logs/screens
mkdir -p dm_text
mkdir -p dm_archive
mkdir -p cookies

# Create example files
echo "📝 Creating example files..."

# Create example Excel files
cat > dm_text/global.xlsx << 'EOF'
# This is a placeholder - replace with actual Excel file
# Put your DM messages in column A of Sheet1
EOF

cat > dm_text/amalia_msgs.xlsx << 'EOF'
# This is a placeholder - replace with actual Excel file
# Put your DM messages in column A of Sheet1
EOF

cat > dm_text/amalia_tip_copy.xlsx << 'EOF'
# This is a placeholder - replace with actual Excel file
# Put your tip messages in column A of Sheet1
EOF

cat > dm_text/amalia_media_captions.xlsx << 'EOF'
# This is a placeholder - replace with actual Excel file
# Put your media captions in column A of Sheet1
EOF

cat > dm_text/sophie_welcome.xlsx << 'EOF'
# This is a placeholder - replace with actual Excel file
# Put your welcome messages in column A of Sheet1
EOF

cat > dm_text/sophie_premium.xlsx << 'EOF'
# This is a placeholder - replace with actual Excel file
# Put your premium messages in column A of Sheet1
EOF

# Create example cookies file
cat > cookies/f2f_cookies.json << 'EOF'
[]
EOF

# Create run script
cat > run_bot.sh << 'EOF'
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
if [ ! -f "cookies/f2f_cookies.json" ]; then
    echo "⚠️  No cookies file found at cookies/f2f_cookies.json"
    echo "The bot will run unauthenticated. Please add your cookies for full functionality."
fi

# Run the bot
python3 dm_main.py
EOF

chmod +x run_bot.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add your F2F cookies to cookies/f2f_cookies.json"
echo "2. Configure your models and campaigns in dm_config.yaml"
echo "3. Add your DM messages to Excel files in dm_text/"
echo "4. Run the bot with: ./run_bot.sh"
echo ""
echo "📚 For detailed instructions, see README.md"
