# Zamglam Database Schema

Complete documentation of all database tables, columns, relationships, and indexes.

## Database: zamglam_db

### Overview

The Zamglam database uses normalized relational schema following 3NF principles. Tables are structured to support:
- Customer and seller authentication
- Product catalog management
- Order processing and tracking
- Delivery/courier information
- Cart management

---

## Tables

### 1. Customers

Stores customer profile information.

```sql
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Customer ID |
| name | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| password | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| address | VARCHAR(500) | | Delivery address |
| phone | VARCHAR(20) | | Phone number |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration date |

**Indexes:**
- PRIMARY KEY: id
- UNIQUE KEY: email

**Notes:**
- Password stored as bcrypt hash (60 characters)
- Email must be unique (enforced by database)

---

### 2. Sellers

Stores seller/shop profile information.

```sql
CREATE TABLE sellers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Seller ID |
| name | VARCHAR(255) | NOT NULL | Owner name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Business email |
| password | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| shop_name | VARCHAR(255) | NOT NULL | Store name |
| phone | VARCHAR(20) | | Business phone |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration date |

**Indexes:**
- PRIMARY KEY: id
- UNIQUE KEY: email

**Notes:**
- Similar structure to customers table
- shop_name uniquely identifies business

---

### 3. Products

Stores product listings from sellers.

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  seller_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Product ID |
| seller_id | INT | FK, NOT NULL | Seller who listed product |
| name | VARCHAR(255) | NOT NULL | Product name |
| description | TEXT | | Detailed product description |
| price | DECIMAL(10,2) | NOT NULL | Product price in Kwacha |
| stock | INT | DEFAULT 0 | Available quantity |
| image_url | VARCHAR(500) | | Product image URL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Listing date |

**Indexes:**
- PRIMARY KEY: id
- FOREIGN KEY: seller_id → sellers.id (CASCADE DELETE)
- INDEX: seller_id (for quick seller lookups)

**Notes:**
- Price stored as DECIMAL for financial accuracy
- Stock managed in integers
- ON DELETE CASCADE ensures orphaned products are removed

---

### 4. Orders

Stores customer orders for products.

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Order ID |
| customer_id | INT | FK, NOT NULL | Customer who placed order |
| product_id | INT | FK, NOT NULL | Product ordered |
| quantity | INT | NOT NULL, DEFAULT 1 | Quantity ordered |
| status | VARCHAR(50) | DEFAULT 'pending' | Order status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Order date |

**Status Values:**
- `pending` - Order received, awaiting confirmation
- `processing` - Being prepared for shipment
- `shipped` - Shipped to customer
- `delivered` - Successfully delivered
- `cancelled` - Order cancelled

**Indexes:**
- PRIMARY KEY: id
- FOREIGN KEY: customer_id → customers.id (CASCADE DELETE)
- FOREIGN KEY: product_id → products.id (CASCADE DELETE)
- INDEX: customer_id (for customer order history)
- INDEX: product_id (for product order tracking)

**Notes:**
- One order = one product instance (denormalized for simplicity)
- For multiple products, create multiple orders
- Status updates tracked implicitly via created_at

---

### 5. Courier

Stores delivery/courier information for orders.

```sql
CREATE TABLE courier (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT,
  driver_name VARCHAR(255),
  price DECIMAL(10, 2),
  distance VARCHAR(50),
  direction VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Courier record ID |
| order_id | INT | FK | Associated order |
| driver_name | VARCHAR(255) | | Assigned driver name |
| price | DECIMAL(10,2) | | Delivery cost in Kwacha |
| distance | VARCHAR(50) | | Distance from warehouse to delivery |
| direction | VARCHAR(100) | | Delivery direction/zone |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Quote/assignment date |

**Indexes:**
- PRIMARY KEY: id
- FOREIGN KEY: order_id → orders.id (CASCADE DELETE)
- INDEX: order_id (for order delivery tracking)

**Notes:**
- One courier record per order
- Distance stored as VARCHAR (e.g., "3.5 km")
- Price calculated by the configured courier provider, from the distance between
  the shop and the delivery address (see backend/src/services/courierProvider.js)
- Nullable fields allow for pending assignments

---

## Entity Relationships (ER Diagram)

```
CUSTOMERS                SELLERS                  PRODUCTS
+---------+             +---------+              +---------+
| id (PK) |             | id (PK) |              | id (PK) |
| name    |             | name    |   1:N        | name    |
| email   |             | email   |<-------------|seller_id|
| phone   |             | phone   |              | price   |
| address |             | shop    |              | stock   |
+---------+             +---------+              +---------+
   1:N                                                |
   |                                                  |1:N
   |                    ORDERS                        |
   |                  +---------+                     |
   +---------------->| id (PK) |<--------------------+
                      |cust_id  |
                      |prod_id  |
                      |quantity |
                      |status   |
                      +---------+
                           |
                           |1:1
                           v
                      COURIER
                      +---------+
                      | id (PK) |
                      |order_id |
                      |driver   |
                      |price    |
                      +---------+
