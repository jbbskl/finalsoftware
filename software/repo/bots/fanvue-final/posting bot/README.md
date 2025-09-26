# Fanvue PostingBot (Python + Playwright)

## 0) Install
```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

## 1) Authentication Setup
The bot uses `cookies.json` for authentication. Fresh cookies are already included.
To update cookies in the future:
1. Login to [Fanvue](https://www.fanvue.com) in your browser
2. Export cookies using a browser extension
3. Replace `cookies.json` with the new cookies

## 2) Test locally (headed mode)
```bash
python fanvue_poster.py --headed --test-mode
```

## 3) Run batch (headless on VPS)
```bash
python fanvue_poster.py
```

## 4) Run a single job
```bash
python fanvue_poster.py --job paid_drop_duo
```

## 5) Run comprehensive tests
```bash
python fanvue_poster.py --config test_config.yaml --headed --test-mode
```

## Notes:
- Uses cookie-based authentication from `cookies.json` - no manual login required
- Audience: defaults to "Subscribers only"; the bot flips it to "Followers and subscribers" when configured
- Text-only posts can't be priced. Media/Text+Media try to set price if the UI exposes it; if not, it no-ops safely
- Vault picking:
  * Provide exact `media_titles` (span[aria-label]) **or** `select_first_n`
  * Optional `folder_filter` opens the folders combobox, searches, and chooses the matching option
- `--test-mode` skips the actual "Create post" button click for safe testing
