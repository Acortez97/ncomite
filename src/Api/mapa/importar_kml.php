<?php
/**
 * importar_kml.php — Importación de puntos desde Google Maps (KML)
 *
 * ESTADO: PREPARADO — no activo hasta recibir el archivo KML exportado.
 * Cuando el archivo esté disponible se ajustarán los campos de cruce con la BD.
 *
 * Flujo esperado:
 *   1. Admin sube el archivo KML desde el panel de importación.
 *   2. Este script parsea cada <Placemark>, extrae nombre + coordenadas.
 *   3. Intenta cruzar el nombre con num_contrato en la tabla contratos.
 *   4. Los que coinciden se insertan en ubicaciones directamente.
 *   5. Los que no coinciden se devuelven en "sin_cruce" para revisión manual.
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
$creado_por = (int)$session['id_usuario'];

// ── Recibir archivo ────────────────────────────────────────────
if (empty($_FILES['kml']) || $_FILES['kml']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "Archivo KML requerido"]);
    exit;
}

$ext = strtolower(pathinfo($_FILES['kml']['name'], PATHINFO_EXTENSION));
if ($ext !== 'kml') {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "Solo se aceptan archivos .kml"]);
    exit;
}

$kmlContent = file_get_contents($_FILES['kml']['tmp_name']);
if (!$kmlContent) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "No se pudo leer el archivo"]);
    exit;
}

// ── Parsear KML ────────────────────────────────────────────────
libxml_use_internal_errors(true);
$xml = simplexml_load_string($kmlContent);
if (!$xml) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "KML inválido o mal formado"]);
    exit;
}

$xml->registerXPathNamespace('kml', 'http://www.opengis.net/kml/2.2');
$placemarks = $xml->xpath('//kml:Placemark') ?: $xml->xpath('//Placemark');

if (empty($placemarks)) {
    echo json_encode(["error" => false, "message" => "No se encontraron puntos en el KML", "insertados" => 0, "sin_cruce" => []]);
    exit;
}

$insertados = 0;
$sin_cruce  = [];

$stmtBuscar = $conn->prepare("
    SELECT id_contrato FROM contratos WHERE num_contrato = ? LIMIT 1
");

$stmtInsertar = $conn->prepare("
    INSERT INTO ubicaciones (id_contrato, tipo, sector, latitud, longitud, notas, creado_por)
    VALUES (?, 'cliente', 1, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE latitud = VALUES(latitud), longitud = VALUES(longitud)
");

foreach ($placemarks as $pm) {
    $nombre = trim((string)($pm->name ?? ''));
    $coordStr = trim((string)($pm->Point->coordinates ?? ''));

    if (!$coordStr) continue;

    // KML: longitud,latitud,altitud
    $parts = explode(',', $coordStr);
    if (count($parts) < 2) continue;

    $longitud = (float)$parts[0];
    $latitud  = (float)$parts[1];

    // TODO (ajustar cuando llegue el KML real):
    // Aquí se extrae el num_contrato del nombre del punto.
    // Por ahora asume que el nombre ES el número de contrato.
    $num_contrato = $nombre;

    $stmtBuscar->bind_param("s", $num_contrato);
    $stmtBuscar->execute();
    $row = $stmtBuscar->get_result()->fetch_assoc();

    if (!$row) {
        $sin_cruce[] = ["nombre" => $nombre, "lat" => $latitud, "lng" => $longitud];
        continue;
    }

    $id_contrato = (int)$row['id_contrato'];
    $notas = "Importado desde Google Maps";

    $stmtInsertar->bind_param("iddsi", $id_contrato, $latitud, $longitud, $notas, $creado_por);
    $stmtInsertar->execute();
    $insertados++;
}

$stmtBuscar->close();
$stmtInsertar->close();
$conn->close();

echo json_encode([
    "error"      => false,
    "message"    => "Importación completada",
    "insertados" => $insertados,
    "sin_cruce"  => $sin_cruce,
    "total_kml"  => count($placemarks),
]);
