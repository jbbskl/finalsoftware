#!/bin/bash

# Build and start all services
echo "Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo "Checking service health..."
docker-compose ps

echo "Services started successfully!"
echo "API: http://localhost:3000"
echo "Flower: http://localhost:5555"
echo "Database: localhost:5432"
echo "Redis: localhost:6379"