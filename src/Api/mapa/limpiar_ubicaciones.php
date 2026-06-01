<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(["error" => true, "message" => "Method Not Allowed"]);
    exit;
}

$session = verificarToken($conn);

// Solo admin puede limpiar
if ($session['tipo'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["error" => true, "message" => "Solo administradores pueden limpiar el mapa"]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM ubicaciones");
$stmt->execute();
$eliminados = $stmt->affected_rows;
$stmt->close();
$conn->close();

echo json_encode([
    "error"      => false,
    "message"    => "Mapa limpiado correctamente",
    "eliminados" => $eliminados
]);
