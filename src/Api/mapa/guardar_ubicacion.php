<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => true, "message" => "Method Not Allowed"]);
    exit;
}

$session    = verificarToken($conn);
$input      = json_decode(file_get_contents("php://input"), true);
$tipo       = $input['tipo']   ?? 'cliente';
$sector     = isset($input['sector'])   ? (int)$input['sector']   : 1;
$latitud    = isset($input['latitud'])  ? (float)$input['latitud']  : null;
$longitud   = isset($input['longitud']) ? (float)$input['longitud'] : null;
$notas      = trim($input['notas'] ?? '');
$creado_por = (int)$session['id_usuario'];

if ($latitud === null || $longitud === null) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "latitud y longitud son requeridas"]);
    exit;
}

if (!in_array($tipo, ['cliente', 'valvula'], true)) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "tipo invalido"]);
    exit;
}

if (!in_array($sector, [1, 2, 3], true)) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "sector invalido"]);
    exit;
}

// ══════════════════════════════════════════════════════════════
//  VÁLVULA — siempre inserta nueva, nunca actualiza
// ══════════════════════════════════════════════════════════════
if ($tipo === 'valvula') {
    $stmt = $conn->prepare("
        INSERT INTO ubicaciones (tipo, sector, latitud, longitud, notas, creado_por)
        VALUES ('valvula', ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("iddsi", $sector, $latitud, $longitud, $notas, $creado_por);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["error" => true, "message" => "Error al guardar válvula: " . $stmt->error]);
        $stmt->close(); $conn->close(); exit;
    }

    $id = $stmt->insert_id;
    $stmt->close();
    $conn->close();
    echo json_encode(["error" => false, "message" => "Válvula guardada", "id" => $id]);
    exit;
}

// ══════════════════════════════════════════════════════════════
//  CLIENTE — requiere contrato, actualiza si ya existe
// ══════════════════════════════════════════════════════════════
$id_contrato = isset($input['id_contrato']) && $input['id_contrato'] ? (int)$input['id_contrato'] : 0;

if (!$id_contrato) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "id_contrato requerido para clientes"]);
    exit;
}

$check = $conn->prepare("SELECT id FROM ubicaciones WHERE id_contrato = ? AND tipo = 'cliente' LIMIT 1");
$check->bind_param("i", $id_contrato);
$check->execute();
$existing = $check->get_result()->fetch_assoc();
$check->close();

if ($existing) {
    $stmt = $conn->prepare("
        UPDATE ubicaciones SET latitud=?, longitud=?, sector=?, notas=?, creado_por=?
        WHERE id=?
    ");
    $stmt->bind_param("ddiisi", $latitud, $longitud, $sector, $notas, $creado_por, $existing['id']);
    $stmt->execute();
    $id  = $existing['id'];
    $msg = "Ubicacion actualizada";
} else {
    $stmt = $conn->prepare("
        INSERT INTO ubicaciones (id_contrato, tipo, sector, latitud, longitud, notas, creado_por)
        VALUES (?, 'cliente', ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("iiddsi", $id_contrato, $sector, $latitud, $longitud, $notas, $creado_por);
    $stmt->execute();
    $id  = $stmt->insert_id;
    $msg = "Ubicacion guardada";
}

$stmt->close();
$conn->close();
echo json_encode(["error" => false, "message" => $msg, "id" => $id]);
