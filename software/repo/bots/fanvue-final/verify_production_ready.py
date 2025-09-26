#!/usr/bin/env python3
"""
Fanvue Final Production Readiness Verification Script
Checks all components for production deployment
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def print_status(message, status="INFO"):
    colors = {
        "INFO": "\033[94m",
        "SUCCESS": "\033[92m", 
        "WARNING": "\033[93m",
        "ERROR": "\033[91m"
    }
    reset = "\033[0m"
    print(f"{colors.get(status, '')}[{status}]{reset} {message}")

def check_file_exists(filepath, description):
    """Check if a file exists and report status"""
    if os.path.exists(filepath):
        print_status(f"✅ {description}: {filepath}", "SUCCESS")
        return True
    else:
        print_status(f"❌ {description}: {filepath}", "ERROR")
        return False

def check_python_imports():
    """Check if required Python packages can be imported"""
    required_packages = [
        ('playwright', 'playwright'),
        ('pandas', 'pandas'), 
        ('openpyxl', 'openpyxl'),
        ('xlrd', 'xlrd'),
        ('psutil', 'psutil'),
        ('python-dotenv', 'dotenv'),
        ('tenacity', 'tenacity'),
        ('odfpy', 'odf')
    ]
    
    missing_packages = []
    for package_name, import_name in required_packages:
        try:
            __import__(import_name)
            print_status(f"✅ Python package '{package_name}' available", "SUCCESS")
        except ImportError:
            print_status(f"❌ Python package '{package_name}' missing", "ERROR")
            missing_packages.append(package_name)
    
    return len(missing_packages) == 0

def check_requirements_files():
    """Check requirements.txt files"""
    requirements_files = [
        "requirements.txt",
        "mass dm bot/requirements.txt", 
        "posting bot/requirements.txt"
    ]
    
    all_good = True
    for req_file in requirements_files:
        if check_file_exists(req_file, f"Requirements file"):
            # Check if file has content
            try:
                with open(req_file, 'r') as f:
                    content = f.read().strip()
                    if content:
                        print_status(f"✅ {req_file} has content ({len(content.splitlines())} lines)", "SUCCESS")
                    else:
                        print_status(f"❌ {req_file} is empty", "ERROR")
                        all_good = False
            except Exception as e:
                print_status(f"❌ Error reading {req_file}: {e}", "ERROR")
                all_good = False
        else:
            all_good = False
    
    return all_good

def check_bot_scripts():
    """Check main bot scripts"""
    scripts = [
        ("mass dm bot/fanvue_mass_dm.py", "Mass DM Bot Script"),
        ("posting bot/fanvue_poster.py", "Posting Bot Script")
    ]
    
    all_good = True
    for script_path, description in scripts:
        if check_file_exists(script_path, description):
            # Check if script is executable and has proper shebang
            try:
                with open(script_path, 'r') as f:
                    first_line = f.readline().strip()
                    if first_line.startswith('#!/usr/bin/env python3'):
                        print_status(f"✅ {script_path} has proper shebang", "SUCCESS")
                    else:
                        print_status(f"⚠️ {script_path} missing shebang", "WARNING")
            except Exception as e:
                print_status(f"❌ Error reading {script_path}: {e}", "ERROR")
                all_good = False
        else:
            all_good = False
    
    return all_good

def check_setup_scripts():
    """Check setup and deployment scripts"""
    setup_scripts = [
        ("setup_vps.sh", "VPS Setup Script"),
        ("setup_crontab.sh", "Crontab Setup Script"),
        ("setup_pm2.sh", "PM2 Setup Script"),
        ("monitor_logs.sh", "Log Monitoring Script")
    ]
    
    all_good = True
    for script_path, description in setup_scripts:
        if check_file_exists(script_path, description):
            # Check if script is executable
            if os.access(script_path, os.X_OK):
                print_status(f"✅ {script_path} is executable", "SUCCESS")
            else:
                print_status(f"⚠️ {script_path} not executable (chmod +x needed)", "WARNING")
        else:
            all_good = False
    
    return all_good

def check_pm2_config():
    """Check PM2 ecosystem configuration"""
    config_file = "fanvue_ecosystem_template.config.js"
    if check_file_exists(config_file, "PM2 Ecosystem Config"):
        try:
            with open(config_file, 'r') as f:
                content = f.read()
                if 'apps:' in content and 'name:' in content:
                    print_status(f"✅ {config_file} has valid PM2 configuration", "SUCCESS")
                    return True
                else:
                    print_status(f"❌ {config_file} missing PM2 configuration", "ERROR")
                    return False
        except Exception as e:
            print_status(f"❌ Error reading {config_file}: {e}", "ERROR")
            return False
    return False

def check_sample_files():
    """Check sample configuration files"""
    sample_files = [
        ("sample_fanvue_cookies.json", "Sample Cookies File"),
        ("sample_captions.xlsx", "Sample Captions File")
    ]
    
    all_good = True
    for file_path, description in sample_files:
        if check_file_exists(file_path, description):
            print_status(f"✅ {file_path} available for reference", "SUCCESS")
        else:
            print_status(f"⚠️ {file_path} missing (optional)", "WARNING")
    
    return all_good

def check_directory_structure():
    """Check if directory structure is correct"""
    required_dirs = [
        "mass dm bot",
        "posting bot"
    ]
    
    all_good = True
    for dir_name in required_dirs:
        if os.path.isdir(dir_name):
            print_status(f"✅ Directory '{dir_name}' exists", "SUCCESS")
        else:
            print_status(f"❌ Directory '{dir_name}' missing", "ERROR")
            all_good = False
    
    return all_good

def main():
    """Main verification function"""
    print_status("🚀 Fanvue Final Production Readiness Verification", "INFO")
    print_status("=" * 60, "INFO")
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print_status(f"📁 Working directory: {os.getcwd()}", "INFO")
    print_status("", "INFO")
    
    # Run all checks
    checks = [
        ("Directory Structure", check_directory_structure),
        ("Bot Scripts", check_bot_scripts),
        ("Requirements Files", check_requirements_files),
        ("Setup Scripts", check_setup_scripts),
        ("PM2 Configuration", check_pm2_config),
        ("Sample Files", check_sample_files),
        ("Python Imports", check_python_imports)
    ]
    
    results = {}
    for check_name, check_func in checks:
        print_status(f"\n🔍 Checking {check_name}...", "INFO")
        try:
            results[check_name] = check_func()
        except Exception as e:
            print_status(f"❌ Error in {check_name}: {e}", "ERROR")
            results[check_name] = False
    
    # Summary
    print_status("\n" + "=" * 60, "INFO")
    print_status("📊 PRODUCTION READINESS SUMMARY", "INFO")
    print_status("=" * 60, "INFO")
    
    passed = sum(results.values())
    total = len(results)
    
    for check_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print_status(f"{check_name}: {status}", "SUCCESS" if result else "ERROR")
    
    print_status("", "INFO")
    if passed == total:
        print_status("🎉 ALL CHECKS PASSED - PRODUCTION READY! 🎉", "SUCCESS")
        print_status("", "INFO")
        print_status("📋 Next Steps:", "INFO")
        print_status("1. Upload to VPS: scp -r . deploy@213.239.209.110:/home/deploy/fanvue_final/", "INFO")
        print_status("2. Run setup: ./setup_vps.sh", "INFO")
        print_status("3. Add client: ./setup_new_client.sh <client_name>", "INFO")
        print_status("4. Update cookies and content files", "INFO")
        print_status("5. Start bots: ./start_all_clients.sh", "INFO")
        return 0
    else:
        print_status(f"⚠️ {total - passed} CHECKS FAILED - NOT PRODUCTION READY", "ERROR")
        print_status("", "INFO")
        print_status("🔧 Fix the failed checks before deploying to production", "WARNING")
        return 1

if __name__ == "__main__":
    sys.exit(main())
