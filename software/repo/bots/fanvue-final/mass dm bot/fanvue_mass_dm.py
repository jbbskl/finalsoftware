#!/usr/bin/env python3
"""
UNIVERSAL FANVUE MASS DM BOT
Standardized, configurable mass DM bot for Fanvue platform
Copy this folder + config + excel files for new clients
"""

import os
import json
import time
import random
import pandas as pd
import asyncio
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional

from playwright.async_api import async_playwright
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/fanvue_mass_dm_bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class PhaseTracker:
    def __init__(self, config_dir: str = "."):
        self.config_dir = Path(config_dir)
        self.tracker_file = self.config_dir / 'phase_tracker.json'
        self.ensure_tracker_file()
    
    def ensure_tracker_file(self):
        """Ensure phase tracker file exists"""
        if not self.tracker_file.exists():
            tracker_data = {
                'last_reset_date': datetime.now().strftime('%Y-%m-%d'),
                'completed_phases': {}
            }
            with open(self.tracker_file, 'w') as f:
                json.dump(tracker_data, f, indent=2)
            logger.info(f"✅ Created phase tracker file: {self.tracker_file}")
    
    def reset_if_new_day(self):
        """Reset tracker if it's a new bot day (3:00 AM boundary)"""
        try:
            with open(self.tracker_file, 'r') as f:
                tracker_data = json.load(f)
            
            last_reset_date = tracker_data.get('last_reset_date')
            current_date = datetime.now().strftime('%Y-%m-%d')
            
            if last_reset_date != current_date:
                tracker_data['last_reset_date'] = current_date
                tracker_data['completed_phases'] = {}
                
                with open(self.tracker_file, 'w') as f:
                    json.dump(tracker_data, f, indent=2)
                
                logger.info("🔄 Reset phase tracker for new day")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Error resetting phase tracker: {e}")
            return False
    
    def is_phase_completed_today(self, phase_time):
        """Check if phase was completed today"""
        try:
            with open(self.tracker_file, 'r') as f:
                tracker_data = json.load(f)
            
            completed_phases = tracker_data.get('completed_phases', {})
            current_date = datetime.now().strftime('%Y-%m-%d')
            
            phase_key = f"{current_date}_{phase_time}"
            return phase_key in completed_phases
            
        except Exception as e:
            logger.error(f"❌ Error checking phase completion: {e}")
            return False
    
    def mark_phase_completed(self, phase_time):
        """Mark phase as completed for today"""
        try:
            with open(self.tracker_file, 'r') as f:
                tracker_data = json.load(f)
            
            current_date = datetime.now().strftime('%Y-%m-%d')
            phase_key = f"{current_date}_{phase_time}"
            
            tracker_data['completed_phases'][phase_key] = {
                'completed_at': datetime.now().isoformat(),
                'status': 'success'
            }
            
            with open(self.tracker_file, 'w') as f:
                json.dump(tracker_data, f, indent=2)
            
            logger.info(f"✅ Marked phase {phase_time} as completed")
            
        except Exception as e:
            logger.error(f"❌ Error marking phase completed: {e}")


class MessageManager:
    def __init__(self, excel_file: str, config_dir: str = "."):
        self.config_dir = Path(config_dir)
        self.excel_file = self.config_dir / excel_file
        self.used_file = self.config_dir / f"used_{excel_file}"
        self.ensure_message_files()
    
    def ensure_message_files(self):
        """Ensure message files exist"""
        if not self.excel_file.exists():
            # Create default Excel file
            df = pd.DataFrame({
                'Message': [
                    'Default message 1',
                    'Default message 2',
                    'Default message 3'
                ]
            })
            df.to_excel(self.excel_file, index=False)
            logger.info(f"✅ Created default message file: {self.excel_file}")
    
    def get_random_message(self):
        """Get a random message from Excel file"""
        try:
            if not self.excel_file.exists():
                return "Default message"
            
            df = pd.read_excel(self.excel_file)
            messages = df.iloc[:, 0].dropna().tolist()
            
            if not messages:
                return "Default message"
            
            message = random.choice(messages)
            return str(message).strip()
            
        except Exception as e:
            logger.error(f"❌ Error getting random message: {e}")
            return "Default message"
    
    def move_to_used_messages(self, message):
        """Move used message to used file"""
        try:
            # Add to used file
            if self.used_file.exists():
                df_used = pd.read_excel(self.used_file)
                used_messages = df_used.iloc[:, 0].tolist()
            else:
                used_messages = []
            
            used_messages.append(message)
            df_used = pd.DataFrame({'Used Messages': used_messages})
            df_used.to_excel(self.used_file, index=False)
            
            # Remove from original file
            if self.excel_file.exists():
                df = pd.read_excel(self.excel_file)
                messages = df.iloc[:, 0].dropna().tolist()
                messages = [m for m in messages if str(m).strip() != message]
                
                df_updated = pd.DataFrame({'Message': messages})
                df_updated.to_excel(self.excel_file, index=False)
            
            logger.info(f"✅ Moved message to used file: {message[:50]}...")
            
        except Exception as e:
            logger.error(f"❌ Error moving message to used: {e}")


