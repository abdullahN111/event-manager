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

$result = $conn->query("SELECT * FROM events ORDER BY eventDate ASC");

$events = [];

while ($row = $result->fetch_assoc()) {
    $events[] = [
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
}

echo json_encode(["status" => "success", "data" => $events]);

$conn->close();
