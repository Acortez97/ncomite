<?php
/**
 * eliminar_elemento.php — Elimina una ubicación o una tubería por id
 *   { "tabla": "ubicaciones" | "trazado_red", "id": 12 }
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => true, "message" => "Method Not Allowed"]);
    exit;
}

$session = verificarToken($conn);
if ($session['tipo'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["error" => true, "message" => "Solo administradores pueden eliminar"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$tabla = $input['tabla'] ?? '';
$id    = (int)($input['id'] ?? 0);

// Whitelist estricta de tablas permitidas
if (!in_array($tabla, ['ubicaciones', 'trazado_red'], true)) {
    http_response_code(403);
    echo json_encode(["error" => true, "message" => "Tabla no permitida"]);
    exit;
}
if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "id requerido"]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM `$tabla` WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$borrado = $stmt->affected_rows;
$stmt->close();
$conn->close();

if ($borrado === 0) {
    http_response_code(404);
    echo json_encode(["error" => true, "message" => "No se encontró el elemento"]);
    exit;
}

echo json_encode(["error" => false, "message" => "Elemento eliminado"]);
