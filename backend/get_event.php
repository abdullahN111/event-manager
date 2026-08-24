<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

include "includes/db.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if (!isset($_GET["id"])) {
    echo json_encode(["status" => "error", "message" => "Missing event ID"]);
    exit;
}

$id = intval($_GET["id"]);

$stmt = $conn->prepare("SELECT * FROM events WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Event not found"]);
    exit;
}

$row = $result->fetch_assoc();

$event = [
    "id" => $row["id"],
    "eventName" => $row["eventName"],
    "eventDate" => $row["eventDate"],
    "bookingDate" => $row["bookingDate"],
    "startTime" => $row["startTime"],
    "endTime" => $row["endTime"],
    "description" => $row["description"],
    "status" => $row["status"],
    "customer" => [
        "name" => $row["customerName"],
        "email" => $row["customerEmail"],
        "phone" => $row["customerPhone"]
    ],
    "finance" => [
        "requestedAmount" => (float)$row["requestedAmount"],
        "totalPaid" => (float)$row["totalPaid"],
        "confirmedAmount" => (float)$row["confirmedAmount"]
    ],
    "time" => [
        "start" => $row["startTime"],
        "end" => $row["endTime"]
    ],
    "bookingBy" => $row["bookingBy"]
];

echo json_encode(["status" => "success", "data" => $event]);

$stmt->close();
$conn->close();
?>
