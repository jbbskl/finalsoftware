#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting frontend development environment...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the software/bots-control-plane directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}📋 Creating .env.local file...${NC}"
    cat > .env.local << 'EOF'
# Authentication
AUTH_SECRET="hi6wUnxqkwEEI8NeY/cArCV3jUg9+dDiCH7aYTkas38="
NEXTAUTH_URL="http://localhost:3000"

# Database
DATABASE_URL="file:./prisma/dev.db"

# Development
NODE_ENV=development
AUTH_DISABLED=false
EOF
    echo -e "${GREEN}✅ Created .env.local file${NC}"
else
    echo -e "${GREEN}✅ .env.local file already exists${NC}"
fi

# Setup database
echo -e "${BLUE}🗄️  Setting up database...${NC}"
if npm run db:setup; then
    echo -e "${GREEN}✅ Database setup complete${NC}"
else
    echo -e "${YELLOW}⚠️  Database setup failed, trying seed only...${NC}"
    npm run seed || echo -e "${YELLOW}⚠️  Seeding also failed${NC}"
fi

# Check if backend is running
echo -e "${BLUE}🔍 Checking backend connection...${NC}"
if curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API not responding at http://localhost:8000${NC}"
    echo -e "${YELLOW}   Make sure to run the backend first:${NC}"
    echo -e "${YELLOW}   cd ../repo && ./scripts/dev-up.sh${NC}"
fi

# Start development server
echo -e "${BLUE}🌐 Starting development server...${NC}"
echo -e "${GREEN}✅ Frontend will be available at: http://localhost:3000${NC}"
echo -e "\n${BLUE}📚 Available Routes:${NC}"
echo -e "Login:     ${GREEN}http://localhost:3000/login${NC}"
echo -e "Signup:    ${GREEN}http://localhost:3000/signup${NC}"
echo -e "Creator:   ${GREEN}http://localhost:3000/creator${NC}"
echo -e "Agency:    ${GREEN}http://localhost:3000/agency${NC}"
echo -e "Admin:     ${GREEN}http://localhost:3000/admin${NC}"

echo -e "\n${BLUE}👤 Test Users:${NC}"
echo -e "Admin:   ${GREEN}admin@example.com${NC} / ${GREEN}Admin123!${NC}"
echo -e "Creator: ${GREEN}creator@example.com${NC} / ${GREEN}Creator123!${NC}"
echo -e "Agency:  ${GREEN}agency@example.com${NC} / ${GREEN}Agency123!${NC}"

echo -e "\n${BLUE}🔧 Useful Commands:${NC}"
echo -e "Type check:  ${YELLOW}npm run typecheck${NC}"
echo -e "Lint:        ${YELLOW}npm run lint${NC}"
echo -e "Test:        ${YELLOW}npm run test${NC}"
echo -e "Build:       ${YELLOW}npm run build${NC}"

echo -e "\n${GREEN}🎉 Starting development server...${NC}"
npm run dev