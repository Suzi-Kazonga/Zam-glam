<?php

require __DIR__ . '/db_connect.php';

try {
    $pdo = getDbConnection();
    echo "Connected successfully to zamglam_db";
} catch (PDOException $e) {
    die('Connection failed: ' . $e->getMessage());
}
