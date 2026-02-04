<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "message" => "Método no permitido"
    ]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$usuarios = $input['usuarios'] ?? null;

if (!is_array($usuarios) || count($usuarios) === 0) {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "message" => "No se enviaron usuarios"
    ]);
    exit;
}

try {
    // Preparamos el statement UNA sola vez (mucho más eficiente)
    $sql = "
        INSERT INTO usuarios
        (Nombre, Apellido_pat, Apellido_mat, num_celular, correo, domicilio, fecha_creacion, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Error al preparar la consulta");
    }

    $count = 0;

    foreach ($usuarios as $usuario) {
        // Validación mínima
        if (empty($usuario['Nombre']) || empty($usuario['fecha_creacion'])) {
            continue; // saltamos registros inválidos
        }

        $Nombre         = $usuario['Nombre'];
        $Apellido_pat   = $usuario['Apellido_pat']   ?? null;
        $Apellido_mat   = $usuario['Apellido_mat']   ?? null;
        $num_celular    = $usuario['num_celular']    ?? null;
        $correo         = $usuario['correo']         ?? null;
        $domicilio      = $usuario['domicilio']      ?? null;
        $fecha_creacion = $usuario['fecha_creacion'];

        $stmt->bind_param(
            "sssssss",
            $Nombre,
            $Apellido_pat,
            $Apellido_mat,
            $num_celular,
            $correo,
            $domicilio,
            $fecha_creacion
        );

        if ($stmt->execute()) {
            $count++;
        }
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        "message" => "Usuarios importados correctamente",
        "count"   => $count
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "message" => "Error en servidor",
        "details" => $e->getMessage()
    ]);
}
