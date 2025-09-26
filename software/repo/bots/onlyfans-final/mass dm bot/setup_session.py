#!/usr/bin/env python3
"""
Setup OnlyFans session for Mass DM Bot
Opens a non-headless browser for manual login, then saves the session for reuse.
"""

import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def setup_session():
    print("🚀 Setting up OnlyFans session...")
    print("📋 This will open a browser window for you to login manually")
    print("🔒 Your session will be saved and reused by both posting and DM bots")
    print("")
    
    pw = await async_playwright().start()
    
    # Use same browser data directory as the main bot
    browser_data_dir = Path("./browser_data")
    browser_data_dir.mkdir(exist_ok=True)
    
    print(f"📁 Using browser data directory: {browser_data_dir}")
    
    # Launch non-headless browser for manual login
    browser = await pw.chromium.launch_persistent_context(
        user_data_dir=str(browser_data_dir),
        headless=False,  # Show browser for manual login
        args=["--window-size=1200,800"],
        viewport={"width": 1200, "height": 800}
    )
    
    # Get or create page
    if browser.pages:
        page = browser.pages[0]
    else:
        page = await browser.new_page()
    
    print("🌐 Opening OnlyFans...")
    await page.goto("https://onlyfans.com/", wait_until="domcontentloaded")
    
    print("")
    print("👆 Please login manually in the browser window")
    print("🕒 Waiting for you to complete login...")
    print("✅ Once logged in, press Enter here to continue...")
    
    input()  # Wait for user to press Enter
    
    # Check if login was successful
    try:
        login_form = page.locator('form[action*="login"], input[name="email"], input[type="email"]')
        await login_form.wait_for(state="visible", timeout=3000)
        print("❌ Login not detected. Please ensure you're logged in and try again.")
        return False
    except Exception:
        # Good! No login form found
        print("✅ Login successful!")
        print("💾 Browser session has been saved")
        print("🤖 You can now run the mass DM bot or posting bot")
        return True
    finally:
        await browser.close()
        await pw.stop()

if __name__ == "__main__":
    success = asyncio.run(setup_session())
    if success:
        print("\n🎉 Setup complete! Run 'python of_dm_main.py' to start the bot.")
    else:
        print("\n❌ Setup failed. Please try again.")
