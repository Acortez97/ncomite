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

$num_contrato = trim($_GET['num_contrato'] ?? '');
if (!$num_contrato) {
    http_response_code(400);
    echo json_encode(["error" => true, "message" => "Parámetro num_contrato requerido"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT
        c.id_contrato,
        c.num_contrato,
        c.Fecha_contrato,
        c.status,
        u.Nombre,
        u.Apellido_pat,
        u.Apellido_mat,
        u.domicilio,
        u.num_celular,
        COUNT(DISTINCT a.id_adeudo) AS anios_deuda
    FROM contratos c
    INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
    LEFT JOIN adeudos a ON a.id_contrato = c.id_contrato AND a.estado = 'pendiente'
    WHERE c.num_contrato = ?
    GROUP BY c.id_contrato
    LIMIT 1
");
$stmt->bind_param("s", $num_contrato);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();
$conn->close();

if (!$row) {
    http_response_code(404);
    echo json_encode(["error" => true, "message" => "Contrato no encontrado"]);
    exit;
}

echo json_encode(["error" => false, "data" => $row]);
