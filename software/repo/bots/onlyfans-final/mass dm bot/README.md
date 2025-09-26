# OnlyFans Mass DM Bot v1.0

🚀 **Production-Ready** automated mass DM bot for OnlyFans using Python and Playwright.

> ⚠️ **Important**: This bot sends real messages to real users. Always test with `test_mode: true` first!

## Features

- **Multi-Model Support**: Configure multiple OnlyFans accounts
- **Campaign Types**: Text-only and text+media campaigns
- **Audience Targeting**: Fans, Recent subscribers, Muted, Following with exclude options
- **Caption Management**: Support for Excel, JSON, and static captions with archiving
- **Media Integration**: Select media from Vault with folder search
- **Pricing**: Optional message pricing (minimum $3)
- **Stealth Mode**: Browser reopening between campaigns for better security

## Setup

1. **Install Dependencies**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Authentication Setup**:
   - The bot uses persistent browser sessions (same as the posting bot)
   - Login once manually by running in non-headless mode or use the posting bot first
   - Browser session data is automatically saved and reused
   - Both posting bot and mass DM bot can share the same browser session

3. **Prepare Captions**:
   - Add your captions to Excel files or JSON files in the `captions/` directory
   - See `captions/example_captions.json` for format reference

4. **Configure Settings**:
   - Edit `of_dm_config.yaml` to match your models and campaigns
   - Set audience targeting, caption sources, media folders, etc.
   - Configure `browser_data_dir` if you want separate sessions per model

## Configuration

### Campaign Types

- **text_only**: Audience → Caption → Send
- **text_media**: Audience → Caption → Media → Price (optional) → Send

### Audience Options

- **Fans**: All fans
- **Recent**: Recent subscribers (with date range)
- **Muted**: Muted users
- **Following**: Users you follow
- **Exclude**: Same options but for exclusion

### Caption Sources

- **Excel**: Read from Excel files (removes used captions)
- **JSON**: Read from JSON arrays (removes used captions)  
- **Static**: Predefined list in config

## Usage

### Production Mode (Real Messages)
```bash
python of_dm_main.py
```

### Test Mode (Safe Testing)
```bash
# Option 1: Set in config file
# test_mode: true

# Option 2: Create test config
cp of_dm_config.yaml test_dm_config.yaml
# Edit test_dm_config.yaml: set test_mode: true, headless: false
OF_DM_CONFIG=test_dm_config.yaml python of_dm_main.py
```

### Debug Mode (Watch in Browser)
```bash
# Edit of_dm_config.yaml: set headless: false
python of_dm_main.py
```

The bot will read the configuration and run all campaigns for all models sequentially.

## File Structure

```
mass dm bot/
├── of_dm_main.py          # Main bot script
├── of_dm_config.yaml      # Configuration file
├── requirements.txt       # Python dependencies
├── setup.sh              # Setup script
├── browser_data/         # Browser session data (auto-created)
├── captions/             # Caption files directory
└── README.md            # This file
```

## Important Notes

- OnlyFans minimum message price is $3
- Recent date selection only works within the current month
- Browser can be reopened between campaigns for better stealth
- All used captions are automatically archived
- Selectors are annotated with comments for easy updates if OnlyFans changes their UI

## Safety & Testing

⚠️ **ALWAYS TEST FIRST**: Set `test_mode: true` in your config before running with real data.

### Test Mode Features:
- ✅ Composes complete messages (audience, caption, media, price)
- ✅ Shows all bot actions in real-time
- ✅ **Skips actual sending** - no messages sent to users
- ✅ Perfect for validating campaigns and debugging

### Production Checklist:
1. ✅ Test all campaigns in test mode first
2. ✅ Verify audience targeting is correct
3. ✅ Check caption files have content
4. ✅ Confirm media folders exist in vault
5. ✅ Set `test_mode: false` for production
6. ✅ Monitor bot execution logs

## Troubleshooting

If selectors stop working due to OnlyFans UI changes, look for the commented selectors in the code:
- `# [BTN]` for buttons
- `# [FIELD]` for input fields  
- `# [STEP]` for navigation steps

Update the selector while keeping the comment for future reference.
