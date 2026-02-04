<?php
header("Content-Type: application/json; charset=UTF-8");

require_once "../db.php";

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode([
        "error" => "No se recibió JSON válido",
        "recibido" => $input
    ]);
    exit;
}

$idusers = $input["idusers"] ?? null;
$data   = $input["data"] ?? null;

if (!$idusers) {
    echo json_encode([
        "error" => "Falta el parámetro idusers",
        "recibido" => $input
    ]);
    exit;
}

if (!$data || !is_array($data)) {
    echo json_encode([
        "error" => "Falta el parámetro data",
        "recibido" => $input
    ]);
    exit;
}

// Construir SET dinámico
$setParts = [];
$values = [];

foreach ($data as $col => $val) {
    $setParts[] = "`$col` = ?";
    $values[] = $val;
}

$setQuery = implode(", ", $setParts);
$values[] = $idusers;

$sql = "UPDATE user_admin SET $setQuery WHERE idusers = ?";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "error" => "Error en prepare()",
        "detalle" => $mysqli->error,
        "sql" => $sql
    ]);
    exit;
}

$stmt->bind_param(str_repeat("s", count($values)), ...$values);

if (!$stmt->execute()) {
    echo json_encode([
        "error" => "Error al ejecutar UPDATE",
        "detalle" => $stmt->error
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Usuario actualizado correctamente"
]);
