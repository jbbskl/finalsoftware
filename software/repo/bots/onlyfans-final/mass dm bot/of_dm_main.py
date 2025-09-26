#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OnlyFans Mass DM Bot (Python + Playwright, async)
- Launches Chromium, loads cookies, goes to /my/chats/send
- Supports per-model / per-campaign configuration
- Audiences: Fans, Recent (period), Muted, Following (+ Exclude tab)
- Message composer: caption (Excel/JSON/static), add media from Vault (+folder search), price, send
- Optional close browser between campaigns
- Annotated selectors with '# [BTN]/[FIELD]/[STEP]' comments for quick updates
"""

import asyncio
import json
import os
import random
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import yaml
from playwright.async_api import async_playwright, Browser, BrowserContext, Page, TimeoutError as PWTimeoutError

# =========================
# Utilities & logging
# =========================

def log(msg: str) -> None:
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {msg}", flush=True)

def ensure_parent_dir(path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)

async def safe_click(locator, retries: int = 3, delay: float = 0.8):
    last_err = None
    for i in range(retries):
        try:
            await locator.wait_for(state="visible", timeout=8000)
            await locator.click()
            return
        except Exception as e:
            last_err = e
            await asyncio.sleep(delay)
    raise last_err if last_err else RuntimeError("safe_click failed")

async def type_contenteditable(page: Page, locator_str: str, text: str, delay: float = 0.01):
    loc = page.locator(locator_str).first
    await loc.wait_for(state="visible", timeout=15000)
    await loc.click()
    # Playwright can type into contenteditable
    await loc.type(text, delay=delay)

def rand_sleep(a: float, b: float) -> float:
    return random.uniform(a, b)

# =========================
# Captions IO
# =========================

class CaptionProvider:
    """Fetches and archives captions (excel/json/static)."""
    def __init__(self, cfg: Dict[str, Any]):
        self.mode: str = (cfg.get("type") or "static").lower()
        self.static: List[str] = cfg.get("static", [])
        self.randomize: bool = bool(cfg.get("randomize", True))

        # Excel
        self.excel_path: Optional[str] = cfg.get("excel", {}).get("path")
        self.excel_sheet: Optional[str] = cfg.get("excel", {}).get("sheet", 0)
        self.excel_col: Optional[str] = cfg.get("excel", {}).get("column", "A")

        # JSON
        self.json_path: Optional[str] = cfg.get("json", {}).get("path")

        # Archive
        self.archive_mode: str = (cfg.get("archive", {}).get("mode") or "json").lower()
        self.archive_json_path: Optional[str] = cfg.get("archive", {}).get("json_path")
        self.archive_excel_path: Optional[str] = cfg.get("archive", {}).get("excel_path")
        self.archive_excel_sheet: Optional[str] = cfg.get("archive", {}).get("excel_sheet", "used")

    def _load_excel(self, path: str, sheet, col: str) -> List[str]:
        if not Path(path).exists():
            return []
        df = pd.read_excel(path, sheet_name=sheet, engine="openpyxl")
        if col.isalpha():
            idx = ord(col.upper()) - ord("A")
            if idx < 0 or idx >= len(df.columns):
                return []
            series = df.iloc[:, idx]
        else:
            series = df[col] if col in df.columns else pd.Series([])
        vals = [str(x).strip() for x in series.dropna().tolist() if str(x).strip()]
        return vals

    def _save_excel_without_first(self, path: str, sheet, col: str):
        # Remove first non-empty row from the column
        if not Path(path).exists():
            return None, None
        df = pd.read_excel(path, sheet_name=sheet, engine="openpyxl")
        idx = ord(col.upper()) - ord("A") if col.isalpha() else None
        if idx is None:
            colname = col if col in df.columns else df.columns[0]
        else:
            if idx < 0 or idx >= len(df.columns):
                colname = df.columns[0]
            else:
                colname = df.columns[idx]
        # find first non-na row
        first_idx = None
        for i, v in enumerate(df[colname].tolist()):
            if isinstance(v, str) and v.strip():
                first_idx = i
                break
        if first_idx is None:
            return None, None
        val = str(df.at[first_idx, colname]).strip()
        df.at[first_idx, colname] = None
        df.to_excel(path, sheet_name=sheet, index=False, engine="openpyxl")
        return val, {"source": "excel", "sheet": sheet, "column": colname, "row": first_idx}

    def _archive_to_json(self, caption: str, meta: Dict[str, Any]):
        if not self.archive_json_path:
            return
        ensure_parent_dir(self.archive_json_path)
        data = []
        p = Path(self.archive_json_path)
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                data = []
        data.append({"caption": caption, "when": datetime.utcnow().isoformat(), "meta": meta})
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def _archive_to_excel(self, caption: str, meta: Dict[str, Any]):
        if not self.archive_excel_path:
            return
        ensure_parent_dir(self.archive_excel_path)
        row = {"caption": caption, "when": datetime.utcnow().isoformat(), "meta": json.dumps(meta, ensure_ascii=False)}
        if Path(self.archive_excel_path).exists():
            df = pd.read_excel(self.archive_excel_path, sheet_name=self.archive_excel_sheet, engine="openpyxl")
            df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
        else:
            df = pd.DataFrame([row])
        with pd.ExcelWriter(self.archive_excel_path, engine="openpyxl", mode="w") as writer:
            df.to_excel(writer, index=False, sheet_name=self.archive_excel_sheet)

    def archive(self, caption: str, meta: Dict[str, Any]):
        if self.archive_mode == "excel":
            self._archive_to_excel(caption, meta)
        else:
            self._archive_to_json(caption, meta)

    def get_next(self) -> Tuple[str, Dict[str, Any]]:
        if self.mode == "excel":
            if not self.excel_path:
                return "", {}
            val, meta = self._save_excel_without_first(self.excel_path, self.excel_sheet, self.excel_col)
            return (val or "", meta or {})
        elif self.mode == "json":
            if not self.json_path or not Path(self.json_path).exists():
                return "", {}
            data = json.loads(Path(self.json_path).read_text(encoding="utf-8"))
            if not isinstance(data, list) or not data:
                return "", {}
            idx = random.randrange(len(data)) if self.randomize else 0
            caption = str(data.pop(idx)).strip()
            # persist shrunk list
            Path(self.json_path).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            return caption, {"source": "json", "index": idx}
        else:
            if not self.static:
                return "", {}
            idx = random.randrange(len(self.static)) if self.randomize else 0
            return self.static.pop(idx), {"source": "static", "index": idx}

# =========================
# Playwright helpers
# =========================

async def launch_and_home(cfg: Dict[str, Any], model_cfg: Dict[str, Any] = None) -> Tuple[Any, Browser, Page]:
    pw = await async_playwright().start()
    
    # Use persistent browser data directory for session persistence
    # Each model can have its own browser data directory or share one
    browser_data_dir = Path(model_cfg.get("browser_data_dir", "./browser_data") if model_cfg else "./browser_data")
    browser_data_dir.mkdir(exist_ok=True)
    
    # Launch browser with persistent user data (same approach as posting bot)
    browser: Browser = await pw.chromium.launch_persistent_context(
        user_data_dir=str(browser_data_dir),
        headless=cfg.get("headless", True),
        args=["--window-size=1200,800"],
        viewport={"width": 1200, "height": 800}
    )
    
    # Get the existing page or create new one
    if browser.pages:
        page = browser.pages[0]
    else:
        page = await browser.new_page()

    log("# [NAV] Go to OnlyFans")
    await page.goto("https://onlyfans.com/", wait_until="domcontentloaded", timeout=cfg["timeouts"]["long_ms"])
    
    # Wait for page to load
    await asyncio.sleep(3)
    
    # Check if we're logged in
    login_form = page.locator('form[action*="login"], input[name="email"], input[type="email"]')
    try:
        await login_form.wait_for(state="visible", timeout=5000)
        log("❌ LOGIN REQUIRED: Browser session not authenticated")
        log("🔍 Current URL: " + page.url)
        log("📄 Page title: " + await page.title())
        log("")
        log("🔧 SOLUTION: Run the posting bot first or manually login in non-headless mode")
        log("   The persistent browser session will be saved and reused automatically")
        log("   Both posting bot and mass DM bot can share the same browser session")
        
        raise RuntimeError("Not authenticated. Please ensure you're logged in first.")
        
    except Exception as e:
        if "Timeout" in str(e):
            # Good! No login form found, we're logged in
            log("✅ Authenticated successfully via persistent browser session")
            log("🔍 Current URL: " + page.url)
        else:
            raise e

    # Accept cookie banner if present
    try:
        accept = page.locator('button:has-text("Accept"), button:has-text("I agree")')
        await accept.wait_for(state="visible", timeout=3000)
        await accept.click()
        await asyncio.sleep(2)
        log('# [BTN] Accepted cookie consent')
    except Exception:
        pass

    return pw, browser, page

async def close_browser(pw, browser: Browser):
    # For persistent context, we just close the browser (data is auto-saved)
    await browser.close()
    await pw.stop()

async def goto_messages_new(page: Page, cfg: Dict[str, Any]):
    log("# [STEP] Open Messages")
    # [BTN] Messages top menu
    await safe_click(page.locator('a.l-header__menu__item.m-chats'), retries=cfg["retries"]["clicks"])
    await page.wait_for_url("**/my/chats/*", timeout=cfg["timeouts"]["long_ms"])

    log("# [STEP] New Message")
    # [BTN] New Message (+)
    await safe_click(page.locator('a[href="/my/chats/send"]'), retries=cfg["retries"]["clicks"])
    await page.wait_for_url("**/my/chats/send*", timeout=cfg["timeouts"]["long_ms"])

# =========================
# Audience selection
# =========================

async def click_audience_checkbox(page: Page, label_text: str, cfg: Dict[str, Any]):
    """
    Clicks the circle checkbox for a given audience row (Fans, Recent..., Muted, Following)
    """
    log(f'# [BTN] Selecting audience: {label_text}')
    # [BTN] audience circle - click the entire label (Strategy 1 from our test)
    row = page.locator(f'label:has(.b-rows-lists__item__name:has-text("{label_text}"))').first
    await row.wait_for(state="visible", timeout=cfg["timeouts"]["default_ms"])
    await safe_click(row, retries=cfg["retries"]["clicks"])
    log(f'✅ Selected audience: {label_text}')

async def set_recent_period_if_needed(page: Page, recent_cfg: Dict[str, Any], cfg: Dict[str, Any]):
    """
    For 'Recent...' audience:
    - if days_back == 0 -> just click 'Save'
    - else: select start day within the same month (>=1), then Save
    """
    if not recent_cfg.get("enabled"):
        return
    days_back = int(recent_cfg.get("days_back", 0))
    
    # Check if calendar is already open (it opens automatically when Recent is selected)
    log(f'# [CHECK] Looking for Recent date picker for {days_back} days back')
    calendar_visible = False
    try:
        calendar = page.locator('.vdatetime-calendar').first
        await calendar.wait_for(state="visible", timeout=3000)
        calendar_visible = True
        log('✅ Calendar is already open')
    except Exception:
        log('📅 Calendar not visible, trying to open it')
        try:
            btn = page.locator('label:has(.b-rows-lists__item__name:has-text("Recent")) .m-datepicker-btn').first
            await btn.click()
            log('✅ Opened date picker')
            calendar_visible = True
        except Exception as e:
            log(f'⚠️ Could not open date picker: {str(e)[:100]}...')
            days_back = 0

    # [POPUP] Recent calendar
    save_btn = page.locator('.vdatetime-popup__actions__button--confirm button:has-text("Save")').first
    if days_back <= 0:
        await safe_click(save_btn, retries=cfg["retries"]["clicks"])
        return

    today = datetime.now()
    start_day = max(1, today.day - days_back + 1)
    
    log(f'# [CALC] Today: {today.day}, Days back: {days_back}, Calculated start day: {start_day}')

    # If they specifically require: if day==1, only that day; if day==2 and days=2 -> select 1
    # The above formula already handles it.

    # Click the day cell - direct approach
    log(f'# [BTN] Clicking day {start_day} in calendar')
    try:
        # Wait for calendar to be ready
        await asyncio.sleep(1.0)
        
        # Just click the day directly - simple approach
        day_cell = page.locator(f'.vdatetime-calendar__month__day span span:text("{start_day}")').first
        await day_cell.wait_for(state="visible", timeout=5000)
        await day_cell.click()
        log(f'✅ Clicked day {start_day}')
        
    except Exception as e:
        log(f'❌ Could not click day {start_day}: {str(e)[:150]}...')
        log(f'⚠️ Proceeding with default date')
    log(f'# [BTN] Save recent date selection')
    await safe_click(save_btn, retries=cfg["retries"]["clicks"])

async def handle_audiences(page: Page, campaign: Dict[str, Any], cfg: Dict[str, Any]):
    """
    send_to: { fans, recent:{enabled, days_back}, muted, following }
    exclude: same keys
    """
    send_to = campaign.get("audience", {}).get("send_to", {})
    exclude = campaign.get("audience", {}).get("exclude", {})

    # --- SEND TO ---
    if send_to.get("fans"):       await click_audience_checkbox(page, "Fans", cfg)
    if send_to.get("muted"):      await click_audience_checkbox(page, "Muted", cfg)
    if send_to.get("following"):  await click_audience_checkbox(page, "Following", cfg)
    recent_cfg = send_to.get("recent", {})
    if recent_cfg and recent_cfg.get("enabled"):
        await click_audience_checkbox(page, "Recent", cfg)
        await set_recent_period_if_needed(page, recent_cfg, cfg)

    # --- EXCLUDE TAB ---
    if exclude and any([exclude.get("fans"), exclude.get("muted"), exclude.get("following"), exclude.get("recent", {}).get("enabled")]):
        log("# [STEP] Open Exclude tab")
        # [TAB] Exclude
        await safe_click(page.locator('a[href="/my/chats/send?list=exclude"]'), retries=cfg["retries"]["clicks"])
        await page.wait_for_url("**/my/chats/send?list=exclude*", timeout=cfg["timeouts"]["default_ms"])

        if exclude.get("fans"):       await click_audience_checkbox(page, "Fans", cfg)
        if exclude.get("muted"):      await click_audience_checkbox(page, "Muted", cfg)
        if exclude.get("following"):  await click_audience_checkbox(page, "Following", cfg)
        recent_ex = exclude.get("recent", {})
        if recent_ex and recent_ex.get("enabled"):
            await click_audience_checkbox(page, "Recent", cfg)
            await set_recent_period_if_needed(page, recent_ex, cfg)

    # Back to main composer section (the bottom area is the same across tabs)
    # (No nav required—OnlyFans keeps composer anchored below.)

# =========================
# Vault media selection
# =========================

async def open_vault(page: Page, cfg: Dict[str, Any]):
    log("# [BTN] Add media from Vault")
    # [BTN] Add media from vault
    await safe_click(page.locator('button[at-attr="add_vault_media"]'), retries=cfg["retries"]["clicks"])
    # Wait modal body appears
    await page.wait_for_selector('#ModalMediaVault___BV_modal_body_', timeout=cfg["timeouts"]["long_ms"])

async def search_and_open_folder(page: Page, folder_name: str, cfg: Dict[str, Any]):
    log(f'# [STEP] Search folder: "{folder_name}"')
    # [BTN] search toggle within vault modal header
    await safe_click(page.locator('#ModalMediaVault___BV_modal_body_ .b-btns-group button[aria-label="Search"]').first,
                     retries=cfg["retries"]["clicks"])
    # Try to type into the search input
    search_input = page.locator('#ModalMediaVault___BV_modal_body_ input[type="search"], #ModalMediaVault___BV_modal_body_ input[placeholder="Search"]').first
    await search_input.fill("")
    await search_input.type(folder_name, delay=0.02)
    await asyncio.sleep(1.0)

    # Click the row with the folder name
    row = page.locator(f'#ModalMediaVault___BV_modal_body_ .b-rows-lists__item__name:has-text("{folder_name}")').first
    await safe_click(row, retries=cfg["retries"]["clicks"])
    await asyncio.sleep(1.0)

async def select_vault_media(page: Page, modal_body, media_container, count: int, cfg: Dict[str, Any]):
    log(f"# [STEP] Selecting {count} item(s)")

    async def scroll_more(times=5):
        """Try multiple scrolling approaches to find what works (exact copy from posting bot)"""
        log(f'# [STEP] Trying different scrolling methods ({times} times)')
        
        for i in range(times):
            try:
                # Method 1: Keyboard scrolling with bigger jumps
                await media_container.focus()
                for _ in range(30):  # More page downs than before
                    await page.keyboard.press('PageDown')
                    await asyncio.sleep(0.05)
                log(f'📜 Keyboard scroll {i+1}/{times}: 30x PageDown')
                
                await asyncio.sleep(1.0)
                
                # Method 2: ScrollIntoView on elements further down
                try:
                    items = await media_container.locator('div[at-attr="checkbox"].checkbox-item').all()
                    if len(items) > 10:
                        await items[-1].scroll_into_view_if_needed()
                        log(f'📜 ScrollIntoView {i+1}/{times}: scrolled to last visible item')
                except Exception:
                    pass
                
                await asyncio.sleep(1.0)
                
                # Method 3: Bigger JavaScript scrolling
                try:
                    await modal_body.evaluate("""
                        (el) => {
                            const scrollers = [
                                el,
                                el.querySelector('.vue-recycle-scroller'),
                                el.querySelector('.b-feed-content'),
                                document.querySelector('#ModalMediaVault___BV_modal_body_')
                            ].filter(Boolean);
                            
                            scrollers.forEach(scroller => {
                                if (scroller && scroller.scrollTop !== undefined) {
                                    scroller.scrollTop += 10000;  // Much bigger scroll jump
                                    scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
                                }
                            });
                        }
                    """)
                    log(f'📜 JavaScript scroll {i+1}/{times}: multiple containers + 10000px')
                except Exception:
                    pass
                
                # Wait for Vue virtual scroller to render items
                await asyncio.sleep(random.uniform(2.0, 3.0))  # Reasonable wait for rendering
                
            except Exception as e:
                log(f'⚠️ Scroll error on attempt {i+1}: {e}')
                pass

    # First, scan what's already loaded without scrolling
    await asyncio.sleep(random.uniform(2.0, 3.0))  # Longer wait for initial load
    checkboxes = await media_container.locator('div[at-attr="checkbox"].checkbox-item').all()
    available_count = len(checkboxes)
    log(f'📊 Initial scan: {available_count} media items already loaded')
    
    # If using "all media", scroll to load more items (exact copy from posting bot)
    use_all_media = True  # We're always using "all media" in our current setup
    if use_all_media:
        log('🔄 Scrolling to load all available media items...')
        
        last_count = available_count
        no_change_count = 0
        max_attempts = 15
        
        for attempt in range(max_attempts):
            await scroll_more(1)  # One round of scrolling
            await asyncio.sleep(random.uniform(1.5, 2.5))
            
            # Check progress
            checkboxes = await modal_body.locator('div[at-attr="checkbox"].checkbox-item').all()
            new_count = len(checkboxes)
            log(f'📊 Scroll attempt {attempt + 1}: {new_count} media items loaded')
            
            # Check if we're still loading new items
            if new_count == last_count:
                no_change_count += 1
                if no_change_count >= 5:  # Stop if no new items for 5 attempts
                    log(f'✅ No new items loaded for 5 attempts, stopping at {new_count} items')
                    break
            else:
                no_change_count = 0  # Reset counter if we got new items
            
            last_count = new_count
        
        # Final count after scroll attempts
        available_count = new_count
        log(f'📊 Final media count: {available_count}')
    
    # Now select the items
    selected = 0
    tried_loops = 0
    max_loops = 3
    
    while selected < count and tried_loops < max_loops:
        tried_loops += 1
        
        # Re-scan available items from media container
        checkboxes = await media_container.locator('div[at-attr="checkbox"].checkbox-item').all()
        available_count = len(checkboxes)
        log(f'📊 Found {available_count} media items available for selection (loop {tried_loops})')
        
        if available_count == 0:
            log('⚠️ No media items found - trying light scroll')
            await scroll_more(2)
            continue
        
        # Check if we have enough items already loaded
        if available_count >= count:
            log(f'✅ Sufficient media items loaded ({available_count} >= {count})')
        
        # Select from available items
        random.shuffle(checkboxes)
        for cb in checkboxes[:count - selected]:  # Only select what we need
            try:
                # Longer delays to prevent over-selection
                await asyncio.sleep(random.uniform(3.0, 4.0))  # 3+ second delay before selecting
                await cb.click()
                selected += 1
                log(f'✅ Selected media item {selected}/{count}')
                await asyncio.sleep(random.uniform(3.0, 4.0))  # 3+ second delay after selection
                
                # Stop if we have enough to prevent over-selection
                if selected >= count:
                    log(f'🛑 Reached target count {count}, stopping selection')
                    break
                    
            except Exception as e:
                log(f'⚠️ Failed to select media item: {e}')
                continue
        
        # Only scroll if we still need more items and haven't found enough
        if selected < count and available_count < count * 2:
            log(f'🔄 Need {count - selected} more items - trying light scroll...')
            await scroll_more(2)
        else:
            break  # We have enough or scrolling won't help

    # [BTN] Add selected
    log('# [BTN] Add selected media')
    add_btn = modal_body.locator('div.b-row-selected__controls button:has-text("Add")')
    await safe_click(add_btn, retries=cfg["retries"]["clicks"])

# =========================
# Message build steps
# =========================

async def fill_caption(page: Page, provider_cfg: Dict[str, Any], cfg: Dict[str, Any]) -> Optional[str]:
    if not provider_cfg or not provider_cfg.get("enabled", True):
        return None
    cp = CaptionProvider(provider_cfg)
    caption, meta = cp.get_next()

    # [FIELD] DM caption composer (contenteditable) - Type a message...
    editor_sel = 'div.b-make-post__text-input [contenteditable="true"]'
    await type_contenteditable(page, editor_sel, caption)
    await asyncio.sleep(0.5)

    # Archive only if non-empty
    if caption.strip():
        cp.archive(caption, meta)
    return caption

async def add_price(page: Page, amount: float, cfg: Dict[str, Any]):
    # [BTN] Price (message price)
    log(f'# [BTN] Opening price modal for ${amount}')
    await safe_click(page.locator('button[at-attr="price_btn"]'), retries=cfg["retries"]["clicks"])
    
    # Wait for price modal to open
    await asyncio.sleep(2.0)
    
    # OF minimum is 3
    clean = max(3.0, float(amount))
    log(f'# [TYPE] Typing price ${clean} directly')
    
    # Type directly without clicking input field first (as you observed)
    await page.keyboard.type(str(clean))
    await asyncio.sleep(1.0)

    # [BTN] Save
    log('# [BTN] Save price')
    save_btn = page.locator('button:has-text("Save")').first
    await safe_click(save_btn, retries=cfg["retries"]["clicks"])
    await asyncio.sleep(2.0)
    log(f'✅ Set price to ${clean}')

async def compose_media_if_needed(page: Page, media_cfg: Dict[str, Any], cfg: Dict[str, Any]):
    if not media_cfg or not media_cfg.get("enabled"):
        return
    folder = media_cfg.get("folder_name") or media_cfg.get("search_query") or ""
    count = int(media_cfg.get("count", 1))
    
    # Open vault modal
    await open_vault(page, cfg)
    
    # Wait for modal to load
    modal_body = page.locator('#ModalMediaVault___BV_modal_body_')
    await modal_body.wait_for(state="visible", timeout=cfg["timeouts"]["long_ms"])
    
    # Handle folder search if needed
    if folder and folder.lower() not in ["all media", "all", ""]:
        await search_and_open_folder(page, folder, cfg)
    else:
        log('# [FILTER] Using "all media" - vault already shows all media')
        await asyncio.sleep(random.uniform(2.0, 3.0))
    
    # Get media container
    media_container = modal_body.locator('div.b-feed-content.b-vault-media.g-negative-sides-gaps')
    await media_container.wait_for(state="visible", timeout=cfg["timeouts"]["long_ms"])
    
    # Select media using the working logic from posting bot
    await select_vault_media(page, modal_body, media_container, count, cfg)

# =========================
# Sending
# =========================

async def send_now(page: Page, cfg: Dict[str, Any]):
    # [BTN] Send
    if cfg.get("test_mode", False):
        log("🧪 TEST MODE: Skipping actual send - message composed successfully!")
        await asyncio.sleep(1.0)
        return
    
    await safe_click(page.locator('button[at-attr="send_btn"]:has-text("Send")'), retries=cfg["retries"]["clicks"])
    await asyncio.sleep(2.0)

# =========================
# Orchestration
# =========================

async def run_campaign(pw, browser, page, model_cfg: Dict[str, Any], campaign: Dict[str, Any], root_cfg: Dict[str, Any]):
    """
    Enforces valid sequences per Miro:
    - text_only: choose audience -> caption -> send
    - text_media: choose audience -> caption -> add media -> (optional price) -> send
    Order is fixed so we don't place price before content, etc.
    """
    log(f'\n===== CAMPAIGN: {campaign.get("name")} ({campaign.get("kind")}) for {model_cfg.get("name")} =====')

    await goto_messages_new(page, root_cfg)

    # 1) Audience
    await handle_audiences(page, campaign, root_cfg)

    # 2) Caption
    await fill_caption(page, campaign.get("captions", {}), root_cfg)

    # 3) Media (if any)
    if campaign.get("kind") == "text_media":
        await compose_media_if_needed(page, campaign.get("media", {}), root_cfg)

    # 4) Price (optional)
    if campaign.get("price", {}).get("enabled"):
        await add_price(page, float(campaign["price"]["amount"]), root_cfg)

    # 5) Send
    await send_now(page, root_cfg)
    log(f"✅ Sent campaign '{campaign.get('name')}'")

async def run_model(model_cfg: Dict[str, Any], root_cfg: Dict[str, Any]):
    """Open browser (or reopen between campaigns), run all campaigns for model."""
    if root_cfg.get("reopen_between_campaigns", False):
        # Reopen each campaign fresh (as requested in earlier bots)
        for i, campaign in enumerate(model_cfg.get("campaigns", []), start=1):
            pw, browser, page = await launch_and_home(root_cfg, model_cfg)
            try:
                await run_campaign(pw, browser, page, model_cfg, campaign, root_cfg)
            finally:
                await close_browser(pw, browser)
            # pacing
            wait_cfg = root_cfg.get("pace", {})
            await asyncio.sleep(random.uniform(wait_cfg.get("between_min_s", 2), wait_cfg.get("between_max_s", 5)))
        return

    # Single session for all campaigns of this model
    pw, browser, page = await launch_and_home(root_cfg, model_cfg)
    try:
        for i, campaign in enumerate(model_cfg.get("campaigns", []), start=1):
            await run_campaign(pw, browser, page, model_cfg, campaign, root_cfg)
            wait_cfg = root_cfg.get("pace", {})
            await asyncio.sleep(random.uniform(wait_cfg.get("between_min_s", 2), wait_cfg.get("between_max_s", 5)))
    finally:
        await close_browser(pw, browser)

async def main():
    print("🚀 OnlyFans Mass DM Bot v1.0")
    print("=" * 50)
    
    cfg_path = os.environ.get("OF_DM_CONFIG", "of_dm_config.yaml")
    if not Path(cfg_path).exists():
        log(f"❌ Config file not found: {cfg_path}")
        log("💡 Create of_dm_config.yaml or set OF_DM_CONFIG environment variable")
        return
    
    cfg: Dict[str, Any] = yaml.safe_load(Path(cfg_path).read_text(encoding="utf-8"))

    # Defaults
    cfg.setdefault("headless", True)
    cfg.setdefault("test_mode", False)
    cfg.setdefault("timeouts", {"default_ms": 15000, "long_ms": 45000})
    cfg.setdefault("retries", {"clicks": 3})
    cfg.setdefault("pace", {"between_min_s": 5, "between_max_s": 10})
    cfg.setdefault("reopen_between_campaigns", False)

    # Show configuration summary
    models: List[Dict[str, Any]] = cfg.get("models", [])
    total_campaigns = sum(len(m.get("campaigns", [])) for m in models)
    
    log(f"📋 Configuration: {len(models)} models, {total_campaigns} total campaigns")
    log(f"🎯 Mode: {'TEST' if cfg.get('test_mode') else 'PRODUCTION'}")
    log(f"👁️ Browser: {'Hidden' if cfg.get('headless') else 'Visible'}")
    log(f"🔄 Reopen between campaigns: {cfg.get('reopen_between_campaigns')}")
    
    if cfg.get("test_mode"):
        log("🧪 TEST MODE: Messages will be composed but not sent")
    else:
        log("⚠️ PRODUCTION MODE: Messages will be sent to real users!")
    
    print("=" * 50)

    # Run models (with optional shuffle)
    if cfg.get("shuffle_models"):
        random.shuffle(models)
        log("🔀 Shuffled model order")

    try:
        for i, model in enumerate(models, 1):
            log(f"🤖 Starting model {i}/{len(models)}: {model.get('name', 'Unnamed')}")
            await run_model(model, cfg)
            
        log("🎉 All campaigns completed successfully!")
        
    except KeyboardInterrupt:
        log("⏹️ Bot stopped by user")
    except Exception as e:
        log(f"❌ Error: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
