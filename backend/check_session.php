<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");

session_start();

if (isset($_SESSION["user_id"])) {
    echo json_encode([
        "status" => "success",
        "user" => [
            "id" => $_SESSION["user_id"],
            "name" => $_SESSION["user_name"],
            "email" => $_SESSION["user_email"]
        ]
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Not authenticated"
    ]);
}