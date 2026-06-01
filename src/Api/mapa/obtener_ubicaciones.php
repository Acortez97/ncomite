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

$sector = isset($_GET['sector']) ? (int)$_GET['sector'] : null;
$tipo   = $_GET['tipo'] ?? null;

$where  = [];
$params = [];
$types  = '';

if ($sector && in_array($sector, [1, 2, 3], true)) {
    $where[]  = "ub.sector = ?";
    $params[] = $sector;
    $types   .= 'i';
}

if ($tipo && in_array($tipo, ['cliente', 'valvula'], true)) {
    $where[]  = "ub.tipo = ?";
    $params[] = $tipo;
    $types   .= 's';
}

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$sql = "
    SELECT
        ub.id,
        ub.id_contrato,
        ub.tipo,
        ub.sector,
        ub.latitud,
        ub.longitud,
        ub.notas,
        ub.updated_at,
        c.num_contrato,
        u.Nombre,
        u.Apellido_pat,
        u.Apellido_mat,
        u.domicilio,
        u.num_celular,
        COUNT(DISTINCT a.id_adeudo) AS anios_deuda
    FROM ubicaciones ub
    LEFT JOIN contratos c ON ub.id_contrato = c.id_contrato
    LEFT JOIN usuarios u  ON c.id_usuario   = u.id_usuario
    LEFT JOIN adeudos a   ON a.id_contrato  = c.id_contrato AND a.estado = 'pendiente'
    $whereClause
    GROUP BY ub.id
    ORDER BY ub.sector ASC, u.Apellido_pat ASC
";

$stmt = $conn->prepare($sql);

if ($params) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode(["error" => false, "data" => $data, "total" => count($data)]);
