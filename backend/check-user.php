<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");

include "includes/db.php";

$result = $conn->query("SELECT COUNT(*) AS count FROM users");
$row = $result->fetch_assoc();

echo json_encode([
    "user_exists" => $row["count"] > 0
]);
