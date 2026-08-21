# Zamglam Setup Guide - Complete Installation Steps

This guide walks you through setting up the entire Zamglam e-commerce application.

## Prerequisites

Before you start, make sure you have installed:
- **Node.js** 16+ (download from [nodejs.org](https://nodejs.org/))
- **MySQL** 8.0+ (download from [mysql.com](https://dev.mysql.com/downloads/mysql/))
- **Python** 3.8+ (download from [python.org](https://www.python.org/))
- **Git** (optional, for version control)

## Step 1: Database Setup

### Windows
```bash
# Open MySQL Command Line Client (installed with MySQL)
# Or use MySQL Workbench

# Run these commands:
CREATE DATABASE IF NOT EXISTS zamglam_db;
USE zamglam_db;

# Then paste the entire content of database/schema.sql
# Or from terminal:
mysql -u root -p zamglam_db < database/schema.sql
```

### Mac/Linux
```bash
mysql -u root -p < database/schema.sql
```

## Step 2: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create and configure .env file
# Edit backend/.env and update database credentials:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD  # Change this
DB_NAME=zamglam_db
JWT_SECRET=zamglam_jwt_secret_key_change_in_production
PORT=5000
NODE_ENV=development

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

**Expected output:**
```
✅ Database connected successfully
✨ Database seeding completed successfully!
🚀 Zamglam API Server running on http://localhost:5000
```

## Step 3: Frontend Setup

```bash
# Navigate to frontend folder
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected output:**
```
VITE v5.0.0 ready in 100 ms

➜  Local:   http://localhost:3000/
```

Open http://localhost:3000 in your browser.

## Step 4: Courier Service Setup (Optional)

```bash
# Navigate to courier service folder
cd ../courier-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
FLASK_ENV=development
PORT=5001
DEBUG=True

# Run Flask app
python app.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5001
 * Press CTRL+C to quit
```

## Step 5: Test the Application

### Test Backend API
```bash
# Open Postman or use curl

# Register as seller
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Seller",
    "email": "seller@test.com",
    "password": "password123",
    "role": "seller"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@test.com",
    "password": "password123"
  }'

# Get all stores
curl http://localhost:5000/api/stores

# Get products with filters
curl "http://localhost:5000/api/products?audience=women&category=1"
```

### Test Frontend
1. Navigate to http://localhost:3000
2. Click "Register" to create an account
3. Login with your credentials
4. Explore stores and products
5. Add products to cart

### Test Courier Service
```bash
curl -X POST http://localhost:5001/api/courier/quote \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_lat": -15.3875,
    "pickup_lon": 28.3228,
    "delivery_lat": -15.4167,
    "delivery_lon": 28.2833
  }'
```

## Sample Credentials

Use these to test the application:

### Sellers
- **Email:** pep@zamglam.local | **Password:** PEP123456
- **Email:** jet@zamglam.local | **Password:** JET123456
- **Email:** mud@zamglam.local | **Password:** MUD123456

### Customer
- **Email:** customer@zamglam.local | **Password:** CUSTOMER123456

## Troubleshooting

### MySQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:**
- Make sure MySQL is running
- Check credentials in .env
- Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
```bash
# Find process on port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill process or change PORT in .env
```

### CORS Error in Frontend
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Ensure backend is running on http://localhost:5000
- Check vite.config.js proxy settings
- Verify .env variables match

### Python Virtual Environment Issues
```bash
# If venv activation fails
python -m venv venv --clear
# Then activate again
```

## Next Steps

1. **Implement Pages:**
   - [ ] HomePage
   - [ ] LoginPage / RegisterPage
   - [ ] StorePage with filters
   - [ ] ProductPage
   - [ ] CartPage
   - [ ] SellerDashboard

2. **Add Features:**
   - [ ] Payment integration (Stripe/PayPal)
   - [ ] Email notifications
   - [ ] Reviews and ratings
   - [ ] Wishlist functionality
   - [ ] Admin dashboard

3. **Deployment:**
   - [ ] Deploy backend to Heroku/Railway
   - [ ] Deploy frontend to Vercel/Netlify
   - [ ] Deploy database to AWS RDS/Azure
   - [ ] Set up CI/CD pipeline

## File Structure Overview

```
Zamglam-main/
├── backend/                    # Express.js API
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── models/            # Database interactions
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Authentication, validation
│   │   ├── config/            # Database config
│   │   ├── server.js          # Entry point
│   │   └── seed.js            # Sample data
│   ├── package.json
│   └── .env                   # Configuration
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── api/               # API client
│   │   ├── context/           # Global state (Auth, Cart)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── styles/            # CSS files
│   │   └── App.jsx            # Root component
│   ├── package.json
│   └── vite.config.js         # Build config
│
├── courier-service/           # Python + Flask
│   ├── app.py                 # Flask server
│   └── requirements.txt        # Python dependencies
│
├── database/
│   └── schema.sql             # MySQL database schema
│
└── README.md                  # Project documentation
```

## Quick Reference

### Start All Services
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Courier Service
cd courier-service && python app.py
```

### Database Operations
```bash
# Seed database
cd backend && npm run seed

# Reset database
mysql -u root -p zamglam_db < database/schema.sql

# Backup database
mysqldump -u root -p zamglam_db > backup.sql
```

### Install/Update Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install

# Courier Service
cd courier-service && pip install -r requirements.txt
```

## Support

If you encounter issues:
1. Check error messages in terminal
2. Review troubleshooting section above
3. Verify all prerequisites are installed
4. Check that all services are running on correct ports
5. Review README.md for additional help

---

Happy coding! 🔥
