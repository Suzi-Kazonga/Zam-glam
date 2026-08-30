@echo off
REM Zamglam Docker Setup Script for Windows
REM This script helps set up and run the entire Zamglam application with Docker

setlocal enabledelayedexpansion

echo ==========================================
echo Zamglam Docker Setup Script - Windows
echo ==========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed. Please install Docker Desktop for Windows first.
    pause
    exit /b 1
)

echo [OK] Docker is installed

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo [OK] Docker Compose is installed

REM Create .env file from example if it doesn't exist
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo [OK] .env file created
) else (
    echo [OK] .env file already exists
)

echo.
echo Building Docker images...
docker-compose build

echo.
echo Starting services...
docker-compose up -d

echo.
echo Waiting for services to be ready (30 seconds)...
timeout /t 30 /nobreak

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Services are running at:
echo   Frontend:      http://localhost
echo   Backend:       http://localhost:5000
echo   Courier API:   http://localhost:5001
echo   PhpMyAdmin:    http://localhost:8080
echo.
echo Useful commands:
echo   docker-compose logs -f              - View logs
echo   docker-compose down                 - Stop all services
echo   docker-compose ps                   - View running containers
echo.
echo Backend testing:
echo   docker-compose exec backend npm test                - Run unit tests
echo   docker-compose exec backend npm run test:integration - Run integration tests
echo.
echo Frontend testing:
echo   docker-compose exec frontend npm test               - Run component tests
echo   docker-compose exec frontend npm run test:e2e       - Run E2E tests
echo.
pause