```

**Legend:**
- 1:N = One-to-Many (one seller has many products)
- PK = Primary Key
- FK = Foreign Key

---

## Relationships Explained

### Customers → Orders
- **Type**: One-to-Many (1:N)
- **Foreign Key**: orders.customer_id → customers.id
- **Cascade**: DELETE (deleting customer deletes their orders)

### Sellers → Products
- **Type**: One-to-Many (1:N)
- **Foreign Key**: products.seller_id → sellers.id
- **Cascade**: DELETE (deleting seller deletes their products)

### Products → Orders
- **Type**: One-to-Many (1:N)
- **Foreign Key**: orders.product_id → products.id
- **Cascade**: DELETE (deleting product deletes related orders)

### Orders → Courier
- **Type**: One-to-One (1:1)
- **Foreign Key**: courier.order_id → orders.id
- **Cascade**: DELETE (deleting order deletes courier record)

---

## Indexes

### Primary Key Indexes (Automatic)
```sql
PRIMARY KEY (id)  -- On all tables
```

### Unique Indexes
```sql
UNIQUE KEY (email)  -- customers, sellers
```

### Foreign Key Indexes (Automatic)
```sql
INDEX (customer_id)  -- orders table
INDEX (product_id)   -- orders table
INDEX (seller_id)    -- products table
INDEX (order_id)     -- courier table
```

### Recommended Additional Indexes for Performance
```sql
-- For product listing by seller
CREATE INDEX idx_products_seller_id ON products(seller_id);

-- For customer order history
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- For order status queries
CREATE INDEX idx_orders_status ON orders(status);

-- For date-based queries
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_products_created_at ON products(created_at);
```

---

## Data Types

| Type | Usage | Size | Range |
|------|-------|------|-------|
| INT | IDs, quantities, counts | 4 bytes | -2^31 to 2^31-1 |
| VARCHAR(n) | Text fields | n bytes | Text up to n characters |
| TEXT | Long text | Variable | Large text content |
| DECIMAL(10,2) | Prices, money | Variable | 99999999.99 max |
| TIMESTAMP | Dates | 4 bytes | 1970-2038 |
| UNIQUE | Email enforcement | - | Prevents duplicates |
| AUTO_INCREMENT | Sequential IDs | - | Starts at 1, increments |

---

## Sample Queries

### Get all products by a seller
```sql
SELECT * FROM products WHERE seller_id = 1;
```

### Get customer's order history
```sql
SELECT o.id, p.name, o.quantity, o.status, o.created_at
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.customer_id = 5;
```

### Get order with delivery info
```sql
SELECT o.id, p.name, o.quantity, o.status, c.driver_name, c.price, c.distance
FROM orders o
JOIN products p ON o.product_id = p.id
LEFT JOIN courier c ON o.id = c.order_id
WHERE o.id = 101;
```

### Find products with low stock
```sql
SELECT id, name, stock FROM products WHERE stock < 10;
```

### Get seller statistics
```sql
SELECT 
  s.shop_name,
  COUNT(p.id) as product_count,
  COUNT(o.id) as order_count,
  SUM(p.price * o.quantity) as total_revenue
FROM sellers s
LEFT JOIN products p ON s.id = p.seller_id
LEFT JOIN orders o ON p.id = o.product_id
GROUP BY s.id;
```

---

## Initialization

### Database Creation
```sql
CREATE DATABASE IF NOT EXISTS zamglam_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### Auto-Initialization
The backend automatically creates all tables on first startup via:
- `config/db.js` → `initializeDatabase()` function
- Runs table creation SQL if tables don't exist
- Idempotent (safe to run multiple times)

---

## Backup & Maintenance

### Backup Database
```bash
mysqldump -u root -p zamglam_db > backup.sql
```

### Restore Database
```bash
mysql -u root -p zamglam_db < backup.sql
```

### Check Database Size
```sql
SELECT 
  SUM(data_length + index_length) / 1024 / 1024 AS size_mb
FROM information_schema.tables
WHERE table_schema = 'zamglam_db';
```

### Optimize Tables
```sql
OPTIMIZE TABLE customers, sellers, products, orders, courier;
```

---

## Constraints & Validations

### NOT NULL Constraints
- Enforces required fields at database level
- Essential for business logic integrity

### UNIQUE Constraints
- Email addresses must be unique (prevents duplicate accounts)
- Enforced at database level

### FOREIGN KEY Constraints
- Enforces referential integrity
- ON DELETE CASCADE automatically removes related records
- Prevents orphaned data

### CHECK Constraints (Recommended for Future)
```sql
-- Suggested additions for data quality
ALTER TABLE products ADD CONSTRAINT chk_price 
  CHECK (price > 0);

ALTER TABLE orders ADD CONSTRAINT chk_quantity 
  CHECK (quantity > 0);

ALTER TABLE orders ADD CONSTRAINT chk_status 
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'));
```

---

## Transaction Support

All operations support ACID transactions:

```sql
START TRANSACTION;
  INSERT INTO orders (customer_id, product_id, quantity, status) 
  VALUES (5, 1, 2, 'pending');
  UPDATE products SET stock = stock - 2 WHERE id = 1;
COMMIT;
-- Or ROLLBACK; if error occurs
```

---

## Monitoring & Performance

### Check Table Status
```sql
SHOW TABLE STATUS FROM zamglam_db;
```

### Find Slow Queries (requires slow query log)
```sql
SELECT * FROM mysql.slow_log;
```

### Connection Pool Status
Backend maintains 10 MySQL connections (configurable in config/db.js)

---

## Security Considerations

- ✅ Password stored as bcrypt hash (never plain text)
- ✅ SQL injection prevented via parameterized queries
- ✅ Foreign keys prevent orphaned data
- ✅ Unique constraint prevents duplicate users
- ⚠️ Consider adding role/permission tables for fine-grained access control
- ⚠️ Consider audit logging for sensitive operations

---

**Database Version**: 1.0  
**MySQL Compatibility**: 5.7+, 8.0+  
**Last Updated**: 2024
