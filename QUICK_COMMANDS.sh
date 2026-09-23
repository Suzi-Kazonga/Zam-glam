#!/usr/bin/env bash
# Zamglam Quick Command Reference
# Copy this file content or bookmark it for quick access

# ==========================================
# DOCKER SETUP & MANAGEMENT
# ==========================================

# Initial Setup
docker-compose up --build -d                    # Start all services with rebuild
./docker-setup.sh                               # Run setup script (Linux/macOS)
docker-setup.bat                                # Run setup script (Windows)

# Basic Commands
docker-compose up -d                            # Start services in background
docker-compose down                             # Stop all services
docker-compose ps                               # View running containers
docker-compose logs -f                          # View real-time logs
docker-compose logs -f backend                  # View backend logs only
docker-compose restart                          # Restart all services
docker-compose restart backend                  # Restart specific service

# ==========================================
# BACKEND TESTING
# ==========================================

# Run Tests
docker-compose exec backend npm test                        # Run all unit tests
docker-compose exec backend npm run test:watch             # Watch mode
docker-compose exec backend npm run test:integration       # Integration tests only
docker-compose exec backend npm run test:coverage          # Coverage report

# Without Docker (Local Development)
cd backend
npm install                                     # Install dependencies
npm test                                        # Run all tests
npm run test:watch                              # Watch mode
npm run test:integration                        # Integration tests

# ==========================================
# FRONTEND TESTING
# ==========================================

# Run Tests
docker-compose exec frontend npm test                       # Component tests
docker-compose exec frontend npm run test:watch            # Watch mode
docker-compose exec frontend npm run test:coverage         # Coverage report

# E2E Tests
docker-compose exec frontend npm run test:e2e              # Open Cypress GUI
docker-compose exec frontend npm run test:e2e:headless     # Headless mode

# Without Docker (Local Development)
cd frontend
npm install                                     # Install dependencies
npm test                                        # Component tests
npm run test:e2e                                # Cypress GUI

# ==========================================
# DATABASE MANAGEMENT
# ==========================================

# MySQL Access
docker-compose exec database mysql -u zamglam_user -pzamglam_pass zamglam_db

# Database Backup
docker-compose exec database mysqldump -u zamglam_user -pzamglam_pass zamglam_db > backup.sql

# Database Restore
docker-compose exec -T database mysql -u zamglam_user -pzamglam_pass zamglam_db < backup.sql

# PhpMyAdmin (Web UI)
# Open browser: http://localhost:8080

# ==========================================
# DEVELOPMENT WORKFLOW
# ==========================================

# Local Development (Non-Docker)
cd backend && npm run dev                       # Start backend with hot reload
cd frontend && npm run dev                      # Start frontend with Vite

# Docker Development
docker-compose up                               # Start and follow logs
docker-compose up -d && docker-compose logs -f # Start detached, then follow logs

# View Container Details
docker-compose exec backend ls -la              # List files
docker-compose exec backend sh                  # Access container shell
docker-compose exec backend npm list            # List installed packages

# ==========================================
# DEBUGGING & TROUBLESHOOTING
# ==========================================

# View Logs
docker-compose logs backend                     # Backend logs
docker-compose logs frontend                    # Frontend logs
docker-compose logs database                    # Database logs
docker-compose logs -f                          # All logs, follow mode

# Test Service Health
docker-compose exec backend curl localhost:5000/health
curl http://localhost:5000/health               # Backend health check
curl http://localhost/health                    # Frontend health check

# Container Resource Usage
docker stats                                    # Real-time stats
docker stats zamglam_backend                    # Specific container

# Rebuild Images
docker-compose build --no-cache                 # Rebuild without cache
docker-compose build backend                    # Rebuild specific service

# ==========================================
# ENVIRONMENT & CONFIGURATION
# ==========================================

# Edit Environment
nano .env                                       # Edit env file
cp .env.example .env                            # Copy template
docker-compose config                           # View merged config

# ==========================================
# PRODUCTION DEPLOYMENT
# ==========================================

# Build Production Images
docker-compose build                            # Build all images
docker tag zamglam_backend myregistry/zamglam-backend:latest
docker push myregistry/zamglam-backend:latest

# Deploy to Production
docker-compose -f docker-compose.yml up -d     # Run production

# ==========================================
# CLEANUP & MAINTENANCE
# ==========================================

# Stop & Remove Everything
docker-compose down                             # Stop and remove containers
docker-compose down -v                          # Also remove volumes
docker system prune                             # Clean up unused resources
docker image prune                              # Remove unused images

# ==========================================
# PORTS & SERVICES
# ==========================================

# Service URLs
Frontend:       http://localhost
Backend API:    http://localhost:5000
PhpMyAdmin:     http://localhost:8080
Courier API:    http://localhost:5001

# Default Credentials
MySQL User:     zamglam_user
MySQL Password: zamglam_pass
MySQL DB:       zamglam_db

# ==========================================
# QUICK CHECKLIST
# ==========================================

# Before Starting Work:
# □ docker-compose up -d (start services)
# □ docker-compose exec backend npm test (verify tests pass)
# □ Open http://localhost in browser

# Before Committing:
# □ npm test (run tests)
# □ npm run test:e2e:headless (run E2E)
# □ npm run test:coverage (check coverage)
# □ docker-compose down (clean up)

# ==========================================
# TIPS & TRICKS
# ==========================================

# Run multiple commands
docker-compose exec backend npm test && npm run test:integration

# Execute without TTY (non-interactive)
docker-compose exec -T backend npm test

# Scale services
docker-compose up -d --scale backend=2

# View docker-compose environment
docker-compose config

# Rebuild and restart
docker-compose build --no-cache && docker-compose restart

# Follow specific container logs with timestamp
docker-compose logs -f --timestamps backend

# Get container IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' zamglam_backend

# ==========================================
# COMMON ISSUES & FIXES
# ==========================================

# Port Already in Use (Linux/macOS)
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Port Already in Use (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Permission Denied (scripts)
chmod +x docker-setup.sh

# Database connection failed
docker-compose restart database
docker-compose logs database

# Container won't start
docker-compose logs backend
# Fix issue, then rebuild
docker-compose build backend && docker-compose restart backend

# ==========================================
# DOCUMENTATION & HELP
# ==========================================

# View this file
cat QUICK_COMMANDS.sh

# Read comprehensive guide
cat DOCKER.md

# View test setup guide
cat TESTING_AND_CONTAINERIZATION.md

# Docker Compose help
docker-compose --help
docker-compose up --help

# View current config
docker-compose config

# ==========================================
