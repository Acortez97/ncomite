<?php
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$usuario = $data["usuario"] ?? "";
$password = $data["password"] ?? "";

if (!$usuario || !$password) {
    echo json_encode(["error" => "Datos incompletos"]);
    exit;
}

/* Verificar existencia */
$sql = "SELECT id_login 
        FROM clientes_login 
        WHERE usuario = ? AND status = 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $usuario);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["error" => "Usuario no válido"]);
    exit;
}

/* Actualizar contraseña (MD5 porque así lo tienes) */
$nuevaPass = md5($password);

$update = "UPDATE clientes_login 
           SET pass = ? 
           WHERE usuario = ?";

$stmt2 = $conn->prepare($update);
$stmt2->bind_param("ss", $nuevaPass, $usuario);
$stmt2->execute();

echo json_encode(["success" => true]);
