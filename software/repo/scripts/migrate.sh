#!/bin/bash
set -e

echo "🔄 Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

# Change to the API directory where alembic is configured
cd "$(dirname "$0")/../services/api"

# Run migrations
echo "📦 Running Alembic migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
    
    # Log the latest migration applied
    echo "📋 Latest migration applied:"
    alembic current
    
    exit 0
else
    echo "❌ Migration failed"
    exit 1
fi