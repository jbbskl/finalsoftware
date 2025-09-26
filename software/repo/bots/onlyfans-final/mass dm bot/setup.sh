#!/bin/bash

echo "Setting up OnlyFans Mass DM Bot..."

# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browser
playwright install chromium

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Login to OnlyFans by running the posting bot first or run this bot in non-headless mode"
echo "2. Add your captions to the captions/ directory (Excel/JSON files)"
echo "3. Configure of_dm_config.yaml with your model settings"
echo "4. Run with: python of_dm_main.py"
echo ""
echo "Note: Browser session data will be shared between posting bot and mass DM bot"
