#!/bin/bash

# Fanvue Bot Client Setup Script
# This script creates a new client setup using the template

set -e

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

# Check if client name is provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 <client_name>"
    print_status "Example: $0 sarah"
    print_status "This will create 'sarah_fanvue' directory with mass DM and posting bots"
    exit 1
fi

CLIENT_NAME="$1"
CLIENT_DIR="${CLIENT_NAME}_fanvue"

print_status "Setting up Fanvue bots for client: $CLIENT_NAME"
print_status "Client directory: $CLIENT_DIR"

# Check if directory already exists
if [ -d "$CLIENT_DIR" ]; then
    print_error "Directory $CLIENT_DIR already exists!"
    print_status "Please choose a different client name or remove the existing directory"
    exit 1
fi

# Create client directory
print_status "Creating client directory..."
mkdir -p "$CLIENT_DIR"

# Copy mass DM bot template
print_status "Setting up mass DM bot..."
cp -r "mass dm bot" "$CLIENT_DIR/massdm"

# Copy posting bot template
print_status "Setting up posting bot..."
cp -r "posting bot" "$CLIENT_DIR/posting"

# Create client-specific configuration files
print_status "Creating client-specific configurations..."

# Mass DM config
cat > "$CLIENT_DIR/massdm/config.yaml" << EOF
# ${CLIENT_NAME^} Fanvue Mass DM Bot Configuration

runtime:
  headless: true
  base_url: https://www.fanvue.com
  cookie_path: ./cookies.json
  viewport_width: 1280
  viewport_height: 800
  default_timeout_ms: 25000

jobs:
  # Morning greeting to all contacts
  - name: morning_greeting
    mode: text
    caption: "Good morning! ☀️ New content coming soon..."
    send_to: ["All contacts"]
    exclude: []

  # Premium content to subscribers
  - name: premium_content_drop
    mode: media
    send_to: ["Subscribers"]
    exclude: ["Expired subscribers"]
    media:
      folder_filter: "premium content"
      random_n: 2
    price: 9.99

  # Teaser to followers
  - name: teaser_followers
    mode: text_media
    caption: "Sneak peek 👀💋"
    send_to: ["Followers"]
    exclude: []
    media:
      folder_filter: "teaser content"
      random_n: 1
    price: null

  # Excel-based captions (if using captions.xlsx)
  - name: excel_captions
    mode: text
    send_to: ["Subscribers"]
    exclude: []
    caption_source:
      path: ./captions.xlsx
      sheet: Sheet1
      column: caption
      strategy: random
      drop_duplicates: true
      strip: true
      min_len: 1
EOF

# Posting config
cat > "$CLIENT_DIR/posting/config.yaml" << EOF
# ${CLIENT_NAME^} Fanvue Posting Bot Configuration

runtime:
  headless: true
  base_url: https://www.fanvue.com
  cookies_file: ./cookies.json
  viewport_width: 1280
  viewport_height: 800
  default_timeout_ms: 25000

defaults:
  audience: subscribers
  post_type: text_media
  caption: ""
  folder_filter: null
  price: null

jobs:
  # Daily content posts
  - name: daily_post_morning
    post_type: text_media
    audience: subscribers
    caption: "Good morning! Starting the day with some amazing content ☀️"
    folder_filter: "daily content"
    price: null

  - name: daily_post_evening
    post_type: media
    audience: subscribers
    folder_filter: "evening content"
    select_first_n: 1
    price: 7.99

  # Premium content
  - name: premium_content
    post_type: media
    audience: subscribers
    folder_filter: "premium content"
    select_first_n: 2
    price: 12.99

  # Teaser for followers
  - name: teaser_followers
    post_type: text_media
    audience: followers_and_subscribers
    caption: "Sneak peek of what's coming! 👀"
    folder_filter: "teaser content"
    price: null
EOF

# Create README for the client
cat > "$CLIENT_DIR/README.md" << EOF
# ${CLIENT_NAME^} Fanvue Bots

This directory contains the Fanvue bots for ${CLIENT_NAME}.

