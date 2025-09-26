# F2F Mass DM Bot

A comprehensive async Playwright-based bot for automating mass direct messages on F2F.com with advanced scheduling, message management, and media handling capabilities.

## Features

- 🕒 **Per-campaign scheduling** - Run campaigns at specific local times (HH:MM format)
- 📝 **Message management** - Excel-based message system with archive/replenish workflow
- 🎯 **Multiple audiences** - Target followers, fans, or both
- 💰 **Tip requests** - Send tip requests with custom amounts
- 📸 **Media campaigns** - Send photos/videos with custom pricing (free/paid)
- 🗂️ **Smart media selection** - Automatic folder detection and random media selection
- ⏱️ **Pacing controls** - Configurable delays between models and campaigns
- 🔄 **Message archiving** - Track used messages with JSON/Excel archive options
- 🌍 **Timezone support** - Run campaigns in your local timezone
- 📊 **Comprehensive logging** - Detailed logs with screenshot capture on errors

## Quick Start

### 1. Setup

```bash
# Run the setup script
./setup.sh
```

This will:
- Install Python dependencies
- Install Playwright browsers
- Create necessary directories
- Generate example files

### 2. Configuration

Edit `dm_config.yaml` to configure your models and campaigns:

```yaml
models:
  - name: "your.model.name"
    campaigns:
      - name: "welcome_message"
        schedule: { at: "10:00" }  # Run at 10:00 AM local time
        audience: "followers"
        type: "text"
        message:
          excel:
            path: "./dm_text/welcome_messages.xlsx"
            column: "A"
            pick_strategy: "sequential"
```

### 3. Add Your Messages

Create Excel files in the `dm_text/` directory with your DM messages in column A.

### 4. Add Cookies

Export your F2F cookies and save them to `cookies/f2f_cookies.json`.

### 5. Run the Bot

```bash
./run_bot.sh
```

## Configuration Guide

### Basic Structure

```yaml
headless: true                    # Run browser in headless mode
timezone: "Europe/Amsterdam"     # Your local timezone
cookies_path: "./cookies/f2f_cookies.json"

models:
  - name: "model.name"
    campaigns: [...]
```

### Campaign Types

#### 1. Text Campaigns
```yaml
- name: "text_campaign"
  audience: "followers"          # followers | fans | both
  type: "text"
  message:
    excel:
      path: "./dm_text/messages.xlsx"
      column: "A"
      pick_strategy: "sequential"  # sequential | random
```

#### 2. Tip Campaigns
```yaml
- name: "tip_campaign"
  audience: "fans"
  type: "tip"
  tip:
    amount: 12.00                # Min: 5, Max: 2500
  message:
    excel:
      path: "./dm_text/tip_messages.xlsx"
      pick_strategy: "random"
```

#### 3. Media Campaigns
```yaml
- name: "media_campaign"
  audience: "both"
  type: "media"
  message:
    excel:
      path: "./dm_text/media_captions.xlsx"
  folder_filter:
    name_contains: "lingerie"    # Folder name to search for
  media:
    count: 4                     # Number of media items
    type: "photo"                # photo | video
  paid:
    enabled: true
    price: 9.99                  # Min: 5, Max: 2500
```

### Scheduling

Schedule campaigns to run at specific times:

```yaml
- name: "scheduled_campaign"
  schedule: { at: "14:30" }     # Run at 2:30 PM local time
  audience: "followers"
  type: "text"
```

### Pacing

Control delays between models and campaigns:

```yaml
pace:
  between_models:
    mode: "fixed"                # fixed | random | none
    fixed_seconds: 120
  between_campaigns:
    mode: "random"
    random_min_seconds: 60
    random_max_seconds: 180
```

### Message Management

#### Excel Source Files
- Put your DM messages in Excel files
- Messages are automatically removed after use
- Support for sequential or random selection

#### Archive System
```yaml
message_archive:
  type: "json"                   # json | excel
  json_path: "./dm_archive/used_global.json"
  replenish_when_empty: true     # Refill from archive when empty
  after_replenish_clear_archive: false
```

#### Replenishment
When source Excel is empty, messages can be automatically replenished from the archive.

### Nested Folders

For models with nested media folders:

```yaml
models:
  - name: "model.with.nested.folders"
    nested_folders:
      parent: "software"         # Parent folder name
    campaigns:
      - name: "media_campaign"
        folder_filter:
          name_contains: "subfolder"
```

## Directory Structure

```
massdm bot/
├── dm_main.py              # Main bot script
├── dm_config.yaml          # Configuration file
├── requirements.txt        # Python dependencies
├── setup.sh               # Setup script
├── run_bot.sh             # Bot runner script
├── README.md              # This file
├── logs/
│   └── screens/           # Error screenshots
├── dm_text/               # Excel files with messages
├── dm_archive/            # Used message archives
└── cookies/               # Browser cookies
    └── f2f_cookies.json
```

## Advanced Features

### Per-Model Overrides

Override global settings for specific models:

```yaml
models:
  - name: "special.model"
    pace:
      between_campaigns:
        mode: "fixed"
        fixed_seconds: 30
    message_archive:
      type: "json"
      json_path: "./dm_archive/special_model_used.json"
```

### Per-Campaign Overrides

Override model settings for specific campaigns:

```yaml
campaigns:
  - name: "special_campaign"
    message:
      excel:
        path: "./dm_text/special_messages.xlsx"
        pick_strategy: "random"
    message_archive:
      replenish_when_empty: false
```

### Inline Messages

For simple campaigns, use inline messages instead of Excel:

```yaml
- name: "quick_campaign"
  message:
    inline:
      - "Hey babe! 💕"
      - "How's your day? 😘"
      - "Miss you! ❤️"
```

## Error Handling

- Automatic screenshot capture on errors
- Failed messages are restored to source Excel
- Comprehensive logging with timestamps
- Graceful handling of missing elements

## Logs

The bot creates detailed logs showing:
- Campaign progress
- Timing information
- Error details with screenshots
- Message management actions

Screenshots are saved to `logs/screens/` with descriptive filenames.

## Troubleshooting

### Common Issues

1. **"No cookies found"** - Add your F2F cookies to `cookies/f2f_cookies.json`
2. **"Folder not found"** - Check folder names in your F2F account
3. **"Source Excel is empty"** - Add messages to your Excel files
4. **"Schedule time already passed"** - Check timezone and schedule times

### Debug Mode

Run with `headless: false` to see the browser in action:

```yaml
headless: false
```

### Cookie Export

To get your F2F cookies:
1. Login to F2F in your browser
2. Open Developer Tools (F12)
3. Go to Application/Storage > Cookies
4. Export cookies for `f2f.com`
5. Save as JSON in `cookies/f2f_cookies.json`

## Support

For issues or questions:
1. Check the logs in `logs/screens/`
2. Verify your configuration in `dm_config.yaml`
3. Ensure your Excel files have messages in column A
4. Check that your cookies are valid and not expired

## License

This bot is for educational and personal use only. Please respect F2F's terms of service and use responsibly.
