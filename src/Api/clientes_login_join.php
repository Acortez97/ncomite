<?php
header("Content-Type: application/json");
require "../db.php";

// Usamos LEFT JOIN para traer a TODOS los usuarios, existan o no en login
$sql = "
SELECT 
    u.id_usuario,
    u.nombre,
    u.apellido_pat,
    u.apellido_mat,
    cl.id_login,
    cl.usuario AS usuario_login,
    cl.status AS login_status
FROM usuarios u
LEFT JOIN clientes_login cl 
    ON u.id_usuario = cl.id_usuario
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        "error" => "Error en la consulta",
        "sql_error" => $conn->error
    ]);
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
$conn->close();
?>