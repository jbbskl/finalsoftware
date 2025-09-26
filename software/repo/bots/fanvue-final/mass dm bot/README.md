# Fanvue Mass DM Bot (Python + Playwright)

## Setup
```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

## Run
```bash
# Headed for debugging:
python fanvue_mass_dm.py --headed

# Headless with default config:
python fanvue_mass_dm.py

# Single job:
python fanvue_mass_dm.py --job paid_media_core
```

## Notes:
- Bot logs in by loading cookies from `cookie.json`. Export cookies for fanvue.com (domain-scoped) and place them there.
- Audience picker:
  * `send_to: ["All contacts"]` is exclusive — don't combine with others.
  * `exclude` supports any of the other lists (no "All contacts" there).
- Media:
  * Option A: `folder_filter` + `random_n` (infinite scroll included).
  * Option B: `search_name` + `search_pick_n` to select specific cards.
- Price:
  * Only applied if media attached and `price` between 3 and 500.
