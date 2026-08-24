<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

include "includes/db.php";
include "send-mail.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$name = $data["name"] ?? '';
$email = $data["email"] ?? '';
$password = $data["password"] ?? '';

if (!$name || !$email || !$password) {
    echo json_encode(["status" => "error", "message" => "All fields are required"]);
    exit;
}

// Check if any user exists
$count = $conn->query("SELECT COUNT(*) AS c FROM users")->fetch_assoc()["c"];
if ($count > 0) {
    echo json_encode(["status" => "error", "message" => "User already exists"]);
    exit;
}

$hashed = password_hash($password, PASSWORD_DEFAULT);
$token = bin2hex(random_bytes(32)); // 64-char strong token

$stmt = $conn->prepare("INSERT INTO users (name, email, password, verify_token, is_verified) VALUES (?, ?, ?, ?, 0)");
$stmt->bind_param("ssss", $name, $email, $hashed, $token);

if ($stmt->execute()) {
    sendVerificationEmail($email, $name, $token);

    echo json_encode([
        "status" => "success",
        "message" => "Account created! Check your email to verify your account."
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Unable to create user"]);
}
