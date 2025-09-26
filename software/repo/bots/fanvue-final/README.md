# Fanvue Bots - Generalized System

A production-ready, scalable system for managing multiple Fanvue bot clients with automatic scheduling, error handling, and monitoring.

## 🚀 Quick Start

### 1. Setup VPS Environment
```bash
chmod +x setup_vps.sh
./setup_vps.sh
```

### 2. Add Your First Client
```bash
./setup_new_client.sh sarah
```

### 3. Configure Authentication
- Export fresh cookies from browser after logging into Fanvue
- Place in `sarah_fanvue/massdm/cookies.json` and `sarah_fanvue/posting/cookies.json`

### 4. Test Configuration
```bash
./manage_clients.sh test sarah
```

### 5. Start All Bots
```bash
./start_all_clients.sh
```

## 📁 System Architecture

```
fanvue final/
├── mass dm bot/                    # Template for mass DM bots
├── posting bot/                    # Template for posting bots
├── client1_fanvue/                 # Client 1 bots
│   ├── massdm/
│   └── posting/
├── client2_fanvue/                 # Client 2 bots
│   ├── massdm/
│   └── posting/
├── setup_new_client.sh             # Add new clients
├── manage_clients.sh               # Manage clients
├── fanvue_bots_env/               # Python virtual environment
└── fanvue_ecosystem_template.config.js  # PM2 configuration
```

## 🛠 Management Commands

### Client Management
```bash
./manage_clients.sh list                    # List all clients
./manage_clients.sh add <client_name>       # Add new client
./manage_clients.sh test <client_name>      # Test client bots
./manage_clients.sh logs <client_name>      # Show client logs
```

### Bot Operations
```bash
./start_all_clients.sh                      # Start all bots
./stop_all_clients.sh                       # Stop all bots
./restart_all_clients.sh                    # Restart all bots
./monitor_all_clients.sh                    # Monitor all bots
```

### Individual Bot Testing
```bash
cd client_fanvue/massdm
python fanvue_mass_dm.py --test-mode --headed

cd ../posting
python fanvue_poster.py --test-mode --headed
```

## 🤖 Bot Features

### Mass DM Bot
- **Text-only messages**: Simple text DMs
- **Media messages**: Send photos/videos with pricing
- **Text+Media**: Combine text and media
- **Excel captions**: Pull captions from Excel files
- **Audience targeting**: Send to specific user groups
- **Exclusion lists**: Exclude certain user groups
- **Automatic scheduling**: Continuous mode with daily reset

### Posting Bot
- **Text posts**: Simple text posts
- **Media posts**: Photo/video posts with pricing
- **Text+Media**: Combine text and media
- **Audience control**: Subscribers vs Followers+Subscribers
- **Vault filtering**: Filter content by folder
- **Excel captions**: Pull captions from Excel files
- **Scheduled posting**: Time-based posting automation

## ⚙️ Configuration

### Mass DM Configuration (`client_fanvue/massdm/config.yaml`)
```yaml
runtime:
  headless: true
  base_url: https://www.fanvue.com
  cookie_path: ./cookies.json

jobs:
  - name: morning_greeting
    mode: text
    caption: "Good morning! ☀️"
    send_to: ["All contacts"]
    exclude: []

  - name: premium_content
    mode: media
    send_to: ["Subscribers"]
    exclude: ["Expired subscribers"]
    media:
      folder_filter: "premium content"
      random_n: 2
    price: 9.99
```

### Posting Configuration (`client_fanvue/posting/config.yaml`)
```yaml
runtime:
  headless: true
  base_url: https://www.fanvue.com
  cookies_file: ./cookies.json

defaults:
  audience: subscribers
  post_type: text_media
  caption: ""

jobs:
  - name: daily_post
    post_type: text_media
    audience: subscribers
    caption: "Daily content! 🔥"
    folder_filter: "daily content"
    price: null
```

## 📊 Available Audience Types

### Mass DM Bot
- `All contacts` - Everyone
- `Online` - Currently online users
- `Followers` - Non-paying followers
- `Subscribers` - Paying subscribers
- `Non-renewing` - Subscribers who won't renew
- `Auto-renewing` - Subscribers with auto-renewal
- `Expired subscribers` - Past subscribers
- `Free trial subscribers` - Trial users
- `Spent more than $50` - High-value users

