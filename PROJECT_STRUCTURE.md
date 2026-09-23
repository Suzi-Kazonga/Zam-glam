# 📁 Zamglam Project Structure - Complete Overview

This document explains the complete folder organization of Zamglam.

---

## Root Level Files

```
Zamglam-main/
├── START_HERE.md              ← 👈 BEGIN HERE! Quick setup guide
├── README.md                  ← Project overview & features
├── SETUP.md                   ← Detailed installation guide
├── QUICK_REFERENCE.md         ← Developer cheat sheet
├── COMPLETION_SUMMARY.md      ← What was built
├── PROJECT_STRUCTURE.md       ← This file
└── .gitignore                 ← Git ignore rules
```

**Quick Navigation:**
- 🚀 **Just starting?** → Read [START_HERE.md](START_HERE.md)
- 🔧 **Need to install?** → Read [SETUP.md](SETUP.md)
- 💻 **Developing?** → Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- 🎯 **Want overview?** → Read [README.md](README.md)

---

## 🎨 Frontend Folder

```
frontend/
├── src/
│   ├── components/
│   │   ├── Button.jsx              # Reusable button component
│   │   ├── Header.jsx              # Navigation header
│   │   ├── ProductCard.jsx         # Product display card
│   │   ├── ProductGrid.jsx         # Grid layout for products
│   │   ├── SearchBar.jsx           # Search input with debounce
│   │   └── FilterBar.jsx           # Product filter controls
│   │
│   ├── pages/
│   │   ├── HomePage.jsx            # Home page (placeholder)
│   │   ├── LoginPage.jsx           # Login/Register (placeholder)
│   │   ├── StorePage.jsx           # Store listing & details
│   │   ├── ProductPage.jsx         # Product details
│   │   ├── CartPage.jsx            # Shopping cart
│   │   └── SellerDashboard.jsx     # Seller dashboard (placeholder)
│   │
│   ├── api/
│   │   ├── axios.js                # Axios config with JWT interceptor
│   │   ├── authApi.js              # Auth endpoints (login, register)
│   │   ├── storeApi.js             # Store CRUD operations
│   │   └── productApi.js           # Product operations
│   │
│   ├── context/
│   │   ├── AuthContext.jsx         # Auth state management
│   │   └── CartContext.jsx         # Cart state management
│   │
│   ├── hooks/
│   │   └── useDebounce.js          # Debounce custom hook
│   │
│   ├── styles/
│   │   ├── globals.css             # Global styles & Tailwind directives
│   │   ├── theme.css               # CSS variables for colors
│   │   ├── components.css          # Component-specific styles
│   │   └── layout.css              # Layout utilities
│   │
│   ├── App.jsx                     # Main app component with routing
│   └── main.jsx                    # React entry point
│
├── index.html                      # HTML template
├── package.json                    # NPM dependencies
├── vite.config.js                  # Vite build configuration
├── tailwind.config.js              # Tailwind CSS configuration
└── postcss.config.js               # PostCSS configuration
```

**Frontend Stack:** React 18 + Vite + TailwindCSS + React Router

---

## ⚙️ Backend Folder

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js       # Auth logic (login, register)
│   │   ├── storeController.js      # Store CRUD & KYC upload
│   │   └── productController.js    # Product CRUD & filtering
│   │
│   ├── models/
│   │   ├── User.js                 # User database operations
│   │   ├── Store.js                # Store database operations
│   │   ├── Product.js              # Product database operations
│   │   ├── Order.js                # Order database operations
│   │   └── Document.js             # Document (KYC) operations
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # Auth endpoints (/api/auth/*)
│   │   ├── storeRoutes.js          # Store endpoints (/api/stores/*)
│   │   └── productRoutes.js        # Product endpoints (/api/products/*)
│   │
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   ├── error.js                # Error handling middleware
│   │   └── upload.js               # File upload configuration (Multer)
│   │
│   ├── config/
│   │   └── db.js                   # MySQL connection pool setup
│   │
│   ├── server.js                   # Express server initialization
│   └── seed.js                     # Database seeding script
│
├── uploads/
│   └── .gitkeep                    # Placeholder for file uploads
│
├── package.json                    # NPM dependencies
├── .env                            # Environment variables (not in git)
└── .env.example                    # Example .env template
```

**Backend Stack:** Node.js + Express + MySQL + JWT + bcrypt

---

## 🚗 Courier Service Folder

```
courier-service/
├── app.py                          # Flask server with distance calc
├── .env                            # Environment variables
└── requirements.txt                # Python dependencies
```

**Courier Stack:** Python + Flask + Haversine formula

---

## 🗄️ Database Folder

```
database/
└── schema.sql                      # Complete MySQL DDL
                                   # Tables: users, stores, products, 
                                   #         orders, categories, etc.
```

**Contains:** Full database schema with relationships, indexes, and FK constraints

---

## 📚 Docs Folder

```
docs/
└── API.md                          # Complete API endpoint documentation
                                   # Includes: examples, response formats,
                                   #           error codes
