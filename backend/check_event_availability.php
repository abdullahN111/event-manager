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

$eventDate = $_GET["eventDate"] ?? "";
$startTime = $_GET["startTime"] ?? "";
$endTime = $_GET["endTime"] ?? "";

if (!$eventDate || !$startTime || !$endTime) {
    echo json_encode([
        "status" => "error",
        "message" => "Date, start time and end time are required."
    ]);
    exit;
}


if ($startTime >= $endTime) {
    echo json_encode([
        "status" => "error",
        "available" => false,
        "message" => "End time must be after start time."
    ]);
    exit;
}


$bufferMinutes = 120;



function timeToMinutes($time)
{
    [$hours, $minutes] = array_map("intval", explode(":", $time));

    return ($hours * 60) + $minutes;
}

function minutesToTime($minutes)
{
    $minutes = max(0, min(1439, $minutes));

    $hours = floor($minutes / 60);
    $mins = $minutes % 60;

    return sprintf("%02d:%02d:00", $hours, $mins);
}

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
            "status" => "success",
            "available" => false,
            "message" =>
            "This time is unavailable. " .
                $event["eventName"] .
                " is scheduled from " .
                date("g:i A", strtotime($event["startTime"])) .
                " to " .
                date("g:i A", strtotime($event["endTime"])) .
                ". A 2-hour buffer is required before and after the event.",
            "conflict" => [
                "id" => $event["id"],
                "eventName" => $event["eventName"],
                "startTime" => $event["startTime"],
                "endTime" => $event["endTime"]
            ]
        ]);

        $stmt->close();
        $conn->close();
        exit;
    }
}

$stmt->close();
$conn->close();

echo json_encode([
    "status" => "success",
    "available" => true,
    "message" => "Time is available."
]);

