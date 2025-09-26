#!/usr/bin/env python3
"""
Fanvue Posting Bot - Playwright Version
More reliable automation with better element detection
"""

import os
import json
import time
import random
import pandas as pd
from datetime import datetime
from playwright.sync_api import sync_playwright
import logging
import fcntl
import sys

# Full configuration
CONFIG = {
    'baseUrl': 'https://www.fanvue.com',
    'createUrl': 'https://www.fanvue.com/create',
    'cookiesFile': './fanvue-cookies.json',
    'captionsFile': './fanvuepostingcaptions.xlsx',
    'usedCaptionsFile': './used_fanvuepostingcaptions.xlsx',
    'usedMediaFile': './used_media.json',  # Track used media files
    'minPosts': 1,
    'maxPosts': 10,  # 10 posts per day
    'delayBetweenPosts': 2,  # 2 hours between posts
    'testMode': False,  # Production mode - turned off test mode
    'buttonDelay': 3,
    'filterDelay': 4,
    'filters': ['lingerie video', 'lingerie photo', 'naked video', 'sexy video', 'lingerie', 'naked', 'sexy', 'videos', 'all folders'],
    'scheduled_times': ['4:10', '6:10', '8:10', '10:10', '12:10', '14:10', '16:10', '18:10', '20:10', '22:10']  # Kiko's posting times (10 min later to avoid mass DM conflicts)
}

