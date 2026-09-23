# Docker and Testing Guide - Zamglam E-Commerce Platform

## Table of Contents
1. [Docker Setup](#docker-setup)
2. [Testing Guidelines](#testing-guidelines)
3. [Running Tests](#running-tests)
4. [Troubleshooting](#troubleshooting)
5. [Production Deployment](#production-deployment)

---

## Docker Setup

### Prerequisites
- Docker (version 20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- Docker Compose (version 1.29+) - [Install Docker Compose](https://docs.docker.com/compose/install/)
- At least 4GB of available RAM
- At least 10GB of free disk space

### Quick Start

#### On Linux/macOS:
```bash
chmod +x docker-setup.sh
./docker-setup.sh
```

#### On Windows (PowerShell):
```bash
.\docker-setup.bat
```

Or manually:
```bash
# Copy environment file
cp .env.example .env

# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f
```

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 80 | React + Vite application served via Nginx |
| Backend | 5000 | Node.js + Express API |
| Database | 3306 | MySQL 8.0 database |
| Courier Service | 5001 | Python Flask microservice |
| PhpMyAdmin | 8080 | MySQL management interface |

### Environment Configuration

Edit `.env` file to customize settings:

```bash
# Database
DB_HOST=database
DB_USER=zamglam_user
DB_PASSWORD=zamglam_pass
DB_NAME=zamglam_db

# Backend
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:5000
```

### Docker Compose Services

```yaml
- database (MySQL 8.0)
- backend (Node.js API)
- frontend (React + Nginx)
- courier_service (Python Flask)
- phpmyadmin (Database UI)
```

---

## Testing Guidelines

### Test Structure

```
backend/
├── tests/
│   ├── setup.js                  # Global test setup
│   ├── unit/
│   │   ├── productModel.test.js
│   │   └── authModel.test.js
│   └── integration/
│       ├── productAPI.test.js
│       └── orderAPI.test.js

frontend/
├── src/
│   ├── setupTests.js             # Jest setup
│   ├── components/
│   │   └── components.test.js
│   └── __tests__/
│       ├── Button.test.jsx
│       └── ProductCard.test.jsx
└── cypress/
    └── e2e/
        ├── userFlows.cy.js
        ├── checkout.cy.js
        └── chat.cy.js
```

### Test Types

#### 1. **Unit Tests** (Backend - Jest)
- Test individual functions and models
- Mock external dependencies
- Fast execution

Example:
```javascript
describe('Product Model', () => {
  test('should validate product fields', () => {
    expect(validateProduct(product)).toBe(true);
  });
});
```

#### 2. **Integration Tests** (Backend - Supertest)
- Test API endpoints with real database
- Verify request/response handling
- Test middleware

Example:
```javascript
describe('Product API', () => {
  test('GET /api/products should return products', async () => {
    const res = await request(app)
      .get('/api/products')
      .expect(200);
  });
});
```

#### 3. **Component Tests** (Frontend - React Testing Library)
- Test React component rendering
- Test user interactions
- Test props and state

Example:
```javascript
describe('ProductCard Component', () => {
  test('should render product information', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Premium Handbag')).toBeInTheDocument();
  });
});
```

#### 4. **E2E Tests** (Frontend - Cypress)
- Test complete user workflows
- Test in real browser
- Test notifications and UI interactions

Example user flows:
- **Login Flow**: Register → Login → Dashboard
- **Shopping Flow**: Browse → Filter → Add to Cart → Checkout
- **Order Tracking**: Place Order → Receive Notification → Track Order
- **Chat**: Send Message → Receive Notification → Continue Chat

---

## Running Tests

### Backend Tests

#### Install dependencies:
```bash
docker-compose exec backend npm install
```

#### Run all unit tests:
```bash
docker-compose exec backend npm test
```

#### Run unit tests in watch mode:
```bash
docker-compose exec backend npm run test:watch
```

#### Run integration tests:
```bash
docker-compose exec backend npm run test:integration
```

#### Generate coverage report:
```bash
docker-compose exec backend npm run test:coverage
```

### Frontend Tests

#### Install dependencies:
```bash
docker-compose exec frontend npm install
```

#### Run component tests:
```bash
docker-compose exec frontend npm test
```

#### Run tests in watch mode:
```bash
docker-compose exec frontend npm run test:watch
```

#### Generate coverage report:
```bash
docker-compose exec frontend npm run test:coverage
```

### E2E Tests with Cypress

#### Interactive mode (browser GUI):
```bash
docker-compose exec frontend npm run test:e2e
```

#### Headless mode (CLI):
```bash
docker-compose exec frontend npm run test:e2e:headless
```

#### Run specific test file:
```bash
docker-compose exec frontend npx cypress run --spec "cypress/e2e/userFlows.cy.js"
```

---

## Running Tests Locally (Without Docker)

### Backend Tests (Local Development)

```bash
cd backend
npm install
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:integration   # Integration tests only
npm run test:coverage      # Coverage report
```

### Frontend Tests (Local Development)

```bash
cd frontend
npm install
npm test                    # Run component tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:e2e           # Open Cypress GUI
npm run test:e2e:headless  # Headless Cypress
```

---

## Docker Commands Reference

### Container Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View running containers
docker-compose ps

# View container logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart [service_name]
```

### Database Management
```bash
# Access MySQL console
docker-compose exec database mysql -u zamglam_user -pzamglam_pass zamglam_db

# Backup database
docker-compose exec database mysqldump -u zamglam_user -pzamglam_pass zamglam_db > backup.sql

# Restore database
docker-compose exec -T database mysql -u zamglam_user -pzamglam_pass zamglam_db < backup.sql
```

### Build Management
```bash
# Rebuild images
docker-compose build --no-cache

# Build specific service
docker-compose build backend

# View image details
docker images | grep zamglam
```

### Debugging
```bash
# Execute command in container
docker-compose exec backend npm test

# Access container shell
docker-compose exec backend sh

# View resource usage
docker stats

# Inspect container configuration
docker-compose config
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :5000              # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process or use different port
docker-compose down
# Change PORT in .env
docker-compose up -d
```

### Database Connection Failed
```bash
# Check database container logs
docker-compose logs database

# Verify database is healthy
docker-compose exec database mysqladmin ping -u zamglam_user -pzamglam_pass

# Restart database
docker-compose restart database
```

### Frontend Not Loading API Calls
```bash
# Verify backend is running
docker-compose exec backend curl localhost:5000/health

# Check CORS settings in backend
# Update CORS_ORIGIN in .env to match frontend URL

# Verify API_URL in frontend
# Check VITE_API_URL in .env
```

### Tests Failing in Docker
```bash
# View detailed test output
docker-compose exec backend npm test -- --verbose

# Run with extended timeout
docker-compose exec backend npm test -- --testTimeout=30000

# Check container logs
docker-compose logs backend
```

### Memory Issues
```bash
# Increase Docker memory limit
# Docker Desktop: Settings → Resources → Memory

# Monitor container memory
docker stats zamglam_backend
```

---

## Test Coverage Goals

| Module | Target Coverage |
|--------|-----------------|
| Backend Services | 70%+ |
| Backend Models | 80%+ |
| Backend Routes | 60%+ |
| Frontend Components | 60%+ |
| Frontend Utils | 80%+ |

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test on Push

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root

    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Backend Tests
        run: |
          cd backend
          npm install
          npm test
      
      - name: Frontend Tests
        run: |
          cd frontend
          npm install
          npm test
```

---

## Production Deployment

### Build Production Images
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### Environment for Production
Create `.env.prod`:
```bash
NODE_ENV=production
JWT_SECRET=your-production-secret-key
CORS_ORIGIN=https://yourdomain.com
DB_PASSWORD=strong-production-password
```

### Deploy
```bash
docker-compose -f docker-compose.yml up -d
```

---

## Best Practices

1. **Always use environment variables** for sensitive data
2. **Run tests before deployment** - `npm test && npm run test:e2e:headless`
3. **Use health checks** - All containers have health checks configured
4. **Monitor logs** - `docker-compose logs -f`
5. **Backup database regularly** - Use mysqldump
6. **Keep images updated** - Pull latest base images
7. **Use specific versions** - Don't use `latest` tags in production
8. **Test notifications** - Verify toast messages in E2E tests

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review test output: `npm test -- --verbose`
3. Check Docker status: `docker-compose ps`
4. Verify network: `docker network ls`

---

**Last Updated**: 2026-08-28
