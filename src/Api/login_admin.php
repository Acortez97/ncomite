<?php
header("Content-Type: application/json");
require "db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$usuario = $input['usuario'] ?? null;
$pass = $input['pass'] ?? null;

if (!$usuario || !$pass) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos"]);
    exit;
}

// ⚠️ Recomendado: password_hash, pero respetamos tu MD5 actual
$passMd5 = md5($pass);

$sql = "
    SELECT 
        u.idusers,
        u.usuario,
        r.nombre AS rol
    FROM user_admin u
    JOIN roles r ON r.id_rol = u.id_rol
    WHERE u.usuario = ? 
      AND u.pass = ?
      AND u.status = 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $usuario, $passMd5);
$stmt->execute();

$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    http_response_code(401);
    echo json_encode(["message" => "Credenciales incorrectas"]);
    exit;
}

echo json_encode([
    "message" => "Login exitoso",
    "user" => [
        "id" => $user['idusers'],
        "usuario" => $user['usuario'],
        "rol" => $user['rol'],
        "tipo" => "admin"
    ]
]);
