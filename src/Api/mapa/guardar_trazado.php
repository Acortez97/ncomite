<?php
/**
 * guardar_trazado.php — Guarda una tubería (línea) dibujada manualmente
 *   { "nombre":"Ramal X", "descripcion":"Tubo 2\"", "sector":1, "coordenadas":[[lat,lng],...] }
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => true, "message" => "Method Not Allowed"]);
    exit;
}

$session    = verificarToken($conn);
$creado_por = (int)$session['id_usuario'];

$input  = json_decode(file_get_contents("php://input"), true);
$nombre = trim($input['nombre'] ?? '');
$desc   = trim($input['descripcion'] ?? '');
$sector = isset($input['sector']) && in_array((int)$input['sector'], [1,2,3], true) ? (int)$input['sector'] : null;
$coords = $input['coordenadas'] ?? [];

if (!$nombre || !is_array($coords) || count($coords) < 2) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "Nombre y al menos 2 puntos son requeridos"]);
    exit;
}

$coordsJson = json_encode($coords);
$stmt = $conn->prepare("
    INSERT INTO trazado_red (nombre, descripcion, sector, coordenadas, creado_por)
    VALUES (?, ?, ?, ?, ?)
");
$stmt->bind_param("ssisi", $nombre, $desc, $sector, $coordsJson, $creado_por);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["error" => true, "message" => "Error al guardar: " . $stmt->error]);
    $stmt->close(); $conn->close(); exit;
}

$id = $stmt->insert_id;
$stmt->close();
$conn->close();
echo json_encode(["error" => false, "message" => "Tubería guardada", "id" => $id]);
