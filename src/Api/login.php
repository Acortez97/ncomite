<?php
header("Content-Type: application/json");
require "db.php";

// SOLO POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido"]);
    exit;
}

// Leer JSON
$input = json_decode(file_get_contents("php://input"), true);

$usuario = $input['usuario'] ?? null;
$pass = $input['pass'] ?? null;

if (!$usuario || !$pass) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos"]);
    exit;
}

$sql = "SELECT idusers, usuario, rol
        FROM users_admins
        WHERE usuario = ? AND pass = ?";

$stmt = $conn->prepare($sql);
$passMd5 = md5($pass);
$stmt->bind_param("ss", $usuario, $passMd5);
$stmt->execute();

$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    http_response_code(401);
    echo json_encode(["message" => "Credenciales incorrectas"]);
    exit;
}

http_response_code(200);
echo json_encode([
    "message" => "Login exitoso",
    "user" => [
        "id" => $user['idusers'],
        "usuario" => $user['usuario'],
        "rol" => $user['rol']
    ]
]);
