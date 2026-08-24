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
        "message" => "No input data received."
    ]);
    exit;
}

$id = $data["id"] ?? "";
$eventDate = $data["eventDate"] ?? "";
$startTime = $data["startTime"] ?? "";
$endTime = $data["endTime"] ?? "";

if (!$id || !$eventDate || !$startTime || !$endTime) {
    echo json_encode([
        "status" => "error",
        "message" => "Event ID, date, start time and end time are required."
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT id, status
    FROM events
    WHERE id = ?
");

$stmt->bind_param("i", $id);
$stmt->execute();

$result = $stmt->get_result();
$existingEvent = $result->fetch_assoc();

$stmt->close();

if (!$existingEvent) {
    echo json_encode([
        "status" => "error",
        "message" => "Event not found."
    ]);
    $conn->close();
    exit;
}


if ($existingEvent["status"] !== "Upcoming") {
    echo json_encode([
        "status" => "error",
        "message" => "Only upcoming and completed events can be edited."
    ]);
    $conn->close();
    exit;
}

if ($startTime >= $endTime) {
    echo json_encode([
        "status" => "error",
        "message" => "End time must be after start time."
    ]);
    $conn->close();
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
    AND id != ?
");

$stmt->bind_param("si", $eventDate, $id);
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

$requestedAmount = (float)($data["requestedAmount"] ?? 0);
$totalPaid = (float)($data["totalPaid"] ?? 0);

$confirmedAmount = $requestedAmount - $totalPaid;


$stmt = $conn->prepare("
    UPDATE events SET
        eventName = ?,
        eventDate = ?,
        bookingDate = ?,
        startTime = ?,
        endTime = ?,
        description = ?,
        customerName = ?,
        customerEmail = ?,
        customerPhone = ?,
        requestedAmount = ?,
        totalPaid = ?,
        confirmedAmount = ?,
        bookingBy = ?
    WHERE id = ?
");

$stmt->bind_param(
    "sssssssssdddsi",
    $data["eventName"],
    $data["eventDate"],
    $data["bookingDate"],
    $data["startTime"],
    $data["endTime"],
    $data["description"],
    $data["customerName"],
    $data["customerEmail"],
    $data["customerPhone"],
    $requestedAmount,
    $totalPaid,
    $confirmedAmount,
    $data["bookingBy"],
    $id
);


if ($stmt->execute()) {

    echo json_encode([
        "status" => "success",
        "message" => "Event updated successfully."
    ]);

} else {

    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>