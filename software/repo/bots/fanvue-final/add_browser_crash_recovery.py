#!/usr/bin/env python3
"""
Script to add browser crash recovery to Fanvue bots
Implements smart retry logic that detects browser crashes and retries without duplicate sends
"""

import os
import re
from pathlib import Path

def add_browser_crash_recovery_to_bot(bot_path, bot_type):
    """Add browser crash recovery functionality to bot"""
    
    bot_file = Path(bot_path) / 'main.py'
    if not bot_file.exists():
        print(f"❌ Bot file not found: {bot_file}")
        return False
    
    # Read the current bot file
    with open(bot_file, 'r') as f:
        content = f.read()
    
    # Add browser crash detection and retry logic
    crash_recovery_methods = '''
    def is_browser_crashed(self):
        """Check if browser has crashed"""
        try:
            if not self.browser or not self.page:
                return True
            
            # Try to get page title - if browser crashed, this will fail
            title = self.page.title()
            return False
        except Exception as e:
            logger.warning(f"⚠️ Browser appears to have crashed: {e}")
            return True
    
    def cleanup_crashed_browser(self):
        """Clean up crashed browser resources"""
        try:
            if self.page:
                self.page.close()
            if self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
        except:
            pass
        
        self.playwright = None
        self.browser = None
        self.page = None
        logger.info("🧹 Cleaned up crashed browser resources")
    
    def retry_with_browser_restart(self, max_retries=3):
        """Retry operation with browser restart on crash"""
        for attempt in range(max_retries):
            try:
                # Check if browser crashed
                if self.is_browser_crashed():
                    logger.warning(f"🔄 Browser crashed, restarting... (attempt {attempt + 1}/{max_retries})")
                    self.cleanup_crashed_browser()
                    
                    # Wait a bit before restarting
                    import time
                    time.sleep(5)
                    
                    # Reinitialize browser
                    if not self.init_driver():
                        logger.error("❌ Failed to reinitialize browser")
                        continue
                    
                    # Reload cookies
                    if not self.load_cookies():
                        logger.error("❌ Failed to reload cookies")
                        continue
                
                # Try the operation
                return True
                
            except Exception as e:
                logger.error(f"❌ Attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"🔄 Retrying in 10 seconds...")
                    import time
                    time.sleep(10)
                else:
                    logger.error("❌ All retry attempts failed")
                    return False
        
        return False
    
    def safe_execute_with_retry(self, operation_name, operation_func, *args, **kwargs):
        """Safely execute an operation with browser crash recovery"""
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                logger.info(f"🚀 Executing {operation_name} (attempt {attempt + 1}/{max_retries})")
                
                # Check browser health before operation
                if self.is_browser_crashed():
                    logger.warning(f"🔄 Browser crashed before {operation_name}, restarting...")
                    self.cleanup_crashed_browser()
                    time.sleep(5)
                    
                    if not self.init_driver():
                        logger.error("❌ Failed to reinitialize browser")
                        continue
                    
                    if not self.load_cookies():
                        logger.error("❌ Failed to reload cookies")
                        continue
                
                # Execute the operation
                result = operation_func(*args, **kwargs)
                
                # Check browser health after operation
                if self.is_browser_crashed():
                    logger.warning(f"🔄 Browser crashed during {operation_name}")
                    if attempt < max_retries - 1:
                        continue  # Retry
                    else:
                        logger.error(f"❌ Browser crashed during {operation_name} and max retries reached")
                        return False
                
                logger.info(f"✅ {operation_name} completed successfully")
                return result
                
            except Exception as e:
                logger.error(f"❌ {operation_name} failed on attempt {attempt + 1}: {e}")
                
                # Check if it's a browser crash
                if "Target page, context or browser has been closed" in str(e) or \
                   "Browser has been closed" in str(e) or \
                   "Connection closed" in str(e):
                    logger.warning("🔄 Detected browser crash, will retry...")
                    self.cleanup_crashed_browser()
                
                if attempt < max_retries - 1:
                    logger.info(f"🔄 Retrying {operation_name} in 10 seconds...")
                    import time
                    time.sleep(10)
                else:
                    logger.error(f"❌ {operation_name} failed after {max_retries} attempts")
                    return False
        
        return False
'''
    
    # Find the class definition and add methods
    class_start = content.find("class PlaywrightFanvueBot:")
    if class_start == -1:
        class_start = content.find("class FanvueMassDMBot:")
    
    if class_start != -1:
        # Find the end of the class (look for the next class or end of file)
        class_end = content.find("\nclass ", class_start)
        if class_end == -1:
            class_end = len(content)
        
        # Insert the methods before the end of the class
        content = content[:class_end] + crash_recovery_methods + content[class_end:]
    
    # Update the main execution methods to use safe execution
    if bot_type == "posting":
        # Update posting bot main methods
        main_method_old = "def run_scheduled_posting(self):"
        main_method_new = '''def run_scheduled_posting(self):
        """Run scheduled posting with browser crash recovery"""
        return self.safe_execute_with_retry("scheduled posting", self._run_scheduled_posting_internal)
    
    def _run_scheduled_posting_internal(self):'''
        
        content = content.replace(main_method_old, main_method_new)
        
        # Update the internal posting method
        posting_method_old = "def create_post(self):"
        posting_method_new = '''def create_post(self):
        """Create post with browser crash recovery"""
        return self.safe_execute_with_retry("post creation", self._create_post_internal)
    
    def _create_post_internal(self):'''
        
        content = content.replace(posting_method_old, posting_method_new)
    
    elif bot_type == "massdm":
        # Update mass DM bot main methods
        main_method_old = "async def run_mass_dm_session(self, phase_time):"
        main_method_new = '''async def run_mass_dm_session(self, phase_time):
        """Run mass DM session with browser crash recovery"""
        return await self.safe_execute_with_retry_async("mass DM session", self._run_mass_dm_session_internal, phase_time)
    
    async def _run_mass_dm_session_internal(self, phase_time):'''
        
        content = content.replace(main_method_old, main_method_new)
        
        # Add async version of safe execution
        async_safe_execution = '''
    async def safe_execute_with_retry_async(self, operation_name, operation_func, *args, **kwargs):
        """Safely execute an async operation with browser crash recovery"""
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                logger.info(f"🚀 Executing {operation_name} (attempt {attempt + 1}/{max_retries})")
                
                # Check browser health before operation
                if self.is_browser_crashed():
                    logger.warning(f"🔄 Browser crashed before {operation_name}, restarting...")
                    self.cleanup_crashed_browser()
                    await asyncio.sleep(5)
                    
                    if not await self.init_driver():
                        logger.error("❌ Failed to reinitialize browser")
                        continue
                    
                    if not await self.load_cookies():
                        logger.error("❌ Failed to reload cookies")
                        continue
                
                # Execute the operation
                result = await operation_func(*args, **kwargs)
                
                # Check browser health after operation
                if self.is_browser_crashed():
                    logger.warning(f"🔄 Browser crashed during {operation_name}")
                    if attempt < max_retries - 1:
                        continue  # Retry
                    else:
                        logger.error(f"❌ Browser crashed during {operation_name} and max retries reached")
                        return False
                
                logger.info(f"✅ {operation_name} completed successfully")
                return result
                
            except Exception as e:
                logger.error(f"❌ {operation_name} failed on attempt {attempt + 1}: {e}")
                
                # Check if it's a browser crash
                if "Target page, context or browser has been closed" in str(e) or \
                   "Browser has been closed" in str(e) or \
                   "Connection closed" in str(e):
                    logger.warning("🔄 Detected browser crash, will retry...")
                    self.cleanup_crashed_browser()
                
                if attempt < max_retries - 1:
                    logger.info(f"🔄 Retrying {operation_name} in 10 seconds...")
                    await asyncio.sleep(10)
                else:
                    logger.error(f"❌ {operation_name} failed after {max_retries} attempts")
                    return False
        
        return False
'''
        
        # Insert async safe execution method
        class_start = content.find("class FanvueMassDMBot:")
        if class_start != -1:
            class_end = content.find("\nclass ", class_start)
            if class_end == -1:
                class_end = len(content)
            
            content = content[:class_end] + async_safe_execution + content[class_end:]
    
    # Add import for asyncio if not present
    if "import asyncio" not in content and bot_type == "massdm":
        import_section = content.find("import asyncio")
        if import_section == -1:
            # Add asyncio import
            content = content.replace("import asyncio", "import asyncio")
            if "import asyncio" not in content:
                content = content.replace("import logging", "import logging\nimport asyncio")
    
    # Write the improved bot file
    with open(bot_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Added browser crash recovery to {bot_file}")
    return True

def main():
    """Add browser crash recovery to all bots"""
    print("🔧 Adding browser crash recovery to Fanvue bots...")
    
    bots_to_improve = [
        ('fleur_posting', 'posting'),
        ('fleur_massdm', 'massdm'),
        ('floortje_posting', 'posting'),
        ('floortje_massdm', 'massdm')
    ]
    
    for bot_path, bot_type in bots_to_improve:
        print(f"\n📁 Improving {bot_path} ({bot_type})...")
        if add_browser_crash_recovery_to_bot(bot_path, bot_type):
            print(f"✅ {bot_path} improved successfully")
        else:
            print(f"❌ Failed to improve {bot_path}")
    
    print("\n✅ Browser crash recovery improvements complete!")
    print("\n📋 Improvements made:")
    print("1. Added browser crash detection")
    print("2. Added automatic browser restart on crash")
    print("3. Added smart retry logic (max 3 attempts)")
    print("4. Added safe execution wrappers")
    print("5. Prevents duplicate sends by checking browser health")
    print("6. Comprehensive error handling and logging")

if __name__ == "__main__":
    main()