## Structure
- \`massdm/\` - Mass DM bot for sending scheduled DMs
- \`posting/\` - Posting bot for creating scheduled posts

## Setup

### 1. Add Authentication Cookies
Export fresh cookies from your browser after logging into Fanvue and place them in:
- \`massdm/cookies.json\`
- \`posting/cookies.json\`

### 2. Add Content Files (Optional)
- Add \`captions.xlsx\` files if using Excel-based captions
- Ensure media folders exist in your Fanvue vault

### 3. Test Configuration
\`\`\`bash
# Test mass DM bot
cd massdm
python fanvue_mass_dm.py --test-mode --headed

# Test posting bot
cd ../posting
python fanvue_poster.py --test-mode --headed
\`\`\`

### 4. Run in Production
\`\`\`bash
# Run mass DM bot
cd massdm
python fanvue_mass_dm.py

# Run posting bot
cd ../posting
python fanvue_poster.py
\`\`\`

## Configuration
Edit \`config.yaml\` files in each directory to customize:
- Posting times and schedules
- Content types and filters
- Audience targeting
- Pricing settings

## Monitoring
Use PM2 to monitor and manage the bots:
\`\`\`bash
pm2 start ${CLIENT_NAME}-massdm
pm2 start ${CLIENT_NAME}-posting
pm2 status
pm2 logs ${CLIENT_NAME}-massdm
\`\`\`
EOF

# Create sample captions Excel file
print_status "Creating sample captions file..."
cat > "$CLIENT_DIR/massdm/sample_captions.csv" << EOF
caption
"Good morning! New content coming soon ☀️"
"Check out this amazing new content! 🔥"
"Don't miss out on today's special content! 💋"
"Fresh content just dropped! 👀"
"Something exciting is coming your way! ✨"
"New content alert! 📢"
"Get ready for some amazing content! 🎉"
"Today's content is going to blow your mind! 💥"
EOF

# Convert CSV to Excel if pandas is available
if command -v python3 &> /dev/null; then
    python3 -c "
import pandas as pd
try:
    df = pd.read_csv('$CLIENT_DIR/massdm/sample_captions.csv')
    df.to_excel('$CLIENT_DIR/massdm/captions.xlsx', index=False)
    print('✅ Created sample captions.xlsx file')
except ImportError:
    print('⚠️ pandas not available, keeping CSV format')
" 2>/dev/null || print_warning "pandas not available, keeping CSV format"
fi

# Create test script for the client
cat > "$CLIENT_DIR/test_client.sh" << EOF
#!/bin/bash

echo "🧪 Testing ${CLIENT_NAME^} Fanvue Bots"
echo "=================================="

echo "Testing Mass DM Bot..."
cd massdm
python fanvue_mass_dm.py --test-mode --headed
cd ..

echo "Testing Posting Bot..."
cd posting
python fanvue_poster.py --test-mode --headed
cd ..

echo "✅ Testing completed!"
EOF

chmod +x "$CLIENT_DIR/test_client.sh"

# Create PM2 ecosystem entry
print_status "Creating PM2 ecosystem entries..."
cat > "$CLIENT_DIR/pm2_entries.txt" << EOF
# Add these entries to your fanvue_bots_ecosystem.config.js:

{
  name: '${CLIENT_NAME}-massdm',
  script: '${CLIENT_DIR}/massdm/fanvue_mass_dm.py',
  interpreter: 'python3',
  args: '',
  cwd: '$(pwd)',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
  error_file: '/var/log/fanvue/${CLIENT_NAME}-massdm-error.log',
  out_file: '/var/log/fanvue/${CLIENT_NAME}-massdm-out.log',
  log_file: '/var/log/fanvue/${CLIENT_NAME}-massdm-combined.log',
  cron_restart: '0 2 * * *'
},
{
  name: '${CLIENT_NAME}-posting',
  script: '${CLIENT_DIR}/posting/fanvue_poster.py',
  interpreter: 'python3',
  args: '',
  cwd: '$(pwd)',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
  error_file: '/var/log/fanvue/${CLIENT_NAME}-posting-error.log',
  out_file: '/var/log/fanvue/${CLIENT_NAME}-posting-out.log',
  log_file: '/var/log/fanvue/${CLIENT_NAME}-posting-combined.log',
  cron_restart: '0 2 * * *'
}
EOF

print_success "Client setup completed successfully!"
echo ""
print_status "Next steps for ${CLIENT_NAME^}:"
echo "1. Add authentication cookies to:"
echo "   - $CLIENT_DIR/massdm/cookies.json"
echo "   - $CLIENT_DIR/posting/cookies.json"
echo ""
echo "2. Test the configuration:"
echo "   cd $CLIENT_DIR && ./test_client.sh"
echo ""
echo "3. Customize the config.yaml files in each directory"
echo ""
echo "4. Add PM2 entries from $CLIENT_DIR/pm2_entries.txt to your ecosystem config"
echo ""
print_warning "Important: Update cookies.json files with fresh authentication cookies before running!"
echo ""
print_status "Client directory structure:"
echo "$CLIENT_DIR/"
echo "├── massdm/"
echo "│   ├── fanvue_mass_dm.py"
echo "│   ├── config.yaml"
echo "│   ├── cookies.json (ADD YOUR COOKIES HERE)"
echo "│   └── captions.xlsx"
echo "├── posting/"
echo "│   ├── fanvue_poster.py"
echo "│   ├── config.yaml"
echo "│   └── cookies.json (ADD YOUR COOKIES HERE)"
echo "├── README.md"
echo "├── test_client.sh"
echo "└── pm2_entries.txt"
