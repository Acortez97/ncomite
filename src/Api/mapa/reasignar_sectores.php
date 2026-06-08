<?php
/**
 * reasignar_sectores.php — Actualiza el sector de ubicaciones y trazado
 *
 * El frontend calcula el sector de cada elemento por geometría (con los
 * cuadrantes dibujados) y envía las actualizaciones en lote:
 *   {
 *     "ubicaciones": [ { "id": 12, "sector": 1 }, { "id": 13, "sector": null } ],
 *     "lineas":      [ { "id": 3,  "sector": 2 } ]
 *   }
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
    echo json_encode(["error" => true, "message" => "Solo administradores"]);
    exit;
}

$input       = json_decode(file_get_contents("php://input"), true);
$ubicaciones = $input['ubicaciones'] ?? [];
$lineas      = $input['lineas'] ?? [];

$updUbic  = $conn->prepare("UPDATE ubicaciones SET sector = ? WHERE id = ?");
$updLinea = $conn->prepare("UPDATE trazado_red SET sector = ? WHERE id = ?");

$nUbic = 0;
foreach ($ubicaciones as $u) {
    $id     = (int)($u['id'] ?? 0);
    $sector = isset($u['sector']) && in_array((int)$u['sector'], [1,2,3], true) ? (int)$u['sector'] : null;
    if (!$id) continue;
    $updUbic->bind_param("ii", $sector, $id);
    $updUbic->execute();
    $nUbic++;
}

$nLinea = 0;
foreach ($lineas as $l) {
    $id     = (int)($l['id'] ?? 0);
    $sector = isset($l['sector']) && in_array((int)$l['sector'], [1,2,3], true) ? (int)$l['sector'] : null;
    if (!$id) continue;
    $updLinea->bind_param("ii", $sector, $id);
    $updLinea->execute();
    $nLinea++;
}

$updUbic->close();
$updLinea->close();
$conn->close();

echo json_encode([
    "error"               => false,
    "message"             => "Sectores reasignados",
    "ubicaciones_actualizadas" => $nUbic,
    "lineas_actualizadas"      => $nLinea,
]);
