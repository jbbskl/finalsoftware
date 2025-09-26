#!/usr/bin/env python3
"""
Test runner for OnlyFans posting bot
Usage: python run_tests.py
"""

import asyncio
import sys
from pathlib import Path
from of_post_main import load_cfg, run_post, log

async def main():
    try:
        # Load test configuration
        cfg = load_cfg("of_post_config.test.yaml")
        
        log("🧪 Starting OnlyFans Posting Bot TEST MODE")
        log(f"🔧 Headless: {cfg.get('headless', True)}")
        log(f"🧪 Dry-run: {cfg.get('dry_run', False)}")
        
        models = cfg.get("models", [])
        for m_i, model in enumerate(models, start=1):
            posts = model.get("posts", [])
            log("=" * 70)
            log(f"MODEL {m_i}/{len(models)}: {model.get('name','(unnamed)')} | posts: {len(posts)}")
            log("=" * 70)
            
            for p_i, post in enumerate(posts, start=1):
                log(f"--- Test {p_i}/{len(posts)} :: {post.get('name','post')} ---")
                try:
                    await run_post(cfg, model, post)
                    log(f"✅ Test {post.get('name')} completed successfully")
                except Exception as e:
                    log(f"❌ Test {post.get('name')} failed: {e}")
                    if "--continue-on-error" not in sys.argv:
                        raise
                
                # Small delay between tests
                await asyncio.sleep(2)
        
        log("🎉 All tests completed!")
        
    except KeyboardInterrupt:
        log("⏹️ Tests interrupted by user")
    except Exception as e:
        log(f"💥 Test suite failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
