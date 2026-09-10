-- Zamglam database snapshot
--
-- Restore with:  mysql -u root < database/snapshot/zamglam_db.sql
--
-- REDACTED for a public repository:
--   * every password hash replaced with the hash of "Demo123456"
--   * real personal email addresses replaced with *@example.local
--   * the documents table (seller ID/licence uploads) excluded entirely
--
-- Seeded demo accounts keep the passwords documented in backend/src/seed.js.
-- To build a fresh dataset instead of restoring this, run: npm run seed
--

-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: zamglam_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `zamglam_db`
--

/*!40000 DROP DATABASE IF EXISTS `zamglam_db`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `zamglam_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `zamglam_db`;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role_level` varchar(30) NOT NULL DEFAULT 'manager',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,NULL,'Zamglam Admin','admin@zamglam.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','manager','2026-09-04 08:32:20');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cart_customer_product` (`customer_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'General','Zamglam products','2026-08-21 14:36:26'),(2,'Dresses','Various dress styles','2026-09-03 23:20:20'),(3,'Pants','Trousers and jeans','2026-09-03 23:20:20'),(4,'Shoes','Footwear collection','2026-09-03 23:20:20'),(5,'Jackets','Outerwear and jackets','2026-09-03 23:20:20'),(6,'Accessories','Bags, belts, and more','2026-09-03 23:20:20'),(7,'clothes','clothes products','2026-09-04 01:51:53');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courier`
--

DROP TABLE IF EXISTS `courier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courier` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `driver_name` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `distance` varchar(100) DEFAULT NULL,
  `direction` varchar(255) DEFAULT NULL,
  `status` varchar(30) DEFAULT 'assigned',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `driver_phone` varchar(50) DEFAULT NULL,
  `courier_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `courier_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courier`
--

LOCK TABLES `courier` WRITE;
/*!40000 ALTER TABLE `courier` DISABLE KEYS */;
INSERT INTO `courier` VALUES (1,1,'Joseph Banda',35.00,'3.0 km','Zamglam store → Lusaka','delivered','2026-09-03 23:23:55',NULL,NULL),(4,4,'Mwansa Phiri',50.00,'6.0 km','Zamglam store → Lusaka','in_transit','2026-09-04 00:07:45',NULL,NULL),(5,5,'Joseph Banda',55.00,'7.0 km','Zamglam store → Lusaka','delivered','2026-09-04 00:11:28',NULL,NULL),(6,6,'Mwansa Phiri',60.00,'8.0 km','Zamglam store → Lusaka','delivered','2026-09-04 00:31:11','+260-970-111-001',1),(7,7,'Thandiwe Zulu',65.00,'9.0 km','Zamglam store → Lusaka','in_transit','2026-09-04 00:36:59','+260-970-111-002',2),(8,8,'Joseph Banda',70.00,'10.0 km','Zamglam store → Lusaka','delivered','2026-09-04 00:49:48','+260-970-111-003',3),(55,57,NULL,27.50,'1.5 km','Lusaka, Zambia → Lusaka','awaiting_pickup','2026-09-09 14:44:25',NULL,NULL);
/*!40000 ALTER TABLE `courier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `couriers`
--

DROP TABLE IF EXISTS `couriers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `couriers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `vehicle` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `on_shift` tinyint(1) NOT NULL DEFAULT 0,
  `shift_changed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `couriers`
--

LOCK TABLES `couriers` WRITE;
/*!40000 ALTER TABLE `couriers` DISABLE KEYS */;
INSERT INTO `couriers` VALUES (1,NULL,'Mwansa Phiri','mwansa@zamglamcourier.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','+260-970-111-001',NULL,1,'2026-09-04 00:30:02',1,'2026-09-04 10:51:43'),(2,NULL,'Thandiwe Zulu','thandiwe@zamglamcourier.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','+260-970-111-002',NULL,1,'2026-09-04 00:30:03',1,NULL),(3,NULL,'Joseph Banda','joseph@zamglamcourier.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','+260-970-111-003',NULL,1,'2026-09-04 00:30:03',1,'2026-09-04 10:07:34');
/*!40000 ALTER TABLE `couriers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `city` varchar(120) DEFAULT NULL,
  `country` varchar(120) NOT NULL DEFAULT 'Zambia',
  `preferred_currency` varchar(10) NOT NULL DEFAULT 'ZMW',
  `newsletter_opt_in` tinyint(1) NOT NULL DEFAULT 1,
  `marketing_opt_in` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `location` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Kelly Mbuyu','shopper1@example.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','','',NULL,'Zambia','ZMW',1,0,1,'2026-09-03 19:41:48','2026-09-03 19:41:48',NULL),(2,'Kelly1','shopper3@example.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','','',NULL,'Zambia','ZMW',1,0,1,'2026-09-03 19:41:48','2026-09-03 19:41:48',NULL),(3,'Kelly Mbuyu','shopper2@example.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','Lusaka','0973649042','Lusaka','Zambia','ZMW',1,0,1,'2026-09-03 22:00:21','2026-09-03 22:00:21',NULL),(4,'John Doe','customer@zamglam.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','','+260-123456789',NULL,'Zambia','ZMW',1,0,1,'2026-09-03 23:21:06','2026-09-03 23:21:06','');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,2,350.00),(2,1,2,1,250.00),(5,4,4,2,400.00),(6,4,6,1,500.00),(7,5,14,1,270.00),(8,5,13,1,320.00),(9,5,6,1,500.00),(10,6,5,1,300.00),(11,7,8,1,200.00),(12,8,1,1,350.00),(13,8,6,1,500.00),(14,8,9,1,450.00),(15,8,30,1,220.00),(70,57,1,1,350.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `shipment_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

LOCK TABLES `order_status_history` WRITE;
/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
INSERT INTO `order_status_history` VALUES (1,1,'placed','Paid with Airtel Money.','2026-09-03 23:23:55',NULL),(2,1,'processing',NULL,'2026-09-03 23:27:34',NULL),(3,1,'shipped',NULL,'2026-09-03 23:28:34',NULL),(4,1,'delivered',NULL,'2026-09-03 23:28:34',NULL),(7,4,'placed','Paid with MTN MoMo.','2026-09-04 00:07:45',NULL),(8,4,'processing',NULL,'2026-09-04 00:07:46',NULL),(9,5,'placed','Paid with Airtel Money.','2026-09-04 00:11:28',NULL),(10,4,'shipped',NULL,'2026-09-04 00:13:15',NULL),(11,5,'processing',NULL,'2026-09-04 00:13:19',NULL),(12,5,'shipped',NULL,'2026-09-04 00:13:22',NULL),(13,5,'delivered',NULL,'2026-09-04 00:15:45',NULL),(14,6,'placed','Paid with Airtel Money.','2026-09-04 00:31:11',NULL),(15,6,'shipped',NULL,'2026-09-04 00:31:33',NULL),(16,6,'delivered',NULL,'2026-09-04 00:31:34',NULL),(17,7,'placed','Paid with MTN MoMo.','2026-09-04 00:36:59',NULL),(18,8,'placed','Paid with Airtel Money.','2026-09-04 00:49:48',NULL),(19,7,'shipped',NULL,'2026-09-04 01:03:58',NULL),(20,8,'processing',NULL,'2026-09-04 01:17:59',7),(21,8,'shipped',NULL,'2026-09-04 01:21:22',7),(22,8,'delivered',NULL,'2026-09-04 01:21:24',7),(61,8,'processing',NULL,'2026-09-04 02:09:11',8),(62,8,'shipped',NULL,'2026-09-04 02:09:15',8),(63,8,'delivered',NULL,'2026-09-04 02:15:55',8),(67,8,'processing',NULL,'2026-09-04 08:05:52',10),(69,8,'shipped',NULL,'2026-09-04 09:07:34',10),(77,4,'shipped','Unclaimed for 1 minutes — assigned to Mwansa Phiri.','2026-09-04 09:54:16',2),(83,4,'shipped','Unclaimed for 60 minutes — assigned to Mwansa Phiri.','2026-09-04 10:00:06',2),(84,8,'delivered',NULL,'2026-09-04 10:09:45',10),(91,57,'placed','Paid with Airtel Money.','2026-09-09 14:44:25',NULL);
/*!40000 ALTER TABLE `order_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `address` varchar(255) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `payment_method` varchar(30) DEFAULT NULL,
  `total_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `items_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `delivery_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,4,NULL,NULL,'delivered','2026-09-03 23:23:55','12 Kabulonga Rd','Lusaka','0977011101','airtel_money',950.00,950.00,0.00),(4,4,NULL,NULL,'picked_up','2026-09-04 00:07:45','9 Great East Rd','Lusaka','0966554433','mtn_momo',1300.00,1300.00,0.00),(5,4,NULL,NULL,'delivered','2026-09-04 00:11:28','Kelly Mbuyu','Lusaka','+260973649042','airtel_money',1090.00,1090.00,0.00),(6,4,NULL,NULL,'delivered','2026-09-04 00:31:11','77 Independence Ave','Lusaka','0977001122','airtel_money',300.00,300.00,0.00),(7,4,NULL,NULL,'picked_up','2026-09-04 00:36:59','3 Kafue Rd','Lusaka','0966777888','mtn_momo',200.00,200.00,0.00),(8,4,NULL,NULL,'placed','2026-09-04 00:49:48','MULTIPLE STORES','Lusaka','+260973649042','airtel_money',1520.00,1520.00,0.00),(57,4,NULL,NULL,'placed','2026-09-09 14:44:25','Kelly Mbuyu','Lusaka','+260973649042','airtel_money',377.50,350.00,27.50);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `method` varchar(30) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` varchar(30) DEFAULT 'pending',
  `transaction_ref` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_ref` (`transaction_ref`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,'mobile_money',950.00,'successful','zg-1-1788477835596','2026-09-03 23:23:55'),(4,4,'mobile_money',1300.00,'successful','zg-4-1788480465038','2026-09-04 00:07:45'),(5,5,'mobile_money',1090.00,'successful','zg-5-1788480688817','2026-09-04 00:11:28'),(6,6,'mobile_money',300.00,'successful','zg-6-1788481871483','2026-09-04 00:31:11'),(7,7,'mobile_money',200.00,'successful','zg-7-1788482219038','2026-09-04 00:36:59'),(8,8,'mobile_money',1520.00,'successful','zg-8-1788482988798','2026-09-04 00:49:48'),(57,57,'mobile_money',377.50,'successful','zg-57-1788965065853','2026-09-09 14:44:25');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seller_id` int(11) NOT NULL,
  `store_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `image_url` varchar(500) DEFAULT NULL,
  `audience` varchar(50) DEFAULT 'unisex',
  `sizes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`sizes`)),
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  PRIMARY KEY (`id`),
  KEY `seller_id` (`seller_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,2,1,3,'Classic Denim Pants','Everyday denim with a comfortable straight fit.',350.00,35,'/images/products/mud-denim.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL),(2,2,1,1,'Casual Cotton Shirt','Soft cotton shirt for easy everyday dressing.',250.00,27,'/images/products/mud-shirt.jpg','women','[\"XS\",\"S\",\"M\",\"L\"]',NULL),(3,2,1,4,'Leather Shoes','Polished leather shoes for work and weekends.',600.00,24,'/images/products/mud-shoes.jpg','unisex','[\"6\",\"7\",\"8\",\"9\",\"10\"]',NULL),(4,3,2,3,'Slim Fit Pants','Clean slim-fit pants with everyday stretch.',400.00,34,'/images/products/jets-pants.jpg','men','[\"28\",\"30\",\"32\",\"34\",\"36\"]',NULL),(5,3,2,7,'Formal White Shirt','Crisp white shirt for formal occasions.',150.00,23,'/images/products/jets-shirt.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL),(6,3,2,4,'Sneakers','Lightweight sneakers for daily movement.',500.00,21,'/images/products/jets-sneakers.jpg','unisex','[\"6\",\"7\",\"8\",\"9\",\"10\"]',NULL),(7,4,3,3,'Comfort Fit Pants','Comfort-first pants for long days.',280.00,26,'/images/products/bata-pants.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL),(8,4,3,1,'Printed T-Shirt','A bright printed cotton tee.',200.00,33,'/images/products/bata-tshirt.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL),(9,4,3,4,'School Shoes','Durable school shoes built for every term.',450.00,28,'/images/products/bata-schoolshoes.jpg','kids','[\"1\",\"2\",\"3\",\"4\",\"5\"]',NULL),(10,5,4,3,'Kids Pants','Play-ready pants with a comfortable fit.',150.00,39,'/images/products/pep-kidspants.jpg','kids','[\"2\",\"4\",\"6\",\"8\",\"10\"]',NULL),(11,5,4,1,'Graphic Tee','A fun graphic tee for everyday outfits.',180.00,39,'/images/products/pep-graphictee.jpg','kids','[\"2\",\"4\",\"6\",\"8\",\"10\"]',NULL),(13,6,5,3,'Jogger Pants','Relaxed joggers with a polished finish.',320.00,28,'/images/products/mrprice-joggers.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL),(14,6,5,1,'Casual Shirt','An easy shirt for weekday layering.',270.00,28,'/images/products/mrprice-shirt.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL),(15,6,5,4,'Canvas Shoes','Versatile canvas shoes for daily wear.',350.00,29,'/images/products/mrprice-canvas.jpg','unisex','[\"6\",\"7\",\"8\",\"9\",\"10\"]',NULL),(16,7,6,3,'Designer Pants','Tailored statement pants from a local edit.',500.00,19,'/images/products/fg-designerpants.jpg','women','[\"S\",\"M\",\"L\",\"XL\"]',NULL),(17,7,6,1,'Silk Shirt','A softly draped silk shirt for occasion dressing.',450.00,19,'/images/products/fg-silkshirt.jpg','women','[\"S\",\"M\",\"L\",\"XL\"]',NULL),(18,7,6,4,'Luxury Shoes','Polished shoes for elevated evenings.',800.00,14,'/images/products/fg-luxuryshoes.jpg','women','[\"6\",\"7\",\"8\",\"9\",\"10\"]',NULL),(30,5,4,4,'Sandals','Lightweight sandals for sunny days.',220.00,28,'/images/products/pep-sandals.jpg','kids','[\"1\",\"2\",\"3\",\"4\",\"5\"]',NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seller_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `reply` text DEFAULT NULL,
  `replied_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_review_customer_order_seller` (`customer_id`,`order_id`,`seller_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,2,4,1,5,'Great denim, fast delivery.','Thank you!','2026-09-04 11:25:59','2026-09-04 11:25:59'),(4,2,4,8,5,NULL,NULL,NULL,'2026-09-04 13:06:32'),(5,3,4,8,5,NULL,NULL,NULL,'2026-09-04 13:06:41');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sellers`
--

DROP TABLE IF EXISTS `sellers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sellers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `shop_name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `verification_status` varchar(20) NOT NULL DEFAULT 'pending',
  `verified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sellers`
--

LOCK TABLES `sellers` WRITE;
/*!40000 ALTER TABLE `sellers` DISABLE KEYS */;
INSERT INTO `sellers` VALUES (1,'kelly boss','seller1@example.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','kelly boss\'s store','0973649042','pending',NULL),(2,'Mud','mud@zamglam.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','Mud\'s store','+260-495908110','verified','2026-09-04 09:54:10'),(3,'Jets','jets@zamglam.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','Jets\'s store','+260-384788406','verified','2026-09-04 09:54:10'),(4,'Bata','bata@zamglam.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','Bata\'s store','+260-453090242','verified','2026-09-04 09:54:10'),(5,'Pep','pep@zamglam.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','Pep\'s store','+260-475417424','verified','2026-09-04 09:54:10'),(6,'Mr Price Zambia','mrprice@zamglam.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','Mr Price Zambia\'s store','+260-756286477','verified','2026-09-04 09:54:10'),(7,'Fashions Galore','fashionsgalore@zamglam.local','$2b$10$Yw8QeQXk9Zr1oQ4mFZs0iu9wJXeQ0oV3Yb1nQ2xK5rZ8tS7uL6mCe','Fashions Galore\'s store','+260-946071420','verified','2026-09-04 09:54:10');
/*!40000 ALTER TABLE `sellers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipments`
--

DROP TABLE IF EXISTS `shipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shipments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'placed',
  `courier_id` int(11) DEFAULT NULL,
  `driver_name` varchar(255) DEFAULT NULL,
  `driver_phone` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `distance` varchar(100) DEFAULT NULL,
  `direction` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `released_at` timestamp NULL DEFAULT NULL,
  `escalated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shipment_order_seller` (`order_id`,`seller_id`),
  CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipments`
--

LOCK TABLES `shipments` WRITE;
/*!40000 ALTER TABLE `shipments` DISABLE KEYS */;
INSERT INTO `shipments` VALUES (1,1,2,'delivered',NULL,'Joseph Banda',NULL,35.00,'3.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-03 23:23:55',NULL),(2,4,3,'picked_up',1,'Mwansa Phiri',NULL,50.00,'6.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-04 00:07:45','2026-09-04 10:00:06'),(3,5,6,'delivered',NULL,'Joseph Banda',NULL,55.00,'7.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-04 00:11:28',NULL),(4,5,3,'delivered',NULL,'Joseph Banda',NULL,55.00,'7.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-04 00:11:28',NULL),(5,6,3,'delivered',1,'Mwansa Phiri','+260-970-111-001',60.00,'8.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-04 00:31:11',NULL),(6,7,4,'picked_up',2,'Thandiwe Zulu','+260-970-111-002',65.00,'9.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-04 00:36:59',NULL),(7,8,2,'delivered',3,'Joseph Banda','+260-970-111-003',70.00,'10.0 km','Zamglam store → Lusaka','2026-09-04 01:17:25','2026-09-04 00:49:48',NULL),(8,8,3,'delivered',3,'Joseph Banda','+260-970-111-003',70.00,'10.0 km','Zamglam store → Lusaka','2026-09-04 01:17:25','2026-09-04 00:49:48',NULL),(9,8,4,'placed',3,'Joseph Banda','+260-970-111-003',70.00,'10.0 km','Zamglam store → Lusaka','2026-09-04 01:17:25',NULL,NULL),(10,8,5,'delivered',3,'Joseph Banda','+260-970-111-003',70.00,'10.0 km','Zamglam store → Lusaka','2026-09-04 01:17:25','2026-09-04 00:49:48',NULL),(65,57,2,'placed',NULL,NULL,NULL,27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-09-09 14:44:25',NULL,NULL);
/*!40000 ALTER TABLE `shipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seller_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `open_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`open_hours`)),
  `status` varchar(20) DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stores_seller` (`seller_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (1,2,'Mud','Official Mud store','/images/logos/mud.png','Lusaka, Zambia','{\"open\":\"09:00\",\"close\":\"18:00\"}','open','2026-09-03 23:21:06'),(2,3,'Jets','Official Jets store','/images/logos/jets.png','Lusaka, Zambia','{\"open\":\"08:00\",\"close\":\"19:00\"}','open','2026-09-03 23:21:06'),(3,4,'Bata','Official Bata store','/images/logos/bata.png','Lusaka, Zambia','{\"open\":\"10:00\",\"close\":\"20:00\"}','open','2026-09-03 23:21:06'),(4,5,'Pep','Official Pep store','/images/logos/pep.png','Lusaka, Zambia','{\"open\":\"08:00\",\"close\":\"18:00\"}','open','2026-09-03 23:21:06'),(5,6,'Mr Price Zambia','Official Mr Price Zambia store','/images/logos/mrprice.png','Lusaka, Zambia','{\"open\":\"09:00\",\"close\":\"19:00\"}','open','2026-09-03 23:21:06'),(6,7,'Fashions Galore','Official Fashions Galore store','/images/logos/fashionsgalore.png','Lusaka, Zambia','{\"open\":\"09:00\",\"close\":\"18:00\"}','open','2026-09-03 23:21:06');
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','customer','seller') NOT NULL DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'zamglam_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-10  6:49:56
