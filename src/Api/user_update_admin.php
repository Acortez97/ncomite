<?php
header("Content-Type: application/json; charset=UTF-8");
require_once "../db.php";
require_once "../auth_check.php";
verificarToken($conn);

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(["error" => "No se recibió JSON válido"]);
    exit;
}

$idusers = $input["idusers"] ?? null;
$data    = $input["data"]    ?? null;

if (!$idusers) {
    http_response_code(400);
    echo json_encode(["error" => "Falta el parámetro idusers"]);
    exit;
}

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(["error" => "Falta el parámetro data"]);
    exit;
}

// Columnas permitidas para actualizar
$colsPermitidas = ['nombre', 'apellido', 'usuario', 'pass', 'id_rol', 'permisos', 'status'];

$setParts = [];
$values   = [];

foreach ($data as $col => $val) {
    if (!in_array($col, $colsPermitidas, true)) continue;

    if ($col === 'pass') {
        $val = password_hash($val, PASSWORD_BCRYPT);
    }

    if ($col === 'permisos') {
        // Convertir array a JSON; null limpia los permisos
        $val = is_array($val) ? json_encode($val) : null;
    }

    $setParts[] = "`$col` = ?";
    $values[]   = $val;
}

if (empty($setParts)) {
    http_response_code(400);
    echo json_encode(["error" => "No hay campos válidos para actualizar"]);
    exit;
}

$values[] = $idusers;
$sql = "UPDATE user_admin SET " . implode(", ", $setParts) . " WHERE idusers = ?";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Error al preparar la consulta", "detalle" => $conn->error]);
    exit;
}

$stmt->bind_param(str_repeat("s", count($values)), ...$values);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["error" => "Error al ejecutar UPDATE", "detalle" => $stmt->error]);
    exit;
}

echo json_encode(["success" => true, "message" => "Usuario actualizado correctamente"]);
$stmt->close();
$conn->close();
