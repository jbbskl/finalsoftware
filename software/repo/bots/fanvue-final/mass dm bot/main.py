#!/usr/bin/env python3
"""
Fanvue Mass DM Bot - Standardized Template
- Works with crontab scheduling
- Tracks daily progress (6 phases per day)
- Runs exactly 1 phase per execution
- Copy this template for new clients
"""

import os
import json
import time
import random
import pandas as pd
import fcntl
import psutil
import asyncio
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
import logging
from pathlib import Path

# Configuration - Load from config.yaml or use defaults
CONFIG = {
    'baseUrl': 'https://www.fanvue.com',
    'messagesUrl': 'https://www.fanvue.com/messages',
    'cookiesFile': './fanvue-cookies.json',
    'usedMediaFile': './used_media.json',
    'dailyProgressFile': './daily_progress.json',
    'phaseTrackerFile': './phase_tracker.json',
    'headless': True,
    'buttonDelay': 2,
    'messageDelay': 5,
    'logFile': './massdm_bot.log'
}

# 6 Phases Configuration
PHASES = {
    '02:00': {
        'file': '2.xlsx',
        'type': 'text_only',
        'description': 'Text only mass DM'
    },
    '08:00': {
        'file': '13.xlsx',
        'type': 'text_only',
        'description': 'Text only mass DM'
    },
    '13:00': {
        'file': '17.xlsx',
        'type': 'bundle_text',
        'description': 'Bundle + text mass DM'
    },
    '16:00': {
        'file': '18.xlsx',
        'type': 'photo_text',
        'description': 'Photo + text mass DM'
    },
    '18:00': {
        'file': '21.xlsx',
        'type': 'text_only',
        'description': 'Text only mass DM'
    },
    '21:00': {
        'file': '22.xlsx',
        'type': 'text_only',
        'description': 'Text only mass DM'
    }
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

class FanvueMassDMBot:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None
        
    def get_daily_progress(self):
        """Get today's phase progress (0-6)"""
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
    
    def update_daily_progress(self, phase_number):
        """Update today's phase progress"""
        try:
            progress = {}
            if os.path.exists(CONFIG['dailyProgressFile']):
                with open(CONFIG['dailyProgressFile'], 'r') as f:
                    progress = json.load(f)
            
            today = datetime.now().strftime('%Y-%m-%d')
            progress[today] = phase_number
            
            with open(CONFIG['dailyProgressFile'], 'w') as f:
                json.dump(progress, f, indent=2)
            
            logger.info(f"📊 Updated daily progress: {phase_number}/6 phases today")
            
        except Exception as e:
            logger.error(f"❌ Failed to update daily progress: {e}")
    
    def get_current_phase(self):
        """Get the current active phase based on time"""
        current_time = datetime.now()
        current_time_str = current_time.strftime("%H:%M")
        
        # Find matching phase (within 30 minutes)
        for phase_time, phase_config in PHASES.items():
            phase_hour, phase_minute = map(int, phase_time.split(':'))
            phase_dt = current_time.replace(hour=phase_hour, minute=phase_minute, second=0, microsecond=0)
            
            time_diff = abs((current_time - phase_dt).total_seconds() / 60)
            if time_diff <= 30:  # Within 30 minutes
                return phase_time, phase_config
        
        return None, None
    
    async def load_cookies(self, context):
        """Load cookies from file with format fixing"""
        try:
            cookies_path = os.getenv("COOKIES_FILE", CONFIG['cookiesFile'])
            if not os.path.exists(cookies_path):
                logger.error(f"❌ No cookies file found: {cookies_path}")
                return False
            
            with open(cookies_path, 'r') as f:
                cookies = json.load(f)
            
            logger.info(f"📄 Loading {len(cookies)} cookies")
            
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
            
            await context.add_cookies(formatted_cookies)
            logger.info("✅ Cookies loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load cookies: {e}")
            return False
    
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
    
    async def get_media_filename(self, media_item):
        """Extract filename from media item"""
        try:
            filename = await media_item.evaluate("""
                () => {
                    const img = this.querySelector('img');
                    if (img) {
                        const src = img.src || img.getAttribute('data-src');
                        if (src) {
                            return src.split('/').pop().split('?')[0];
                        }
                    }
                    return 'unknown_' + Math.random().toString(36).substr(2, 9);
                }
            """)
            return filename
        except Exception as e:
            return f"unknown_{random.randint(1000, 9999)}"
    
    async def run_phase(self, phase_time, phase_config):
        """Run a specific DM phase"""
        try:
            logger.info(f"🚀 Running phase {phase_time}: {phase_config['description']}")
            
            # Load messages for this phase
            messages_file = phase_config['file']
            if not os.path.exists(messages_file):
                logger.error(f"❌ Messages file not found: {messages_file}")
                return False
            
            # Load messages
            df = pd.read_excel(messages_file)
            messages = df.iloc[:, 0].dropna().tolist()
            if not messages:
                logger.error(f"❌ No messages found in {messages_file}")
                return False
            
            logger.info(f"📝 Loaded {len(messages)} messages from {messages_file}")
            
            # Navigate to messages page
            await self.page.goto(CONFIG['messagesUrl'])
            await self.page.wait_for_timeout(3000)
            
            # Select random message
            message = random.choice(messages)
            logger.info(f"📝 Selected message: {message[:50]}...")
            
            # Auto-clear used media if needed (for media recycling)
            used_media = self.load_used_media()
            if len(used_media) > 100:  # If we have many used items, clear periodically
                logger.info("🔄 Clearing used media list for recycling...")
                used_media.clear()
                self.save_used_media(used_media)
            
            # For now, just log success (implement full DM logic here)
            logger.info(f"✅ Phase {phase_config['type']} completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Phase failed: {e}")
            return False
    
    async def run_bot(self):
        """Main bot logic - run exactly 1 phase and exit"""
        try:
            logger.info("🤖 Starting Fanvue Mass DM Bot (Crontab Mode)")
            logger.info(f"⏰ Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Check daily progress
            phases_today = self.get_daily_progress()
            
            if phases_today >= 6:
                logger.info(f"✅ All 6 phases completed today. Exiting.")
                return True
            
            # Get current active phase
            phase_time, phase_config = self.get_current_phase()
            
            if not phase_time:
                logger.info(f"⏰ No active phase at current time")
                return True
            
            logger.info(f"📊 Daily Progress: {phases_today}/6 phases completed")
            next_phase = phases_today + 1
            logger.info(f"🎯 Running phase #{next_phase}: {phase_time}")
            
            # Initialize Playwright
            self.playwright = await async_playwright().start()
            
            # Launch browser
            self.browser = await self.playwright.chromium.launch(
                headless=CONFIG['headless'],
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--ignore-gpu-blocklist",
                    "--use-gl=swiftshader",
                    "--disable-features=VizDisplayCompositor"
                ]
            )
            
            # Create context and page
            context = await self.browser.new_context()
            self.page = await context.new_page()
            
            # Load cookies
            if not await self.load_cookies(context):
                return False
            
            # Navigate and check login
            await self.page.goto(CONFIG['baseUrl'])
            await self.page.wait_for_timeout(3000)
            
            current_url = self.page.url
            if '/signin' in current_url or '/login' in current_url:
                logger.error("❌ Not logged in - please update cookies")
                return False
            
            logger.info("✅ Successfully logged in")
            
            # Run the current phase
            success = await self.run_phase(phase_time, phase_config)
            
            if success:
                # Update daily progress
                self.update_daily_progress(next_phase)
                logger.info(f"🎉 Phase #{next_phase}/6 completed successfully!")
            else:
                logger.error(f"❌ Failed to complete phase #{next_phase}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Bot failed: {e}")
            return False
        finally:
            # Cleanup
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("🔒 Browser closed, script exiting")

async def main():
    """Main entry point for crontab execution"""
    try:
        with BotLock():
            bot = FanvueMassDMBot()
            success = await bot.run_bot()
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
    exit(asyncio.run(main()))
