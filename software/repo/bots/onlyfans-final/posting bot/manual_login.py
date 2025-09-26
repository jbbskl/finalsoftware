#!/usr/bin/env python3
"""
Manual Login Helper for OnlyFans
Run this first to authenticate manually, then use the bot
"""

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

async def manual_login():
    print("🔐 OnlyFans Manual Login Helper")
    print("=" * 50)
    print("This will open a browser where you can login manually.")
    print("After successful login, cookies will be saved for automated use.")
    print("")
    
    pw = await async_playwright().start()
    browser = await pw.chromium.launch(headless=False, args=["--window-size=1200,800"])
    context = await browser.new_context(viewport={"width": 1200, "height": 800})
    page = await context.new_page()
    
    try:
        print("🌐 Opening OnlyFans...")
        await page.goto("https://onlyfans.com/", wait_until="domcontentloaded")
        
        print("👤 Please login manually in the browser window")
        print("   1. Enter your email and password")
        print("   2. Complete any CAPTCHA if required")
        print("   3. Wait until you see your OnlyFans feed/homepage")
        print("   4. Then press ENTER in this terminal")
        print("")
        
        # Wait for user to login manually
        input("Press ENTER after you have successfully logged in...")
        
        # Check if login was successful
        current_url = page.url
        page_title = await page.title()
        
        print(f"🔍 Current URL: {current_url}")
        print(f"📄 Page title: {page_title}")
        
        # Check for login indicators
        if "login" in current_url.lower():
            print("❌ Still on login page. Please complete login first.")
            return
        
        # Save cookies
        cookies_dir = Path("cookies")
        cookies_dir.mkdir(exist_ok=True)
        
        # Save to multiple locations for flexibility
        storage_state = await context.storage_state()
        cookies = storage_state.get("cookies", [])
        
        if cookies:
            # Save as Playwright storage state
            with open("cookies/onlyfans_session.json", "w") as f:
                json.dump(storage_state, f, indent=2)
            
            # Save cookies in simple format for testing
            with open("cookies/testing_of.json", "w") as f:
                json.dump(cookies, f, indent=2)
            
            print(f"✅ Saved {len(cookies)} cookies to:")
            print("   - cookies/onlyfans_session.json (full session)")  
            print("   - cookies/testing_of.json (cookies only)")
            print("")
            print("🎉 Manual login complete!")
            print("   You can now run the bot: python run_tests.py")
        else:
            print("❌ No cookies found. Login may not have completed successfully.")
        
    except KeyboardInterrupt:
        print("\n⏹️ Manual login cancelled")
    except Exception as e:
        print(f"❌ Error during manual login: {e}")
    finally:
        print("\n🔚 Closing browser...")
        await browser.close()
        await pw.stop()

if __name__ == "__main__":
    asyncio.run(manual_login())
