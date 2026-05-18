<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once "../db.php";

$input = json_decode(file_get_contents("php://input"), true);

$years  = $input["years"] ?? [];
$months = $input["months"] ?? [];
$singleYear  = $input["year"] ?? null;
$singleMonth = $input["month"] ?? null;

// ----------------------------
// FUNCIÓN WHERE (YA CON STATUS)
// ----------------------------
function buildWhere($campoFecha, $year, $month, $years, $months) {
    $where = "status = 1"; // 👈 AQUI EL CAMBIO IMPORTANTE

    if ($years && count($years) > 0) {
        $yrs = implode(",", $years);
        $where .= " AND YEAR($campoFecha) IN ($yrs)";
    }
    else if ($year) {
        $where .= " AND YEAR($campoFecha) = '$year'";
    }

    if ($months && count($months) > 0) {
        $ms = implode(",", $months);
        $where .= " AND MONTH($campoFecha) IN ($ms)";
    }
    else if ($month) {
        $where .= " AND MONTH($campoFecha) = '$month'";
    }

    return $where;
}

$data_detallada = [];

// --------------------------
// 1. PAGOS (anualidades)
// --------------------------
$wherePagos = "status = 1"; // 👈 AQUI

if ($singleYear) $wherePagos .= " AND anio_pago = '$singleYear'";
if ($singleMonth) $wherePagos .= " AND MONTH(fecha_registro) = '$singleMonth'";

if ($years) {
    $yrs = implode(",", $years);
    $wherePagos .= " AND anio_pago IN ($yrs)";
}

if ($months) {
    $ms = implode(",", $months);
    $wherePagos .= " AND MONTH(fecha_registro) IN ($ms)";
}

$sql = "SELECT monto_pago AS monto, fecha_registro AS fecha, anio_pago AS anio 
        FROM pagos WHERE $wherePagos";

$res = $conn->query($sql);
$totalPagos = 0;

while ($row = $res->fetch_assoc()) {
    $row["tipo"] = "Anualidad";
    $data_detallada[] = $row;
    $totalPagos += $row["monto"];
}

// --------------------------
// 2. APORTACIONES
// --------------------------
$where = buildWhere("fecha_aportacion", $singleYear, $singleMonth, $years, $months);

$sql = "SELECT monto, fecha_aportacion AS fecha 
        FROM aportacion_voluntaria WHERE $where";

$res = $conn->query($sql);
$totalApo = 0;

while ($row = $res->fetch_assoc()) {
    $row["tipo"] = "Aportación voluntaria";
    $row["anio"] = date("Y", strtotime($row["fecha"]));
    $data_detallada[] = $row;
    $totalApo += $row["monto"];
}

// --------------------------
// 3. CONTRATOS
// --------------------------
$where = buildWhere("fecha_contrato", $singleYear, $singleMonth, $years, $months);

$sql = "SELECT monto, fecha_contrato AS fecha 
        FROM pagos_contratos WHERE $where";

$res = $conn->query($sql);
$totalContratos = 0;

while ($row = $res->fetch_assoc()) {
    $row["tipo"] = "Contrato nuevo / Reposición";
    $row["anio"] = date("Y", strtotime($row["fecha"]));
    $data_detallada[] = $row;
    $totalContratos += $row["monto"];
}

// --------------------------
// 4. SALIDAS
// --------------------------
$where = buildWhere("fecha", $singleYear, $singleMonth, $years, $months);

$sql = "SELECT monto, fecha 
        FROM salidas WHERE $where";

$res = $conn->query($sql);
$totalSalidas = 0;

while ($row = $res->fetch_assoc()) {
    $row["tipo"] = "Salida";
    $row["anio"] = date("Y", strtotime($row["fecha"]));
    $data_detallada[] = $row;
    $totalSalidas += $row["monto"];
}

// --------------------------
// CÁLCULOS
// --------------------------
$ingresos = $totalPagos + $totalApo + $totalContratos;
$restante = $ingresos - $totalSalidas;

echo json_encode([
    "categorias" => [
        ["name" => "Anualidades", "monto" => $totalPagos],
        ["name" => "Aportaciones voluntarias", "monto" => $totalApo],
        ["name" => "Contratos nuevos/reposiciones", "monto" => $totalContratos],
        ["name" => "Salidas", "monto" => $totalSalidas],
    ],
    "detalles" => [
        "ingresos" => $ingresos,
        "salidas"  => $totalSalidas,
        "restante" => $restante
    ],
    "tabla" => $data_detallada
]);
?>