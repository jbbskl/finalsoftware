#!/usr/bin/env python3
"""
Debug script to test cookie loading and OnlyFans authentication
"""

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

async def debug_cookies():
    print("🔍 Debug: Testing OnlyFans cookie authentication")
    
    # Load cookies
    cookies_path = "cookies/testing_of.json"
    print(f"📂 Loading cookies from: {cookies_path}")
    
    if not Path(cookies_path).exists():
        print(f"❌ Cookies file not found: {cookies_path}")
        return
    
    try:
        with open(cookies_path, 'r') as f:
            cookies = json.load(f)
        print(f"✅ Loaded {len(cookies)} cookies")
        
        # Show cookie names and domains
        for i, cookie in enumerate(cookies[:3]):  # Show first 3
            print(f"  {i+1}. {cookie['name']} ({cookie['domain']})")
        print(f"  ... and {len(cookies)-3} more")
        
    except Exception as e:
        print(f"❌ Error loading cookies: {e}")
        return
    
    # Test with browser
    print("\n🌐 Opening browser to test authentication...")
    
    pw = await async_playwright().start()
    browser = await pw.chromium.launch(headless=False)  # Always visible for debugging
    context = await browser.new_context()
    
    try:
        # Add cookies
        await context.add_cookies(cookies)
        print("✅ Cookies added to browser context")
        
        # Navigate to OnlyFans
        page = await context.new_page()
        print("🔗 Navigating to OnlyFans...")
        await page.goto("https://onlyfans.com/", wait_until="domcontentloaded")
        
        # Wait a bit for page to load
        await asyncio.sleep(5)
        
        current_url = page.url
        page_title = await page.title()
        
        print(f"📄 Current URL: {current_url}")
        print(f"📄 Page Title: {page_title}")
        
        # Check for login indicators
        login_indicators = [
            'input[name="email"]',
            'input[type="email"]', 
            'form[action*="login"]',
            'button:has-text("Log in")',
            'a[href*="login"]'
        ]
        
        found_login = False
        for selector in login_indicators:
            try:
                element = await page.locator(selector).first.wait_for(state="visible", timeout=2000)
                print(f"❌ Found login element: {selector}")
                found_login = True
                break
            except:
                continue
        
        if not found_login:
            print("✅ No login elements found - likely authenticated!")
            
            # Check for authenticated indicators
            auth_indicators = [
                'a[href="/posts/create"]',
                '.m-create-post',
                'button[data-name="PostsCreate"]',
                '[data-name="PostsCreate"]'
            ]
            
            for selector in auth_indicators:
                try:
                    element = await page.locator(selector).first.wait_for(state="visible", timeout=3000)
                    print(f"✅ Found authenticated element: {selector}")
                    break
                except:
                    continue
            else:
                print("⚠️ No clear authentication indicators found")
        
        print("\n⏸️ Browser will stay open for 30 seconds for manual inspection...")
        await asyncio.sleep(30)
        
    except Exception as e:
        print(f"❌ Error during browser test: {e}")
    
    finally:
        await browser.close()
        await pw.stop()
        print("🔚 Browser closed")

if __name__ == "__main__":
    asyncio.run(debug_cookies())
