<?php
header("Content-Type: application/json");
require "../db.php";

// 🔒 SOLO POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

// Leer body JSON
$input = json_decode(file_get_contents("php://input"), true);

$select = $input['select'] ?? null;
$table  = $input['table']  ?? null;
$column = $input['column'] ?? null;
$id     = $input['id']     ?? null;

// 🔎 Validaciones básicas
if (!$select || !$table || !$column || $id === null) {
    http_response_code(400);
    echo json_encode(["error" => "Parámetros incompletos"]);
    exit;
}

// 🔐 Validar SELECT
if (!preg_match('/^[a-zA-Z0-9_,\s\*\.\(\)`]+$/', $select)) {
    http_response_code(400);
    echo json_encode(["error" => "SELECT inválido"]);
    exit;
}

// 🔐 Validar TABLE (sin JOIN para este endpoint)
if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
    http_response_code(400);
    echo json_encode(["error" => "TABLE inválida"]);
    exit;
}

// 🔐 Validar COLUMN
if (!preg_match('/^[a-zA-Z0-9_]+$/', $column)) {
    http_response_code(400);
    echo json_encode(["error" => "COLUMN inválida"]);
    exit;
}

// 🔢 Validar ID
if (!is_numeric($id)) {
    http_response_code(400);
    echo json_encode(["error" => "ID inválido"]);
    exit;
}

// 🧠 Construcción segura del SQL
$sql = "SELECT $select FROM $table WHERE $column = ? AND status = 1";

// 🛠️ Preparar query
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "error" => "Error al preparar la consulta",
        "detalle" => $conn->error
    ]);
    exit;
}

// Bind del ID
$stmt->bind_param("i", $id);

// Ejecutar
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["error" => "Registro no encontrado"]);
    exit;
}

// Obtener resultados
$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

// ✅ Respuesta OK
http_response_code(200);
echo json_encode($data);
