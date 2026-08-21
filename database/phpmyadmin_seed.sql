-- Zamglam sample data for MySQL/phpMyAdmin
-- Run this script after selecting the zamglam_db database.

CREATE DATABASE IF NOT EXISTS zamglam_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE zamglam_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS stores;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE stores (
    store_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    logo_url VARCHAR(255) NOT NULL,
    PRIMARY KEY (store_id),
    UNIQUE KEY uk_stores_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
    product_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    store_id INT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('pants', 'shirts', 'shoes') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    image_url VARCHAR(255) NOT NULL,
    PRIMARY KEY (product_id),
    KEY idx_products_store (store_id),
    KEY idx_products_category (category),
    CONSTRAINT fk_products_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_products_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE deals (
    deal_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id INT UNSIGNED NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL,
    expiry_date DATETIME NOT NULL,
    PRIMARY KEY (deal_id),
    UNIQUE KEY uk_deals_product (product_id),
    KEY idx_deals_expiry (expiry_date),
    CONSTRAINT fk_deals_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_deals_discount CHECK (discount_percentage > 0 AND discount_percentage < 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO stores (store_id, name, logo_url) VALUES
    (1, 'Mud', '/images/logos/mud.png'),
    (2, 'Jets', '/images/logos/jets.png'),
    (3, 'Bata', '/images/logos/bata.png'),
    (4, 'Pep', '/images/logos/pep.png'),
    (5, 'Mr Price Zambia', '/images/logos/mrprice.png'),
    (6, 'Fashions Galore', '/images/logos/fashionsgalore.png');

INSERT INTO products (product_id, store_id, name, description, category, price, stock, image_url) VALUES
    (1, 1, 'Classic Denim Pants', 'Everyday denim pants with a comfortable straight fit.', 'pants', 350.00, 50, '/images/products/classic-denim-pants.jpg'),
    (2, 1, 'Casual Cotton Shirt', 'Soft cotton shirt for easy everyday dressing.', 'shirts', 250.00, 30, '/images/products/casual-cotton-shirt.jpg'),
    (3, 1, 'Leather Shoes', 'Polished leather shoes for work and weekends.', 'shoes', 600.00, 25, '/images/products/leather-shoes.jpg'),

    (4, 2, 'Slim Fit Pants', 'Clean slim-fit pants with everyday stretch.', 'pants', 400.00, 40, '/images/products/slim-fit-pants.jpg'),
    (5, 2, 'Formal White Shirt', 'Crisp white shirt for formal occasions.', 'shirts', 300.00, 25, '/images/products/formal-white-shirt.jpg'),
    (6, 2, 'Sneakers', 'Lightweight sneakers for daily movement.', 'shoes', 500.00, 25, '/images/products/sneakers.jpg'),

    (7, 3, 'Comfort Fit Pants', 'Comfort-first pants for long days.', 'pants', 280.00, 30, '/images/products/comfort-fit-pants.jpg'),
    (8, 3, 'Printed T-Shirt', 'A bright printed cotton tee.', 'shirts', 200.00, 35, '/images/products/printed-t-shirt.jpg'),
    (9, 3, 'School Shoes', 'Durable school shoes built for every term.', 'shoes', 450.00, 30, '/images/products/school-shoes.jpg'),

    (10, 4, 'Kids Pants', 'Play-ready pants with a comfortable fit.', 'pants', 150.00, 40, '/images/products/kids-pants.jpg'),
    (11, 4, 'Graphic Tee', 'A fun graphic tee for everyday outfits.', 'shirts', 180.00, 40, '/images/products/graphic-tee.jpg'),
    (12, 4, 'Sandals', 'Lightweight sandals for sunny days.', 'shoes', 220.00, 30, '/images/products/sandals.jpg'),

    (13, 5, 'Jogger Pants', 'Relaxed joggers with a polished finish.', 'pants', 320.00, 30, '/images/products/jogger-pants.jpg'),
    (14, 5, 'Casual Shirt', 'An easy shirt for weekday layering.', 'shirts', 270.00, 30, '/images/products/casual-shirt.jpg'),
    (15, 5, 'Canvas Shoes', 'Versatile canvas shoes for daily wear.', 'shoes', 350.00, 30, '/images/products/canvas-shoes.jpg'),

    (16, 6, 'Designer Pants', 'Tailored statement pants from a local edit.', 'pants', 500.00, 20, '/images/products/designer-pants.jpg'),
    (17, 6, 'Silk Shirt', 'A softly draped silk shirt for occasion dressing.', 'shirts', 450.00, 20, '/images/products/silk-shirt.jpg'),
    (18, 6, 'Luxury Shoes', 'Polished shoes for elevated evenings.', 'shoes', 800.00, 15, '/images/products/luxury-shoes.jpg');

UPDATE products SET image_url = CASE product_id
    WHEN 1 THEN '/images/products/mud-denim.jpg'
    WHEN 2 THEN '/images/products/mud-shirt.jpg'
    WHEN 3 THEN '/images/products/mud-shoes.jpg'
    WHEN 4 THEN '/images/products/jets-pants.jpg'
    WHEN 5 THEN '/images/products/jets-shirt.jpg'
    WHEN 6 THEN '/images/products/jets-sneakers.jpg'
    WHEN 7 THEN '/images/products/bata-pants.jpg'
    WHEN 8 THEN '/images/products/bata-tshirt.jpg'
    WHEN 9 THEN '/images/products/bata-schoolshoes.jpg'
    WHEN 10 THEN '/images/products/pep-kidspants.jpg'
    WHEN 11 THEN '/images/products/pep-graphictee.jpg'
    WHEN 12 THEN '/images/products/pep-sandals.jpg'
    WHEN 13 THEN '/images/products/mrprice-joggers.jpg'
    WHEN 14 THEN '/images/products/mrprice-shirt.jpg'
    WHEN 15 THEN '/images/products/mrprice-canvas.jpg'
    WHEN 16 THEN '/images/products/fg-designerpants.jpg'
    WHEN 17 THEN '/images/products/fg-silkshirt.jpg'
    WHEN 18 THEN '/images/products/fg-luxuryshoes.jpg'
END;

INSERT INTO deals (deal_id, product_id, discount_percentage, expiry_date) VALUES
    (1, 1, 20.00, DATE_ADD(NOW(), INTERVAL 6 HOUR)),
    (2, 3, 15.00, DATE_ADD(NOW(), INTERVAL 6 HOUR)),
    (3, 6, 20.00, DATE_ADD(NOW(), INTERVAL 6 HOUR)),
    (4, 8, 20.00, DATE_ADD(NOW(), INTERVAL 6 HOUR)),
    (5, 12, 15.00, DATE_ADD(NOW(), INTERVAL 6 HOUR)),
    (6, 14, 20.00, DATE_ADD(NOW(), INTERVAL 6 HOUR)),
    (7, 17, 25.00, DATE_ADD(NOW(), INTERVAL 6 HOUR));

-- Optional verification queries:
-- SELECT * FROM stores;
-- SELECT s.name AS store_name, p.name AS product_name, p.price, p.stock
-- FROM products p JOIN stores s ON s.store_id = p.store_id ORDER BY s.store_id, p.product_id;
-- SELECT d.*, p.name AS product_name FROM deals d JOIN products p ON p.product_id = d.product_id;