# Set up logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/fanvue_bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PlaywrightFanvueBot:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None
        self.lock_file = None
        self.lock_fd = None
    
    def acquire_lock(self):
        """Acquire a file lock to prevent multiple instances"""
        try:
            lock_file_path = '/tmp/fanvue_bot_kiko.lock'
            self.lock_fd = open(lock_file_path, 'w')
            fcntl.flock(self.lock_fd.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            logger.info("🔒 Acquired bot lock - no other instances running")
            return True
        except (IOError, OSError) as e:
            logger.error(f"❌ Another bot instance is already running: {e}")
            return False
    
    def release_lock(self):
        """Release the file lock"""
        try:
            if self.lock_fd:
                fcntl.flock(self.lock_fd.fileno(), fcntl.LOCK_UN)
                self.lock_fd.close()
                logger.info("🔓 Released bot lock")
        except Exception as e:
            logger.warning(f"⚠️ Error releasing lock: {e}")
    
    def init_driver(self):
        """Initialize Playwright browser"""
        logger.info("🚀 Initializing Playwright browser...")
        
        try:
            self.playwright = sync_playwright().start()
            
            # Launch browser (headless=False for local testing, headless=True for VPS)
            self.browser = self.playwright.chromium.launch(
                headless=True,  # Set to True for VPS (no X server)
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--disable-extensions",
                    "--disable-plugins"
                ]
            )
            
            # Create new page
            self.page = self.browser.new_page()
            self.page.set_viewport_size({"width": 1280, "height": 720})
            
            logger.info("✅ Playwright browser initialized successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize Playwright: {e}")
            return False
    
    def load_cookies(self):
        """Load cookies from file"""
        try:
            if not os.path.exists(CONFIG['cookiesFile']):
                logger.error("❌ No cookies file found")
                return False
            
            with open(CONFIG['cookiesFile'], 'r') as f:
                cookies = json.load(f)
            
            logger.info(f"📄 Found {len(cookies)} cookies")
            
            # Navigate to domain first
            self.page.goto(CONFIG['baseUrl'])
            time.sleep(2)
            
            # Add cookies
            for cookie in cookies:
                try:
                    self.page.context.add_cookies([{
                        'name': cookie['name'],
                        'value': cookie['value'],
                        'path': cookie.get('path', '/'),
                        'domain': cookie.get('domain', '.fanvue.com')
                    }])
                except:
                    continue
            
            logger.info("✅ Cookies loaded")
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
                logger.error("❌ Not logged in")
                return False
        except Exception as e:
            logger.error(f"❌ Error checking login: {e}")
            return False
    
    def load_used_media(self):
        """Load list of used media files"""
        try:
            if not os.path.exists(CONFIG['usedMediaFile']):
                return set()
            
            with open(CONFIG['usedMediaFile'], 'r') as f:
                used_media = json.load(f)
            
            logger.info(f"📄 Loaded {len(used_media)} used media files")
            return set(used_media)
        except Exception as e:
            logger.warning(f"⚠️ Failed to load used media: {e}")
            return set()
    
    def save_used_media(self, used_media):
        """Save list of used media files"""
        try:
            with open(CONFIG['usedMediaFile'], 'w') as f:
                json.dump(list(used_media), f, indent=2)
            logger.info(f"💾 Saved {len(used_media)} used media files")
        except Exception as e:
            logger.error(f"❌ Failed to save used media: {e}")
    
    def get_media_filename(self, media_item):
        """Extract the filename from a media item"""
        try:
            filename = media_item.evaluate("""
                el => {
                    const container = el.closest('div[class*="MuiBox-root"]');
                    if (container) {
                        // Try to find the most specific title element
                        const titleEl = container.querySelector('p, span, div');
                        if (titleEl) {
                            const text = titleEl.textContent.trim();
                            // Extract just the filename part (before any date or additional info)
                            const lines = text.split('\\n');
                            if (lines.length > 0) {
                                // Take the first line which should be the filename
                                return lines[0].trim();
                            }
                            return text;
                        }
                    }
                    return 'Unknown';
                }
            """)
            
            # Log the extracted filename for debugging
            logger.debug(f"🔍 Extracted filename: '{filename}'")
            return filename
        except Exception as e:
            logger.debug(f"⚠️ Failed to get media filename: {e}")
            return "Unknown"
    
    def get_random_caption(self):
        """Get a random caption"""
        try:
            # Try different Excel engines to handle format issues
            try:
                df = pd.read_excel(CONFIG['captionsFile'], engine='openpyxl')
            except:
                try:
                    df = pd.read_excel(CONFIG['captionsFile'], engine='xlrd')
                except:
                    df = pd.read_excel(CONFIG['captionsFile'], engine='odf')
            
            if df.empty:
                return "Just for you 💕"
            
            first_column = df.columns[0]
            caption = df.sample(n=1).iloc[0][first_column]
            return str(caption)
        except Exception as e:
            logger.error(f"❌ Failed to get caption: {e}")
            return "Just for you 💕"
    
    def get_posts_made_today(self):
        """Get the number of posts made today"""
        try:
            if not os.path.exists(CONFIG['usedCaptionsFile']):
                return 0
            
            # Try different Excel engines to handle format issues
            try:
                df = pd.read_excel(CONFIG['usedCaptionsFile'], engine='openpyxl')
            except:
                try:
                    df = pd.read_excel(CONFIG['usedCaptionsFile'], engine='xlrd')
                except:
                    df = pd.read_excel(CONFIG['usedCaptionsFile'], engine='odf')
            
            if df.empty:
                return 0
            
            today = datetime.now().date()
            df['Used_Date'] = pd.to_datetime(df['Used_Date'])
            today_posts = df[df['Used_Date'].dt.date == today]
            
            post_count = len(today_posts)
            logger.info(f"📊 Posts made today: {post_count}")
            return post_count
        except Exception as e:
            logger.warning(f"⚠️ Failed to get today's post count: {e}")
            return 0
    
    def get_next_scheduled_time(self):
        """Get the next scheduled posting time"""
        try:
            current_time = datetime.now()
            current_time_str = current_time.strftime("%H:%M")
            
            # Check if we've passed all times for today
            for time_str in CONFIG['scheduled_times']:
                if time_str > current_time_str:
                    return time_str
            
            # If all times for today have passed, schedule for tomorrow
            hour, minute = map(int, CONFIG['scheduled_times'][0].split(':'))
            tomorrow = current_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
            tomorrow = tomorrow.replace(day=tomorrow.day + 1)
            return tomorrow.strftime("%H:%M")
            
        except Exception as e:
            logger.error(f"❌ Error getting next scheduled time: {e}")
            return None
    
    def should_post_now(self):
        """Check if it's time to post based on scheduled times"""
        try:
            current_time = datetime.now()
            current_time_str = current_time.strftime("%H:%M")
            
            # Check if current time matches any scheduled time (within 5 minutes)
            for scheduled_time in CONFIG['scheduled_times']:
                # Parse scheduled time
                scheduled_hour, scheduled_minute = map(int, scheduled_time.split(':'))
                scheduled_dt = current_time.replace(hour=scheduled_hour, minute=scheduled_minute, second=0, microsecond=0)
                
                # Check if we're within 5 minutes of the scheduled time
                time_diff = abs((current_time - scheduled_dt).total_seconds() / 60)
                if time_diff <= 5:
                    logger.info(f"⏰ Current time {current_time_str} is within 5 minutes of scheduled time {scheduled_time}")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Error checking if should post now: {e}")
            return False
    
    def create_post(self, post_number):
        """Create a full post with media selection"""
        try:
            logger.info(f"📝 Creating post #{post_number}...")
            
            # Navigate to create page
            self.page.goto(CONFIG['createUrl'])
            time.sleep(CONFIG['buttonDelay'])
            
            # Get caption
            caption = self.get_random_caption()
            logger.info(f"📝 Using caption: {caption[:50]}...")
            
            # Add caption first
            if not self.add_caption(caption):
                logger.error("❌ Failed to add caption")
                return False
            
            # Select audience (alternating) - BEFORE opening vault
            try:
                if not self.select_audience(post_number):
                    logger.error("❌ Failed to select audience")
                    return False
                logger.info("✅ Audience selection completed")
            except Exception as e:
                logger.error(f"❌ Error during audience selection: {e}")
                return False
            
            # Select filter based on audience type
            is_subscribers_only = post_number % 2 == 1  # Odd posts = subscribers only
            if is_subscribers_only:
                filter_name = "lingerie video"  # Subscribers only -> lingerie video
                logger.info(f"🎯 Subscribers Only post -> Using filter: '{filter_name}'")
            else:
                filter_name = "lingerie photo"   # Followers and Subscribers -> lingerie photo
                logger.info(f"🎯 Followers and Subscribers post -> Using filter: '{filter_name}'")
            
            try:
                if not self.select_media(filter_name):
                    logger.error("❌ Failed to select media")
                    return False
                logger.info("✅ Media selection completed")
            except Exception as e:
                logger.error(f"❌ Error during media selection: {e}")
                return False
            
            # Submit post
            if not self.submit_post():
                logger.error("❌ Failed to submit post")
                return False
            
            # Move caption to used
            self.move_caption_to_used(caption)
            
            time.sleep(2)
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create post: {e}")
            return False
    
    def add_caption(self, caption):
        """Add caption to the post"""
        try:
            logger.info("📝 Adding caption...")
            
            # Look for caption field with Playwright's better selectors
            caption_selectors = [
                'textarea[placeholder*="caption"]',
                'textarea[placeholder*="Caption"]',
                'textarea[aria-label*="caption"]',
                'textarea[aria-label*="Caption"]',
                'textarea'
            ]
            
            caption_field = None
            for selector in caption_selectors:
                try:
                    caption_field = self.page.wait_for_selector(selector, timeout=5000)
                    if caption_field:
                        logger.info(f"✅ Found caption field with selector: {selector}")
                        break
                except:
                    continue
            
            if not caption_field:
                logger.error("❌ Could not find caption field")
                return False
            
            # Add caption (handle special characters)
            caption_field.click()
            time.sleep(1)
            caption_field.fill("")  # Clear
            time.sleep(1)
            
            # Clean caption to remove only truly problematic characters while preserving emojis
            import re
            # Only remove control characters and other problematic ones, but keep emojis
            clean_caption = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', str(caption))
            # Remove any remaining problematic characters but keep emojis
            clean_caption = clean_caption.replace('\u0000', '').replace('\u0001', '').replace('\u0002', '')
            
            if clean_caption != str(caption):
                logger.info(f"🧹 Cleaned caption from '{str(caption)[:30]}...' to '{clean_caption[:30]}...'")
            
            # Type the caption
            caption_field.type(clean_caption, delay=50)  # Type with delay for better reliability
            time.sleep(2)
            
            logger.info(f"✅ Caption added: {clean_caption[:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to add caption: {e}")
            return False
    
    def select_audience(self, post_number):
        """Select audience - alternating between subscribers only and followers & subscribers"""
        try:
            # Determine audience based on post number and ensure proper alternation
            posts_today = self.get_posts_made_today()
            # For the second post, it should be "Followers and Subscribers" (even number)
            # Post 1 = Subscribers Only (odd)
            # Post 2 = Followers and Subscribers (even)
            # Post 3 = Subscribers Only (odd)
            # etc.
            is_subscribers_only = post_number % 2 == 1  # Odd posts = subscribers only, even = followers & subscribers
            audience_type = "Subscribers Only" if is_subscribers_only else "Followers and Subscribers"
            
            logger.info(f"📊 Posts today: {posts_today}, Current post: {post_number}")
            logger.info(f"🎯 Audience decision: {'ODD' if is_subscribers_only else 'EVEN'} post -> {audience_type}")
            
            if is_subscribers_only:
                # For subscribers only, no dropdown selection needed (default)
                logger.info("📝 Posting for subscribers only - no audience selection needed")
                return True
            else:
                # For followers and subscribers, need to click dropdown
                logger.info("🔍 Looking for audience dropdown...")
                
                time.sleep(3)
                
                # Look for the specific audience dropdown with Playwright
                audience_selectors = [
                    'div[role="combobox"][aria-expanded="false"][aria-haspopup="listbox"]',
                    'div[class*="MuiSelect-select"]',
                    'div[role="combobox"]',
                    'div[aria-haspopup="listbox"]'
                ]
                
                audience_dropdown = None
                for selector in audience_selectors:
                    try:
                        audience_dropdown = self.page.wait_for_selector(selector, timeout=3000)
                        if audience_dropdown:
                            logger.info(f"✅ Found audience dropdown with selector: {selector}")
                            break
                    except:
                        continue
                
                if not audience_dropdown:
                    logger.warning("⚠️ Could not find audience dropdown, using default audience")
                    return True
                
                # Click dropdown
                try:
                    audience_dropdown.click()
                    logger.info("👆 Clicked audience dropdown")
                    time.sleep(2)
                except Exception as e:
                    logger.warning(f"⚠️ Failed to click audience dropdown: {e}")
                    return True
                
                # Look for "Followers and subscribers" option using Playwright
                option_selectors = [
                    'li[role="option"][data-value="1"]',
                    'li[class*="MuiMenuItem-root"][data-value="1"]',
                    'li:has-text("Followers and subscribers")',
                    'li:has-text("followers")'
                ]
                
                followers_option = None
                for selector in option_selectors:
                    try:
                        followers_option = self.page.wait_for_selector(selector, timeout=3000)
                        if followers_option:
                            logger.info(f"✅ Found followers option with selector: {selector}")
                            break
                    except:
                        continue
                
                if followers_option:
                    try:
                        followers_option.click()
                        logger.info("✅ Selected 'Followers and subscribers'")
                        time.sleep(2)
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to click followers option: {e}")
                else:
                    logger.warning("⚠️ Could not find followers option, using default")
                
                return True
            
        except Exception as e:
            logger.error(f"❌ Failed to select audience: {e}")
            return True
    
    def select_media(self, filter_name):
        """Select media from vault with filter"""
        try:
            logger.info(f"📁 Opening media vault for filter: '{filter_name}'...")
            
            # Look for vault button with Playwright
            vault_selectors = [
                'button[aria-label*="vault"]',
                'button[aria-label*="Vault"]',
                'button[aria-label*="media"]',
                'button[aria-label*="Media"]',
                '[data-testid*="vault"]',
                '[data-testid*="media"]'
            ]
            
            vault_button = None
            for selector in vault_selectors:
                try:
                    vault_button = self.page.wait_for_selector(selector, timeout=5000)
                    if vault_button:
                        logger.info(f"✅ Found vault button with selector: {selector}")
                        break
                except:
                    continue
            
            if not vault_button:
                logger.error("❌ Could not find vault button")
                return False
            
            # Click vault button with better handling
            try:
                # Scroll into view first
                vault_button.scroll_into_view_if_needed()
                time.sleep(1)
                
                # Click with Playwright's better click handling
                vault_button.click()
                logger.info("🖱️ Clicked vault button")
            except Exception as e:
                logger.warning(f"⚠️ Regular click failed: {e}")
                try:
                    # Try JavaScript click
                    self.page.evaluate("arguments[0].click();", vault_button)
                    logger.info("🖱️ Clicked vault button (JavaScript)")
                except Exception as js_e:
                    logger.warning(f"⚠️ JavaScript click failed: {js_e}")
                    # Try force click
                    vault_button.click(force=True)
                    logger.info("🖱️ Clicked vault button (force)")
            
            time.sleep(CONFIG['buttonDelay'])
            
            # Wait for vault to open
            try:
                self.page.wait_for_selector('.MuiDrawer-root, [role="dialog"]', timeout=10000)
                logger.info("✅ Vault drawer opened")
            except:
                logger.error("❌ Vault drawer didn't open")
                return False
            
            # Open filter menu
            if not self.open_filter_menu():
                logger.error("❌ Failed to open filter menu")
                return False
            
            # Choose filter
            if not self.choose_filter(filter_name):
                logger.error(f"❌ Failed to choose filter: {filter_name}")
                return False
            
            # Find and select media
            if not self.select_random_media():
                logger.error("❌ Failed to select media")
                return False
            
            # Add media to post
            if not self.add_media():
                logger.error("❌ Failed to add media")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Media selection failed: {e}")
            return False
    
    def open_filter_menu(self):
        """Open the filter menu"""
        try:
            logger.info("🎛️ Opening filter menu...")
            
            # Look for filter button with Playwright
            filter_selectors = [
                'div[role="combobox"][aria-label="folders"]',
                'div[role="combobox"]',
                'div[aria-haspopup="listbox"]',
                'div[class*="MuiSelect"]'
            ]
            
            filter_button = None
            for selector in filter_selectors:
                try:
                    filter_button = self.page.wait_for_selector(selector, timeout=5000)
                    if filter_button:
                        logger.info(f"✅ Found filter button with selector: {selector}")
                        break
                except:
                    continue
            
            if not filter_button:
                logger.error("❌ Could not find filter button")
                return False
            
            # Click filter button
            filter_button.click()
            logger.info("✅ Clicked filter button")
            time.sleep(CONFIG['filterDelay'])
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to open filter menu: {e}")
            return False
    
    def choose_filter(self, filter_name):
        """Choose a specific filter"""
        try:
            logger.info(f"🎯 Looking for filter: '{filter_name}'...")
            
            # Look for filter option with Playwright
            filter_selectors = [
                f'li[role="option"][data-value="{filter_name}"]',
                f'li:has-text("{filter_name}")',
                f'li:has-text("{filter_name.title()}")',
                f'li:has-text("{filter_name.upper()}")'
            ]
            
            filter_option = None
            for selector in filter_selectors:
                try:
                    filter_option = self.page.wait_for_selector(selector, timeout=5000)
                    if filter_option:
                        logger.info(f"✅ Found filter option: '{filter_name}' with selector: {selector}")
                        break
                except:
                    continue
            
            if not filter_option:
                logger.warning(f"⚠️ Could not find filter '{filter_name}', trying 'All folders' as fallback...")
                all_folders_selectors = [
                    "li:has-text('All folders')",
                    "li:has-text('all folders')",
                    "li:has-text('All')"
                ]
                
                for selector in all_folders_selectors:
                    try:
                        all_folders = self.page.wait_for_selector(selector, timeout=3000)
                        if all_folders:
                            logger.info(f"✅ Found 'All folders' with selector: {selector}")
                            all_folders.click()
                            logger.info("✅ Clicked 'All folders'")
                            time.sleep(CONFIG['filterDelay'])
                            return True
                    except:
                        continue
                
                logger.warning(f"⚠️ Could not find filter '{filter_name}', continuing without filter...")
                return True
            
            # Click filter option
            filter_option.click()
            logger.info(f"✅ Clicked filter: '{filter_name}'")
            time.sleep(CONFIG['filterDelay'])
            
            return True
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to choose filter '{filter_name}': {e}")
            return True
    
    def select_random_media(self):
        """Select random media from available options with scrolling, avoiding used media"""
        try:
            logger.info("🎲 Selecting random media with used media tracking...")
            
            # Load used media files
            used_media = self.load_used_media()
            logger.info(f"📋 Avoiding {len(used_media)} previously used media files")
            
            # First, scroll to load all available media
            logger.info("📜 Scrolling to load all media items...")
            self.scroll_media_container()
            
            # Get all media items
            media_items = self.page.query_selector_all('button[aria-label="Select media"]')
            logger.info(f"✅ Found {len(media_items)} media items with selector: button[aria-label=\"Select media\"]")
            
            if not media_items:
                logger.error("❌ No media items found")
                return False
            
            # Try to find an unused media item by randomly selecting and checking
            # Use a percentage of total media items, with a minimum and maximum
            total_media = len(media_items)
            max_attempts = min(max(total_media // 2, 30), 100)  # 50% of items, min 30, max 100
            logger.info(f"📊 Total media items: {total_media}, will try up to {max_attempts} attempts")
            attempts = 0
            selected_item = None
            checked_items = set()  # Track which items we've already checked
            
            while attempts < max_attempts:
                attempts += 1
                
                # Get a fresh list of media items each time to avoid memory issues
                media_items = self.page.query_selector_all('button[aria-label="Select media"]')
                if not media_items:
                    logger.error("❌ No media items found")
                    return False
                
                # Select a random media item that we haven't checked yet
                available_indices = [i for i in range(len(media_items)) if i not in checked_items]
                if not available_indices:
                    logger.warning("⚠️ Checked all available media items, will start over")
                    checked_items.clear()  # Reset and start over
                    available_indices = list(range(len(media_items)))
                
                random_index = random.choice(available_indices)
                selected_item = media_items[random_index]
                checked_items.add(random_index)
                
                # Get the filename of the selected item
                filename = self.get_media_filename(selected_item)
                
                if filename == "Unknown":
                    logger.info(f"🎲 Attempt {attempts}/{max_attempts}: Checking media item with unknown filename...")
                else:
                    logger.info(f"🎲 Attempt {attempts}/{max_attempts}: Checking media item '{filename}'")
                
                # Check if this media item has been used before
                if filename in used_media:
                    logger.info(f"❌ Media item '{filename}' has been used before, trying another...")
                    selected_item = None  # Clean up immediately
                    continue
                else:
                    logger.info(f"✅ Media item '{filename}' is NOT in used list, selecting it...")
                
                # This item has not been used, select it
                logger.info(f"✅ Selecting unused media item '{filename}' on attempt {attempts}")
                try:
                    # Log the exact index being clicked
                    logger.info(f"🎯 Clicking media item at index {random_index}")
                    
                    # Click the "Select media" button
                    self.page.click(f'button[aria-label="Select media"] >> nth={random_index}')
                    
                    # Verify what was actually selected by checking the selected state
                    time.sleep(1)
                    selected_filename = self.page.evaluate(f"""
                        () => {{
                            const buttons = document.querySelectorAll('button[aria-label="Select media"]');
                            if (buttons[{random_index}]) {{
                                const container = buttons[{random_index}].closest('div[class*="MuiBox-root"]');
                                if (container) {{
                                    const titleEl = container.querySelector('p, span, div');
                                    return titleEl ? titleEl.textContent.trim().split('\\n')[0] : 'Unknown';
                                }}
                            }}
                            return 'Unknown';
                        }}
                    """)
                    logger.info(f"✅ Actually selected: '{selected_filename}'")
                    
                    logger.info(f"✅ Selected unused media item after {attempts} attempts")
                    
                    # Add to used media list
                    used_media.add(filename)
                    self.save_used_media(used_media)
                    logger.info(f"💾 Added '{filename}' to used media list")
                    
                    selected_item = None  # Clean up immediately
                    time.sleep(CONFIG['buttonDelay'])
                    return True
                except Exception as e:
                    logger.error(f"❌ Failed to select media: {e}")
                    return False
            else:
                # If we've tried too many times and all items are used, FAIL
                logger.error(f"❌ ALL {max_attempts} media items have been used before! Cannot create post.")
                logger.error("❌ No unused media available in this filter.")
                return False
            
        except Exception as e:
            logger.error(f"❌ Failed to select random media: {e}")
            return False
    
    def scroll_media_container(self):
        """Scroll through the media container to load all items"""
        try:
            logger.info("📜 Starting media container scroll...")
            
            # Count initial items
            initial_items = self.page.query_selector_all('button[aria-label="Select media"]')
            initial_count = len(initial_items)
            logger.info(f"📊 Initial media count: {initial_count}")
            
            # First, try to find the actual scrollable container
            logger.info("🔍 Looking for the actual scrollable container...")
            
            # Try to find the dialog content area that contains the media grid
            dialog_content = None
            content_selectors = [
                '.MuiDialogContent-root',
                '.MuiDrawer-root .MuiDialogContent-root',
                '.MuiDrawer-root .MuiBox-root',
                '.MuiDrawer-root div[style*="overflow"]',
                '.MuiDrawer-root div[style*="scroll"]',
                'div[style*="overflow-y: auto"]',
                'div[style*="overflow-y: scroll"]',
                # Try to find the actual media grid container
                'div[class*="grid"]',
                'div[class*="Grid"]',
                'div[class*="media"]',
                'div[class*="Media"]'
            ]
            
            for selector in content_selectors:
                try:
                    elements = self.page.query_selector_all(selector)
                    for element in elements:
                        if element.is_visible():
                            # Check if this element actually has scrollable content
                            scroll_height = element.evaluate("el => el.scrollHeight")
                            client_height = element.evaluate("el => el.clientHeight")
                            
                            if scroll_height > client_height:
                                dialog_content = element
                                logger.info(f"✅ Found scrollable container with selector: {selector} (scrollHeight: {scroll_height}, clientHeight: {client_height})")
                                break
                    if dialog_content:
                        break
                except Exception as e:
                    logger.debug(f"Selector {selector} failed: {e}")
                    continue
            
            if not dialog_content:
                logger.warning("⚠️ Could not find scrollable container, using fallback")
                # Use page as fallback
                dialog_content = self.page
            
            # Scroll until no new media is found
            max_count = initial_count
            scroll_attempts = 0
            max_scroll_attempts = 20  # Reasonable limit to prevent infinite loops

            # First, try to find the actual media grid
            logger.info("🔍 Looking for media grid elements...")
            media_grid_selectors = [
                'div[class*="grid"]',
                'div[class*="Grid"]', 
                'div[class*="media"]',
                'div[class*="Media"]',
                'div[class*="vault"]',
                'div[class*="Vault"]',
                'div[class*="content"]',
                'div[class*="Content"]'
            ]
            
            media_grid = None
            for selector in media_grid_selectors:
                try:
                    elements = self.page.query_selector_all(selector)
                    for element in elements:
                        if element.is_visible():
                            # Check if this element contains media items
                            media_items = element.query_selector_all('button[aria-label="Select media"]')
                            if len(media_items) > 0:
                                media_grid = element
                                logger.info(f"✅ Found media grid with selector: {selector} (contains {len(media_items)} items)")
                                break
                    if media_grid:
                        break
                except:
                    continue

            while scroll_attempts < max_scroll_attempts:
                try:
                    # Get current scroll position
                    current_scroll = dialog_content.evaluate("el => el.scrollTop")
                    scroll_height = dialog_content.evaluate("el => el.scrollHeight")
                    client_height = dialog_content.evaluate("el => el.clientHeight")
                    
                    logger.info(f"📊 Scroll attempt {scroll_attempts + 1}: position {current_scroll}/{scroll_height}, client height: {client_height}")
                    
                    # Try multiple scrolling approaches (like the working Selenium version)
                    # 1. Scroll the container with larger increments
                    scroll_increment = 800  # Much larger increments to force loading
                    new_scroll = min(current_scroll + scroll_increment, scroll_height)
                    dialog_content.evaluate(f"el => el.scrollTop = {new_scroll}")
                    
                    # 2. Try scrolling the actual media grid
                    self.page.evaluate("""
                        var mediaButtons = document.querySelectorAll('button[aria-label="Select media"]');
                        if (mediaButtons.length > 0) {
                            var lastButton = mediaButtons[mediaButtons.length - 1];
                            lastButton.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }
                    """)
                    
                    # Wait for content to load
                    time.sleep(3)
                    
                    # 3. Force scroll the page itself more aggressively
                    self.page.evaluate("window.scrollBy(0, 500);")
                    time.sleep(2)
                    
                    # 4. Try scrolling the dialog content directly
                    self.page.evaluate("""
                        var dialogContent = document.querySelector('.MuiDialogContent-root');
                        if (dialogContent) {
                            dialogContent.scrollTop = dialogContent.scrollTop + 500;
                        }
                    """)
                    time.sleep(2)
                    
                    # Count current items
                    current_items = self.page.query_selector_all('button[aria-label="Select media"]')
                    current_count = len(current_items)
                    
                    if current_count > max_count:
                        logger.info(f"📊 Found more items: {max_count} -> {current_count}")
                        max_count = current_count
                        scroll_attempts = 0  # Reset attempts when we find new items
                    else:
                        scroll_attempts += 1
                        
                        # If we're at the bottom and no new items, try multiple approaches
                        if current_scroll >= scroll_height - client_height - 50:  # Less strict bottom detection
                            logger.info("📊 Reached bottom, trying multiple scroll approaches...")
                            
                            # Try scrolling the entire dialog
                            self.page.evaluate("""
                                var dialog = document.querySelector('.MuiDrawer-root');
                                if (dialog) {
                                    dialog.scrollTop = dialog.scrollHeight;
                                }
                            """)
                            time.sleep(2)
                            
                            # Try scrolling any grid or media container
                            self.page.evaluate("""
                                var mediaContainers = document.querySelectorAll('div[class*="grid"], div[class*="Grid"], div[class*="media"], div[class*="Media"]');
                                for (var i = 0; i < mediaContainers.length; i++) {
                                    var container = mediaContainers[i];
                                    if (container.scrollHeight > container.clientHeight) {
                                        container.scrollTop = container.scrollHeight;
                                    }
                                }
                            """)
                            time.sleep(2)
                            
                            # Try scrolling the page itself
                            self.page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
                            time.sleep(2)
                            
                            # Force scroll to the very bottom of the dialog
                            dialog_content.evaluate("el => el.scrollTop = el.scrollHeight")
                            time.sleep(3)
                            
                            # Check again
                            final_items = self.page.query_selector_all('button[aria-label="Select media"]')
                            final_count = len(final_items)
                            
                            if final_count > current_count:
                                logger.info(f"📊 Multiple scroll approaches found more items: {current_count} -> {final_count}")
                                max_count = final_count
                                scroll_attempts = 0
                                
                                # If we found more items, continue scrolling to find even more
                                if final_count > max_count:  # Found new items
                                    logger.info(f"📊 Found {final_count} items (was {max_count}), continuing to scroll...")
                                    max_count = final_count
                                    scroll_attempts = 0  # Reset attempts when we find new items
                                    continue
                            else:
                                # If we haven't found new items, we're done
                                logger.info(f"📊 No new items found after {scroll_attempts} attempts")
                                logger.info(f"📊 Final count: {max_count} items found")
                                break
                    
                except Exception as e:
                    logger.warning(f"⚠️ Scroll attempt {scroll_attempts + 1} failed: {e}")
                    scroll_attempts += 1
            
            logger.info(f"✅ Finished scrolling, total media items: {max_count}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to scroll media container: {e}")
            return False
    
    def add_media(self):
        """Add selected media to the post"""
        try:
            logger.info("➕ Looking for Add Media button...")
            
            # Look for Add Media button with Playwright
            add_selectors = [
                '.MuiDialogActions-root button',
                'button:has-text("Add")',
                'button:has-text("Add Media")',
                'button[aria-label*="Add"]',
                'button[aria-label*="add"]'
            ]
            
            add_button = None
            for selector in add_selectors:
                try:
                    add_button = self.page.wait_for_selector(selector, timeout=5000)
                    if add_button:
                        logger.info(f"✅ Found Add Media button with selector: {selector}")
                        break
                except:
                    continue
            
            if not add_button:
                logger.error("❌ Could not find Add Media button")
                return False
            
            # Click Add Media button
            try:
                add_button.click()
                logger.info("✅ Clicked Add Media button")
            except Exception as e:
                logger.warning(f"⚠️ Regular click failed: {e}")
                try:
                    add_button.click(force=True)
                    logger.info("✅ Clicked Add Media button (force)")
                except Exception as force_e:
                    logger.error(f"❌ All click methods failed: {force_e}")
                    return False
            
            # Wait for loading to complete
            try:
                # Wait for any loading indicators to disappear
                self.page.wait_for_selector('[class*="loading"], [class*="spinner"]', state='hidden', timeout=10000)
                logger.info("✅ Loading completed")
            except:
                logger.info("ℹ️ No loading indicator found or already completed")
            
            time.sleep(CONFIG['buttonDelay'])
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to add media: {e}")
            return False
    
    def submit_post(self):
        """Submit the post"""
        try:
            logger.info("🚀 Submitting post...")
            time.sleep(5)
            
            # Wait for the page to fully load after adding media
            logger.info("⏳ Waiting for page to load after adding media...")
            time.sleep(3)
            
            # Look for Create post button with Playwright - try multiple approaches
            create_selectors = [
                'button[data-sentry-element="Button"][data-sentry-source-file="CreatePostForm.tsx"]',
                'button[data-sentry-element="Button"][data-sentry-source-file="CreatePostForm.tsx"]',
                'button.mui-1l5go5g',
                'button[class*="MuiButton-root"][class*="MuiButton-text"][class*="MuiButton-fullWidth"]',
                'button[data-sentry-element="Button"]',
                'button[class*="MuiButton"]',
                'button:has-text("Publish")',
                'button:has-text("Post")',
                'button[type="submit"]'
            ]
            
            create_button = None
            for selector in create_selectors:
                try:
                    # Try to find the button
                    buttons = self.page.query_selector_all(selector)
                    logger.info(f"🔍 Found {len(buttons)} buttons with selector: {selector}")
                    
                    # Check each button to see if it's the right one
                    for i, button in enumerate(buttons):
                        try:
                            button_text = button.evaluate("el => el.textContent || el.innerText || ''")
                            logger.info(f"🔍 Button {i+1} text: '{button_text.strip()}'")
                            
                            # Check if this button contains "Create post" or similar
                            if any(keyword in button_text.lower() for keyword in ['create post', 'publish', 'post']):
                                create_button = button
                                logger.info(f"✅ Found Create post button with selector: {selector} (button {i+1})")
                                break
                        except:
                            continue
                    
                    if create_button:
                        break
                except:
                    continue
            
            if not create_button:
                logger.error("❌ Could not find Create post button")
                # Debug: Let's see what buttons are available
                try:
                    all_buttons = self.page.query_selector_all('button')
                    logger.info(f"🔍 Debug: Found {len(all_buttons)} total buttons on page")
                    for i, btn in enumerate(all_buttons[:5]):  # Show first 5 buttons
                        try:
                            btn_text = btn.evaluate("el => el.textContent || el.innerText || ''")
                            logger.info(f"🔍 Debug button {i+1}: '{btn_text.strip()}'")
                        except:
                            logger.info(f"🔍 Debug button {i+1}: [error getting text]")
                except:
                    pass
                return False
            
            # Click Create post
            try:
                create_button.scroll_into_view_if_needed()
                time.sleep(1)
                create_button.click()
                logger.info("✅ Clicked Create post button")
                time.sleep(10)
                
                # Verify post was published by checking for success indicators
                success_indicators = [
                    'div:has-text("Post published")',
                    'div:has-text("published")',
                    'div:has-text("success")',
                    'div[class*="success"]',
                    'div[class*="published"]'
                ]
                
                post_published = False
                for indicator in success_indicators:
                    try:
                        success_element = self.page.wait_for_selector(indicator, timeout=3000)
                        if success_element:
                            logger.info(f"✅ Post published successfully! Found indicator: {indicator}")
                            post_published = True
                            break
                    except:
                        continue
                
                # Also check if we're redirected away from create page (another success indicator)
                current_url = self.page.url
                if 'create' not in current_url:
                    logger.info(f"✅ Post published! Redirected to: {current_url}")
                    post_published = True
                
                if not post_published:
                    logger.warning("⚠️ Could not confirm post was published, but continuing...")
                
                return True
            except Exception as e:
                logger.error(f"❌ Failed to click Create post: {e}")
                return False
            
        except Exception as e:
            logger.error(f"❌ Failed to submit post: {e}")
            return False
    
    def move_caption_to_used(self, caption):
        """Move caption to used file"""
        try:
            # Add to used captions
            try:
                df = pd.read_excel(CONFIG['usedCaptionsFile'], engine='openpyxl')
            except:
                try:
                    df = pd.read_excel(CONFIG['usedCaptionsFile'], engine='xlrd')
                except:
                    df = pd.read_excel(CONFIG['usedCaptionsFile'], engine='odf')
            
            if df.empty:
                df = pd.DataFrame(columns=['Caption', 'Used_Date'])
            
            new_row = pd.DataFrame({'Caption': [caption], 'Used_Date': [datetime.now()]})
            df = pd.concat([df, new_row], ignore_index=True)
            df.to_excel(CONFIG['usedCaptionsFile'], index=False)
            
            # Remove from main captions
            try:
                main_df = pd.read_excel(CONFIG['captionsFile'], engine='openpyxl')
            except:
                try:
                    main_df = pd.read_excel(CONFIG['captionsFile'], engine='xlrd')
                except:
                    main_df = pd.read_excel(CONFIG['captionsFile'], engine='odf')
            
            first_column = main_df.columns[0]
            main_df = main_df[main_df[first_column] != caption]
            main_df.to_excel(CONFIG['captionsFile'], index=False)
            
            logger.info(f"✅ Moved caption to used: '{str(caption)[:50]}...'")
        except Exception as e:
            logger.error(f"❌ Failed to move caption: {e}")
    
    def run(self):
        """Main run method with scheduled posting times"""
        try:
            logger.info("🤖 Starting Playwright Fanvue Bot with scheduled posting...")
            logger.info(f"⏰ Scheduled times: {', '.join(CONFIG['scheduled_times'])}")
            
            # Initialize driver
            if not self.init_driver():
                return False
            
            # Load cookies and check login
            if not self.load_cookies():
                return False
            
            if not self.check_login():
                return False
            
            # Get posts made today
            posts_today = self.get_posts_made_today()
            logger.info(f"📊 Posts already made today: {posts_today}")
            
            # Check if we've reached the maximum posts for today
            if posts_today >= CONFIG['maxPosts']:
                logger.info(f"✅ Already made {posts_today} posts today (max: {CONFIG['maxPosts']}). Exiting.")
                return True
            
            # Check if it's time to post
            if not self.should_post_now():
                next_time = self.get_next_scheduled_time()
                logger.info(f"⏰ Not time to post yet. Next scheduled time: {next_time}")
                return True
            
            # Create exactly 1 post per session
            actual_post_number = posts_today + 1
            logger.info(f"📝 Creating post #{actual_post_number} (scheduled time reached)")
            
            if self.create_post(actual_post_number):
                logger.info(f"✅ Post #{actual_post_number} created successfully!")
            else:
                logger.error(f"❌ Failed to create post #{actual_post_number}")
                return False
            
            logger.info("✅ Bot completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Bot failed: {e}")
            return False
        finally:
            if self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
                logger.info("🔒 Browser closed")

def main():
    """Main function - PRODUCTION"""
    bot = None
    try:
        logger.info("🚀 PRODUCTION: Starting Playwright Fanvue Bot...")
        logger.info(f"⏰ Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        bot = PlaywrightFanvueBot()
        
        # Acquire lock to prevent multiple instances
        if not bot.acquire_lock():
            logger.error("❌ Cannot acquire lock - another instance is running")
            return False
        
        # Production mode: check posts made today first
        posts_today = bot.get_posts_made_today()
        logger.info(f"📊 Posts made today: {posts_today}")
        
        if posts_today >= CONFIG['maxPosts']:
            logger.info(f"✅ Already made {posts_today} posts today (max: {CONFIG['maxPosts']}). Exiting.")
            return True
        
        # Initialize driver and login
        logger.info("🔧 Initializing driver and logging in...")
        if not bot.init_driver():
            return False
        
        if not bot.load_cookies():
            return False
        
        if not bot.check_login():
            return False
        
        # Create exactly 1 post per session
        if posts_today >= CONFIG['maxPosts']:
            logger.info(f"✅ Already made {posts_today} posts today (max: {CONFIG['maxPosts']}). Exiting.")
            return True
        
        post_number = posts_today + 1
        logger.info(f"📝 Will create exactly 1 post (#{post_number})")
        
        success = bot.create_post(post_number)
        if not success:
            logger.error(f"❌ Failed to create post #{post_number}")
            return False
        
        logger.info(f"✅ Successfully created post #{post_number}")
        
        logger.info("🎉 All posts completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Main execution failed: {e}")
        return False
    finally:
        # Always release the lock
        if bot:
            bot.release_lock()

if __name__ == "__main__":
    main() 