### Posting Bot
- `subscribers` - Subscribers only
- `followers_and_subscribers` - Both followers and subscribers

## 🔧 Advanced Features

### Excel Caption Management
```yaml
caption_source:
  path: ./captions.xlsx
  sheet: Sheet1
  column: caption
  strategy: random  # or sequential
  drop_duplicates: true
  strip: true
  min_len: 1
```

### Media Selection
```yaml
media:
  folder_filter: "specific folder name"  # Filter by vault folder
  random_n: 2                           # Pick N random items
  search_name: "IMG_1234"               # Search for specific media
  search_pick_n: 1                      # Pick N matching items
```

### Scheduling (Continuous Mode)
```yaml
scheduling:
  continuous_mode: true
  daily_reset_hour: 1
  check_interval_minutes: 1
  scheduled_posts:
    "09:00": "morning_post"
    "15:00": "afternoon_post"
    "21:00": "evening_post"
```

## 🚨 Error Handling & Recovery

### Authentication Errors
- Clear error messages when cookies expire
- Automatic retry mechanisms
- Detailed troubleshooting steps

### Browser Crash Recovery
- Automatic restart on crashes
- Memory limits (1GB per bot)
- Daily restart at 2:00 AM
- Robust error handling

### Monitoring & Logging
- Comprehensive logging to `/var/log/fanvue/`
- Log rotation (30 days retention)
- Real-time monitoring with PM2
- Error detection and alerting

## 📈 Production Features

### PM2 Process Management
- Automatic restart on crashes
- Memory monitoring and restart
- Daily scheduled restarts
- Process monitoring and logging

### Log Management
- Structured logging with timestamps
- Separate logs for each bot
- Error log aggregation
- Log rotation and cleanup

### Security
- Non-root user execution
- Secure cookie file permissions
- Regular system updates
- Process isolation

## 🔄 Scaling & Maintenance

### Adding New Clients
1. Run `./setup_new_client.sh <client_name>`
2. Add authentication cookies
3. Customize configuration files
4. Test with `./manage_clients.sh test <client_name>`
5. Start with PM2 ecosystem

### Updating Bots
- Update template files in `mass dm bot/` and `posting bot/`
- Copy updates to existing clients
- Test before deploying

### Monitoring Health
- Use `./monitor_all_clients.sh` for system overview
- Check PM2 status: `pm2 status`
- Review logs: `./manage_clients.sh logs <client_name>`

## 🛡 Troubleshooting

### Common Issues

#### Authentication Failures
```bash
# Check cookie files exist and are valid
ls -la client_fanvue/*/cookies.json

# Update cookies from browser
# Export fresh cookies and replace files
```

#### Bot Won't Start
```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs client_name-massdm --err

# Restart specific bot
pm2 restart client_name-massdm
```

#### Memory Issues
```bash
# Check system resources
free -h
df -h

# Restart all bots
./restart_all_clients.sh
```

### Log Analysis
```bash
# View recent errors
pm2 logs --err --lines 50

# Monitor real-time
pm2 logs --follow

# Check specific client
./manage_clients.sh logs client_name
```

## 📞 Support

### Getting Help
1. Check logs: `./monitor_all_clients.sh`
2. Test in headed mode: `--headed --test-mode`
3. Verify configuration syntax
4. Check authentication cookies
5. Review system resources

### Maintenance Tasks
- **Daily**: Monitor logs and bot status
- **Weekly**: Check system resources and updates
- **Monthly**: Review and rotate logs
- **As needed**: Update cookies when authentication fails

---

## ✅ Production Checklist

Before going live:

- [ ] VPS setup completed (`./setup_vps.sh`)
- [ ] Client added (`./setup_new_client.sh <name>`)
- [ ] Fresh cookies added to all clients
- [ ] All clients tested (`./manage_clients.sh test <name>`)
- [ ] PM2 startup configured
- [ ] Log directory permissions set
- [ ] System resources adequate
- [ ] Internet connection stable
- [ ] Monitoring setup complete

**Your scalable Fanvue bot system is now production-ready! 🚀**
