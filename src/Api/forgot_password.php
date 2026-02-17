<?php
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$usuario = $data["usuario"] ?? "";

if (!$usuario) {
    echo json_encode(["error" => "Usuario requerido"]);
    exit;
}

/* Buscar en clientes_login */
$sql = "SELECT id_login, id_usuario 
        FROM clientes_login 
        WHERE usuario = ? AND status = 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $usuario);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["error" => "Usuario no encontrado"]);
    exit;
}

echo json_encode(["success" => true]);
