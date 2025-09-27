# Bot Control Plane - Production Deployment Guide

This guide covers deploying the Bot Control Plane system to production using Docker Compose.

## Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+
- 4GB+ RAM, 2+ CPU cores
- 50GB+ disk space
- Domain name (for SSL certificates)
- Basic knowledge of Docker and Linux administration

## Quick Start

1. **Clone and setup environment:**
   ```bash
   git clone <repository-url>
   cd software/repo/infra
   cp .env.example .env
   ```

2. **Configure environment variables:**
   ```bash
   nano .env
   ```

3. **Deploy with production profile:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. **Verify deployment:**
   ```bash
   ./scripts/smoke.sh
   ```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the `infra/` directory with the following variables:

```bash
# Database Configuration
POSTGRES_DB=app
POSTGRES_USER=app
POSTGRES_PASSWORD=your_secure_db_password_here

# Redis Configuration (if using external Redis)
REDIS_URL=redis://redis:6379/0

# Cookie Encryption (32-byte base64 key)
COOKIE_KEY=your_32_byte_base64_encoded_key_here

# Application Secrets
SECRET_KEY=your_secret_key_for_sessions_here

# MinIO Configuration
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=your_secure_minio_password_here
S3_BUCKET=artifacts

# Security Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
COOKIE_DOMAIN=.yourdomain.com

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# Logging
LOG_RETENTION_DAYS=30

# Performance Tuning
API_WORKERS=4
WORKER_CONCURRENCY=4

# Optional: Monitoring
GRAFANA_PASSWORD=your_grafana_password_here
```

### Generating Secure Keys

Generate a 32-byte base64 encoded key for cookie encryption:
```bash
openssl rand -base64 32
```

Generate a secure secret key:
```bash
openssl rand -hex 32
```

## Production Deployment

### 1. Basic Production Setup

```bash
# Start all services with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### 2. SSL/TLS Configuration

#### Option A: Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infra/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infra/ssl/key.pem

# Update nginx.conf to enable HTTPS
# Uncomment the HTTPS server block in nginx.conf

# Restart nginx
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
```

#### Option B: Self-signed certificates (development only)

```bash
# Create SSL directory
mkdir -p infra/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infra/ssl/key.pem \
  -out infra/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

### 3. Monitoring Setup (Optional)

Enable monitoring stack:
```bash
# Start with monitoring profile
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile monitoring up -d

# Access Grafana at http://yourdomain.com:3001
# Default login: admin / (your GRAFANA_PASSWORD)
```

### 4. Data Persistence

Ensure data directories exist and have proper permissions:
```bash
# Create data directories
sudo mkdir -p /data/{postgres,redis,minio,prometheus,grafana}

# Set permissions
sudo chown -R 999:999 /data/postgres  # PostgreSQL user
sudo chown -R 999:999 /data/redis     # Redis user
sudo chown -R 1000:1000 /data/minio   # MinIO user
sudo chown -R 65534:65534 /data/prometheus  # Prometheus user
sudo chown -R 472:472 /data/grafana   # Grafana user
```

## Administration

### Creating Admin Users

Access the API directly to create admin users:
```bash
# Create admin user via API
curl -X POST http://localhost:8000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "secure_password",
    "role": "admin"
  }'
```

### Database Management

#### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db \
  pg_dump -U app app > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using docker exec
docker exec $(docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps -q db) \
  pg_dump -U app app > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Restore Database
```bash
# Restore from backup
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  psql -U app app < backup_20240101_120000.sql
```

#### Run Database Migrations
```bash
# Apply migrations
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec api \
  alembic upgrade head
