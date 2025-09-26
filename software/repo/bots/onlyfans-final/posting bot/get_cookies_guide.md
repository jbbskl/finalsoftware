# 🍪 Get Fresh OnlyFans Cookies

## Method 1: Browser Developer Tools (Most Reliable)

1. **Open OnlyFans in Chrome/Firefox**
   - Go to `https://onlyfans.com/` 
   - Make sure you're logged in and can see your feed

2. **Open Developer Tools**
   - Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

3. **Go to Application/Storage Tab**
   - Click **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Click **Cookies** in the left sidebar
   - Click **https://onlyfans.com**

4. **Copy All Cookies**
   - Right-click in the cookies area
   - Select "Export" or manually copy each cookie

5. **Convert to Playwright Format**
   - Use the format below for each cookie

## Method 2: Cookie Editor Extension (Easier)

1. **Install Cookie Editor**
   - Chrome: https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/

2. **Export Cookies**
   - Go to OnlyFans (logged in)
   - Click Cookie Editor extension icon
   - Click "Export" → "Netscape HTTP Cookie File" or "JSON"

3. **Convert to Playwright Format** (see below)

## Playwright Cookie Format

```json
[
  {
    "name": "auth_id",
    "value": "YOUR_USER_ID",
    "domain": "onlyfans.com",
    "path": "/",
    "expires": 1792773982,
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
  },
  {
    "name": "sess", 
    "value": "YOUR_SESSION_ID",
    "domain": "onlyfans.com",
    "path": "/",
    "expires": 1759169886,
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
  },
  {
    "name": "st",
    "value": "YOUR_SECURITY_TOKEN", 
    "domain": ".onlyfans.com",
    "path": "/",
    "expires": 1792867843,
    "httpOnly": false,
    "secure": true,
    "sameSite": "None"
  }
]
```

## 🔑 Critical Cookies for OnlyFans

Make sure these cookies are present and valid:
- **`auth_id`** - Your user ID
- **`sess`** - Session identifier  
- **`st`** - Security token
- **`csrf`** - CSRF protection token

## ⚠️ Common Issues

1. **Cookies expire quickly** - OnlyFans sessions timeout
2. **Missing httpOnly cookies** - Browser extensions can't export these
3. **Domain mismatch** - Use exact domains (.onlyfans.com vs onlyfans.com)

## 🧪 Test Your Cookies

Run: `python debug_cookies.py`

Should show: **✅ No login elements found - likely authenticated!**