class FanvueMassDMBot:
    def __init__(self, config_dir: str = "."):
        self.config_dir = Path(config_dir)
        self.config = self.load_config()
        
        # Initialize components
        self.phase_tracker = PhaseTracker(config_dir)
        
        # Crash recovery
        self.crash_recovery_file = self.config_dir / 'crash_recovery.json'
        self.ensure_crash_recovery_file()
        
        # Browser session
        self.playwright = None
        self.browser = None
        self.page = None
        
        logger.info(f"📋 Loaded {len(self.config.get('phases', {}))} phases")
        
    def ensure_crash_recovery_file(self):
        """Ensure crash recovery file exists"""
        if not self.crash_recovery_file.exists():
            recovery_data = {
                'last_phase': None,
                'last_message_index': 0,
                'last_timestamp': None,
                'completed_phases': []
            }
            with open(self.crash_recovery_file, 'w') as f:
                json.dump(recovery_data, f, indent=2)
    
    def save_crash_recovery(self, phase: str, message_index: int):
        """Save crash recovery information"""
        recovery_data = {
            'last_phase': phase,
            'last_message_index': message_index,
            'last_timestamp': datetime.now().isoformat(),
            'completed_phases': self.load_crash_recovery().get('completed_phases', [])
        }
        with open(self.crash_recovery_file, 'w') as f:
            json.dump(recovery_data, f, indent=2)
    
    def load_crash_recovery(self) -> dict:
        """Load crash recovery information"""
        if self.crash_recovery_file.exists():
            with open(self.crash_recovery_file, 'r') as f:
                return json.load(f)
        return {}
    
    def mark_phase_completed(self, phase: str):
        """Mark phase as completed in crash recovery"""
        recovery_data = self.load_crash_recovery()
        completed_phases = recovery_data.get('completed_phases', [])
        if phase not in completed_phases:
            completed_phases.append(phase)
            recovery_data['completed_phases'] = completed_phases
            with open(self.crash_recovery_file, 'w') as f:
                json.dump(recovery_data, f, indent=2)
    
    def is_phase_completed(self, phase: str) -> bool:
        """Check if phase was completed"""
        recovery_data = self.load_crash_recovery()
        return phase in recovery_data.get('completed_phases', [])
    
    def reset_crash_recovery(self):
        """Reset crash recovery data"""
        recovery_data = {
            'last_phase': None,
            'last_message_index': 0,
            'last_timestamp': None,
            'completed_phases': []
        }
        with open(self.crash_recovery_file, 'w') as f:
            json.dump(recovery_data, f, indent=2)
        logger.info("🔄 Crash recovery data reset")
        
    def load_config(self) -> dict:
        """Load configuration from config.json"""
        config_file = self.config_dir / 'config.json'
        if config_file.exists():
            with open(config_file, 'r') as f:
                return json.load(f)
        else:
            logger.warning("⚠️ config.json not found, using default settings")
            return self.get_default_config()
            
    def get_default_config(self) -> dict:
        """Return default configuration if config.json is missing"""
        return {
            "base_url": "https://www.fanvue.com",
            "login_url": "https://www.fanvue.com/signin",
            "messages_url": "https://www.fanvue.com/messages",
            "phases": {
                "02:00": {
                    "file": "2.xlsx",
                    "type": "text_only",
                    "description": "Text only mass DM"
                },
                "08:00": {
                    "file": "8.xlsx",
                    "type": "text_only",
                    "description": "Text only mass DM"
                },
                "13:00": {
                    "file": "13.xlsx",
                    "type": "bundle_text",
                    "bundle_size": 3,
                    "price": 15,
                    "filter": "naked videos",
                    "description": "Bundle + Text mass DM"
                },
                "16:00": {
                    "file": "21.xlsx",
                    "type": "text_only",
                    "description": "Text only mass DM"
                },
                "18:00": {
                    "file": "18.xlsx",
                    "type": "photo_text",
                    "filter": "lingerie photo",
                    "description": "Photo + Text mass DM"
                },
                "21:00": {
                    "file": "22.xlsx",
                    "type": "text_only",
                    "description": "Text only mass DM"
                }
            },
            "caption_management": {
                "auto_refill_threshold": 5,
                "refill_from_used": True,
                "backup_original_files": True,
                "shuffle_on_refill": True
            },
            "crash_recovery": {
                "enabled": True,
                "auto_reset_daily": True,
                "save_interval": 1
            },
            "browser_settings": {
                "headless": True,
                "button_delay": 2,
                "message_delay": 5,
                "debug_mode": True
            },
            "mass_dm_settings": {
                "min_dms": 1,
                "max_dms": 5,
                "delay_between_dms": 30
            },
            "files": {
                "cookies": "fanvue-cookies.json"
            },
            "audience_selection": {
                "default": "all_contacts",  # all_contacts, online, followers, subscribers, etc.
                "fallback_options": ["online", "followers", "all_contacts"]
            },
            "excluding_list": {
                "enabled": False,
                "audience_type": None,  # Set to audience type to exclude, or None to skip
                "fallback_options": ["online", "followers"]
            },
            "media_settings": {
                "vault_filter": "All folders",  # Default filter for vault
                "media_count": 1,  # Number of media items to select
                "scroll_attempts": 10  # Max scroll attempts when selecting media
            },
            "pricing": {
                "photo_text_enabled": False,  # Whether to set price for photo messages
                "bundle_text_enabled": True,  # Whether to set price for bundle messages
                "default_price": 15  # Default price if not specified in phase config
            },
            "scheduled_restarts": {
                "enabled": True,
                "restart_times": ["03:00", "15:00"],
                "auto_display_setup": True,
                "vnc_management": {
                    "enabled": True,
                    "display_numbers": [1, 2, 3],
                    "auto_start_vnc": True
                }
            }
        }

    async def init_browser(self):
        """Initialize Playwright browser"""
        logger.info("🚀 Initializing Playwright browser...")
        
        try:
            self.playwright = await async_playwright().start()
            
            browser_settings = self.config.get("browser_settings", {})
            headless = browser_settings.get("headless", True)
            
            # Launch browser (like Kiko's bot)
            self.browser = await self.playwright.chromium.launch(
                headless=headless,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            )
            
            # Create context (like Kiko's bot)
            self.context = await self.browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            
            # Create page (don't load cookies here - let test script handle it)
            self.page = await self.context.new_page()
            
            logger.info("✅ Playwright browser initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error initializing browser: {e}")
            return False

    async def load_cookies(self, context):
        """Load cookies from file (like Kiko's bot)"""
        try:
            cookies_file = self.config.get("files", {}).get("cookies", "fanvue-cookies.json")
            cookies_path = self.config_dir / cookies_file
            
            if not cookies_path.exists():
                logger.info("⚠️ No cookies file found")
                return False
                
            with open(cookies_path, 'r') as f:
                cookies = json.load(f)
            
            # Fix sameSite values for Playwright compatibility (like Kiko's bot)
            for cookie in cookies:
                if 'sameSite' in cookie:
                    if cookie['sameSite'] == 'unspecified':
                        cookie['sameSite'] = 'Lax'
                    elif cookie['sameSite'] == 'no_restriction':
                        cookie['sameSite'] = 'None'
                    elif cookie['sameSite'] == 'lax':
                        cookie['sameSite'] = 'Lax'
                    elif cookie['sameSite'] == 'strict':
                        cookie['sameSite'] = 'Strict'
            
            logger.info(f"📄 Found {len(cookies)} cookies in file")
            await context.add_cookies(cookies)
            logger.info(f"✅ Added {len(cookies)} cookies")
            return True
                
        except Exception as e:
            logger.error(f"❌ Failed to load cookies: {e}")
            return False

    async def go_to_website(self):
        """Go to Fanvue website"""
        try:
            base_url = self.config.get("base_url", "https://www.fanvue.com")
            await self.page.goto(base_url)
            await asyncio.sleep(3)
            logger.info("✅ Navigated to Fanvue website")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error going to website: {e}")
            return False

    async def load_cookies_like_posting_bot(self):
        """Load cookies using the same proven approach as the working posting bot"""
        try:
            cookies_file = self.config.get("files", {}).get("cookies", "fanvue-cookies.json")
            cookies_path = self.config_dir / cookies_file
            
            if not cookies_path.exists():
                logger.error(f"❌ No cookies file found: {cookies_path}")
                return False
            
            with open(cookies_path, 'r') as f:
                cookies = json.load(f)
            
            logger.info(f"📄 Found {len(cookies)} cookies")
            
            # Navigate to domain first (like posting bot)
            await self.page.goto("https://www.fanvue.com")
            await asyncio.sleep(2)
            
            # Add cookies with format fixing (like posting bot)
            formatted_cookies = []
            for cookie in cookies:
                formatted_cookie = {
                    'name': cookie['name'],
                    'value': cookie['value'],
                    'domain': cookie.get('domain', '.fanvue.com'),
                    'path': cookie.get('path', '/'),
                    'httpOnly': cookie.get('httpOnly', False),
                    'secure': cookie.get('secure', False)
                }
                
                # Handle sameSite properly
                if 'sameSite' in cookie:
                    if cookie['sameSite'] == 'unspecified':
                        formatted_cookie['sameSite'] = 'Lax'
                    elif cookie['sameSite'] == 'no_restriction':
                        formatted_cookie['sameSite'] = 'None'
                    else:
                        formatted_cookie['sameSite'] = cookie['sameSite'].capitalize()
                
                formatted_cookies.append(formatted_cookie)
            
            # Add cookies to context
            await self.context.add_cookies(formatted_cookies)
            logger.info(f"✅ Added {len(formatted_cookies)} cookies like posting bot")
            return True
                
        except Exception as e:
            logger.error(f"❌ Failed to load cookies like posting bot: {e}")
            return False

    async def login_to_fanvue(self):
        """Login to Fanvue with email and password (Fleur account)"""
        try:
            logger.info("🔐 Starting Fanvue login process...")
            
            # Navigate to signin page
            await self.page.goto("https://www.fanvue.com/signin")
            await asyncio.sleep(3)
            
            # Human-like delay before typing
            await asyncio.sleep(random.uniform(1, 2))
            
            # Find and click email field using new Material-UI selector
            email_selector = 'input[name="email"][type="email"]'
            logger.info("📧 Filling email field...")
            await self.page.wait_for_selector(email_selector, timeout=10000)
            await self.page.click(email_selector)
            await asyncio.sleep(random.uniform(0.5, 1))
            
            # Clear field and type email with human-like speed
            await self.page.keyboard.press('Control+a')
            await asyncio.sleep(0.1)
            email = "koljeroen539@gmail.com"
            for char in email:
                await self.page.keyboard.type(char)
                await asyncio.sleep(random.uniform(0.05, 0.15))
            
            logger.info("✅ Email entered")
            await asyncio.sleep(random.uniform(0.5, 1))
            
            # Find and click password field using new Material-UI selector
            password_selector = 'input[name="password"][type="password"]'
            logger.info("🔑 Filling password field...")
            await self.page.wait_for_selector(password_selector, timeout=10000)
            await self.page.click(password_selector)
            await asyncio.sleep(random.uniform(0.5, 1))
            
            # Clear field and type password with human-like speed
            await self.page.keyboard.press('Control+a')
            await asyncio.sleep(0.1)
            password = "Boerderij100"
            for char in password:
                await self.page.keyboard.type(char)
                await asyncio.sleep(random.uniform(0.05, 0.15))
            
            logger.info("✅ Password entered")
            await asyncio.sleep(random.uniform(1, 2))
            
            # Find and click sign in button using Material-UI selector
            signin_button_selector = 'span:has-text("Sign In")'
            logger.info("🚀 Clicking Sign In button...")
            await self.page.wait_for_selector(signin_button_selector, timeout=10000)
            await self.page.click(signin_button_selector)
            
            # Wait for login to complete
            await asyncio.sleep(8)
            
            # Verify login success by checking URL
            current_url = self.page.url
            if '/signin' not in current_url and 'fanvue.com' in current_url:
                logger.info("✅ Successfully logged in to Fanvue!")
                return True
            else:
                logger.error(f"❌ Login failed, still on signin page: {current_url}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error during login: {e}")
            return False

    async def click_messages_button(self):
        """Navigate to messages page using proven multi-method approach"""
        try:
            logger.info("💬 Navigating to messages page...")
            
            # Method 1: Try direct navigation first (bypasses button clicking)
            try:
                logger.info("🌐 Attempting direct navigation to messages...")
                await self.page.goto("https://www.fanvue.com/messages")
                await asyncio.sleep(3)
                
                # Verify we're on messages page
                current_url = self.page.url
                if '/messages' in current_url:
                    logger.info("✅ Successfully navigated to messages page via direct URL")
                    return True
                else:
                    logger.info(f"⏳ Direct navigation failed, still on: {current_url}")
            except Exception as e:
                logger.info(f"⏳ Direct navigation failed: {e}")
            
            # Method 2: Try clicking with proven selectors from working bot
            messages_selectors = [
                'a[data-sentry-element="NavigationItem"][data-sentry-component="ChatMenuItem"][aria-label="Messages"]',
                'a[data-sentry-element="NavigationItem"][data-sentry-component="ChatMenuItem"]',
                'a:has(svg[data-sentry-component="MessageCircleOutlineIcon"])',
                'a.MuiTypography-root[aria-label="Messages"][href="/messages"]',
                'a[aria-label="Messages"][href="/messages"]',
                'a[href="/messages"]'
            ]
            
            for selector in messages_selectors:
                try:
                    logger.info(f"🔍 Trying selector: {selector}")
                    await self.page.wait_for_selector(selector, timeout=5000)
                    await self.page.click(selector)
                    await asyncio.sleep(3)
                    
                    # Verify navigation worked
                    if '/messages' in self.page.url:
                        logger.info("✅ Successfully clicked messages button")
                        return True
                        
                except Exception as e:
                    logger.info(f"⏳ Selector {selector} failed: {e}")
                    continue
            
            logger.error("❌ All methods failed to navigate to messages")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error navigating to messages: {e}")
            return False

    async def click_new_mass_dm_button(self):
        """Click the new mass DM button using the exact selector"""
        try:
            # Exact selector from the provided HTML
            new_mass_dm_selector = 'button[aria-label="New mass message"]'
            
            await self.page.wait_for_selector(new_mass_dm_selector, timeout=10000)
            await self.page.click(new_mass_dm_selector)
            time.sleep(3)
            
            logger.info("✅ Clicked new mass DM button")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking new mass DM button: {e}")
            return False

    def click_select_lists_button(self):
        """Click the select lists button using the exact selector"""
        try:
            # Exact selector from the provided HTML
            select_lists_selector = 'button:has-text("Select lists")'
            
            await self.page.wait_for_selector(select_lists_selector, timeout=10000)
            await self.page.click(select_lists_selector)
            time.sleep(3)
            
            logger.info("✅ Clicked select lists button")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking select lists button: {e}")
            return False

    async def select_audience(self, audience_type="all_contacts"):
        """Select audience type using the exact radio button selectors"""
        try:
            # Map audience types to their radio button values
            audience_mapping = {
                "all_contacts": "6",
                "online": "4", 
                "followers": "3",
                "subscribers": "2",
                "non_renewing": "7",
                "auto_renewing": "8",
                "expired_subscribers": "9",
                "free_trial_subscribers": "10"
            }
            
            # Get the value for the selected audience type
            value = audience_mapping.get(audience_type, "6")  # Default to all_contacts
            
            # Exact selector for radio buttons
            radio_selector = f'input[type="radio"][value="{value}"]'
            
            # Wait for the radio button to be available
            self.page.wait_for_selector(radio_selector, timeout=10000)
            
            # Check if the radio button is disabled
            is_disabled = self.page.locator(radio_selector).is_disabled()
            
            if is_disabled:
                logger.warning(f"⚠️ {audience_type} option is disabled, trying fallback options")
                
                # Try fallback options
                fallback_options = self.config.get("audience_selection", {}).get("fallback_options", ["online", "followers", "all_contacts"])
                
                for fallback in fallback_options:
                    fallback_value = audience_mapping.get(fallback, "6")
                    fallback_selector = f'input[type="radio"][value="{fallback_value}"]'
                    
                    try:
                        is_fallback_disabled = await self.page.locator(fallback_selector).is_disabled()
                        if not is_fallback_disabled:
                            self.page.click(fallback_selector)
                            time.sleep(1)
                            logger.info(f"✅ Selected fallback audience: {fallback}")
                            return True
                    except:
                        continue
                
                logger.error("❌ No available audience options found")
                return False
            else:
                # Click the radio button
                self.page.click(radio_selector)
                time.sleep(1)
                logger.info(f"✅ Selected audience: {audience_type}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error selecting audience: {e}")
            return False

    def click_save_button(self):
        """Click the save button using the exact selector"""
        try:
            # Exact selector from the provided HTML
            save_selector = 'button:has-text("Save")'
            
            self.page.wait_for_selector(save_selector, timeout=10000)
            self.page.click(save_selector)
            time.sleep(3)
            
            logger.info("✅ Clicked save button")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking save button: {e}")
            return False

    def click_excluding_list_button(self):
        """Click the excluding list button (optional step)"""
        try:
            # Look for the excluding list button (same structure as select lists)
            excluding_selector = 'button:has-text("Select lists")'
            
            # Check if there are multiple "Select lists" buttons (indicating excluding list option)
            buttons = self.page.query_selector_all('button:has-text("Select lists")')
            
            if len(buttons) > 1:
                # Click the second "Select lists" button (excluding list)
                buttons[1].click()
                time.sleep(3)
                logger.info("✅ Clicked excluding list button")
                return True
            else:
                logger.info("ℹ️ No excluding list option found, continuing...")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error clicking excluding list button: {e}")
            return False

    def select_excluding_audience(self, excluding_type=None):
        """Select excluding audience (optional)"""
        try:
            if not excluding_type:
                logger.info("ℹ️ No excluding audience specified, skipping...")
                return True
            
            # Same mapping as regular audience selection
            audience_mapping = {
                "all_contacts": "6",
                "online": "4", 
                "followers": "3",
                "subscribers": "2",
                "non_renewing": "7",
                "auto_renewing": "8",
                "expired_subscribers": "9",
                "free_trial_subscribers": "10"
            }
            
            value = audience_mapping.get(excluding_type, "6")
            radio_selector = f'input[type="radio"][value="{value}"]'
            
            self.page.wait_for_selector(radio_selector, timeout=10000)
            is_disabled = self.page.locator(radio_selector).is_disabled()
            
            if not is_disabled:
                self.page.click(radio_selector)
                time.sleep(1)
                logger.info(f"✅ Selected excluding audience: {excluding_type}")
                return True
            else:
                logger.warning(f"⚠️ Excluding audience {excluding_type} is disabled, skipping...")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error selecting excluding audience: {e}")
            return False

    def fill_message_text(self, message):
        """Fill the message text in the textarea"""
        try:
            # Exact selector from the provided HTML
            textarea_selector = 'textarea[placeholder="Type a message..."]'
            
            self.page.wait_for_selector(textarea_selector, timeout=10000)
            self.page.fill(textarea_selector, message)
            time.sleep(1)
            
            logger.info(f"✅ Filled message text: {message[:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error filling message text: {e}")
            return False

    def click_vault_button(self):
        """Click the vault button to add media from vault"""
        try:
            # Exact selector from the provided HTML
            vault_selector = 'svg[data-sentry-component="PhotoLibraryOutlinedIcon"]'
            
            self.page.wait_for_selector(vault_selector, timeout=10000)
            self.page.click(vault_selector)
            time.sleep(3)
            
            logger.info("✅ Clicked vault button")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking vault button: {e}")
            return False

    def click_filter_button(self):
        """Click the filter button to select folders"""
        try:
            # Exact selector from the provided HTML
            filter_selector = 'div[role="combobox"][aria-label="folders"]'
            
            self.page.wait_for_selector(filter_selector, timeout=10000)
            self.page.click(filter_selector)
            time.sleep(2)
            
            logger.info("✅ Clicked filter button")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking filter button: {e}")
            return False

    def select_filter_option(self, filter_name):
        """Select a specific filter option"""
        try:
            # Click on the filter option that matches the name
            filter_option_selector = f'li:has-text("{filter_name}"), div:has-text("{filter_name}")'
            
            self.page.wait_for_selector(filter_option_selector, timeout=10000)
            self.page.click(filter_option_selector)
            time.sleep(2)
            
            logger.info(f"✅ Selected filter: {filter_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error selecting filter option: {e}")
            return False

    def select_media_from_vault(self, filter_name, media_count=1):
        """Select media from vault using scrolling and selection logic"""
        try:
            logger.info(f"📸 Selecting {media_count} media items from vault with filter: {filter_name}")
            
            # Wait for media grid to load
            self.page.wait_for_selector('[data-testid="media-item"], .media-item, img', timeout=10000)
            time.sleep(2)
            
            selected_count = 0
            max_scroll_attempts = 10
            scroll_attempts = 0
            
            while selected_count < media_count and scroll_attempts < max_scroll_attempts:
                # Find all media items
                media_items = self.page.query_selector_all('[data-testid="media-item"], .media-item, img')
                
                if not media_items:
                    logger.warning("⚠️ No media items found")
                    break
                
                # Try to select available media items
                for item in media_items:
                    if selected_count >= media_count:
                        break
                    
                    try:
                        # Check if item is already selected
                        is_selected = item.evaluate('el => el.classList.contains("selected") || el.getAttribute("data-selected") === "true"')
                        
                        if not is_selected:
                            item.click()
                            time.sleep(0.5)
                            selected_count += 1
                            logger.info(f"✅ Selected media item {selected_count}")
                    except Exception as e:
                        logger.warning(f"⚠️ Could not select media item: {e}")
                        continue
                
                # If we need more items, scroll down
                if selected_count < media_count:
                    self.page.evaluate('window.scrollBy(0, 500)')
                    time.sleep(2)
                    scroll_attempts += 1
                    logger.info(f"📜 Scrolled down (attempt {scroll_attempts})")
            
            logger.info(f"✅ Selected {selected_count} media items from vault")
            return selected_count > 0
            
        except Exception as e:
            logger.error(f"❌ Error selecting media from vault: {e}")
            return False

    def click_add_media_button(self):
        """Click the add media button"""
        try:
            # Exact selector from the provided HTML
            add_media_selector = 'button:has-text("Add Media")'
            
            self.page.wait_for_selector(add_media_selector, timeout=10000)
            self.page.click(add_media_selector)
            time.sleep(3)
            
            logger.info("✅ Clicked add media button")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking add media button: {e}")
            return False

    def click_send_mass_dm_button(self):
        """Click the send mass DM button"""
        try:
            # Exact selector from the provided HTML
            send_selector = 'button[aria-label="Send"][type="submit"]'
            
            self.page.wait_for_selector(send_selector, timeout=10000)
            self.page.click(send_selector)
            time.sleep(3)
            
            logger.info("✅ Clicked send mass DM button")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking send mass DM button: {e}")
            return False

    def click_price_button(self):
        """Click the set post price button"""
        try:
            # Exact selector from the provided HTML
            price_button_selector = 'button[aria-label="Set post price"]'
            
            self.page.wait_for_selector(price_button_selector, timeout=10000)
            self.page.click(price_button_selector)
            time.sleep(2)
            
            logger.info("✅ Clicked price button")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking price button: {e}")
            return False

    def set_price_value(self, price):
        """Set the price value in the price input field"""
        try:
            # Exact selector from the provided HTML
            price_input_selector = 'input[name="price"][type="number"]'
            
            self.page.wait_for_selector(price_input_selector, timeout=10000)
            
            # Click on the input field to focus it
            self.page.click(price_input_selector)
            time.sleep(0.5)
            
            # Clear the field by pressing backspace multiple times
            self.page.keyboard.press("Backspace")
            time.sleep(0.2)
            self.page.keyboard.press("Backspace")
            time.sleep(0.2)
            self.page.keyboard.press("Backspace")
            time.sleep(0.2)
            
            # Type the new price value
            self.page.fill(price_input_selector, str(price))
            time.sleep(1)
            
            logger.info(f"✅ Set price value: ${price}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error setting price value: {e}")
            return False

    def click_set_price_button(self):
        """Click the 'Set the price' button"""
        try:
            # Exact selector from the provided HTML
            set_price_selector = 'button:has-text("Set the price")'
            
            self.page.wait_for_selector(set_price_selector, timeout=10000)
            self.page.click(set_price_selector)
            time.sleep(2)
            
            logger.info("✅ Clicked set price button")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking set price button: {e}")
            return False

    def click_post_button(self):
        """Click the post/send button after setting price"""
        try:
            # Exact selector from the provided HTML (same as send button)
            post_selector = 'button[aria-label="Send"][type="submit"]'
            
            self.page.wait_for_selector(post_selector, timeout=10000)
            self.page.click(post_selector)
            time.sleep(3)
            
            logger.info("✅ Clicked post button")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking post button: {e}")
            return False

    async def check_login(self):
        """Check if user is logged in (like posting bot)"""
        try:
            logger.info("🔍 Checking login status...")
            
            # Check for login indicators
            login_indicators = [
                'a[href*="signin"]',
                'button:has-text("Sign In")',
                '[data-testid="login-button"]'
            ]
            
            for indicator in login_indicators:
                try:
                    if await self.page.locator(indicator).is_visible(timeout=2000):
                        logger.warning("⚠️ Not logged in - login indicators found")
                        return False
                except:
                    continue
            
            logger.info("✅ Appears to be logged in")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error checking login status: {e}")
            return False

    def navigate_to_messages(self):
        """Navigate to messages page"""
        try:
            messages_url = self.config.get("messages_url", "https://www.fanvue.com/messages")
            self.page.goto(messages_url)
            time.sleep(3)
            
            logger.info("✅ Navigated to messages page")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error navigating to messages: {e}")
            return False

    def get_conversations(self):
        """Get all conversation elements"""
        try:
            # Wait for conversations to load
            self.page.wait_for_selector('[data-testid="conversation-item"]', timeout=10000)
            
            conversations = self.page.query_selector_all('[data-testid="conversation-item"]')
            
            if not conversations:
                logger.warning("⚠️ No conversations found")
                return []
            
            logger.info(f"✅ Found {len(conversations)} conversations")
            return conversations
            
        except Exception as e:
            logger.error(f"❌ Error getting conversations: {e}")
            return []

    def step_click_conversation(self, conversation_element):
        """Click on a conversation"""
        try:
            conversation_element.click()
            time.sleep(2)
            logger.info("✅ Clicked conversation")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking conversation: {e}")
            return False

    def step_wait_for_message_input(self):
        """Wait for message input to be available"""
        try:
            self.page.wait_for_selector('textarea[placeholder*="message"], textarea[placeholder*="Message"]', timeout=10000)
            logger.info("✅ Message input ready")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error waiting for message input: {e}")
            return False

    def step_fill_message_text(self, message):
        """Fill message text"""
        try:
            textarea_selector = 'textarea[placeholder*="message"], textarea[placeholder*="Message"]'
            self.page.fill(textarea_selector, message)
            time.sleep(1)
            
            logger.info(f"✅ Filled message text: {message[:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error filling message text: {e}")
            return False

    def step_click_attach_button(self):
        """Click attach button"""
        try:
            attach_selectors = [
                'button[aria-label*="attach"]',
                'button:has-text("Attach")',
                '[data-testid="attach-button"]'
            ]
            
            for selector in attach_selectors:
                try:
                    if self.page.locator(selector).is_visible(timeout=2000):
                        self.page.click(selector)
                        time.sleep(2)
                        logger.info("✅ Clicked attach button")
                        return True
                except:
                    continue
            
            logger.warning("⚠️ Attach button not found")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error clicking attach button: {e}")
            return False

    def step_upload_media(self, file_paths):
        """Upload media files"""
        try:
            # Handle file upload
            file_input_selector = 'input[type="file"]'
            self.page.set_input_files(file_input_selector, file_paths)
            time.sleep(3)
            
            logger.info(f"✅ Uploaded {len(file_paths)} media files")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error uploading media: {e}")
            return False

    def step_select_bundle_option(self, bundle_size):
        """Select bundle option"""
        try:
            bundle_selector = f'input[value="{bundle_size}"], [data-testid="bundle-{bundle_size}"]'
            self.page.click(bundle_selector)
            time.sleep(1)
            
            logger.info(f"✅ Selected bundle size: {bundle_size}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error selecting bundle option: {e}")
            return False

    def step_set_price(self, price):
        """Set price for bundle"""
        try:
            price_selector = 'input[placeholder*="price"], input[type="number"]'
            self.page.fill(price_selector, str(price))
            time.sleep(1)
            
            logger.info(f"✅ Set price: €{price}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error setting price: {e}")
            return False

    def step_send_message(self):
        """Send the message"""
        try:
            send_selectors = [
                'button:has-text("Send")',
                'button[type="submit"]',
                '[data-testid="send-button"]'
            ]
            
            for selector in send_selectors:
                try:
                    if self.page.locator(selector).is_visible(timeout=2000):
                        self.page.click(selector)
                        time.sleep(3)
                        logger.info("✅ Message sent")
                        return True
                except:
                    continue
            
            logger.warning("⚠️ Send button not found")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error sending message: {e}")
            return False

    def step_click_messages_button(self):
        """Click messages button to go back"""
        try:
            messages_selectors = [
                'a.MuiTypography-root[aria-label="Messages"][href="/messages"]',
                'a[aria-label="Messages"][href="/messages"]',
                'a[href="/messages"]',
                'a[href*="messages"]',
                'button:has-text("Messages")',
                'text=Messages',
                '[data-testid="messages-button"]'
            ]
            
            for selector in messages_selectors:
                try:
                    if self.page.locator(selector).is_visible(timeout=2000):
                        self.page.click(selector)
                        time.sleep(2)
                        logger.info("✅ Clicked messages button")
                        return True
                except:
                    continue
            
            logger.warning("⚠️ Messages button not found")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error clicking messages button: {e}")
            return False

    def step_click_new_mass_message(self):
        """Click new mass message button"""
        try:
            mass_message_selectors = [
                'button:has-text("New Mass Message")',
                'button:has-text("Mass Message")',
                '[data-testid="mass-message-button"]'
            ]
            
            for selector in mass_message_selectors:
                try:
                    if self.page.locator(selector).is_visible(timeout=2000):
                        self.page.click(selector)
                        time.sleep(2)
                        logger.info("✅ Clicked new mass message button")
                        return True
                except:
                    continue
            
            logger.warning("⚠️ New mass message button not found")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error clicking new mass message: {e}")
            return False

    def step_click_select_lists(self):
        """Click select lists button"""
        try:
            lists_selectors = [
                'button:has-text("Select Lists")',
                'button:has-text("Lists")',
                '[data-testid="select-lists-button"]'
            ]
            
            for selector in lists_selectors:
                try:
                    if self.page.locator(selector).is_visible(timeout=2000):
                        self.page.click(selector)
                        time.sleep(2)
                        logger.info("✅ Clicked select lists button")
                        return True
                except:
                    continue
            
            logger.warning("⚠️ Select lists button not found")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error clicking select lists: {e}")
            return False

    def step_select_all_members(self):
        """Select all members"""
        try:
            all_members_selectors = [
                'input[type="checkbox"]',
                '[data-testid="select-all"]',
                'button:has-text("Select All")'
            ]
            
            for selector in all_members_selectors:
                try:
                    if self.page.locator(selector).is_visible(timeout=2000):
                        self.page.click(selector)
                        time.sleep(1)
                        logger.info("✅ Selected all members")
                        return True
                except:
                    continue
            
            logger.warning("⚠️ Select all members option not found")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error selecting all members: {e}")
            return False

    def step_click_save_button(self):
        """Click save button"""
        try:
            save_selectors = [
                'button:has-text("Save")',
                'button:has-text("Confirm")',
                '[data-testid="save-button"]'
            ]
            
            for selector in save_selectors:
                try:
                    if self.page.locator(selector).is_visible(timeout=2000):
                        self.page.click(selector)
                        time.sleep(2)
                        logger.info("✅ Clicked save button")
                        return True
                except:
                    continue
            
            logger.warning("⚠️ Save button not found")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error clicking save button: {e}")
            return False

    def send_text_only_message(self, conversation_element, message):
        """Send text-only message"""
        try:
            logger.info("💬 Sending text-only message")
            
            # Click conversation
            if not self.step_click_conversation(conversation_element):
                return False
            
            # Wait for message input
            if not self.step_wait_for_message_input():
                return False
            
            # Fill message text
            if not self.step_fill_message_text(message):
                return False
            
            # Send message
            if not self.step_send_message():
                return False
            
            # Go back to messages
            self.step_click_messages_button()
            
            logger.info("✅ Text-only message sent successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error sending text-only message: {e}")
            return False

    def send_bundle_text_message(self, conversation_element, message, bundle_size, price):
        """Send bundle + text message"""
        try:
            logger.info(f"📦 Sending bundle + text message (size: {bundle_size}, price: €{price})")
            
            # Click conversation
            if not self.step_click_conversation(conversation_element):
                return False
            
            # Wait for message input
            if not self.step_wait_for_message_input():
                return False
            
            # Fill message text
            if not self.step_fill_message_text(message):
                return False
            
            # Click attach button
            if not self.step_click_attach_button():
                return False
            
            # Upload media (placeholder - would need actual file paths)
            # self.step_upload_media(file_paths)
            
            # Select bundle option
            if not self.step_select_bundle_option(bundle_size):
                return False
            
            # Set price
            if not self.step_set_price(price):
                return False
            
            # Send message
            if not self.step_send_message():
                return False
            
            # Go back to messages
            self.step_click_messages_button()
            
            logger.info("✅ Bundle + text message sent successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error sending bundle + text message: {e}")
            return False

    def send_photo_text_message(self, conversation_element, message, photo_path=None):
        """Send photo + text message"""
        try:
            logger.info("📸 Sending photo + text message")
            
            # Click conversation
            if not self.step_click_conversation(conversation_element):
                return False
            
            # Wait for message input
            if not self.step_wait_for_message_input():
                return False
            
            # Fill message text
            if not self.step_fill_message_text(message):
                return False
            
            # Click attach button
            if not self.step_click_attach_button():
                return False
            
            # Upload photo (placeholder - would need actual file path)
            if photo_path:
                # self.step_upload_media([photo_path])
                pass
            
            # Send message
            if not self.step_send_message():
                return False
            
            # Go back to messages
            self.step_click_messages_button()
            
            logger.info("✅ Photo + text message sent successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error sending photo + text message: {e}")
            return False

    async def setup_mass_dm_flow(self, phase_type="text_only", phase_config=None):
        """Setup the mass DM flow with audience selection"""
        try:
            logger.info("🎯 Setting up mass DM flow")
            
            # 1. Click messages button (navigation already done by test script)
            if not await self.click_messages_button():
                return False
            
            # 3. Click new mass DM button
            if not self.click_new_mass_dm_button():
                return False
            
            # 4. Click select lists button
            if not self.click_select_lists_button():
                return False
            
            # 5. Select audience
            default_audience = self.config.get("audience_selection", {}).get("default", "all_contacts")
            if not self.select_audience(default_audience):
                return False
            
            # 6. Click save button
            if not self.click_save_button():
                return False
            
            # 7. (Optional) Click excluding list button
            if self.config.get("excluding_list", {}).get("enabled", False):
                if not self.click_excluding_list_button():
                    return False
                
                # 8. Select excluding audience
                excluding_type = self.config.get("excluding_list", {}).get("audience_type")
                if excluding_type:
                    if not self.select_excluding_audience(excluding_type):
                        return False
                
                # 9. Click save button again
                if not self.click_save_button():
                    return False
            
            # 10. Fill message text
            if phase_config and "file" in phase_config:
                message_manager = MessageManager(phase_config["file"], str(self.config_dir))
            else:
                message_manager = MessageManager("default.xlsx", str(self.config_dir))
            
            message = message_manager.get_random_message()
            if not self.fill_message_text(message):
                return False
            
            # Handle different message types
            if phase_type == "text_only":
                # For text only, just send the message
                logger.info("💬 Text-only message - sending directly")
                if not self.click_send_mass_dm_button():
                    return False
                    
            elif phase_type in ["photo_text", "bundle_text"]:
                # For photo/bundle messages, add media from vault
                logger.info(f"📸 {phase_type} message - adding media from vault")
                
                # 11. Click vault button
                if not self.click_vault_button():
                    return False
                
                # 12. Click filter button
                if not self.click_filter_button():
                    return False
                
                # 13. Select filter option
                if phase_config and "filter" in phase_config:
                    filter_name = phase_config["filter"]
                else:
                    filter_name = self.config.get("media_settings", {}).get("vault_filter", "All folders")
                
                if not self.select_filter_option(filter_name):
                    return False
                
                # 14. Select media from vault
                if phase_type == "bundle_text":
                    media_count = phase_config.get("bundle_size", 3) if phase_config else 3
                else:
                    media_count = self.config.get("media_settings", {}).get("media_count", 1)
                
                if not self.select_media_from_vault(filter_name, media_count):
                    return False
                
                # 15. Click add media button
                if not self.click_add_media_button():
                    return False
                
                # 16. Handle pricing (for bundle messages or photo messages with pricing enabled)
                should_set_price = False
                if phase_type == "bundle_text" and self.config.get("pricing", {}).get("bundle_text_enabled", True):
                    should_set_price = True
                elif phase_type == "photo_text" and self.config.get("pricing", {}).get("photo_text_enabled", False):
                    should_set_price = True
                
                if should_set_price:
                    # Get price from phase config or use default
                    if phase_config and "price" in phase_config:
                        price = phase_config["price"]
                    else:
                        price = self.config.get("pricing", {}).get("default_price", 15)
                    
                    # Click price button
                    if not self.click_price_button():
                        return False
                    
                    # Set price value
                    if not self.set_price_value(price):
                        return False
                    
                    # Click set price button
                    if not self.click_set_price_button():
                        return False
                
                # 17. Click send mass DM button
                if not self.click_send_mass_dm_button():
                    return False
            
            logger.info("✅ Mass DM flow setup completed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error setting up mass DM flow: {e}")
            return False

    async def run_mass_dm_session(self, phase_time):
        """Run mass DM session for a specific phase"""
        try:
            logger.info(f"🎯 Starting mass DM session for phase {phase_time}")
            
            # Get phase configuration
            phases = self.config.get("phases", {})
            if phase_time not in phases:
                logger.error(f"❌ Phase {phase_time} not found in configuration")
                return False
            
            phase_config = phases[phase_time]
            phase_type = phase_config.get("type", "text_only")
            
            # Check if phase already completed
            if self.phase_tracker.is_phase_completed_today(phase_time):
                logger.info(f"✅ Phase {phase_time} already completed today")
                return True
            
            # Setup mass DM flow
            if not await self.setup_mass_dm_flow(phase_type, phase_config):
                return False
            
            # Initialize message manager
            message_file = phase_config.get("file", "default.xlsx")
            message_manager = MessageManager(message_file, str(self.config_dir))
            
            # Get conversations
            conversations = await self.get_conversations()
            if not conversations:
                logger.warning("⚠️ No conversations available for mass DM")
                return False
            
            # Get random message
            message = message_manager.get_random_message()
            
            # Send messages based on phase type
            mass_dm_settings = self.config.get("mass_dm_settings", {})
            max_dms = mass_dm_settings.get("max_dms", 5)
            delay_between_dms = mass_dm_settings.get("delay_between_dms", 30)
            
            success_count = 0
            
            for i, conversation in enumerate(conversations[:max_dms]):
                logger.info(f"📤 Sending DM {i+1}/{min(len(conversations), max_dms)}")
                
                success = False
                
                if phase_type == "text_only":
                    success = await self.send_text_only_message(conversation, message)
                elif phase_type == "bundle_text":
                    bundle_size = phase_config.get("bundle_size", 3)
                    price = phase_config.get("price", 15)
                    success = await self.send_bundle_text_message(conversation, message, bundle_size, price)
                elif phase_type == "photo_text":
                    success = await self.send_photo_text_message(conversation, message)
                else:
                    logger.warning(f"⚠️ Unknown phase type: {phase_type}")
                    continue
                
                if success:
                    success_count += 1
                    message_manager.move_to_used_messages(message)
                    
                    # Get new message for next DM
                    message = message_manager.get_random_message()
                
                # Delay between DMs
                if i < len(conversations) - 1 and i < max_dms - 1:
                    logger.info(f"⏰ Waiting {delay_between_dms} seconds before next DM...")
                    await asyncio.sleep(delay_between_dms)
            
            # Mark phase as completed
            if success_count > 0:
                self.phase_tracker.mark_phase_completed(phase_time)
                logger.info(f"✅ Mass DM session completed: {success_count} messages sent")
                return True
            else:
                logger.warning("⚠️ No messages sent successfully")
                return False
            
        except Exception as e:
            logger.error(f"❌ Error in mass DM session: {e}")
            return False

    async def run(self):
        """Main run method"""
        try:
            logger.info("🤖 Starting Fanvue Mass DM Bot")
            
            # Reset phase tracker if new day
            self.phase_tracker.reset_if_new_day()
            
            # Initialize browser
            if not await self.init_browser():
                return False
            
            # Load cookies and navigate using proven posting bot approach
            if not await self.load_cookies_like_posting_bot():
                logger.warning("⚠️ Failed to load cookies, will try without authentication")
            
            # Navigate to home page like posting bot
            await self.page.goto("https://www.fanvue.com/home")
            await asyncio.sleep(3)
            
            logger.info("✅ Browser initialized with cookies and navigated to home")
            
            # Get current time
            current_time = datetime.now().strftime("%H:%M")
            
            # Check if current time matches any phase
            phases = self.config.get("phases", {})
            if current_time in phases:
                logger.info(f"⏰ Current time {current_time} matches phase configuration")
                success = await self.run_mass_dm_session(current_time)
                return success
            else:
                logger.info(f"⏰ Current time {current_time} doesn't match any phase")
                logger.info(f"📅 Available phases: {list(phases.keys())}")
                return True
            
        except Exception as e:
            logger.error(f"❌ Bot failed: {e}")
            return False
        finally:
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()


async def main():
    """Main entry point"""
    import sys
    
    # Check for testing mode
    testing_mode = "--test" in sys.argv
    
    # Create bot instance
    bot = FanvueMassDMBot()
    
    # Run bot
    success = await bot.run()
    
    if success:
        logger.info("✅ Bot completed successfully")
        sys.exit(0)
    else:
        logger.error("❌ Bot failed")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
