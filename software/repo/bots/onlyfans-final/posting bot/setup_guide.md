# OnlyFans Posting Bot Setup Guide

## Installation

1. **Install dependencies:**
```bash
pip install -r requirements.txt
python -m playwright install chromium
```

2. **Create directory structure:**
```bash
mkdir -p cookies captions of_archive
```

3. **Setup cookies:**
   - Login to OnlyFans in Chrome
   - Export cookies using a browser extension (like Cookie Editor)
   - Save as `cookies/onlyfans_cookies.json`

4. **Setup captions:**
   - Create Excel files with captions in column A
   - Example: `captions/global.xlsx`, `captions/creator_main.xlsx`

## Configuration

Edit `of_config.yaml`:

- **Basic settings:** Set `headless: false` for testing, `true` for production
- **Models:** Define your creators with their specific configurations
- **Sequences:** Configure post types with steps like caption, media, quiz, poll, price, expiration, post_now

## Running

```bash
python of_post_main.py
```

## Key Features

### Excel MOVE Workflow
- **Pop:** Takes caption from Excel (sequential or random)
- **Archive:** Stores used captions in JSON/Excel after successful post
- **Replenish:** Refills source Excel from archive when empty
- **Restore:** Returns caption to Excel if post fails

### Supported Steps
- `caption`: Text from step or Excel MOVE
- `quiz`: Interactive quiz with correct answer
- `poll`: Voting poll 
- `media`: Select from vault by folder filter
- `price`: Set paid post amount
- `expiration`: Set post expiration period
- `post_now`: Submit the post

### Error Handling
- Failed posts restore captions to Excel
- Robust selector retries
- Browser session management
- Detailed logging

## Selectors Used
All selectors are tagged with comments for easy maintenance:
- `# [NAV]` - Navigation elements
- `# [BTN]` - Clickable buttons  
- `# [FIELD]` - Input fields
- `# [STEP]` - Process steps

Current selectors target OnlyFans elements like:
- New post: `a.m-create-post[data-name="PostsCreate"]`
- Caption: `div.tiptap.ProseMirror[contenteditable="true"]`
- Media vault: `button[at-attr="add_vault_media"]`
- Post button: `button[at-attr="submit_post"]:has-text("Post")`
