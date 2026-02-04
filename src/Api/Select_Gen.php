<?php
header("Content-Type: application/json");
require "../db.php"; // ajusta la ruta si es necesario

// 🔒 SOLO POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

// Leer body JSON
$input = json_decode(file_get_contents("php://input"), true);

$select  = $input['select']  ?? null;
$table   = $input['table']   ?? null;
$orderBy = $input['orderBy'] ?? null;

// Validaciones básicas
if (!$select || !$table) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan parámetros select o table"]);
    exit;
}

/*
  ⚠️ IMPORTANTE:
  No se pueden bindear columnas, tablas ni ORDER BY
  Se sanitiza manualmente
*/

// SELECT: columnas, funciones, alias
if (!preg_match('/^[a-zA-Z0-9_,\s\*\.\(\)"\'\-:%`]+$/', $select)) {
    http_response_code(400);
    echo json_encode(["error" => "SELECT inválido"]);
    exit;
}

// TABLE
if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
    http_response_code(400);
    echo json_encode(["error" => "TABLE inválida"]);
    exit;
}

// ORDER BY (opcional)
if ($orderBy && !preg_match('/^[a-zA-Z0-9_\s\.,]+$/', $orderBy)) {
    http_response_code(400);
    echo json_encode(["error" => "ORDER BY inválido"]);
    exit;
}

// Construcción SQL
$sql = "SELECT $select 
        FROM `$table`
        WHERE status = 1";

if ($orderBy) {
    $sql .= " ORDER BY $orderBy";
}

// Ejecutar consulta
$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        "error"   => "Error al ejecutar la consulta",
        "detalle" => $conn->error
    ]);
    exit;
}

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["error" => "No se encontraron resultados"]);
    exit;
}

// Armar respuesta
$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

http_response_code(200);
echo json_encode($data);
