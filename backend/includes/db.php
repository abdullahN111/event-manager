<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "event_manager";

// Connect to MySQL (no database selected yet)
$conn = new mysqli($host, $user, $pass, $dbname);

// If connection fails
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database if not exists
$conn->query("CREATE DATABASE IF NOT EXISTS $dbname");

// Select database
$conn->select_db($dbname);

// --- AUTO CREATE USERS TABLE ---
$conn->query("
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified TINYINT(1) DEFAULT 0,
    verify_token VARCHAR(64)
) ENGINE=InnoDB;
");

// --- AUTO CREATE EVENTS TABLE ---
$conn->query("
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    eventName VARCHAR(255) NOT NULL,
    eventDate DATE NOT NULL,
    bookingDate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    description TEXT null,
    status ENUM('Upcoming','In Progress','Completed', 'Cancelled') DEFAULT 'Upcoming',
    customerName VARCHAR(255) NOT NULL,
    customerEmail VARCHAR(255) NOT NULL,
    customerPhone VARCHAR(30),
    requestedAmount DECIMAL(10,2) NOT NULL,
    totalPaid DECIMAL(10,2) NOT NULL,
    confirmedAmount DECIMAL(10,2) NOT NULL,
    bookingBy VARCHAR(255) NOT NULL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
");


?>
