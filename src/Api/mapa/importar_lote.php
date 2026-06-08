<?php
/**
 * importar_lote.php — Importación masiva de ubicaciones y trazado
 *
 * Recibe del frontend (que ya parseó el KML y detectó sector por geometría):
 *   {
 *     "ubicaciones": [
 *       { "tipo":"cliente", "num_contrato":"1001", "lat":19.23, "lng":-99.54, "sector":1, "notas":"" },
 *       { "tipo":"valvula", "lat":..., "lng":..., "sector":1, "notas":"Valvula 3\"" },
 *       { "tipo":"tubo|conexion", ... }
 *     ],
 *     "lineas": [
 *       { "nombre":"Ramal 5", "descripcion":"Tubo 2\"", "sector":1, "coordenadas":[[lat,lng],...] }
 *     ]
 *   }
 *
 * Para clientes cruza num_contrato → id_contrato. Los que no existen se reportan.
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

if ($session['tipo'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["error" => true, "message" => "Solo administradores pueden importar"]);
    exit;
}

$input      = json_decode(file_get_contents("php://input"), true);
$ubicaciones = $input['ubicaciones'] ?? [];
$lineas      = $input['lineas'] ?? [];

if (!is_array($ubicaciones) && !is_array($lineas)) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "Datos inválidos"]);
    exit;
}

$insertadosCliente = 0;
$insertadosInfra   = 0;
$insertadasLineas  = 0;
$sinContrato       = [];   // clientes cuyo num_contrato no existe en la BD

// Prepared statements reutilizables
$buscarContrato = $conn->prepare("SELECT id_contrato FROM contratos WHERE num_contrato = ? LIMIT 1");

$insCliente = $conn->prepare("
    INSERT INTO ubicaciones (id_contrato, tipo, sector, latitud, longitud, notas, creado_por)
    VALUES (?, 'cliente', ?, ?, ?, ?, ?)
");
$insInfra = $conn->prepare("
    INSERT INTO ubicaciones (tipo, sector, latitud, longitud, notas, creado_por)
    VALUES (?, ?, ?, ?, ?, ?)
");
$insLinea = $conn->prepare("
    INSERT INTO trazado_red (nombre, descripcion, sector, coordenadas, creado_por)
    VALUES (?, ?, ?, ?, ?)
");

foreach ($ubicaciones as $u) {
    $tipo   = $u['tipo'] ?? 'cliente';
    $lat    = isset($u['lat']) ? (float)$u['lat'] : null;
    $lng    = isset($u['lng']) ? (float)$u['lng'] : null;
    $sector = isset($u['sector']) && in_array((int)$u['sector'], [1,2,3], true) ? (int)$u['sector'] : null;
    $notas  = trim($u['notas'] ?? '');

    if ($lat === null || $lng === null) continue;

    if ($tipo === 'cliente') {
        $num = trim((string)($u['num_contrato'] ?? ''));
        if ($num === '') { $sinContrato[] = ['nombre' => $notas ?: '(sin nombre)', 'lat' => $lat, 'lng' => $lng]; continue; }

        $buscarContrato->bind_param("s", $num);
        $buscarContrato->execute();
        $row = $buscarContrato->get_result()->fetch_assoc();

        if (!$row) {
            $sinContrato[] = ['num_contrato' => $num, 'lat' => $lat, 'lng' => $lng];
            continue;
        }
        $idc = (int)$row['id_contrato'];
        // i(id) i(sector) d(lat) d(lng) s(notas) i(creado_por)
        $insCliente->bind_param("iiddsi", $idc, $sector, $lat, $lng, $notas, $creado_por);
        $insCliente->execute();
        $insertadosCliente++;
    } else {
        // valvula | tubo | conexion
        if (!in_array($tipo, ['valvula','tubo','conexion'], true)) $tipo = 'valvula';
        $insInfra->bind_param("siddsi", $tipo, $sector, $lat, $lng, $notas, $creado_por);
        $insInfra->execute();
        $insertadosInfra++;
    }
}

foreach ($lineas as $l) {
    $nombre = trim((string)($l['nombre'] ?? ''));
    $desc   = trim((string)($l['descripcion'] ?? ''));
    $sector = isset($l['sector']) && in_array((int)$l['sector'], [1,2,3], true) ? (int)$l['sector'] : null;
    $coords = $l['coordenadas'] ?? [];
    if (!$nombre || !is_array($coords) || count($coords) < 2) continue;
    $coordsJson = json_encode($coords);
    $insLinea->bind_param("ssisi", $nombre, $desc, $sector, $coordsJson, $creado_por);
    $insLinea->execute();
    $insertadasLineas++;
}

$buscarContrato->close();
$insCliente->close();
$insInfra->close();
$insLinea->close();
$conn->close();

echo json_encode([
    "error"               => false,
    "message"             => "Importación completada",
    "clientes_importados" => $insertadosCliente,
    "infra_importada"     => $insertadosInfra,
    "lineas_importadas"   => $insertadasLineas,
    "sin_contrato"        => $sinContrato,
    "total_sin_contrato"  => count($sinContrato),
]);
