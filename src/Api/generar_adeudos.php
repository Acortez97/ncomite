<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once "../db.php";

$input = json_decode(file_get_contents("php://input"), true);

$id_usuario = $input["id_usuario"] ?? null;
$id_contrato = $input["id_contrato"] ?? null;

if (!$id_usuario || !$id_contrato) {
    echo json_encode(["error" => "Faltan parámetros"]);
    exit;
}

$yearStart = 2018;
$yearEnd = intval(date("Y")); // Año actual

// =========================================
// 1) Consultar adeudos existentes
// =========================================
$sql = "SELECT anio FROM adeudos WHERE id_usuario = ? AND id_contrato = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_contrato);
$stmt->execute();
$result = $stmt->get_result();

$existentes = [];
while ($row = $result->fetch_assoc()) {
    $existentes[] = intval($row["anio"]);
}

// =========================================
// 2) Generar lista de todos los años que deben existir
// =========================================
$years = range($yearStart, $yearEnd);

// =========================================
// 3) Insertar SOLO los años faltantes
// =========================================
$insertados = [];

foreach ($years as $y) {
    if (!in_array($y, $existentes)) {

        $sql2 = "INSERT INTO adeudos (id_usuario, id_contrato, anio, estado, fecha_creacion)
                 VALUES (?, ?, ?, 'pendiente', NOW())";

        $stmt2 = $conn->prepare($sql2);
        $stmt2->bind_param("iii", $id_usuario, $id_contrato, $y);
        $stmt2->execute();

        $insertados[] = $y;
    }
}

echo json_encode([
    "mensaje" => "Adeudos generados correctamente",
    "insertados" => $insertados
]);
