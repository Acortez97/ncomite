<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../security.php';
require_once __DIR__ . '/../auth_check.php';

/* SOLO POST */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "message" => "Method Not Allowed"
    ]);
    exit;
}

verificarToken($conn);

/* LEER JSON */
$input = json_decode(file_get_contents("php://input"), true);

$table = $input['table'] ?? null;
$data  = $input['data']  ?? null;

if (!$table || !$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "message" => "Missing 'table' or 'data'"
    ]);
    exit;
}

/* VALIDAR NOMBRE DE TABLA */
if (!preg_match('/^[a-zA-Z0-9_]+$/', $table) || !validarTabla($table)) {
    http_response_code(403);
    echo json_encode([
        "error" => true,
        "message" => "Acceso no permitido"
    ]);
    exit;
}

$fields = array_keys($data);
$values = array_values($data);

/* VALIDAR CAMPOS */
foreach ($fields as $field) {
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $field)) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "message" => "Invalid field name: $field"
        ]);
        exit;
    }
}

/* ARMAR QUERY */
$columns = implode(", ", $fields);
$placeholders = implode(", ", array_fill(0, count($fields), "?"));
$types = str_repeat("s", count($values)); // todos string

$sql = "INSERT INTO `$table` ($columns) VALUES ($placeholders)";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "message" => "Error preparing query"
    ]);
    exit;
}

/* BIND DINÁMICO */
$stmt->bind_param($types, ...$values);

/* EJECUTAR */
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "message" => "Error inserting data"
    ]);
    exit;
}

echo json_encode([
    "message"  => "Data inserted successfully",
    "insertId" => $stmt->insert_id
]);

$stmt->close();
$conn->close();
