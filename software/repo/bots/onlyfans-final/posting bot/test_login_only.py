#!/usr/bin/env python3
"""
Simple test to verify login process works
"""

import asyncio
from of_post_main import load_cfg, open_home, log

async def test_login():
    try:
        # Load test configuration
        cfg = load_cfg("of_post_config.test.yaml")
        model = cfg["models"][0]  # First model
        
        log("🧪 Testing OnlyFans login process only...")
        log(f"📧 Email: {cfg.get('email')}")
        log(f"🍪 Cookies: {model.get('cookies_path')}")
        
        # Test login
        pw, browser, context, page = await open_home(cfg, model)
        
        # If we get here, login worked!
        log("🎉 Login test successful!")
        log(f"📍 Current URL: {page.url}")
        log(f"📄 Page title: {await page.title()}")
        
        # Keep browser open for 10 seconds to verify
        log("🖼️ Browser will stay open for 10 seconds for verification...")
        await asyncio.sleep(10)
        
        # Cleanup
        await browser.close()
        await pw.stop()
        log("✅ Login test completed successfully!")
        
    except KeyboardInterrupt:
        log("⏹️ Test interrupted by user")
    except Exception as e:
        log(f"❌ Login test failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(test_login())
