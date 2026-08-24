<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

include "includes/db.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "status" => "error",
        "message" => "No input data received"
    ]);
    exit;
}

$eventDate = $data["eventDate"] ?? "";
$startTime = $data["startTime"] ?? "";
$endTime = $data["endTime"] ?? "";

if (!$eventDate || !$startTime || !$endTime) {
    echo json_encode([
        "status" => "error",
        "message" => "Event date, start time and end time are required."
    ]);
    exit;
}


if ($startTime >= $endTime) {
    echo json_encode([
        "status" => "error",
        "message" => "End time must be after start time."
    ]);
    exit;
}


function timeToMinutes($time)
{
    [$hours, $minutes] = array_map("intval", explode(":", $time));

    return ($hours * 60) + $minutes;
}

$bufferMinutes = 120;

$newStart = timeToMinutes($startTime);
$newEnd = timeToMinutes($endTime);

$newProtectedStart = $newStart - $bufferMinutes;
$newProtectedEnd = $newEnd + $bufferMinutes;


$stmt = $conn->prepare("
    SELECT id, eventName, startTime, endTime
    FROM events
    WHERE eventDate = ?
    AND status != 'Cancelled'
");

$stmt->bind_param("s", $eventDate);
$stmt->execute();

$result = $stmt->get_result();

while ($event = $result->fetch_assoc()) {

    $existingStart = timeToMinutes($event["startTime"]);
    $existingEnd = timeToMinutes($event["endTime"]);

    $existingProtectedStart = $existingStart - $bufferMinutes;
    $existingProtectedEnd = $existingEnd + $bufferMinutes;

    if (
        $newProtectedStart < $existingProtectedEnd &&
        $newProtectedEnd > $existingProtectedStart
    ) {

        echo json_encode([
            "status" => "error",
            "message" =>
            "This time is unavailable. " .
                $event["eventName"] .
                " is scheduled from " .
                date("g:i A", strtotime($event["startTime"])) .
                " to " .
                date("g:i A", strtotime($event["endTime"])) .
                ". A 2-hour buffer is required before and after the event."
        ]);

        $stmt->close();
        $conn->close();
        exit;
    }
}

$stmt->close();


$stmt = $conn->prepare("
    INSERT INTO events (
        eventName,
        eventDate,
        bookingDate,
        startTime,
        endTime,
        description,
        status,
        customerName,
        customerEmail,
        customerPhone,
        requestedAmount,
        totalPaid,
        confirmedAmount,
        bookingBy
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    "ssssssssssddds",
    $data["eventName"],
    $data["eventDate"],
    $data["bookingDate"],
    $data["startTime"],
    $data["endTime"],
    $data["description"],
    $data["status"],
    $data["customerName"],
    $data["customerEmail"],
    $data["customerPhone"],
    $data["requestedAmount"],
    $data["totalPaid"],
    $data["confirmedAmount"],
    $data["bookingBy"]
);

if ($stmt->execute()) {

    echo json_encode([
        "status" => "success",
        "message" => "Event added successfully!"
    ]);
} else {

    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
