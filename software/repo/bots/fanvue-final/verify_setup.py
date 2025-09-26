#!/usr/bin/env python3
"""
Fanvue Bots Setup Verification Script
Checks if all required files are present and properly configured
"""

import os
import json
import pandas as pd
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and report status"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} - MISSING")
        return False

def check_cookies_file(filepath, description):
    """Check if cookies file exists and is valid JSON"""
    if not os.path.exists(filepath):
        print(f"❌ {description}: {filepath} - MISSING")
        return False
    
    try:
        with open(filepath, 'r') as f:
            cookies = json.load(f)
        if isinstance(cookies, list) and len(cookies) > 0:
            print(f"✅ {description}: {filepath} - Valid JSON with {len(cookies)} cookies")
            return True
        else:
            print(f"⚠️ {description}: {filepath} - Empty or invalid format")
            return False
    except json.JSONDecodeError:
        print(f"❌ {description}: {filepath} - Invalid JSON")
        return False

def check_excel_file(filepath, description):
    """Check if Excel file exists and has content"""
    if not os.path.exists(filepath):
        print(f"❌ {description}: {filepath} - MISSING")
        return False
    
    try:
        df = pd.read_excel(filepath)
        if not df.empty:
            print(f"✅ {description}: {filepath} - {len(df)} rows")
            return True
        else:
            print(f"⚠️ {description}: {filepath} - Empty file")
            return False
    except Exception as e:
        print(f"❌ {description}: {filepath} - Error reading file: {e}")
        return False

def main():
    print("🔍 Fanvue Bots Setup Verification")
    print("=" * 50)
    
    # Check bot scripts
    print("\n📜 Bot Scripts:")
    scripts = [
        ("kiko_posting_bot.py", "Kiko Posting Bot"),
        ("kiko_mass_dm_bot.py", "Kiko Mass DM Bot"),
        ("floortje_posting_bot.py", "Floortje Posting Bot"),
        ("floortje_mass_dm_bot.py", "Floortje Mass DM Bot")
    ]
    
    for script, description in scripts:
        check_file_exists(script, description)
    
    # Check cookies
    print("\n🍪 Authentication Cookies:")
    check_cookies_file("fleur_cookies.json", "Fleur Cookies")
    check_cookies_file("floortje_cookies.json", "Floortje Cookies")
    
    # Check sample files
    print("\n📋 Sample Configuration Files:")
    check_excel_file("sample_captions.xlsx", "Sample Captions")
    
    mass_dm_files = [
        ("sample_2.xlsx", "Sample 2.xlsx (02:00 phase)"),
        ("sample_13.xlsx", "Sample 13.xlsx (08:00 phase)"),
        ("sample_17.xlsx", "Sample 17.xlsx (13:00 phase)"),
        ("sample_18.xlsx", "Sample 18.xlsx (18:00 phase)"),
        ("sample_21.xlsx", "Sample 21.xlsx (16:00 phase)"),
        ("sample_22.xlsx", "Sample 22.xlsx (21:00 phase)")
    ]
    
    for file, description in mass_dm_files:
        check_excel_file(file, description)
    
    # Check documentation
    print("\n📚 Documentation:")
    docs = [
        ("SETUP_GUIDE.md", "Setup Guide"),
        ("FINAL_SETUP_SUMMARY.md", "Final Setup Summary"),
        ("kiko_posting_config_explanation.md", "Kiko Posting Config Guide"),
        ("kiko_mass_dm_config_explanation.md", "Kiko Mass DM Config Guide"),
        ("floortje_posting_config_explanation.md", "Floortje Posting Config Guide"),
        ("floortje_mass_dm_config_explanation.md", "Floortje Mass DM Config Guide")
    ]
    
    for doc, description in docs:
        check_file_exists(doc, description)
    
    print("\n" + "=" * 50)
    print("✅ Setup verification complete!")
    print("\n📝 Next steps:")
    print("1. Create actual content files (captions and messages)")
    print("2. Organize media files in proper folder structure")
    print("3. Copy cookies to bot directories as 'fanvue-cookies.json'")
    print("4. Set up cron jobs for automated scheduling")
    print("5. Deploy to VPS for production use")

if __name__ == "__main__":
    main()
