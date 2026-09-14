# Zamglam E-Commerce Platform

A full-stack e-commerce application built with React, Node.js, Express, and MySQL. Features separate customer and seller dashboards with complete order management, product catalog, and delivery integration.

## Overview

Zamglam is a two-sided marketplace enabling:
- **Customers**: Browse products, add to cart, place orders, track deliveries
- **Sellers**: List products, manage inventory, process orders, view sales analytics

## Key Features

✅ **User Authentication**
- Separate customer and seller registration
- JWT-based authentication (7-day expiry)
- Password hashing with bcrypt
- Role-based access control

✅ **Product Management**
- Browse product catalog with filtering
- Detailed product pages with images
- Seller inventory management
- Stock tracking

✅ **Shopping Cart**
- Add/remove products
- Quantity management
- Persistent cart storage
- Real-time total calculation

✅ **Order Management**
- Place orders with multiple items
- Order status tracking (pending, processing, delivered)
- Customer order history
- Seller order queue

✅ **Delivery Integration**
- Real-time delivery quotes
- Driver assignment
- Distance and pricing calculation
- Pluggable courier providers (see `backend/src/services/courierProvider.js`)
- In-house Zamglam Courier is the implemented provider; a third-party adapter
  (e.g. Yango) can be dropped in, but is **not implemented** — those APIs are
  commercial B2B integrations needing credentials this project does not have

✅ **Dashboards**
- Customer dashboard: order tracking, cart, wishlist
- Seller dashboard: product management, sales analytics, order processing

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express 4.18.2
- **Database**: MySQL 8.0+
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt for password hashing
- **API Calls**: axios
- **Logging**: morgan
- **Middleware**: CORS, Helmet

### Frontend
- **Library**: React 18.3.1
- **Build Tool**: Vite 5.4.21
- **Routing**: React Router 6.30.4
- **Styling**: Tailwind CSS 3.4.19
- **HTTP Client**: Axios 1.19.0
- **State Management**: React Context API

## Project Structure

```
Zamglam-main/
├── backend/              # Express API server
│   ├── config/          # Database configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, error handling
│   ├── models/          # Database models
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── server.js        # App entry point
│   ├── package.json
│   └── .env             # Environment variables
├── frontend/            # React SPA
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── context/     # Auth and Cart context
│   │   ├── services/    # API integration
│   │   └── App.jsx      # Root component
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── README.md            # This file
├── BACKEND_SETUP.md     # Backend setup guide
├── FRONTEND_SETUP.md    # Frontend setup guide
└── API_REFERENCE.md     # API documentation
```

## Quick Start

### Fastest start (Windows)

From the project root, in a terminal:

```powershell
.\start.bat
```

It checks that MySQL is running, opens the backend and frontend in their own windows,
and prints the address to use from a phone on the same Wi-Fi. Close those two windows
to stop the servers.

The script calls `npm.cmd` rather than `npm`: on a machine whose PowerShell execution
policy blocks unsigned scripts, plain `npm run dev` fails with
"npm.ps1 cannot be loaded because running scripts is disabled on this system". If you
prefer plain `npm`, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once.

MySQL itself is not started by the script - start it from the XAMPP Control Panel.

### Prerequisites
- Node.js 16+ 
- npm
- MySQL 8.0+ (XAMPP recommended for Windows)

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file (copy from .env.example)
cp .env.example .env

# 4. Edit .env with your MySQL credentials
# 5. Start backend server
npm run dev      # Development with auto-reload
# or
npm start        # Production mode
```

Backend API: `http://localhost:5000`

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Frontend App: `http://localhost:3000`
- ✅ Product images and sizes
- ✅ Stock management

### Shopping Cart
- ✅ Add/remove items from cart
- ✅ Cart persistence (localStorage)
- ✅ Quantity management

### Orders
- ✅ Create orders from cart
- ✅ Order tracking
- ✅ Order status management

### Delivery
- ✅ Courier service integration
- ✅ Distance-based pricing
- ✅ Quote calculation

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Stores
- `GET /api/stores` - Get all stores
- `GET /api/stores/:id` - Get store details
- `POST /api/stores` - Create store (seller only)
- `PUT /api/stores/:id` - Update store (seller only)
- `GET /api/stores/:id/products` - Get store products with filters
- `POST /api/stores/documents/upload` - Upload KYC docs (protected)
- `GET /api/stores/documents/list` - Get seller documents (protected)

### Products
- `GET /api/products` - Get products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (seller only)
- `PUT /api/products/:id` - Update product (seller only)
- `DELETE /api/products/:id` - Delete product (seller only)

### Courier Service
- `GET /health` - Health check
- `POST /api/courier/quote` - Calculate delivery quote
- `GET /api/courier/pricing` - Get pricing info

## Sample Data

### Sellers
- **PEP Zambia** - pep@zamglam.local / PEP123456
- **JET Stores** - jet@zamglam.local / JET123456
- **MUD Zambia** - mud@zamglam.local / MUD123456

### Customer
- Email: customer@zamglam.local
- Password: CUSTOMER123456

### Categories
- Shirts
- Dresses
- Pants
- Shoes
- Jackets
- Accessories

## Database Schema

### Key Tables
- `users` - All users (customers, sellers)
- `customers` - Customer-specific data
- `stores` - Seller stores
- `products` - Product catalog
- `categories` - Product categories
- `cart` - Shopping cart items
- `orders` - Customer orders
- `order_items` - Products in orders
- `documents` - KYC documents

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root123
DB_NAME=zamglam_db
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=development
```

### Courier Service (.env)
```
FLASK_ENV=development
PORT=5001
DEBUG=True
```

## Code Standards

- ✅ SOLID principles + Separation of Concerns
- ✅ No files over 200 lines
- ✅ Reusable components
- ✅ Proper error handling
- ✅ Input validation
- ✅ Security headers (Helmet)
- ✅ CORS enabled
- ✅ Commented code

## Next Steps

### Pages to Implement
- [ ] HomePage with featured stores
- [ ] LoginPage with role selection
- [ ] RegisterPage with form validation
- [ ] StorePage with filtering
- [ ] ProductPage with details
- [ ] CartPage with checkout
- [ ] SellerDashboard with CRUD

### Features to Add
- [ ] Payment integration
- [ ] Email notifications
- [ ] Order tracking
- [ ] Reviews and ratings
- [ ] Wishlist
- [ ] Search with Elasticsearch
- [ ] Admin dashboard

## Common Commands

```bash
# Backend
npm install              # Install dependencies
npm run dev              # Start dev server
npm run seed             # Seed database
npm start                # Start production server

# Frontend
npm install              # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Courier Service
pip install -r requirements.txt  # Install dependencies
python app.py                    # Run server
```

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Check .env credentials
- Run schema.sql to create database

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: Vite will auto-select new port
- Courier: Change PORT in courier-service/.env

### CORS Errors
- Ensure backend and frontend are on correct ports
- Check vite.config.js proxy settings

## License

MIT

## Support

For issues and questions, contact: support@zamglam.local
