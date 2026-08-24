<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . "/vendor/autoload.php";


function sendVerificationEmail($email, $name, $token)
{
    $mail = new PHPMailer(true);

    try {
        // SMTP
        $mail->isSMTP();
        $mail->Host       = "smtp.gmail.com";
        $mail->SMTPAuth   = true;
        $mail->Username   = "myselfabdullah360@gmail.com";
        $mail->Password   = "bnbuuirkjdbgtklb";
        $mail->SMTPSecure = "tls";
        $mail->Port       = 587;

        // Sender
        $mail->setFrom("myselfabdullah360@gmail.com", "Events Manager");

        // Recipient
        $mail->addAddress($email, $name);

        // Content
        $mail->isHTML(true);
        $mail->Subject = "Verify Your Email - Events Manager";

        $link = "http://localhost/management_project/backend/verify.php?token=$token";

        $mail->Body = "
            <h2>Hello $name,</h2>
            <p>Please verify your email:</p>
            <a href='$link'>Click here to verify your account</a>
            <p>If you did not create an account, ignore this email.</p>
        ";

        return $mail->send();
    } catch (Exception $e) {
    echo "Mailer Error: " . $mail->ErrorInfo;
    return false;
}

}
