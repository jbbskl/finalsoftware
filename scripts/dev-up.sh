#!/bin/bash

# Build and start all services
echo "Building and starting development environment..."

# Create data directory if it doesn't exist
mkdir -p ./data

# Build and start services
docker-compose up -d --build

echo "Services started! Check status with: docker-compose ps"
echo "API: http://localhost:3000"
echo "Flower: http://localhost:5555"
echo "Database: localhost:5432"
echo "Redis: localhost:6379"