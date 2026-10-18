-- Zamglam demo database: the shops, products, orders, deliveries and chats from the
-- team's working copy, cleaned for a public repository.
--
--   * every account (shopper, shop, courier, admin) signs in with the password 123456789
--   * personal accounts are replaced by demo ones: shopperN@zamglam.local, demoseller@zamglam.local
--   * customer names, phones and delivery addresses are placeholders
--   * uploaded ID/licence documents are not included
--
-- Load it with:  npm run db:import   (from the project folder; backs up your current database first)
-- By hand:       mysql -u root zamglam_db < database/snapshot/zamglam_db.sql
-- Product images come from frontend/public/images, so nothing else needs copying.
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
INSERT INTO `admins` VALUES (1,NULL,'Zamglam Admin','admin@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','manager','2026-09-04 08:32:20');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
INSERT INTO `cart` VALUES (1,4,1,2,'2026-09-15 06:50:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courier`
--

LOCK TABLES `courier` WRITE;
/*!40000 ALTER TABLE `courier` DISABLE KEYS */;
INSERT INTO `courier` VALUES (1,1,'Joseph Banda',35.00,'3.0 km','Zamglam store → Lusaka','delivered','2026-09-03 23:23:55',NULL,NULL),(4,4,'Mwansa Phiri',50.00,'6.0 km','Zamglam store → Lusaka','delivered','2026-09-04 00:07:45',NULL,NULL),(5,5,'Joseph Banda',55.00,'7.0 km','Zamglam store → Lusaka','delivered','2026-09-04 00:11:28',NULL,NULL),(6,6,'Mwansa Phiri',60.00,'8.0 km','Zamglam store → Lusaka','delivered','2026-09-04 00:31:11','+260-970-111-001',1),(7,7,'Thandiwe Zulu',65.00,'9.0 km','Zamglam store → Lusaka','delivered','2026-09-04 00:36:59','+260-970-111-002',2),(8,8,'Joseph Banda',70.00,'10.0 km','Zamglam store → Lusaka','delivered','2026-09-04 00:49:48','+260-970-111-003',3),(55,57,'Mwansa Phiri',27.50,'1.5 km','Lusaka, Zambia → Lusaka','delivered','2026-09-09 14:44:25','+260-970-111-001',1),(57,59,'Mwansa Phiri',27.50,'1.5 km','Lusaka, Zambia → LUSAKA','delivered','2026-09-15 00:12:58','+260-970-111-001',1),(58,60,'Mwansa Phiri',27.50,'1.5 km','Lusaka, Zambia → Lusaka','delivered','2026-09-15 00:23:02','+260-970-111-001',1),(59,61,'Mwansa Phiri',27.50,'1.5 km','Lusaka, Zambia → Lusaka','delivered','2026-09-15 00:23:59','+260-970-111-001',1),(60,62,'Thandiwe Zulu',27.50,'1.5 km','Lusaka, Zambia → Lusaka','delivered','2026-09-15 00:25:02','+260-970-111-002',2),(61,63,'Thandiwe Zulu',27.50,'1.5 km','Lusaka, Zambia → Lusaka','delivered','2026-09-15 00:25:26','+260-970-111-002',2),(62,64,'Mwansa Phiri',27.50,'1.5 km','Lusaka, Zambia → Lusaka','delivered','2026-09-15 11:24:23','+260-970-111-001',1),(63,65,'Mwansa Phiri',27.50,'1.5 km','Lusaka, Zambia → Lusaka','delivered','2026-09-15 11:33:34','+260-970-111-001',1),(64,66,'Joseph Banda',27.50,'1.5 km','Lusaka, Zambia → Lusaka ','delivered','2026-10-16 13:21:26','+260-970-111-003',3),(65,67,'Joseph Banda',27.50,'1.5 km','Lusaka, Zambia → Lusaka','delivered','2026-10-17 10:00:28','+260-970-111-003',3),(66,68,NULL,27.50,'1.5 km','Lusaka, Zambia → Lusaka','awaiting_pickup','2026-10-17 12:14:06',NULL,NULL),(67,69,'Thandiwe Zulu',27.50,'1.5 km','Lusaka, Zambia → Lusaka','delivered','2026-10-17 13:22:18','+260-970-111-002',2);
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
  `approval_status` varchar(20) NOT NULL DEFAULT 'pending',
  `approved_at` timestamp NULL DEFAULT NULL,
  `account_status` varchar(20) NOT NULL DEFAULT 'active',
  `suspended_at` timestamp NULL DEFAULT NULL,
  `suspension_reason` varchar(255) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `terms_accepted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `couriers`
--

LOCK TABLES `couriers` WRITE;
/*!40000 ALTER TABLE `couriers` DISABLE KEYS */;
INSERT INTO `couriers` VALUES (1,NULL,'Mwansa Phiri','mwansa@zamglamcourier.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','+260-970-111-001',NULL,1,'2026-09-04 00:30:02',1,'2026-09-15 11:34:12','approved','2026-09-15 00:23:59','active',NULL,NULL,NULL,NULL),(2,NULL,'Thandiwe Zulu','thandiwe@zamglamcourier.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','+260-970-111-002',NULL,1,'2026-09-04 00:30:03',1,'2026-10-17 13:24:44','approved','2026-09-14 21:46:25','active',NULL,NULL,NULL,NULL),(3,NULL,'Joseph Banda','joseph@zamglamcourier.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','+260-970-111-003',NULL,1,'2026-09-04 00:30:03',1,'2026-10-17 10:01:21','approved','2026-09-14 21:46:25','active',NULL,NULL,NULL,NULL);
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
  `account_status` varchar(20) NOT NULL DEFAULT 'active',
  `suspended_at` timestamp NULL DEFAULT NULL,
  `suspension_reason` varchar(255) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `terms_accepted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Demo Shopper 1','shopper1@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','1 Demo Road','+260-970-000-001','Lusaka','Zambia','ZMW',1,0,1,'2026-09-03 19:41:48','2026-10-18 21:28:00','Lusaka','active',NULL,NULL,'2026-10-16 14:00:53',NULL),(2,'Demo Shopper 2','shopper2@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','2 Demo Road','+260-970-000-002','Lusaka','Zambia','ZMW',1,0,1,'2026-09-03 19:41:48','2026-10-18 21:28:00','Lusaka','active',NULL,NULL,'2026-10-16 14:00:15',NULL),(3,'Demo Shopper 3','shopper3@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','3 Demo Road','+260-970-000-003','Lusaka','Zambia','ZMW',1,0,1,'2026-09-03 22:00:21','2026-10-18 21:28:00','Lusaka','active',NULL,NULL,'2026-10-16 14:00:20',NULL),(4,'John Doe','customer@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','4 Demo Road','+260-123456789','Lusaka','Zambia','ZMW',1,0,1,'2026-09-03 23:21:06','2026-10-18 21:28:38','','active',NULL,NULL,NULL,NULL),(8,'Demo Shopper 8','shopper8@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','8 Demo Road','+260-970-000-008','Lusaka','Zambia','ZMW',1,0,1,'2026-10-16 12:06:14','2026-10-18 21:28:00','Lusaka','active',NULL,NULL,NULL,'2026-10-16 12:06:14'),(9,'Demo Shopper 9','shopper9@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','9 Demo Road','+260-970-000-009','Lusaka','Zambia','ZMW',1,0,1,'2026-10-16 13:20:22','2026-10-18 21:28:00','Lusaka','active',NULL,NULL,NULL,'2026-10-16 13:20:22');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `url` varchar(500) NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `seller_id` int(11) DEFAULT NULL,
  `doc_number` varchar(100) DEFAULT NULL,
  `review_note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,2,350.00),(2,1,2,1,250.00),(5,4,4,2,400.00),(6,4,6,1,500.00),(7,5,14,1,270.00),(8,5,13,1,320.00),(9,5,6,1,500.00),(10,6,5,1,300.00),(11,7,8,1,200.00),(12,8,1,1,350.00),(13,8,6,1,500.00),(14,8,9,1,450.00),(15,8,30,1,220.00),(70,57,1,1,350.00),(72,59,1,1,350.00),(73,60,1,1,350.00),(74,61,1,1,350.00),(75,62,1,1,350.00),(76,63,1,1,350.00),(77,64,1,1,350.00),(78,64,2,1,250.00),(79,65,2,1,250.00),(80,66,1,1,350.00),(81,67,2,1,250.00),(82,67,3,1,600.00),(83,68,3,1,600.00),(84,68,2,1,250.00),(85,69,1,1,350.00),(86,69,2,1,250.00),(87,69,3,1,600.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=189 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

LOCK TABLES `order_status_history` WRITE;
/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
INSERT INTO `order_status_history` VALUES (1,1,'placed','Paid with Airtel Money.','2026-09-03 23:23:55',NULL),(2,1,'processing',NULL,'2026-09-03 23:27:34',NULL),(3,1,'shipped',NULL,'2026-09-03 23:28:34',NULL),(4,1,'delivered',NULL,'2026-09-03 23:28:34',NULL),(7,4,'placed','Paid with MTN MoMo.','2026-09-04 00:07:45',NULL),(8,4,'processing',NULL,'2026-09-04 00:07:46',NULL),(9,5,'placed','Paid with Airtel Money.','2026-09-04 00:11:28',NULL),(10,4,'shipped',NULL,'2026-09-04 00:13:15',NULL),(11,5,'processing',NULL,'2026-09-04 00:13:19',NULL),(12,5,'shipped',NULL,'2026-09-04 00:13:22',NULL),(13,5,'delivered',NULL,'2026-09-04 00:15:45',NULL),(14,6,'placed','Paid with Airtel Money.','2026-09-04 00:31:11',NULL),(15,6,'shipped',NULL,'2026-09-04 00:31:33',NULL),(16,6,'delivered',NULL,'2026-09-04 00:31:34',NULL),(17,7,'placed','Paid with MTN MoMo.','2026-09-04 00:36:59',NULL),(18,8,'placed','Paid with Airtel Money.','2026-09-04 00:49:48',NULL),(19,7,'shipped',NULL,'2026-09-04 01:03:58',NULL),(20,8,'processing',NULL,'2026-09-04 01:17:59',7),(21,8,'shipped',NULL,'2026-09-04 01:21:22',7),(22,8,'delivered',NULL,'2026-09-04 01:21:24',7),(61,8,'processing',NULL,'2026-09-04 02:09:11',8),(62,8,'shipped',NULL,'2026-09-04 02:09:15',8),(63,8,'delivered',NULL,'2026-09-04 02:15:55',8),(67,8,'processing',NULL,'2026-09-04 08:05:52',10),(69,8,'shipped',NULL,'2026-09-04 09:07:34',10),(77,4,'shipped','Unclaimed for 1 minutes — assigned to Mwansa Phiri.','2026-09-04 09:54:16',2),(83,4,'shipped','Unclaimed for 60 minutes — assigned to Mwansa Phiri.','2026-09-04 10:00:06',2),(84,8,'delivered',NULL,'2026-09-04 10:09:45',10),(91,57,'placed','Paid with Airtel Money.','2026-09-09 14:44:25',NULL),(92,4,'delivered',NULL,'2026-09-10 14:30:10',2),(93,57,'processing',NULL,'2026-09-14 21:27:54',65),(94,57,'shipped',NULL,'2026-09-14 21:27:56',65),(95,57,'picked_up','Collected by Mwansa Phiri.','2026-09-14 21:31:40',65),(96,57,'delivered',NULL,'2026-09-14 21:32:12',65),(106,59,'placed','Paid with Airtel Money.','2026-09-15 00:12:58',NULL),(107,59,'processing',NULL,'2026-09-15 00:15:43',67),(108,59,'shipped',NULL,'2026-09-15 00:15:54',67),(109,59,'pickup_requested','Mwansa Phiri is collecting this parcel; waiting for the shop to confirm.','2026-09-15 00:18:14',67),(110,59,'shipped','Mwansa Phiri did not collect the parcel (had an emergency ). It is back with the shop and open to other couriers.','2026-09-15 00:22:28',67),(111,59,'pickup_requested','Mwansa Phiri is collecting this parcel; waiting for the shop to confirm.','2026-09-15 00:22:46',67),(112,60,'placed','Paid with cash.','2026-09-15 00:23:02',NULL),(113,60,'processing',NULL,'2026-09-15 00:23:02',68),(114,60,'shipped',NULL,'2026-09-15 00:23:02',68),(115,60,'pickup_requested','Mwansa Phiri is collecting this parcel; waiting for the shop to confirm.','2026-09-15 00:23:02',68),(116,60,'picked_up','Shop confirmed handover to Mwansa Phiri.','2026-09-15 00:23:03',68),(117,59,'picked_up','Shop confirmed handover to Mwansa Phiri.','2026-09-15 00:23:09',67),(118,61,'placed','Paid with cash.','2026-09-15 00:23:59',NULL),(119,61,'processing',NULL,'2026-09-15 00:23:59',69),(120,61,'shipped',NULL,'2026-09-15 00:23:59',69),(121,61,'pickup_requested','Mwansa Phiri is collecting this parcel; waiting for the shop to confirm.','2026-09-15 00:23:59',69),(122,61,'picked_up','Shop confirmed handover to Mwansa Phiri.','2026-09-15 00:23:59',69),(123,61,'delivered',NULL,'2026-09-15 00:24:31',69),(124,59,'delivered',NULL,'2026-09-15 00:24:34',67),(125,60,'delivered',NULL,'2026-09-15 00:24:36',68),(126,62,'placed','Paid with cash.','2026-09-15 00:25:02',NULL),(127,62,'processing',NULL,'2026-09-15 00:25:02',70),(128,62,'shipped',NULL,'2026-09-15 00:25:02',70),(129,62,'pickup_requested','Mwansa Phiri is collecting this parcel; waiting for the shop to confirm.','2026-09-15 00:25:02',70),(130,62,'shipped','Mwansa Phiri did not collect the parcel (The rider never arrived). It is back with the shop and open to other couriers.','2026-09-15 00:25:02',70),(131,63,'placed','Paid with cash.','2026-09-15 00:25:26',NULL),(132,63,'processing',NULL,'2026-09-15 00:25:26',71),(133,63,'shipped',NULL,'2026-09-15 00:25:26',71),(134,63,'pickup_requested','Mwansa Phiri is collecting this parcel; waiting for the shop to confirm.','2026-09-15 00:25:26',71),(135,63,'shipped','Mwansa Phiri did not collect the parcel (The rider never arrived). It is back with the shop and open to other couriers.','2026-09-15 00:25:26',71),(136,62,'pickup_requested','Thandiwe Zulu is collecting this parcel; waiting for the shop to confirm.','2026-09-15 00:48:56',70),(137,7,'delivered',NULL,'2026-09-15 00:48:58',6),(138,63,'pickup_requested','Thandiwe Zulu is collecting this parcel; waiting for the shop to confirm.','2026-09-15 00:49:06',71),(139,62,'picked_up','Shop confirmed handover to Thandiwe Zulu.','2026-09-15 00:49:28',70),(140,63,'picked_up','Shop confirmed handover to Thandiwe Zulu.','2026-09-15 00:49:29',71),(141,62,'delivered',NULL,'2026-09-15 00:50:00',70),(142,63,'delivered',NULL,'2026-09-15 00:50:01',71),(143,63,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:00:50',71),(144,62,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:00:59',70),(145,61,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:01',69),(146,60,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:02',68),(147,59,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:02',67),(148,57,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:03',65),(149,8,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:04',7),(150,8,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:04',8),(151,8,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:05',10),(152,7,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:06',6),(153,6,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:08',5),(154,5,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:10',3),(155,5,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:11',4),(156,4,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:12',2),(157,1,'confirmed','Customer confirmed they received this parcel.','2026-09-15 01:01:14',1),(158,64,'placed','Paid with Airtel Money.','2026-09-15 11:24:23',NULL),(159,64,'processing',NULL,'2026-09-15 11:24:44',72),(160,64,'shipped',NULL,'2026-09-15 11:24:47',72),(161,64,'pickup_requested','Mwansa Phiri is collecting this parcel; waiting for the shop to confirm.','2026-09-15 11:27:33',72),(162,64,'picked_up','Shop confirmed handover to Mwansa Phiri.','2026-09-15 11:27:39',72),(163,64,'delivered',NULL,'2026-09-15 11:27:48',72),(164,65,'placed','Paid with Airtel Money.','2026-09-15 11:33:34',NULL),(165,65,'processing',NULL,'2026-09-15 11:33:56',73),(166,65,'shipped',NULL,'2026-09-15 11:33:58',73),(167,65,'pickup_requested','Mwansa Phiri is collecting this parcel; waiting for the shop to confirm.','2026-09-15 11:34:21',73),(168,65,'picked_up','Shop confirmed handover to Mwansa Phiri.','2026-09-15 11:34:29',73),(169,66,'placed','Paid with Airtel Money.','2026-10-16 13:21:26',NULL),(170,66,'processing',NULL,'2026-10-16 13:24:03',74),(171,66,'shipped',NULL,'2026-10-16 13:24:11',74),(172,66,'pickup_requested','Joseph Banda is collecting this parcel; waiting for the shop to confirm.','2026-10-16 13:24:28',74),(173,66,'picked_up','Shop confirmed handover to Joseph Banda.','2026-10-16 13:24:39',74),(174,66,'delivered',NULL,'2026-10-16 13:24:52',74),(175,67,'placed','Paid with Airtel Money.','2026-10-17 10:00:28',NULL),(176,67,'processing',NULL,'2026-10-17 10:00:58',75),(177,67,'shipped',NULL,'2026-10-17 10:01:01',75),(178,67,'pickup_requested','Joseph Banda is collecting this parcel; waiting for the shop to confirm.','2026-10-17 10:01:24',75),(179,67,'picked_up','Shop confirmed handover to Joseph Banda.','2026-10-17 10:01:54',75),(180,67,'delivered',NULL,'2026-10-17 10:02:33',75),(181,65,'delivered',NULL,'2026-10-17 11:23:09',73),(182,68,'placed','Paid with Airtel Money.','2026-10-17 12:14:05',NULL),(183,69,'placed','Paid with Airtel Money.','2026-10-17 13:22:18',NULL),(184,69,'processing',NULL,'2026-10-17 13:22:55',77),(185,69,'shipped',NULL,'2026-10-17 13:24:28',77),(186,69,'pickup_requested','Thandiwe Zulu is collecting this parcel; waiting for the shop to confirm.','2026-10-17 13:25:11',77),(187,69,'picked_up','Shop confirmed handover to Thandiwe Zulu.','2026-10-17 13:25:22',77),(188,69,'delivered',NULL,'2026-10-17 13:25:54',77);
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
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,4,NULL,NULL,'delivered','2026-09-03 23:23:55','4 Demo Road','Lusaka','+260-123456789','airtel_money',950.00,950.00,0.00),(4,4,NULL,NULL,'delivered','2026-09-04 00:07:45','4 Demo Road','Lusaka','+260-123456789','mtn_momo',1300.00,1300.00,0.00),(5,4,NULL,NULL,'delivered','2026-09-04 00:11:28','4 Demo Road','Lusaka','+260-123456789','airtel_money',1090.00,1090.00,0.00),(6,4,NULL,NULL,'delivered','2026-09-04 00:31:11','4 Demo Road','Lusaka','+260-123456789','airtel_money',300.00,300.00,0.00),(7,4,NULL,NULL,'delivered','2026-09-04 00:36:59','4 Demo Road','Lusaka','+260-123456789','mtn_momo',200.00,200.00,0.00),(8,4,NULL,NULL,'placed','2026-09-04 00:49:48','4 Demo Road','Lusaka','+260-123456789','airtel_money',1520.00,1520.00,0.00),(57,4,NULL,NULL,'delivered','2026-09-09 14:44:25','4 Demo Road','Lusaka','+260-123456789','airtel_money',377.50,350.00,27.50),(59,4,NULL,NULL,'delivered','2026-09-15 00:12:58','4 Demo Road','Lusaka','+260-123456789','airtel_money',377.50,350.00,27.50),(60,4,NULL,NULL,'delivered','2026-09-15 00:23:02','4 Demo Road','Lusaka','+260-123456789',NULL,377.50,350.00,27.50),(61,4,NULL,NULL,'delivered','2026-09-15 00:23:59','4 Demo Road','Lusaka','+260-123456789',NULL,377.50,350.00,27.50),(62,4,NULL,NULL,'delivered','2026-09-15 00:25:02','4 Demo Road','Lusaka','+260-123456789',NULL,377.50,350.00,27.50),(63,4,NULL,NULL,'delivered','2026-09-15 00:25:26','4 Demo Road','Lusaka','+260-123456789',NULL,377.50,350.00,27.50),(64,4,NULL,NULL,'delivered','2026-09-15 11:24:23','4 Demo Road','Lusaka','+260-123456789','airtel_money',627.50,600.00,27.50),(65,4,NULL,NULL,'delivered','2026-09-15 11:33:34','4 Demo Road','Lusaka','+260-123456789','airtel_money',277.50,250.00,27.50),(66,9,NULL,NULL,'delivered','2026-10-16 13:21:26','9 Demo Road','Lusaka','+260-970-000-009','airtel_money',377.50,350.00,27.50),(67,4,NULL,NULL,'delivered','2026-10-17 10:00:28','4 Demo Road','Lusaka','+260-123456789','airtel_money',877.50,850.00,27.50),(68,4,NULL,NULL,'placed','2026-10-17 12:14:05','4 Demo Road','Lusaka','+260-123456789','airtel_money',877.50,850.00,27.50),(69,4,NULL,NULL,'delivered','2026-10-17 13:22:18','4 Demo Road','Lusaka','+260-123456789','airtel_money',1227.50,1200.00,27.50);
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
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,'mobile_money',950.00,'successful','zg-1-1788477835596','2026-09-03 23:23:55'),(4,4,'mobile_money',1300.00,'successful','zg-4-1788480465038','2026-09-04 00:07:45'),(5,5,'mobile_money',1090.00,'successful','zg-5-1788480688817','2026-09-04 00:11:28'),(6,6,'mobile_money',300.00,'successful','zg-6-1788481871483','2026-09-04 00:31:11'),(7,7,'mobile_money',200.00,'successful','zg-7-1788482219038','2026-09-04 00:36:59'),(8,8,'mobile_money',1520.00,'successful','zg-8-1788482988798','2026-09-04 00:49:48'),(57,57,'mobile_money',377.50,'successful','zg-57-1788965065853','2026-09-09 14:44:25'),(59,59,'mobile_money',377.50,'successful','zg-59-1789431178630','2026-09-15 00:12:58'),(60,60,'mobile_money',377.50,'successful','zg-60-1789431782793','2026-09-15 00:23:02'),(61,61,'mobile_money',377.50,'successful','zg-61-1789431839360','2026-09-15 00:23:59'),(62,62,'mobile_money',377.50,'successful','zg-62-1789431902197','2026-09-15 00:25:02'),(63,63,'mobile_money',377.50,'successful','zg-63-1789431926320','2026-09-15 00:25:26'),(64,64,'mobile_money',627.50,'successful','zg-64-1789471463949','2026-09-15 11:24:23'),(65,65,'mobile_money',277.50,'successful','zg-65-1789472014818','2026-09-15 11:33:34'),(66,66,'mobile_money',377.50,'successful','zg-66-1792156886858','2026-10-16 13:21:26'),(67,67,'mobile_money',877.50,'successful','zg-67-1792231228754','2026-10-17 10:00:28'),(68,68,'mobile_money',877.50,'successful','zg-68-1792239245996','2026-10-17 12:14:05'),(69,69,'mobile_money',1227.50,'successful','zg-69-1792243338380','2026-10-17 13:22:18');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `problem_reports`
--

DROP TABLE IF EXISTS `problem_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `problem_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reporter_role` varchar(20) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `reporter_name` varchar(255) DEFAULT NULL,
  `reporter_email` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_problem_reports_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `problem_reports`
--

LOCK TABLES `problem_reports` WRITE;
/*!40000 ALTER TABLE `problem_reports` DISABLE KEYS */;
INSERT INTO `problem_reports` VALUES (1,'courier',3,'Joseph Banda','joseph@zamglamcourier.local','just trying','open','2026-10-16 20:28:14',NULL),(2,'seller',2,'Mud','mud@zamglam.local','trying the report feature','open','2026-10-17 11:20:05',NULL);
/*!40000 ALTER TABLE `problem_reports` ENABLE KEYS */;
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
  `restock_expected_at` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seller_id` (`seller_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,2,1,3,'Classic Denim Pants','Everyday denim with a comfortable straight fit.',350.00,26,'/images/products/mud-denim.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL,NULL),(2,2,1,1,'Casual Cotton Shirt','Soft cotton shirt for easy everyday dressing.',250.00,22,'/images/products/mud-shirt.jpg','women','[\"XS\",\"S\",\"M\",\"L\"]',NULL,NULL),(3,2,1,4,'Leather Shoes','Polished leather shoes for work and weekends.',600.00,21,'/images/products/mud-shoes.jpg','unisex','[\"6\",\"7\",\"8\",\"9\",\"10\"]',NULL,NULL),(4,3,2,3,'Slim Fit Pants','Clean slim-fit pants with everyday stretch.',400.00,34,'/images/products/jets-pants.jpg','men','[\"28\",\"30\",\"32\",\"34\",\"36\"]',NULL,NULL),(5,3,2,7,'Formal White Shirt','Crisp white shirt for formal occasions.',150.00,23,'/images/products/jets-shirt.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL,NULL),(6,3,2,4,'Sneakers','Lightweight sneakers for daily movement.',500.00,21,'/images/products/jets-sneakers.jpg','unisex','[\"6\",\"7\",\"8\",\"9\",\"10\"]',NULL,NULL),(7,4,3,3,'Comfort Fit Pants','Comfort-first pants for long days.',280.00,26,'/images/products/bata-pants.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL,NULL),(8,4,3,1,'Printed T-Shirt','A bright printed cotton tee.',200.00,33,'/images/products/bata-tshirt.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL,NULL),(9,4,3,4,'School Shoes','Durable school shoes built for every term.',450.00,28,'/images/products/bata-schoolshoes.jpg','kids','[\"1\",\"2\",\"3\",\"4\",\"5\"]',NULL,NULL),(10,5,4,3,'Kids Pants','Play-ready pants with a comfortable fit.',150.00,39,'/images/products/pep-kidspants.jpg','kids','[\"2\",\"4\",\"6\",\"8\",\"10\"]',NULL,NULL),(11,5,4,1,'Graphic Tee','A fun graphic tee for everyday outfits.',180.00,39,'/images/products/pep-graphictee.jpg','kids','[\"2\",\"4\",\"6\",\"8\",\"10\"]',NULL,NULL),(13,6,5,3,'Jogger Pants','Relaxed joggers with a polished finish.',320.00,28,'/images/products/mrprice-joggers.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL,NULL),(14,6,5,1,'Casual Shirt','An easy shirt for weekday layering.',270.00,28,'/images/products/mrprice-shirt.jpg','unisex','[\"S\",\"M\",\"L\",\"XL\"]',NULL,NULL),(15,6,5,4,'Canvas Shoes','Versatile canvas shoes for daily wear.',350.00,29,'/images/products/mrprice-canvas.jpg','unisex','[\"6\",\"7\",\"8\",\"9\",\"10\"]',NULL,NULL),(16,7,6,3,'Designer Pants','Tailored statement pants from a local edit.',500.00,19,'/images/products/fg-designerpants.jpg','women','[\"S\",\"M\",\"L\",\"XL\"]',NULL,NULL),(17,7,6,1,'Silk Shirt','A softly draped silk shirt for occasion dressing.',450.00,19,'/images/products/fg-silkshirt.jpg','women','[\"S\",\"M\",\"L\",\"XL\"]',NULL,NULL),(18,7,6,4,'Luxury Shoes','Polished shoes for elevated evenings.',800.00,14,'/images/products/fg-luxuryshoes.jpg','women','[\"6\",\"7\",\"8\",\"9\",\"10\"]',NULL,NULL),(30,5,4,4,'Sandals','Lightweight sandals for sunny days.',220.00,28,'/images/products/pep-sandals.jpg','kids','[\"1\",\"2\",\"3\",\"4\",\"5\"]',NULL,NULL),(40,6,5,1,'Striped Polo Shirt','A smart-casual cotton polo with a comfortable fit.',290.00,24,'/images/products/mrprice-shirt.jpg','men','[\"S\",\"M\",\"L\",\"XL\"]','[]',NULL),(41,7,6,1,'Linen Blouse','A lightweight linen blouse for warm-weather outfits.',380.00,18,'/images/products/fg-silkshirt.jpg','women','[\"S\",\"M\",\"L\",\"XL\"]','[]',NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refund_messages`
--

DROP TABLE IF EXISTS `refund_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refund_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `refund_request_id` int(11) NOT NULL,
  `sender_role` varchar(20) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_refund_message_thread` (`refund_request_id`,`created_at`),
  CONSTRAINT `fk_refund_message_request` FOREIGN KEY (`refund_request_id`) REFERENCES `refund_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refund_messages`
--

LOCK TABLES `refund_messages` WRITE;
/*!40000 ALTER TABLE `refund_messages` DISABLE KEYS */;
INSERT INTO `refund_messages` VALUES (1,1,'customer',4,'Item damaged or defective: the zipper isnt working','2026-10-17 12:15:04'),(2,1,'seller',2,'Seller recommends approving the refund: Approved','2026-10-17 12:16:42');
/*!40000 ALTER TABLE `refund_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refund_requests`
--

DROP TABLE IF EXISTS `refund_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refund_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `shipment_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `reason` varchar(100) NOT NULL,
  `details` text NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'seller_review',
  `seller_recommendation` varchar(10) DEFAULT NULL,
  `seller_note` text DEFAULT NULL,
  `admin_decision_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refund_shipment` (`shipment_id`),
  KEY `idx_refund_customer` (`customer_id`),
  KEY `idx_refund_seller` (`seller_id`),
  KEY `idx_refund_status` (`status`),
  KEY `fk_refund_order` (`order_id`),
  CONSTRAINT `fk_refund_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_refund_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_refund_seller` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_refund_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refund_requests`
--

LOCK TABLES `refund_requests` WRITE;
/*!40000 ALTER TABLE `refund_requests` DISABLE KEYS */;
INSERT INTO `refund_requests` VALUES (1,67,75,4,2,'Item damaged or defective','the zipper isnt working','admin_review','approve','Approved',NULL,'2026-10-17 12:15:04','2026-10-17 12:16:42');
/*!40000 ALTER TABLE `refund_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) DEFAULT NULL,
  `reporter_role` varchar(20) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `reported_role` varchar(20) NOT NULL,
  `reported_id` int(11) NOT NULL,
  `reason` varchar(80) NOT NULL,
  `details` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_report_once` (`order_id`,`reporter_role`,`reporter_id`,`reported_role`,`reported_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,2,4,1,5,'Great denim, fast delivery.','Thank you!','2026-09-04 11:25:59','2026-09-04 11:25:59'),(4,2,4,8,5,NULL,NULL,NULL,'2026-09-04 13:06:32'),(5,3,4,8,5,NULL,NULL,NULL,'2026-09-04 13:06:41'),(6,2,4,64,3,'Great ',NULL,NULL,'2026-09-15 11:28:04'),(7,2,9,66,5,'Awesome ',NULL,NULL,'2026-10-16 13:25:05'),(8,2,4,67,4,'greay service\n',NULL,NULL,'2026-10-17 10:02:53'),(9,2,4,69,4,'rate ',NULL,NULL,'2026-10-17 13:26:08');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seller_promotions`
--

DROP TABLE IF EXISTS `seller_promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seller_promotions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seller_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `discount_percent` tinyint(3) unsigned NOT NULL,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_seller_promotions_product_dates` (`product_id`,`starts_at`,`ends_at`),
  KEY `idx_seller_promotions_seller` (`seller_id`),
  CONSTRAINT `seller_promotions_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `seller_promotions_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_promotions`
--

LOCK TABLES `seller_promotions` WRITE;
/*!40000 ALTER TABLE `seller_promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `seller_promotions` ENABLE KEYS */;
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
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `account_status` varchar(20) NOT NULL DEFAULT 'active',
  `suspended_at` timestamp NULL DEFAULT NULL,
  `suspension_reason` varchar(255) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `terms_accepted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sellers`
--

LOCK TABLES `sellers` WRITE;
/*!40000 ALTER TABLE `sellers` DISABLE KEYS */;
INSERT INTO `sellers` VALUES (1,'Demo Seller','demoseller@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','Demo Store','+260-970-000-100','rejected',NULL,'2026-09-14 21:51:33','active',NULL,NULL,NULL,NULL),(2,'Mud','mud@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','Mud','+260-495908110','rejected',NULL,'2026-09-14 21:51:33','active',NULL,NULL,NULL,NULL),(3,'Jets','jets@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','Jets','+260-384788406','verified','2026-10-17 11:38:27','2026-09-14 21:51:33','active',NULL,NULL,NULL,NULL),(4,'Bata','bata@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','Bata','+260-453090242','verified','2026-10-16 12:19:33','2026-09-14 21:51:33','active',NULL,NULL,NULL,NULL),(5,'Pep','pep@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','Pep','+260-475417424','verified','2026-10-17 11:50:16','2026-09-14 21:51:33','active',NULL,NULL,NULL,NULL),(6,'Mr Price Zambia','mrprice@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','Mr Price Zambia','+260-756286477','verified','2026-10-16 12:19:33','2026-09-14 21:51:33','active',NULL,NULL,NULL,NULL),(7,'Fashions Galore','fashionsgalore@zamglam.local','$2b$10$URKFzmgrueJQlZoj8XrAe.EuruNPrv2/Z2JK6AQbis5GcUOnhkUG6','Fashions Galore','+260-946071420','verified','2026-10-16 12:19:33','2026-09-14 21:51:33','active',NULL,NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipments`
--

LOCK TABLES `shipments` WRITE;
/*!40000 ALTER TABLE `shipments` DISABLE KEYS */;
INSERT INTO `shipments` VALUES (1,1,2,'delivered',NULL,'Joseph Banda',NULL,35.00,'3.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-03 23:23:55',NULL),(2,4,3,'delivered',1,'Mwansa Phiri',NULL,50.00,'6.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-04 00:07:45','2026-09-04 10:00:06'),(3,5,6,'delivered',NULL,'Joseph Banda',NULL,55.00,'7.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-04 00:11:28',NULL),(4,5,3,'delivered',NULL,'Joseph Banda',NULL,55.00,'7.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-04 00:11:28',NULL),(5,6,3,'delivered',1,'Mwansa Phiri','+260-970-111-001',60.00,'8.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-04 00:31:11',NULL),(6,7,4,'delivered',2,'Thandiwe Zulu','+260-970-111-002',65.00,'9.0 km','Zamglam store → Lusaka','2026-09-04 01:17:24','2026-09-04 00:36:59',NULL),(7,8,2,'delivered',3,'Joseph Banda','+260-970-111-003',70.00,'10.0 km','Zamglam store → Lusaka','2026-09-04 01:17:25','2026-09-04 00:49:48',NULL),(8,8,3,'delivered',3,'Joseph Banda','+260-970-111-003',70.00,'10.0 km','Zamglam store → Lusaka','2026-09-04 01:17:25','2026-09-04 00:49:48',NULL),(9,8,4,'placed',3,'Joseph Banda','+260-970-111-003',70.00,'10.0 km','Zamglam store → Lusaka','2026-09-04 01:17:25',NULL,NULL),(10,8,5,'delivered',3,'Joseph Banda','+260-970-111-003',70.00,'10.0 km','Zamglam store → Lusaka','2026-09-04 01:17:25','2026-09-04 00:49:48',NULL),(65,57,2,'delivered',1,'Mwansa Phiri','+260-970-111-001',27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-09-09 14:44:25','2026-09-14 21:27:56',NULL),(67,59,2,'delivered',1,'Mwansa Phiri','+260-970-111-001',27.50,'1.5 km','Lusaka, Zambia → LUSAKA','2026-09-15 00:12:58','2026-09-15 00:22:28',NULL),(68,60,2,'delivered',1,'Mwansa Phiri','+260-970-111-001',27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-09-15 00:23:02','2026-09-15 00:23:02',NULL),(69,61,2,'delivered',1,'Mwansa Phiri','+260-970-111-001',27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-09-15 00:23:59','2026-09-15 00:23:59',NULL),(70,62,2,'delivered',2,'Thandiwe Zulu','+260-970-111-002',27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-09-15 00:25:02','2026-09-15 00:25:02',NULL),(71,63,2,'delivered',2,'Thandiwe Zulu','+260-970-111-002',27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-09-15 00:25:26','2026-09-15 00:25:26',NULL),(72,64,2,'delivered',1,'Mwansa Phiri','+260-970-111-001',27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-09-15 11:24:23','2026-09-15 11:24:47',NULL),(73,65,2,'delivered',1,'Mwansa Phiri','+260-970-111-001',27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-09-15 11:33:34','2026-09-15 11:33:58',NULL),(74,66,2,'delivered',3,'Joseph Banda','+260-970-111-003',27.50,'1.5 km','Lusaka, Zambia → Lusaka ','2026-10-16 13:21:26','2026-10-16 13:24:11',NULL),(75,67,2,'delivered',3,'Joseph Banda','+260-970-111-003',27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-10-17 10:00:28','2026-10-17 10:01:01',NULL),(76,68,2,'placed',NULL,NULL,NULL,27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-10-17 12:14:06',NULL,NULL),(77,69,2,'delivered',2,'Thandiwe Zulu','+260-970-111-002',27.50,'1.5 km','Lusaka, Zambia → Lusaka','2026-10-17 13:22:18','2026-10-17 13:24:28',NULL);
/*!40000 ALTER TABLE `shipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_messages`
--

DROP TABLE IF EXISTS `store_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `store_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `sender_role` enum('customer','seller') NOT NULL,
  `sender_id` int(11) NOT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_store_messages_thread` (`store_id`,`customer_id`,`created_at`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `store_messages_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_messages_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_messages`
--

LOCK TABLES `store_messages` WRITE;
/*!40000 ALTER TABLE `store_messages` DISABLE KEYS */;
INSERT INTO `store_messages` VALUES (1,1,9,'customer',9,'Do you have dressses','2026-10-16 13:26:20','2026-10-16 13:26:20'),(2,1,9,'seller',2,'What size','2026-10-16 13:26:41','2026-10-16 13:26:41'),(3,1,9,'customer',9,'Size xs','2026-10-16 13:26:55','2026-10-16 13:26:55'),(4,1,9,'seller',2,'wala we only have Mediums','2026-10-16 13:28:47','2026-10-16 13:28:47'),(5,1,9,'seller',2,'harder','2026-10-16 13:29:06','2026-10-16 13:29:06');
/*!40000 ALTER TABLE `store_messages` ENABLE KEYS */;
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
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stores_seller` (`seller_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (1,2,'Mud','Official Mud store','/images/logos/mud.png','Lusaka, Zambia','{\"open\":\"09:00\",\"close\":\"18:00\"}','open','2026-09-03 23:21:06',NULL,NULL),(2,3,'Jets','Official Jets store','/images/logos/jets.png','Lusaka, Zambia','{\"open\":\"08:00\",\"close\":\"19:00\"}','open','2026-09-03 23:21:06',NULL,NULL),(3,4,'Bata','Official Bata store','/images/logos/bata.png','Lusaka, Zambia','{\"open\":\"10:00\",\"close\":\"20:00\"}','open','2026-09-03 23:21:06',NULL,NULL),(4,5,'Pep','Official Pep store','/images/logos/pep.png','Lusaka, Zambia','{\"open\":\"08:00\",\"close\":\"18:00\"}','open','2026-09-03 23:21:06',NULL,NULL),(5,6,'Mr Price Zambia','Official Mr Price Zambia store','/images/logos/mrprice.png','Lusaka, Zambia','{\"open\":\"09:00\",\"close\":\"19:00\"}','open','2026-09-03 23:21:06',NULL,NULL),(6,7,'Fashions Galore','Official Fashions Galore store','/images/logos/fashionsgalore.png','Lusaka, Zambia','{\"open\":\"09:00\",\"close\":\"18:00\"}','open','2026-09-03 23:21:06',NULL,NULL);
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
  `role` enum('admin','customer','seller','courier') NOT NULL DEFAULT 'customer',
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

-- Dump completed
