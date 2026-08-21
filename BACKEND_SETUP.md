# Zamglam Backend Setup Guide

## Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+ (via XAMPP or standalone)
- Git (optional)

## Database Setup

### 1. Start MySQL Service

Using XAMPP:
- Open XAMPP Control Panel
- Click **Start** next to MySQL

Or manually via command line:
```bash
# Windows (if MySQL is installed as a service)
net start MySQL80
```

### 2. Create Database

```bash
# Connect to MySQL
mysql -u root -p

# Run this in the MySQL prompt
source database/schema.sql
```

Or use a GUI tool like MySQL Workbench or phpMyAdmin (XAMPP includes it at http://localhost/phpmyadmin).

## Backend Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=zamglam_db
JWT_SECRET=zamglam_super_secret_key
YANGO_API_KEY=demo_yango_key
NODE_ENV=development
```

### 3. Start Backend Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at `http://localhost:5000`

## Backend Project Structure

```
backend/
├── config/
│   └── db.js              # MySQL connection pool & initialization
├── controllers/
│   ├── AuthController.js   # Login/signup handlers
│   ├── ProductController.js
│   ├── OrderController.js
│   ├── CartController.js
│   └── CourierController.js
├── models/
│   ├── BaseModel.js        # Abstract model class (SOLID: Liskov)
│   ├── CustomerModel.js
│   ├── SellerModel.js
│   ├── ProductModel.js
│   ├── OrderModel.js
│   └── CourierModel.js
├── services/
│   ├── AuthService.js      # Business logic for auth
│   ├── ProductService.js
│   ├── OrderService.js
│   ├── CartService.js
│   └── CourierService.js
├── middleware/
│   ├── auth.js             # JWT authentication
│   └── errorHandler.js     # Global error handler
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── cartRoutes.js
│   └── courierRoutes.js
├── server.js               # Express app entry point
├── package.json
├── .env
└── .env.example
```

## SOLID Architecture

### Single Responsibility
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Models**: Handle database operations
- **Routes**: Define API endpoints

### Open/Closed
- Services and middleware are modular and extendable
- New routes can be added without modifying existing ones

### Liskov Substitution
- `BaseModel` class provides abstract DB operations
- All models inherit and extend without breaking interface

### Interface Segregation
- Separate route files for each domain (auth, products, orders, courier)
- Controllers only handle their specific logic

### Dependency Inversion
- Database connection injected via `config/db.js`
- Services depend on models, not vice versa

## API Endpoints

### Authentication

```
POST   /api/auth/customer/signup    - Register customer
POST   /api/auth/customer/login     - Customer login
POST   /api/auth/seller/signup      - Register seller
POST   /api/auth/seller/login       - Seller login
GET    /api/auth/me                 - Get current user (protected)
```

### Products

```
GET    /api/products                - List all products
GET    /api/products/:id            - Get product details
POST   /api/products                - Create product (seller only)
PUT    /api/products/:id            - Update product (seller only)
DELETE /api/products/:id            - Delete product (seller only)
GET    /api/products/seller/my-products - Get seller's products
```

### Orders

```
POST   /api/orders                  - Place order (customer only)
GET    /api/orders/my-orders        - Get customer's orders (protected)
PATCH  /api/orders/:id/status       - Update order status (protected)
```

### Cart

```
GET    /api/cart                    - View cart items (protected)
POST   /api/cart/add                - Add item to cart (protected)
DELETE /api/cart/remove/:id         - Remove item from cart (protected)
```

### Courier

```
POST   /api/courier/quote           - Get delivery quote (protected)
```

## Database Schema

### Tables

- **customers** - Customer profiles (name, email, password, address, phone)
- **sellers** - Seller profiles (name, email, password, shop_name, phone)
- **products** - Products listing (seller_id, name, description, price, stock, image_url)
- **orders** - Customer orders (customer_id, product_id, quantity, status, created_at)
- **courier** - Courier information (order_id, driver_name, price, distance, direction)

## Authentication Flow

1. User signs up → password hashed with bcrypt
2. User logs in → credentials verified
3. JWT token generated (expires in 7 days)
4. Token sent in `Authorization: Bearer <token>` header for protected routes
5. Middleware verifies token before allowing access

## Error Handling

Global error handler catches all errors and returns JSON responses:

```json
{
  "message": "Error description",
  "stack": "Error stack (development only)"
}
```

## Troubleshooting

### "Database connection failed"
- Ensure MySQL is running
- Check `.env` credentials match your MySQL setup
- Verify database `zamglam_db` exists

### Port 5000 already in use
- Change `PORT` in `.env`
- Or kill the process: `lsof -ti:5000 | xargs kill -9`

### JWT errors
- Ensure `JWT_SECRET` is set in `.env`
- Check token hasn't expired (7 days)
- Verify token format in Authorization header

## Testing

Run the health check:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "zamglam_db"
}
```
