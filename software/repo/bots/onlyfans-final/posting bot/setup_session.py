#!/usr/bin/env python3
"""
OnlyFans Session Setup - One-time authentication
Creates a persistent browser session that the bot can reuse
"""

import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def setup_session():
    print("🔐 OnlyFans Session Setup")
    print("=" * 50)
    print("This creates a persistent browser session for the bot.")
    print("You only need to run this ONCE per client setup.")
    print("")
    
    # Use the same persistent browser data directory as the bot
    browser_data_dir = Path("./browser_data")
    browser_data_dir.mkdir(exist_ok=True)
    
    pw = await async_playwright().start()
    
    try:
        print("🌐 Opening persistent browser session...")
        
        # Launch the same persistent context the bot will use
        browser = await pw.chromium.launch_persistent_context(
            user_data_dir=str(browser_data_dir),
            headless=False,  # Always visible for manual login
            args=["--window-size=1200,800"],
            viewport={"width": 1200, "height": 800}
        )
        
        # Get or create page
        if browser.pages:
            page = browser.pages[0]
        else:
            page = await browser.new_page()
        
        print("🔗 Navigating to OnlyFans...")
        await page.goto("https://onlyfans.com", wait_until="domcontentloaded")
        
        print("👤 Please login manually in the browser window:")
        print("   1. Enter your email and password")
        print("   2. Complete any CAPTCHA/verification if required")  
        print("   3. Wait until you see your OnlyFans feed/homepage")
        print("   4. Then press ENTER in this terminal")
        print("")
        print("💡 TIP: The browser session will be saved automatically")
        print("       The bot will reuse this session for all future runs")
        print("")
        
        # Wait for user to complete login
        input("Press ENTER after you have successfully logged in...")
        
        # Verify login was successful
        current_url = page.url
        page_title = await page.title()
        
        print(f"🔍 Current URL: {current_url}")
        print(f"📄 Page title: {page_title}")
        
        # Check if still on login page
        if "login" in current_url.lower():
            print("❌ Still on login page. Please complete login first.")
            print("   Run this script again after logging in successfully.")
            return
        
        # Check for login form elements
        try:
            login_form = page.locator('input[name="email"], input[type="email"]')
            await login_form.wait_for(state="visible", timeout=3000)
            print("⚠️ Login form still visible. Please ensure you're fully logged in.")
            print("   You should see your OnlyFans feed, not the login page.")
            return
        except:
            # Good! No login form found
            pass
        
        print("")
        print("✅ Session setup complete!")
        print(f"📁 Browser data saved to: {browser_data_dir}")
        print("")
        print("🎉 You can now run the bot:")
        print("   python run_tests.py")
        print("")
        print("💡 This session will persist until you:")
        print("   - Delete the browser_data folder")
        print("   - OnlyFans logs you out (rare)")
        print("   - You change your OnlyFans password")
        
    except KeyboardInterrupt:
        print("\n⏹️ Session setup cancelled")
    except Exception as e:
        print(f"❌ Error during session setup: {e}")
    finally:
        print("\n🔚 Closing browser...")
        await browser.close()
        await pw.stop()

if __name__ == "__main__":
    asyncio.run(setup_session())
