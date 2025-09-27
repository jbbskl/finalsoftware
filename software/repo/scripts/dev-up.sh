#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting development environment setup...${NC}"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the software/repo directory"
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📋 Creating .env file from example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
    else
        echo -e "${YELLOW}⚠️  No .env.example found, creating basic .env${NC}"
        cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql+psycopg://app:app@db:5432/app

# Redis
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123
S3_BUCKET=artifacts

# Security
COOKIE_KEY=your-32-byte-secret-key-change-me-123
AUTH_SECRET=your-auth-secret-change-me-123

# API
UVICORN_HOST=0.0.0.0
UVICORN_PORT=8000

# App
APP_TZ=Europe/Amsterdam
RATE_LIMIT_PER_MINUTE=30

# Development
NODE_ENV=development
EOF
        echo -e "${GREEN}✅ Created basic .env file${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Start services
echo -e "${BLUE}🐳 Starting Docker services...${NC}"
docker-compose up -d --build

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
echo -e "${BLUE}🔍 Checking service health...${NC}"

# Check database
if docker-compose exec -T db pg_isready -U app -d app > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Database not ready, waiting...${NC}"
    sleep 5
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Redis not ready, waiting...${NC}"
    sleep 5
fi

# Run migrations
echo -e "${BLUE}📦 Running database migrations...${NC}"
if ./scripts/migrate.sh; then
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Migration failed, but continuing...${NC}"
fi

# Seed database
echo -e "${BLUE}🌱 Seeding database with test users...${NC}"
if python3 scripts/seed.py; then
    echo -e "${GREEN}✅ Database seeded${NC}"
else
    echo -e "${YELLOW}⚠️  Seeding failed, but continuing...${NC}"
fi

# Check API health
echo -e "${BLUE}🏥 Checking API health...${NC}"
sleep 5

if curl -s http://localhost:8000/healthz | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  API health check failed${NC}"
fi

# Display status
echo -e "\n${GREEN}🎉 Development environment is ready!${NC}"
echo -e "\n${BLUE}📋 Service Status:${NC}"
docker-compose ps

echo -e "\n${BLUE}🌐 Access Points:${NC}"
echo -e "API:      ${GREEN}http://localhost:8000${NC}"
echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "Health:   ${GREEN}http://localhost:8000/healthz${NC}"
echo -e "MinIO:    ${GREEN}http://localhost:9001${NC} (minio/minio123)"

echo -e "\n${BLUE}👤 Test Users:${NC}"
echo -e "Admin:   ${GREEN}admin@example.com${NC} / ${GREEN}Admin123!${NC}"
echo -e "Creator: ${GREEN}creator@example.com${NC} / ${GREEN}Creator123!${NC}"
echo -e "Agency:  ${GREEN}agency@example.com${NC} / ${GREEN}Agency123!${NC}"

echo -e "\n${BLUE}📚 Next Steps:${NC}"
echo -e "1. Start the frontend: ${YELLOW}cd ../bots-control-plane && npm run dev${NC}"
echo -e "2. Run smoke tests: ${YELLOW}./scripts/smoke.sh${NC}"
echo -e "3. Check logs: ${YELLOW}docker-compose logs -f${NC}"
echo -e "4. Stop services: ${YELLOW}docker-compose down${NC}"

echo -e "\n${BLUE}🔧 Useful Commands:${NC}"
echo -e "View logs:     ${YELLOW}docker-compose logs -f [service]${NC}"
echo -e "Restart API:   ${YELLOW}docker-compose restart api${NC}"
echo -e "Restart Worker: ${YELLOW}docker-compose restart worker${NC}"
echo -e "Shell access:  ${YELLOW}docker-compose exec api bash${NC}"
echo -e "DB access:     ${YELLOW}docker-compose exec db psql -U app -d app${NC}"

echo -e "\n${GREEN}✅ Development environment setup complete!${NC}"