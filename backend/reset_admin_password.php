<?php
include "includes/db.php";

$newPassword = "1111";

$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

$stmt = $conn->prepare("UPDATE users SET password = ? LIMIT 1");
$stmt->bind_param("s", $hashedPassword);

if ($stmt->execute()) {
    echo "Password reset successfully!<br>";
    echo "New Password: <b>$newPassword</b>";
} else {
    echo "Failed to reset password.";
}

$stmt->close();
$conn->close();
?>