```

### Log Management

#### View Application Logs
```bash
# All services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f worker
```

#### Log Rotation
```bash
# Configure logrotate for Docker logs
sudo tee /etc/logrotate.d/docker-compose << EOF
/var/lib/docker/containers/*/*.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
  create 0644 root root
}
EOF
```

### Health Checks

#### Service Health
```bash
# Check all services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Check API health
curl http://localhost:8000/healthz

# Check readiness
curl http://localhost:8000/readyz
```

#### Run Smoke Tests
```bash
# Run comprehensive smoke tests
./scripts/smoke.sh
```

## Scaling and Performance

### Horizontal Scaling

#### API Scaling
```bash
# Scale API service
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale api=3
```

#### Worker Scaling
```bash
# Scale worker service
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale worker=2
```

### Performance Tuning

#### Database Optimization
- Monitor query performance with `pg_stat_statements`
- Adjust PostgreSQL configuration in `docker-compose.prod.yml`
- Consider connection pooling for high-load scenarios

#### Redis Optimization
- Monitor memory usage
- Adjust `maxmemory` and eviction policies
- Consider Redis Cluster for high availability

#### Application Optimization
- Adjust `API_WORKERS` based on CPU cores
- Tune `WORKER_CONCURRENCY` based on workload
- Monitor memory usage and adjust resource limits

## Security Considerations

### Network Security
- Use reverse proxy (nginx) for SSL termination
- Restrict database and Redis ports to internal network only
- Implement firewall rules to limit external access

### Application Security
- Regularly update Docker images
- Use secrets management for sensitive data
- Enable audit logging
- Implement proper backup encryption

### Data Protection
- Enable database encryption at rest
- Use encrypted volumes for sensitive data
- Implement proper access controls
- Regular security audits

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs <service-name>

# Check resource usage
docker stats

# Check disk space
df -h
```

#### Database Connection Issues
```bash
# Check database connectivity
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec api \
  python -c "import psycopg2; psycopg2.connect('postgresql://app:password@db:5432/app')"

# Check database logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs db
```

#### Redis Connection Issues
```bash
# Check Redis connectivity
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec api \
  python -c "import redis; redis.Redis.from_url('redis://redis:6379/0').ping()"
```

#### Worker Issues
```bash
# Check worker status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec worker \
  celery -A celery_app inspect active

# Check worker logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs worker
```

### Performance Issues

#### High Memory Usage
- Check for memory leaks in application logs
- Adjust worker concurrency settings
- Monitor database query performance

#### Slow Response Times
- Check nginx access logs for slow requests
- Monitor database query performance
- Check Redis connection pool settings

#### High CPU Usage
- Profile application code
- Check for infinite loops in workers
- Monitor system resources

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- Review application logs for errors
- Check disk space usage
- Verify backup integrity
- Update security patches

#### Monthly
- Review performance metrics
- Update Docker images
- Review and rotate secrets
- Test disaster recovery procedures

#### Quarterly
- Security audit
- Performance optimization review
- Capacity planning
- Documentation updates

### Updates and Upgrades

#### Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec api \
  alembic upgrade head
```

#### Infrastructure Updates
```bash
# Update base images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Recreate services with new images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
```

## Support and Monitoring

### Monitoring Endpoints
- Health: `http://yourdomain.com/healthz`
- Readiness: `http://yourdomain.com/readyz`
- Metrics: `http://yourdomain.com:9090` (Prometheus)
- Dashboards: `http://yourdomain.com:3001` (Grafana)

### Alerting
Configure alerts for:
- Service downtime
- High error rates
- Resource usage thresholds
- Database connection issues
- Worker queue backlog

### Support Channels
- Documentation: This file and related docs in `/docs`
- Logs: Application and system logs
- Metrics: Prometheus and Grafana dashboards
- Health checks: Automated monitoring endpoints

## Backup and Recovery

### Backup Strategy
1. **Database**: Daily automated backups
2. **Application Data**: MinIO bucket backups
3. **Configuration**: Version-controlled in Git
4. **Secrets**: Encrypted backup storage

### Recovery Procedures
1. **Service Recovery**: Docker Compose restart
2. **Data Recovery**: Database and MinIO restore
3. **Full System Recovery**: Complete infrastructure rebuild

### Disaster Recovery Plan
1. Identify critical services and dependencies
2. Establish recovery time objectives (RTO)
3. Test recovery procedures regularly
4. Maintain off-site backups
5. Document recovery procedures

For additional support or questions, refer to the project documentation or contact the development team.