```

---

## 🎯 What Happens When You Run Commands

### `npm run dev` in frontend/
```
1. Vite starts dev server on http://localhost:3000
2. Serves React app with hot module reload
3. Proxies /api/* requests to http://localhost:5000
4. Watches for file changes → auto-reload
```

### `npm run dev` in backend/
```
1. Nodemon starts Express server on http://localhost:5000
2. Connects to MySQL using connection pool
3. Loads environment variables from .env
4. Watches for file changes → auto-restart
5. Provides RESTful API endpoints
```

### `python app.py` in courier-service/
```
1. Flask starts dev server on http://localhost:5001
2. Provides courier pricing API
3. Calculates distance using coordinates
4. Returns delivery price based on distance
```

### `npm run seed` in backend/
```
1. Connects to MySQL database
2. Creates 3 seller accounts (PEP, JET, MUD)
3. Creates 6 product categories
4. Creates sample products per store
5. Creates 1 customer account
6. Logs progress to console
```

---

## 📊 Database Tables

### Core Tables
- **users** - All application users (customers, sellers, admins)
- **customers** - Customer-specific data (addresses)
- **stores** - Seller store information
- **products** - Product catalog with filtering data
- **categories** - Product category taxonomy

### Transaction Tables
- **cart** - Shopping cart items per user
- **orders** - Customer orders
- **order_items** - Line items in orders

### Other Tables
- **documents** - KYC documents (PACRA, NRC) for sellers

---

## 🔌 API Endpoint Groups

### Authentication Routes
```
POST   /api/auth/register      # Create new user
POST   /api/auth/login         # Login user
GET    /api/auth/me            # Get current user (protected)
```

### Store Routes
```
GET    /api/stores             # List all stores
GET    /api/stores/:id         # Get store details
GET    /api/stores/:id/products # Get store products (with filters)
POST   /api/stores             # Create store (seller only)
PUT    /api/stores/:id         # Update store (seller only)
POST   /api/stores/documents/upload    # Upload KYC (protected)
GET    /api/stores/documents/list      # Get documents (protected)
```

### Product Routes
```
GET    /api/products           # Get products (with filters)
GET    /api/products/:id       # Get product details
POST   /api/products           # Create product (seller only)
PUT    /api/products/:id       # Update product (seller only)
DELETE /api/products/:id       # Delete product (seller only)
```

### Courier Routes
```
POST   /api/courier/quote      # Calculate delivery price
GET    /api/courier/pricing    # Get pricing info
```

---

## 🔐 Authentication Flow

```
1. User → Registers (email/password)
2. Backend → Hash password with bcrypt
3. Backend → Save user to database
4. User → Logs in with email/password
5. Backend → Verify password
6. Backend → Generate JWT token
7. Frontend → Store token in localStorage
8. Frontend → Send token in Authorization header for protected routes
9. Backend → Verify JWT token on protected endpoints
10. User → Access granted/denied based on role
```

---

## 📦 Key Dependencies

### Frontend
- `react` - UI framework
- `vite` - Build tool
- `tailwindcss` - Styling
- `react-router-dom` - Routing
- `axios` - HTTP client

### Backend
- `express` - Web framework
- `mysql2` - Database driver
- `jsonwebtoken` - JWT auth
- `bcrypt` - Password hashing
- `multer` - File uploads
- `helmet` - Security headers
- `cors` - Cross-origin requests

### Courier
- `Flask` - Web framework
- `python-dotenv` - Environment variables

---

## 🚀 Deployment Structure

When deploying to production:

```
Production Server 1: Frontend
├── Built React app (npm run build)
└── Served by: Vercel, Netlify, or nginx

Production Server 2: Backend
├── Node.js + Express app
├── Environment: NODE_ENV=production
└── Database: AWS RDS MySQL

Production Server 3: Database
├── MySQL instance
└── Regular backups

Production Server 4: Courier
├── Python Flask app
└── Can be serverless (AWS Lambda)
```

---

## 📋 Development Checklist

- ✅ **Cleaned up:** Removed old public/, server/, tests/ folders
- ✅ **Organized:** Frontend and backend in separate folders
- ✅ **Documented:** Complete documentation in place
- ✅ **Database:** MySQL schema ready
- ✅ **API:** 18 endpoints built
- ✅ **Auth:** JWT + role-based access control
- ✅ **Components:** Reusable React components
- ✅ **Config:** Environment variables setup

---

## 🎓 Learning Path

### For Frontend Developers
1. Start in `frontend/src/pages/` - create new pages
2. Use components from `frontend/src/components/`
3. Call APIs using functions in `frontend/src/api/`
4. Style with Tailwind in `frontend/src/styles/`

### For Backend Developers
1. Add routes in `backend/src/routes/`
2. Add logic in `backend/src/controllers/`
3. Database queries in `backend/src/models/`
4. Test endpoints with Postman/cURL

### For Full-Stack Developers
1. Read START_HERE.md first
2. Run all services locally
3. Make changes in both frontend & backend
4. Test with browser + Postman

---

## 🔗 File Relationships

```
Browser Request
     ↓
Frontend Component (frontend/src/pages/*.jsx)
     ↓
API Client Function (frontend/src/api/*.js)
     ↓ HTTP Request
Backend Route (backend/src/routes/*.js)
     ↓
Controller (backend/src/controllers/*.js)
     ↓
Model/Database (backend/src/models/*.js)
     ↓
MySQL Database (database/schema.sql)
```

---

## 📝 Adding New Features

### To add a new API endpoint:
1. Add route in `backend/src/routes/*.js`
2. Add controller logic in `backend/src/controllers/*.js`
3. Add database query in `backend/src/models/*.js`
4. Test with Postman
5. Create API function in `frontend/src/api/*.js`
6. Use in React component `frontend/src/pages/*.jsx`

### To add a new page:
1. Create file in `frontend/src/pages/*.jsx`
2. Add route in `frontend/src/App.jsx`
3. Create components in `frontend/src/components/`
4. Call API functions from `frontend/src/api/`
5. Style with Tailwind CSS

---

## ✨ Final Notes

- **No node_modules in git** - Run `npm install` locally
- **No .env in git** - Create your own `.env` file
- **No uploads in git** - But `.gitkeep` tracks the folder
- **Hot reload enabled** - Changes auto-reload in dev mode
- **All code documented** - Check file headers for explanations

---

**Happy developing! 🔥**

*For questions, see START_HERE.md, SETUP.md, or QUICK_REFERENCE.md*
