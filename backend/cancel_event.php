<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

include "includes/db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["id"])) {
  echo json_encode(["status" => "error", "message" => "Event ID missing"]);
  exit;
}

$id = intval($data["id"]);

$sql = "UPDATE events SET status='Cancelled' WHERE id=$id";

if ($conn->query($sql)) {
  echo json_encode(["status" => "success", "message" => "Event cancelled"]);
} else {
  echo json_encode(["status" => "error", "message" => $conn->error]);
}

$conn->close();
?>
