<?php
header("Content-Type: application/json");
require "../db.php";
require "../security.php";
require "../auth_check.php";

// 🔒 SOLO POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

verificarToken($conn);

// Leer body JSON
$input = json_decode(file_get_contents("php://input"), true);

$select  = $input['select']  ?? null;
$table   = $input['table']   ?? null;
$where   = $input['where']   ?? null;
$orderBy = $input['orderBy'] ?? null;

// Validaciones básicas
if (!$select || !$table) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan parámetros select o table"]);
    exit;
}

/*
  ⚠️ IMPORTANTE:
  No se pueden bindear columnas, tablas ni WHERE dinámico
  Se SANITIZA manualmente
*/

// SELECT
if (!preg_match('/^[a-zA-Z0-9_,\s\*\.\(\)"\'\-:%`]+$/', $select)) {
    http_response_code(400);
    echo json_encode(["error" => "SELECT inválido"]);
    exit;
}

// TABLE (permite JOIN)
if (!preg_match('/^[a-zA-Z0-9_\s\.\=]+$/', $table) || !validarTablaJoin($table)) {
    http_response_code(403);
    echo json_encode(["error" => "Acceso no permitido"]);
    exit;
}

// WHERE
if ($where && !preg_match('/^[a-zA-Z0-9_\s\.\=\>\<\!\(\)\'"%\-]+$/', $where)) {
    http_response_code(400);
    echo json_encode(["error" => "WHERE inválido"]);
    exit;
}

// ORDER BY
if ($orderBy && !preg_match('/^[a-zA-Z0-9_\s\.,]+$/', $orderBy)) {
    http_response_code(400);
    echo json_encode(["error" => "ORDER BY inválido"]);
    exit;
}

// Construcción dinámica
$sql = "SELECT $select FROM $table";

if ($where) {
    $sql .= " WHERE $where";
}

if ($orderBy) {
    $sql .= " ORDER BY $orderBy";
}

// Ejecutar query
$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        "error" => "Error al ejecutar la consulta",
        "detalle" => $conn->error,
        "sql" => $sql
    ]);
    exit;
}

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["error" => "No se encontraron resultados"]);
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

http_response_code(200);
echo json_encode($data);
