-- Shein-style e-commerce database schema
-- Includes Admin, Customer, and Seller dashboards

CREATE DATABASE IF NOT EXISTS zamglam_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE zamglam_db;

-- RBAC tables restored from the earlier working schema
CREATE TABLE roles (
    role_id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    role_name ENUM('Admin', 'Customer', 'Seller') NOT NULL UNIQUE,
    description VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE role_permissions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    role_id TINYINT UNSIGNED NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_role_permission (role_id, permission_name),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (role_name, description) VALUES
('Admin', 'Manage users, products, orders, couriers, and system settings'),
('Customer', 'Browse products, place orders, and track deliveries'),
('Seller', 'Add and manage products, view orders, update status, and track courier assignments');

INSERT INTO role_permissions (role_id, permission_name) VALUES
(1, 'manage_users'),
(1, 'manage_products'),
(1, 'manage_orders'),
(1, 'manage_couriers'),
(1, 'manage_system_settings'),
(2, 'browse_products'),
(2, 'place_orders'),
(2, 'track_deliveries'),
(3, 'add_products'),
(3, 'manage_products'),
(3, 'view_orders'),
(3, 'update_order_status'),
(3, 'track_courier_assignments');

-- Users table: central user registry for all account types
CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer', 'seller') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_users_email (email),
    KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Customers table
CREATE TABLE customers (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(30) NOT NULL,
    location VARCHAR(150) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_customers_user (user_id),
    KEY idx_customers_phone (phone),
    CONSTRAINT fk_customers_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Sellers table
CREATE TABLE sellers (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    shop_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_sellers_user (user_id),
    UNIQUE KEY uk_sellers_shop_name (shop_name),
    KEY idx_sellers_verification (verification_status),
    CONSTRAINT fk_sellers_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Admins table
CREATE TABLE admins (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    role_level ENUM('super_admin', 'manager', 'support') NOT NULL DEFAULT 'manager',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admins_user (user_id),
    CONSTRAINT fk_admins_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Categories table
CREATE TABLE categories (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE stores (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    seller_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    logo_url VARCHAR(255) DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    open_hours JSON,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_stores_seller (seller_id),
    CONSTRAINT fk_stores_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Products table
CREATE TABLE products (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    seller_id INT UNSIGNED NOT NULL,
    store_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255) DEFAULT NULL,
    audience VARCHAR(50) DEFAULT 'unisex',
    sizes JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_products_seller (seller_id),
    KEY idx_products_category (category_id),
    KEY idx_products_name (name),
    CONSTRAINT fk_products_seller
        FOREIGN KEY (seller_id) REFERENCES sellers(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_products_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Cart table
CREATE TABLE cart (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_cart_customer_product (customer_id, product_id),
    CONSTRAINT fk_cart_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_cart_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Orders table
CREATE TABLE orders (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    status ENUM('placed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'placed',
    address VARCHAR(255) DEFAULT NULL,
    location VARCHAR(150) DEFAULT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    payment_method ENUM('airtel_money', 'mtn_momo', 'card') DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_orders_customer (customer_id),
    KEY idx_orders_status (status),
    CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9a. Order status history table (per-step tracking timeline)
CREATE TABLE order_status_history (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    status VARCHAR(50) NOT NULL,
    note VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_order_status_history_order (order_id),
    CONSTRAINT fk_order_status_history_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Order items table
CREATE TABLE order_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_order_items_order (order_id),
    KEY idx_order_items_product (product_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9b. Courier accounts (drivers who log in, collect parcels and confirm deliveries)
CREATE TABLE couriers (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED DEFAULT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    password VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    vehicle VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_couriers_user (user_id),
    UNIQUE KEY uk_couriers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Courier table (per-order delivery assignment)
CREATE TABLE courier (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    courier_id INT UNSIGNED DEFAULT NULL,
    driver_name VARCHAR(150) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    distance DECIMAL(8,2) NOT NULL,
    direction VARCHAR(255) DEFAULT NULL,
    status ENUM('assigned', 'in_transit', 'delivered', 'failed') NOT NULL DEFAULT 'assigned',
    PRIMARY KEY (id),
    UNIQUE KEY uk_courier_order (order_id),
    KEY idx_courier_status (status),
    CONSTRAINT fk_courier_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10a. One shipment per seller for each multi-vendor order
CREATE TABLE shipments (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    seller_id INT UNSIGNED NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'placed',
    courier_id INT UNSIGNED DEFAULT NULL,
    driver_name VARCHAR(150) DEFAULT NULL,
    driver_phone VARCHAR(50) DEFAULT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    distance VARCHAR(100) DEFAULT NULL,
    direction VARCHAR(255) DEFAULT NULL,
    released_at TIMESTAMP NULL DEFAULT NULL,
    escalated_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_shipment_order_seller (order_id, seller_id),
    KEY idx_shipments_seller (seller_id),
    KEY idx_shipments_courier (courier_id),
    CONSTRAINT fk_shipments_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_shipments_seller
        FOREIGN KEY (seller_id) REFERENCES sellers(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_shipments_courier
        FOREIGN KEY (courier_id) REFERENCES couriers(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Payments table
CREATE TABLE payments (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    method ENUM('card', 'cash', 'mobile_money', 'bank_transfer') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'successful', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    transaction_ref VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_payments_order (order_id),
    KEY idx_payments_status (status),
    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Reviews table
CREATE TABLE reviews (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id INT UNSIGNED NOT NULL,
    customer_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_reviews_product (product_id),
    KEY idx_reviews_customer (customer_id),
    CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_reviews_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Wishlists table
CREATE TABLE wishlists (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_wishlist_customer_product (customer_id, product_id),
    CONSTRAINT fk_wishlist_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Documents table
CREATE TABLE documents (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    seller_id INT UNSIGNED NOT NULL,
    doc_type ENUM('national_id', 'business_license', 'tax_id', 'bank_statement') NOT NULL,
    doc_number VARCHAR(100) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_documents_seller (seller_id),
    KEY idx_documents_status (status),
    CONSTRAINT fk_documents_seller
        FOREIGN KEY (seller_id) REFERENCES sellers(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data for roles (optional)
INSERT INTO users (email, password, role) VALUES
('admin@zamglam.com', '$2y$10$examplehash', 'admin'),
('customer@zamglam.com', '$2y$10$examplehash', 'customer'),
('seller@zamglam.com', '$2y$10$examplehash', 'seller');

-- Optional indexes for performance
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_reviews_rating ON reviews(rating);
