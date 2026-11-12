<?php

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "event_manager";

// Connect WITHOUT selecting a database first
$conn = new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database if it doesn't exist
$conn->query("CREATE DATABASE IF NOT EXISTS `$dbname`");

// Select the database
$conn->select_db($dbname);

// --- AUTO CREATE EVENTS TABLE ---
$conn->query("
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    eventName VARCHAR(255) NOT NULL,
    eventDate DATE NOT NULL,
    bookingDate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    description TEXT NULL,
    status ENUM('Upcoming','In Progress','Completed','Cancelled') DEFAULT 'Upcoming',
    customerName VARCHAR(255) NOT NULL,
    customerEmail VARCHAR(255) DEFAULT '',
    customerPhone VARCHAR(30) NOT NULL,
    requestedAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    totalPaid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    confirmedAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    bookingBy VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
");

?>
