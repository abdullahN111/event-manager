<?php
include "includes/db.php";

$token = $_GET["token"] ?? "";

if (!$token) {
    die("Invalid verification link.");
}

$sql = "UPDATE users SET is_verified = 1, verify_token = NULL WHERE verify_token = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $token);
$stmt->execute();

if ($stmt->affected_rows === 1) {
    echo "<h2>Email verified successfully! You may now close this window.</h2>";
} else {
    echo "<h3>Invalid or expired link.</h3>";
}
