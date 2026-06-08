<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => true, "message" => "Method Not Allowed"]);
    exit;
}

verificarToken($conn);

$res = $conn->query("SELECT id, nombre, descripcion, sector, coordenadas FROM trazado_red ORDER BY id ASC");

$data = [];
while ($row = $res->fetch_assoc()) {
    $row['coordenadas'] = json_decode($row['coordenadas'], true);
    $data[] = $row;
}
$conn->close();

echo json_encode(["error" => false, "data" => $data, "total" => count($data)]);
