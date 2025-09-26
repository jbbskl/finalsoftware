#!/usr/bin/env python3
"""
Fanvue Posting Bot - Standardized Template
- Works with crontab scheduling
- Tracks daily progress (1-10 posts per day)
- Creates exactly 1 post per execution
- Copy this template for new clients
"""

import os
import json
import time
import random
import pandas as pd
import fcntl
import psutil
from datetime import datetime
from playwright.sync_api import sync_playwright
import logging
from pathlib import Path

# Configuration - Load from config.yaml or use defaults
CONFIG = {
    'baseUrl': 'https://www.fanvue.com',
    'createUrl': 'https://www.fanvue.com/create',
    'cookiesFile': './fanvue-cookies.json',
    'captionsFile': './fanvuepostingcaptions.xlsx',
    'usedCaptionsFile': './used_fanvuepostingcaptions.xlsx',
    'usedMediaFile': './used_media.json',
    'dailyProgressFile': './daily_progress.json',
    'maxPostsPerDay': 10,
    'headless': True,
    'buttonDelay': 3,
    'filterDelay': 4,
    'defaultFilter': 'lingerie video',
    'logFile': './posting_bot.log'
}

# Set up logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(CONFIG['logFile']),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BotLock:
    """PID-aware file lock to prevent multiple instances"""
    def __init__(self, lock_path="./bot.lock"):
        self.lock_path = lock_path
        self.f = None
    
    def __enter__(self):
        self.f = open(self.lock_path, "a+")
        try:
            fcntl.flock(self.f, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            # Check if lock is stale
            self.f.seek(0)
            try:
                data = json.load(self.f)
                pid = data.get("pid")
                if not (pid and psutil.pid_exists(pid)):
                    # Stale lock - clear and retry
                    self.f.truncate(0)
                    self.f.flush()
                    time.sleep(0.1)
                    fcntl.flock(self.f, fcntl.LOCK_EX | fcntl.LOCK_NB)
                else:
                    raise RuntimeError("Another instance is running")
            except Exception:
                raise RuntimeError("Another instance is running")
        
        # Write our PID
        self.f.seek(0)
        self.f.truncate(0)
        json.dump({"pid": os.getpid(), "time": time.time()}, self.f)
        self.f.flush()
        return self
    
    def __exit__(self, *exc):
        try:
            self.f.truncate(0)
            self.f.flush()
        finally:
            fcntl.flock(self.f, fcntl.LOCK_UN)
            self.f.close()
            try:
                os.unlink(self.lock_path)
            except:
                pass

class FanvuePostingBot:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None
        
    def get_daily_progress(self):
        """Get today's posting progress (0-10)"""
        try:
            if not os.path.exists(CONFIG['dailyProgressFile']):
                return 0
            
            with open(CONFIG['dailyProgressFile'], 'r') as f:
                progress = json.load(f)
            
            today = datetime.now().strftime('%Y-%m-%d')
            return progress.get(today, 0)
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to get daily progress: {e}")
            return 0
    
    def update_daily_progress(self, post_number):
        """Update today's posting progress"""
        try:
            progress = {}
            if os.path.exists(CONFIG['dailyProgressFile']):
                with open(CONFIG['dailyProgressFile'], 'r') as f:
                    progress = json.load(f)
            
            today = datetime.now().strftime('%Y-%m-%d')
            progress[today] = post_number
            
            with open(CONFIG['dailyProgressFile'], 'w') as f:
                json.dump(progress, f, indent=2)
            
            logger.info(f"📊 Updated daily progress: {post_number}/10 posts today")
            
        except Exception as e:
            logger.error(f"❌ Failed to update daily progress: {e}")
    
    def init_driver(self):
        """Initialize Playwright browser"""
        try:
            logger.info("🚀 Initializing Playwright browser...")
            
            self.playwright = sync_playwright().start()
            self.browser = self.playwright.chromium.launch(
                headless=CONFIG['headless'],
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--disable-extensions",
                    "--disable-plugins"
                ]
            )
            
            self.page = self.browser.new_page()
            self.page.set_viewport_size({"width": 1280, "height": 720})
            
            logger.info("✅ Playwright browser initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Playwright: {e}")
            return False
    
    def load_cookies(self):
        """Load cookies from file with format fixing"""
        try:
            if not os.path.exists(CONFIG['cookiesFile']):
                logger.error(f"❌ No cookies file found: {CONFIG['cookiesFile']}")
                return False
            
            with open(CONFIG['cookiesFile'], 'r') as f:
                cookies = json.load(f)
            
            logger.info(f"📄 Found {len(cookies)} cookies")
            
            # Navigate to domain first
            self.page.goto(CONFIG['baseUrl'])
            time.sleep(2)
            
            # Add cookies with format fixing
            formatted_cookies = []
            for cookie in cookies:
                formatted_cookie = {
                    'name': cookie['name'],
                    'value': cookie['value'],
                    'domain': cookie.get('domain', '.fanvue.com'),
                    'path': cookie.get('path', '/'),
                }
                # Fix sameSite if invalid
                if 'sameSite' in cookie:
                    if cookie['sameSite'] not in ['Strict', 'Lax', 'None']:
                        formatted_cookie['sameSite'] = 'Lax'
                    else:
                        formatted_cookie['sameSite'] = cookie['sameSite']
                
                # Add other optional fields
                for field in ['httpOnly', 'secure', 'expires']:
                    if field in cookie:
                        formatted_cookie[field] = cookie[field]
                        
                formatted_cookies.append(formatted_cookie)
            
            try:
                self.page.context.add_cookies(formatted_cookies)
                logger.info("✅ Cookies loaded successfully")
                return True
            except Exception as e:
                logger.warning(f"⚠️ Some cookies failed to load: {e}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Failed to load cookies: {e}")
            return False
    
    def check_login(self):
        """Check if logged in"""
        try:
            self.page.goto(CONFIG['baseUrl'])
            time.sleep(3)
            
            current_url = self.page.url
            if '/signin' not in current_url and '/login' not in current_url:
                logger.info("✅ Successfully logged in")
                return True
            else:
                logger.error("❌ Not logged in - please update cookies")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error checking login: {e}")
            return False
    
    def get_random_caption(self):
        """Get a random caption from Excel file"""
        try:
            if not os.path.exists(CONFIG['captionsFile']):
                logger.warning(f"⚠️ Captions file not found: {CONFIG['captionsFile']}")
                return "Just for you 💕"
            
            df = pd.read_excel(CONFIG['captionsFile'])
            if df.empty:
                logger.warning("⚠️ Captions file is empty")
                return "Just for you 💕"
            
            captions = df.iloc[:, 0].dropna().tolist()
            if not captions:
                logger.warning("⚠️ No captions found in file")
                return "Just for you 💕"
            
            caption = random.choice(captions)
            logger.info(f"📝 Selected caption: {str(caption)[:50]}...")
            return str(caption)
            
        except Exception as e:
            logger.error(f"❌ Failed to get caption: {e}")
            return "Just for you 💕"
    
    def load_used_media(self):
        """Load list of used media files"""
        try:
            if not os.path.exists(CONFIG['usedMediaFile']):
                return set()
            
            with open(CONFIG['usedMediaFile'], 'r') as f:
                used_media = json.load(f)
            
            return set(used_media)
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to load used media: {e}")
            return set()
    
    def save_used_media(self, used_media):
        """Save list of used media files"""
        try:
            with open(CONFIG['usedMediaFile'], 'w') as f:
                json.dump(list(used_media), f, indent=2)
                
        except Exception as e:
            logger.error(f"❌ Failed to save used media: {e}")
    
    def get_media_filename(self, media_item):
        """Extract filename from media item"""
        try:
            filename = media_item.evaluate("""
                el => {
                    const container = el.closest('div[class*="MuiBox-root"]');
                    if (container) {
                        const titleEl = container.querySelector('p, span, div');
                        if (titleEl) {
                            const text = titleEl.textContent.trim();
                            const lines = text.split('\\n');
                            return lines.length > 0 ? lines[0].trim() : text;
                        }
                    }
                    return 'unknown_' + Math.random().toString(36).substr(2, 9);
                }
            """)
            return filename
        except Exception as e:
            return f"unknown_{random.randint(1000, 9999)}"
    
    def create_post(self, post_number):
        """Create a single post"""
        try:
            logger.info(f"📝 Creating post #{post_number}/10...")
            
            # Navigate to create page
            self.page.goto(CONFIG['createUrl'])
            time.sleep(CONFIG['buttonDelay'])
            
            # Get and add caption
            caption = self.get_random_caption()
            if not self.add_caption(caption):
                logger.error("❌ Failed to add caption")
                return False
            
            # Select audience (alternating)
            if not self.select_audience(post_number):
                logger.error("❌ Failed to select audience")
                return False
            
            # Select media with recycling
            if not self.select_media_with_recycling():
                logger.error("❌ Failed to select media")
                return False
            
            # Submit post
            if not self.submit_post():
                logger.error("❌ Failed to submit post")
                return False
            
            # Move caption to used
            self.move_caption_to_used(caption)
            
            # Update daily progress
            self.update_daily_progress(post_number)
            
            logger.info(f"✅ Post #{post_number}/10 created successfully!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create post: {e}")
            return False
    
    def add_caption(self, caption):
        """Add caption to post"""
        try:
            caption_field = self.page.wait_for_selector('textarea[placeholder*="caption"]', timeout=10000)
            if not caption_field:
                logger.error("❌ Could not find caption field")
                return False
            
            caption_field.click()
            time.sleep(1)
            caption_field.fill("")
            time.sleep(1)
            caption_field.type(str(caption), delay=50)
            time.sleep(2)
            
            logger.info(f"✅ Caption added: {str(caption)[:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to add caption: {e}")
            return False
    
    def select_audience(self, post_number):
        """Select audience - alternating between subscribers only and followers & subscribers"""
        try:
            # Odd posts = Followers and Subscribers, Even posts = Subscribers Only
            is_followers_and_subs = post_number % 2 == 1
            audience_type = "Followers and Subscribers" if is_followers_and_subs else "Subscribers Only"
            
            logger.info(f"🎯 Post #{post_number} -> {audience_type}")
            
            if not is_followers_and_subs:
                # Subscribers only is default, no action needed
                return True
            
            # Select Followers and Subscribers
            try:
                dropdown = self.page.wait_for_selector('div[role="combobox"][aria-haspopup="listbox"]', timeout=5000)
                if dropdown:
                    dropdown.click()
                    time.sleep(2)
                    
                    option = self.page.wait_for_selector('li[role="option"][data-value="1"]', timeout=3000)
                    if option:
                        option.click()
                        logger.info("✅ Selected 'Followers and subscribers'")
                        time.sleep(2)
            except:
                logger.warning("⚠️ Could not change audience, using default")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to select audience: {e}")
            return True
    
    def select_media_with_recycling(self):
        """Select media with automatic recycling when all used"""
        try:
            logger.info("📁 Opening media vault...")
            
            # Open vault
            vault_button = self.page.wait_for_selector('button[aria-label*="vault"], button[aria-label*="Vault"]', timeout=10000)
            if not vault_button:
                logger.error("❌ Could not find vault button")
                return False
            
            vault_button.click()
            time.sleep(CONFIG['buttonDelay'])
            
            # Wait for vault to open
            self.page.wait_for_selector('.MuiDrawer-root, [role="dialog"]', timeout=10000)
            
            # Open filter menu
            filter_button = self.page.wait_for_selector('div[role="combobox"][aria-label="folders"]', timeout=5000)
            if filter_button:
                filter_button.click()
                time.sleep(CONFIG['filterDelay'])
                
                # Select filter
                filter_option = self.page.wait_for_selector(f'li:has-text("{CONFIG["defaultFilter"]}")', timeout=5000)
                if filter_option:
                    filter_option.click()
                    logger.info(f"✅ Selected filter: {CONFIG['defaultFilter']}")
                    time.sleep(CONFIG['filterDelay'])
            
            # Load used media
            used_media = self.load_used_media()
            logger.info(f"📋 Avoiding {len(used_media)} previously used media files")
            
            # Get all media items
            media_items = self.page.query_selector_all('button[aria-label="Select media"]')
            if not media_items:
                logger.error("❌ No media items found")
                return False
            
            logger.info(f"📊 Found {len(media_items)} total media items")
            
            # Try to find unused media
            max_attempts = min(len(media_items), 50)
            for attempt in range(max_attempts):
                random_index = random.randint(0, len(media_items) - 1)
                selected_item = media_items[random_index]
                filename = self.get_media_filename(selected_item)
                
                if filename not in used_media:
                    # Found unused media
                    logger.info(f"✅ Selecting unused media: {filename}")
                    selected_item.click()
                    
                    # Add to used list
                    used_media.add(filename)
                    self.save_used_media(used_media)
                    
                    time.sleep(CONFIG['buttonDelay'])
                    break
            else:
                # All media used - auto-clear and select any
                logger.warning(f"⚠️ All media has been used! Auto-clearing for recycling...")
                used_media.clear()
                self.save_used_media(used_media)
                
                # Select any random media
                random_index = random.randint(0, len(media_items) - 1)
                selected_item = media_items[random_index]
                filename = self.get_media_filename(selected_item)
                
                logger.info(f"🔄 Selecting recycled media: {filename}")
                selected_item.click()
                
                # Add to fresh used list
                used_media.add(filename)
                self.save_used_media(used_media)
                time.sleep(CONFIG['buttonDelay'])
            
            # Add media to post
            add_button = self.page.wait_for_selector('.MuiDialogActions-root button, button:has-text("Add")', timeout=10000)
            if add_button:
                add_button.click()
                logger.info("✅ Added media to post")
                time.sleep(CONFIG['buttonDelay'])
                return True
            else:
                logger.error("❌ Could not find Add Media button")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to select media: {e}")
            return False
    
    def submit_post(self):
        """Submit the post"""
        try:
            logger.info("🚀 Submitting post...")
            time.sleep(5)
            
            # Look for Create post button
            create_button = self.page.wait_for_selector('button:has-text("Create post"), button[type="submit"]', timeout=10000)
            if not create_button:
                logger.error("❌ Could not find Create post button")
                return False
            
            create_button.click()
            logger.info("✅ Clicked Create post button")
            time.sleep(10)
            
            # Check for success (redirect or success message)
            current_url = self.page.url
            if 'create' not in current_url:
                logger.info("✅ Post submitted successfully (redirected)")
                return True
            
            logger.info("✅ Post submitted")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to submit post: {e}")
            return False
    
    def move_caption_to_used(self, caption):
        """Move caption to used file"""
        try:
            # Load or create used captions file
            used_df = pd.DataFrame(columns=['Caption', 'Used_Date'])
            if os.path.exists(CONFIG['usedCaptionsFile']):
                used_df = pd.read_excel(CONFIG['usedCaptionsFile'])
            
            # Add new caption
            new_row = pd.DataFrame({'Caption': [caption], 'Used_Date': [datetime.now()]})
            used_df = pd.concat([used_df, new_row], ignore_index=True)
            used_df.to_excel(CONFIG['usedCaptionsFile'], index=False)
            
            # Remove from main captions file
            if os.path.exists(CONFIG['captionsFile']):
                main_df = pd.read_excel(CONFIG['captionsFile'])
                first_column = main_df.columns[0]
                main_df = main_df[main_df[first_column] != caption]
                main_df.to_excel(CONFIG['captionsFile'], index=False)
            
            logger.info(f"✅ Moved caption to used file")
            
        except Exception as e:
            logger.error(f"❌ Failed to move caption: {e}")
    
    def run(self):
        """Main execution - create exactly 1 post and exit"""
        try:
            logger.info("🤖 Starting Fanvue Posting Bot (Crontab Mode)")
            logger.info(f"⏰ Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Check daily progress
            posts_today = self.get_daily_progress()
            next_post = posts_today + 1
            
            if posts_today >= CONFIG['maxPostsPerDay']:
                logger.info(f"✅ All {CONFIG['maxPostsPerDay']} posts completed today. Exiting.")
                return True
            
            logger.info(f"📊 Daily Progress: {posts_today}/{CONFIG['maxPostsPerDay']} posts completed")
            logger.info(f"🎯 Creating post #{next_post} this session")
            
            # Initialize browser and login
            if not self.init_driver():
                return False
            
            if not self.load_cookies():
                return False
            
            if not self.check_login():
                return False
            
            # Create the next post
            success = self.create_post(next_post)
            
            if success:
                logger.info(f"🎉 Post #{next_post}/10 completed successfully!")
                logger.info(f"📊 Daily Progress: {next_post}/{CONFIG['maxPostsPerDay']} posts completed")
            else:
                logger.error(f"❌ Failed to create post #{next_post}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Bot execution failed: {e}")
            return False
        finally:
            # Always cleanup
            if self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
            logger.info("🔒 Browser closed, script exiting")

def main():
    """Main entry point for crontab execution"""
    try:
        with BotLock():
            bot = FanvuePostingBot()
            success = bot.run()
            exit_code = 0 if success else 1
            logger.info(f"🏁 Script exiting with code {exit_code}")
            return exit_code
            
    except RuntimeError as e:
        logger.error(f"❌ {e}")
        return 1
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())
