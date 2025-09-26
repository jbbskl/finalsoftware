# OnlyFans Posting Bot - Testing Setup

## 🧪 Test Configuration

The testing setup includes:

- **`cookies/testing_of.json`** - Your OnlyFans authentication cookies
- **`of_post_config.test.yaml`** - Comprehensive test scenarios  
- **`run_tests.py`** - Test runner script
- **`of_post_main.py`** - Updated bot with dry-run functionality

## 🚀 Running Tests

### Quick Start
```bash
python run_tests.py
```

### Manual Test (Single Config)
```bash
python -c "
import asyncio
from of_post_main import load_cfg, main
asyncio.run(main())
" of_post_config.test.yaml
```

## 🎯 Test Scenarios

### A. Text Only Post
- **Sequence:** caption → post
- **Tests:** Basic caption input and dry-run post

### B. Quiz (4 Options)  
- **Sequence:** caption → quiz → post
- **Tests:** Quiz creation, 4 options, correct answer selection, 3-day duration

### C. Poll (5 Options)
- **Sequence:** caption → poll → post  
- **Tests:** Poll creation, 5 options, 7-day duration

### D. Media Free
- **Sequence:** caption → media → post
- **Tests:** Vault search, folder selection, multi-select (2 items)

### E. PPV + Expiration  
- **Sequence:** caption → media → price → expire → post
- **Tests:** Media + $9.99 price + 1-day expiration

### F. Media Only + Long Expiration
- **Sequence:** media → price → expire → post
- **Tests:** Media selection (3 items) + $14.50 + 30-day expiration

## 🔧 Key Features Tested

### ✅ DRY-RUN Mode
- **`dry_run: true`** in config skips final POST button
- All other steps execute normally for complete testing
- Logs: `🧪 DRY-RUN: skipping final POST click`

### ✅ Visual Testing  
- **`headless: false`** shows browser for visual verification
- Watch each step execute in real-time
- Verify selectors and UI interactions

### ✅ All Components
- **Caption:** Text input with contenteditable
- **Quiz:** 2-10 options, correct answer, duration picker  
- **Poll:** 2-10 options, duration picker
- **Media:** Vault search, folder navigation, multi-select
- **Price:** Toggle + amount input
- **Expiration:** Duration picker (1d/3d/7d/30d/no_limit)

## 🛠️ Selectors Tested

All selectors are tagged with comments:
- `# [NAV]` - Navigation (OnlyFans home, new post)
- `# [BTN]` - Buttons (quiz, poll, media, price, expire, post)  
- `# [FIELD]` - Inputs (caption, quiz options, price amount)
- `# [STEP]` - Process steps (media selection, duration picker)

## 📊 Expected Output

```
[OF POST] 🧪 Starting OnlyFans Posting Bot TEST MODE
[OF POST] 🔧 Headless: false
[OF POST] 🧪 Dry-run: true
[OF POST] ======================================================================
[OF POST] MODEL 1/1: OF Test | posts: 6
[OF POST] ======================================================================
[OF POST] --- Test 1/6 :: A_text_only ---
[OF POST] # [NAV] Go to OnlyFans home
[OF POST] # [BTN] "New post" (+)
[OF POST] # [FIELD] Caption contenteditable
[OF POST] # [BTN] Post now
[OF POST] 🧪 DRY-RUN: skipping final POST click
[OF POST] ✅ Test A_text_only completed successfully
```

## 🔍 Troubleshooting

### Cookies Expired
- Update `cookies/testing_of.json` with fresh cookies from browser
- Use Cookie Editor extension to export current session

### Selector Issues  
- Check browser console for element changes
- Update selectors in `of_post_main.py` if OnlyFans UI changed
- All selectors are commented for easy maintenance

### Test Failures
- Run with `--continue-on-error` to test all scenarios
- Check logs for specific step failures
- Verify folder names exist in your OnlyFans vault
