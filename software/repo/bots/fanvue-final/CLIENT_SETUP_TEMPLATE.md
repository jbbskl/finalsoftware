# Fanvue Bot Client Setup Template

This template helps you quickly set up new Fanvue bot clients using the generalized scripts.

## 🚀 Quick Setup for New Client

### 1. Create Client Directory
```bash
mkdir "client_name_fanvue"
cd "client_name_fanvue"
```

### 2. Copy Template Files
```bash
# Copy mass DM bot template
cp -r "../mass dm bot" ./massdm
cp -r "../posting bot" ./posting
```

### 3. Configure Client Settings

#### Mass DM Bot Configuration (`massdm/config.yaml`)
```yaml
runtime:
  headless: true
  base_url: https://www.fanvue.com
  cookie_path: ./cookies.json
  viewport_width: 1280
  viewport_height: 800
  default_timeout_ms: 25000

# Client-specific jobs
jobs:
  - name: morning_greeting
    mode: text
    caption: "Good morning! ☀️ New content coming soon..."
    send_to: ["All contacts"]
    exclude: []

  - name: paid_content_drop
    mode: media
    send_to: ["Subscribers"]
    exclude: ["Expired subscribers"]
    media:
      folder_filter: "premium content"
      random_n: 2
    price: 9.99

  # Add more jobs as needed...
```

#### Posting Bot Configuration (`posting/config.yaml`)
```yaml
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
  - name: daily_post_1
    post_type: text_media
    audience: subscribers
    caption: "Daily content drop! 🔥"
    folder_filter: "daily content"
    price: null

  - name: premium_post
    post_type: media
    audience: subscribers
    folder_filter: "premium content"
    select_first_n: 1
    price: 12.99

  # Add more jobs as needed...
```

### 4. Add Authentication Cookies
- Export fresh cookies from browser after logging into Fanvue
- Place in `massdm/cookies.json` and `posting/cookies.json`

### 5. Add Content Files
- **Mass DM**: Add caption Excel files (e.g., `captions.xlsx`)
- **Posting**: Add caption Excel files if using Excel-based captions

### 6. Test Configuration
```bash
# Test mass DM bot
cd massdm
python fanvue_mass_dm.py --test-mode --headed

# Test posting bot
cd ../posting
python fanvue_poster.py --test-mode --headed
```

### 7. Add to PM2 Ecosystem
Add the client to your PM2 ecosystem configuration:

```javascript
// Add to fanvue_bots_ecosystem.config.js
{
  name: 'client_name-massdm',
  script: 'client_name_fanvue/massdm/fanvue_mass_dm.py',
  interpreter: 'python3',
  args: '',
  cwd: '/path/to/fanvue/final',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
  error_file: '/var/log/fanvue/client_name-massdm-error.log',
  out_file: '/var/log/fanvue/client_name-massdm-out.log',
  log_file: '/var/log/fanvue/client_name-massdm-combined.log',
  cron_restart: '0 2 * * *'
},
{
  name: 'client_name-posting',
  script: 'client_name_fanvue/posting/fanvue_poster.py',
  interpreter: 'python3',
  args: '',
  cwd: '/path/to/fanvue/final',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
  error_file: '/var/log/fanvue/client_name-posting-error.log',
  out_file: '/var/log/fanvue/client_name-posting-out.log',
  log_file: '/var/log/fanvue/client_name-posting-combined.log',
  cron_restart: '0 2 * * *'
}
```

## 📋 Configuration Options

### Mass DM Bot Features
- **Text-only messages**: Simple text DMs
- **Media messages**: Send photos/videos with optional pricing
- **Text+Media**: Combine text and media
- **Excel captions**: Pull captions from Excel files
- **Audience targeting**: Send to specific user groups
- **Exclusion lists**: Exclude certain user groups

### Posting Bot Features
- **Text posts**: Simple text posts
- **Media posts**: Photo/video posts with pricing
- **Text+Media**: Combine text and media
- **Audience control**: Subscribers vs Followers+Subscribers
- **Vault filtering**: Filter content by folder
- **Excel captions**: Pull captions from Excel files

### Available Audience Types
- `subscribers` - Subscribers only
- `followers_and_subscribers` - Both followers and subscribers
- `All contacts` - Everyone (mass DM only)
- `Online` - Currently online users (mass DM only)
- `Followers` - Non-paying followers (mass DM only)
- `Non-renewing` - Subscribers who won't renew (mass DM only)
- `Auto-renewing` - Subscribers with auto-renewal (mass DM only)
- `Expired subscribers` - Past subscribers (mass DM only)
- `Free trial subscribers` - Trial users (mass DM only)
- `Spent more than $50` - High-value users (mass DM only)

## 🔧 Advanced Configuration

### Scheduling
Both bots support continuous mode with automatic scheduling:

```yaml
scheduling:
  continuous_mode: true
  daily_reset_hour: 1
  check_interval_minutes: 1
  scheduled_posts:
    "09:00": "morning_post"
    "15:00": "afternoon_post"
    "21:00": "evening_post"
```

### Media Selection
```yaml
media:
  folder_filter: "specific folder name"  # Filter by vault folder
  random_n: 2                           # Pick N random items
  search_name: "IMG_1234"               # Search for specific media
  search_pick_n: 1                      # Pick N matching items
```

### Excel Captions
```yaml
caption_source:
  path: ./captions.xlsx
  sheet: Sheet1
  column: caption
  strategy: random  # or sequential
  drop_duplicates: true
  strip: true
  min_len: 1
```

## 🚨 Common Issues

### Authentication Errors
- Update `cookies.json` with fresh cookies
- Ensure cookies are exported for `fanvue.com` domain
- Check internet connection

### Media Not Found
- Verify folder names match exactly
- Check media search terms
- Ensure media exists in vault

### Caption Issues
- Verify Excel file format
- Check column names match configuration
- Ensure captions are in the correct sheet

## 📞 Support

For issues:
1. Check logs: `pm2 logs [bot-name]`
2. Test in headed mode: `--headed --test-mode`
3. Verify configuration syntax
4. Check authentication cookies
