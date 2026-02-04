<?php
header("Content-Type: application/json");
require "../db.php"; // ajusta la ruta si es necesario

// SOLO POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

// Leer JSON
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(["error" => "JSON inválido en body"]);
    exit;
}

// Parámetros requeridos
$table   = $input['table']   ?? null;
$updates = $input['updates'] ?? null;
$idField = $input['idField'] ?? null;
$idValue = $input['idValue'] ?? null;

if (!$table || !$updates || !$idField || $idValue === null) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan parámetros requeridos"]);
    exit;
}

if (!is_array($updates) || count($updates) === 0) {
    http_response_code(400);
    echo json_encode(["error" => "El objeto updates está vacío"]);
    exit;
}

/* ===================== CONSTRUIR QUERY ===================== */

// SET campo1 = ?, campo2 = ?
$setParts = [];
$values   = [];
$types    = "";

foreach ($updates as $field => $value) {
    $setParts[] = "`$field` = ?";
    $values[] = $value;
    $types .= "s";
}

$values[] = $idValue;
$types .= "s";

$setClause = implode(", ", $setParts);

// ⚠️ Tabla y campo NO pueden ir como ?
$sql = "UPDATE `$table` SET $setClause WHERE `$idField` = ?";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Error al preparar la consulta"]);
    exit;
}

// Bind dinámico
$stmt->bind_param($types, ...$values);

/* ===================== EJECUTAR ===================== */

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["error" => "Error al ejecutar la consulta"]);
    exit;
}

if ($stmt->affected_rows === 0) {
    http_response_code(404);
    echo json_encode(["error" => "No se encontró registro para actualizar"]);
    exit;
}

echo json_encode(["message" => "Registro actualizado correctamente"]);

$stmt->close();
$conn->close();
