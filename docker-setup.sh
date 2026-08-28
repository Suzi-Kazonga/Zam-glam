#!/bin/bash

# Zamglam Docker Setup Script
# This script helps set up and run the entire Zamglam application with Docker

set -e

echo "=========================================="
echo "Zamglam Docker Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Build and start containers
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"

# Check database
if docker-compose exec -T database mysqladmin ping -h localhost -u zamglam_user -pzamglam_pass &> /dev/null; then
    echo -e "${GREEN}✓ Database is healthy${NC}"
else
    echo -e "${RED}✗ Database health check failed${NC}"
fi

# Check backend
if curl -s http://localhost:5000/health &> /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

# Check courier service
if curl -s http://localhost:5001/health &> /dev/null; then
    echo -e "${GREEN}✓ Courier Service is healthy${NC}"
else
    echo -e "${RED}✗ Courier Service health check failed${NC}"
fi

# Check frontend
if curl -s http://localhost/health &> /dev/null; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Services are running at:"
echo "  Frontend:      http://localhost"
echo "  Backend:       http://localhost:5000"
echo "  Courier API:   http://localhost:5001"
echo "  PhpMyAdmin:    http://localhost:8080"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f              # View logs"
echo "  docker-compose down                 # Stop all services"
echo "  docker-compose ps                   # View running containers"
echo ""
echo "Backend testing:"
echo "  docker-compose exec backend npm test                # Run unit tests"
echo "  docker-compose exec backend npm run test:integration # Run integration tests"
echo ""
echo "Frontend testing:"
echo "  docker-compose exec frontend npm test               # Run component tests"
echo "  docker-compose exec frontend npm run test:e2e       # Run E2E tests"
echo ""
