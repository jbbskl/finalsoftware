# External Setup Guide

This document outlines the external services and configurations needed for production deployment.

## SMTP / Transactional Email

### Purpose
- User signup verification emails
- Password reset emails
- Invoice notifications
- System alerts

### Recommended Providers

#### Option 1: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Get API key from dashboard
4. Set environment variables:
   ```bash
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASSWORD=your_api_key
   SMTP_FROM=noreply@yourdomain.com
   ```

#### Option 2: Postmark
1. Sign up at [postmarkapp.com](https://postmarkapp.com)
2. Create a server
3. Get API token
4. Set environment variables:
   ```bash
   SMTP_HOST=smtp.postmarkapp.com
   SMTP_PORT=587
   SMTP_USER=your_api_token
   SMTP_PASSWORD=your_api_token
   SMTP_FROM=noreply@yourdomain.com
   ```

#### Option 3: AWS SES
1. Set up AWS SES in your region
2. Verify domain and email addresses
3. Create IAM user with SES permissions
4. Set environment variables:
   ```bash
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your_ses_access_key
   SMTP_PASSWORD=your_ses_secret_key
   SMTP_FROM=noreply@yourdomain.com
   ```

#### Option 4: SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Verify sender identity
4. Set environment variables:
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=your_sendgrid_api_key
   SMTP_FROM=noreply@yourdomain.com
   ```

## Stripe (Invoices)

### Setup Steps
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from dashboard:
   - Publishable key (starts with `pk_`)
   - Secret key (starts with `sk_`)
3. Set environment variables:
   ```bash
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Webhook Configuration
1. In Stripe dashboard, go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/billing/webhook/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Production Considerations
- Switch to live keys for production
- Update webhook URL to production domain
- Test webhook delivery and signature verification

## Coinbase Commerce (Crypto)

### Setup Steps
1. Create account at [commerce.coinbase.com](https://commerce.coinbase.com)
2. Generate API key
3. Set environment variables:
   ```bash
   COINBASE_API_KEY=your_api_key
   COINBASE_WEBHOOK_SECRET=your_webhook_secret
   ```

### Webhook Configuration
1. In Coinbase Commerce dashboard, go to Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/billing/webhook/crypto`
3. Select events:
   - `charge:confirmed`
   - `charge:failed`
4. Copy webhook secret to `COINBASE_WEBHOOK_SECRET`

## Domain & TLS

### DNS Configuration
1. Point your domain to your server:
   ```
   A     yourdomain.com     -> YOUR_SERVER_IP
   AAAA  yourdomain.com     -> YOUR_SERVER_IPv6 (if applicable)
   CNAME www.yourdomain.com -> yourdomain.com
   ```

2. Optional subdomains:
   ```
   CNAME api.yourdomain.com -> yourdomain.com
   CNAME admin.yourdomain.com -> yourdomain.com
   ```

### TLS Certificate

#### Option 1: Let's Encrypt (Free)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Option 2: Cloudflare (Recommended)
1. Add domain to Cloudflare
2. Update nameservers at your registrar
3. Enable "Full (strict)" SSL mode
4. Set "Always Use HTTPS" to On

### Reverse Proxy Configuration

#### Nginx Example
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Caddy Example (Simpler)
```
yourdomain.com {
    reverse_proxy localhost:3000
    reverse_proxy /api/* localhost:8000
    
    header {
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
}
```

## Persistent Storage

### Database Backups
```bash
# Create backup script
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup created: $BACKUP_FILE.gz"
EOF

chmod +x /opt/backup-db.sh

# Schedule daily backups
echo "0 2 * * * /opt/backup-db.sh" | sudo crontab -
```

### Application Data
```bash
# Create data directory
sudo mkdir -p /data/{logs,uploads,secrets}
sudo chown -R app:app /data

# Mount in docker-compose
volumes:
  - /data/logs:/app/logs
  - /data/uploads:/app/uploads
  - /data/secrets:/app/secrets
```

### Log Rotation
```bash
# Configure logrotate
sudo cat > /etc/logrotate.d/bots-app << 'EOF'
/data/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
```

## Monitoring & Logs

### Log Shipping (Optional)

#### Option 1: Logtail
1. Sign up at [logtail.com](https://logtail.com)
2. Create source
3. Install agent:
   ```bash
   curl -s https://logtail.com/install.sh | bash
   ```
4. Configure to ship `/data/logs/*.log`

#### Option 2: Datadog
1. Sign up at [datadoghq.com](https://datadoghq.com)
2. Install agent:
   ```bash
   DD_API_KEY=your_api_key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
   ```
3. Configure log collection in `/etc/datadog-agent/conf.d/`

#### Option 3: Self-hosted ELK Stack
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
      - /data/logs:/var/log/app

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

volumes:
  es_data:
```

### Uptime Monitoring

#### Option 1: UptimeRobot (Free)
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitors:
   - HTTP: `https://yourdomain.com/healthz`
   - HTTP: `https://yourdomain.com/readyz`
3. Set 5-minute intervals

#### Option 2: Pingdom
1. Sign up at [pingdom.com](https://pingdom.com)
2. Create HTTP check for `/healthz`
3. Set alerts for downtime

#### Option 3: Self-hosted Uptime Kuma
```bash
docker run -d --restart=always -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1
```

## Security Considerations

### Firewall Configuration
```bash
# UFW example
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### SSL/TLS Hardening
```nginx
# Add to nginx config
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### Environment Security
```bash
# Secure environment files
chmod 600 .env.production
chown root:root .env.production

# Use secrets management
export $(cat .env.production | xargs)
```

## Performance Optimization

### CDN Setup (Optional)
1. Cloudflare: Enable caching for static assets
2. AWS CloudFront: For global distribution
3. KeyCDN: Cost-effective alternative

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_runs_bot_instance_started ON runs(bot_instance_id, started_at DESC);
CREATE INDEX CONCURRENTLY idx_schedules_bot_instance_start ON schedules(bot_instance_id, start_at);
CREATE INDEX CONCURRENTLY idx_bot_instances_owner ON bot_instances(owner_type, owner_id, bot_code);
```

### Caching
```bash
# Redis configuration for production
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Cost Estimation

### Monthly Costs (Approximate)
- **VPS**: $10-50 (DigitalOcean, Linode, Vultr)
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)
- **SMTP**: $0-20 (Resend free tier: 3k emails/month)
- **Stripe**: 2.9% + $0.30 per transaction
- **Monitoring**: $0-10 (UptimeRobot free, Pingdom $10/month)
- **Backups**: $0-5 (local storage)

### Scaling Considerations
- Database: Consider managed PostgreSQL (AWS RDS, DigitalOcean Managed DB)
- Load Balancing: Use multiple app instances behind nginx
- File Storage: Move to S3-compatible storage for large files
- CDN: Implement for global users

## Deployment Checklist

- [ ] Domain registered and DNS configured
- [ ] SSL certificate installed and auto-renewal configured
- [ ] SMTP provider configured and tested
- [ ] Stripe account set up with webhooks
- [ ] Database backups scheduled
- [ ] Log rotation configured
- [ ] Monitoring alerts set up
- [ ] Firewall rules applied
- [ ] Environment variables secured
- [ ] Health checks responding
- [ ] Smoke tests passing