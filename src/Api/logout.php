<?php
header("Content-Type: application/json");
require "db.php";
require "auth_check.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$auth = $_SERVER['HTTP_AUTHORIZATION']
     ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
     ?? '';

if (!$auth && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
}

if (preg_match('/^Bearer\s+(\S+)$/i', $auth, $m)) {
    $token = $m[1];
    $stmt = $conn->prepare("DELETE FROM sessions WHERE token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $stmt->close();
}

echo json_encode(["success" => true]);
$conn->close();
