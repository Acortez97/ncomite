<?php
$host = "localhost";       // o el host que te dio GoDaddy
$db   = "sistema_agua";       // nombre de tu base de datos
$user = "DBA";      // usuario MySQL
$pass = "4dministradorc0mit3";     // contraseña MySQL

$conn = new mysqli($host, $user, $pass, $db);

// Forzar UTF-8 (muy importante para acentos)
$conn->set_charset("utf8");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "message" => "Error de conexión a la base de datos"
    ]);
    exit;
}
