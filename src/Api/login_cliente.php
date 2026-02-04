<?php
header("Content-Type: application/json");
require "db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$usuario = $input['usuario'] ?? null;
$pass = $input['pass'] ?? null;

if (!$usuario || !$pass) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos"]);
    exit;
}

// JOIN correcto con usuarios
$sql = "SELECT u.id_usuario, u.Nombre, u.Apellido_pat, u.Apellido_mat, u.num_celular, u.correo, u.domicilio
        FROM clientes_login cl
        JOIN usuarios u ON cl.id_usuario = u.id_usuario
        WHERE cl.usuario = ? AND cl.pass = ? AND cl.status = 1 AND u.status = 1";

$stmt = $conn->prepare($sql);
$passMd5 = md5($pass);
$stmt->bind_param("ss", $usuario, $passMd5);
$stmt->execute();

$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    http_response_code(401);
    echo json_encode(["message" => "Credenciales incorrectas"]);
    exit;
}

http_response_code(200);
echo json_encode([
    "message" => "Login exitoso",
    "user" => [
        "id_usuario" => $user['id_usuario'],
        "Nombre" => $user['Nombre'],
        "Apellido_pat" => $user['Apellido_pat'],
        "Apellido_mat" => $user['Apellido_mat'],
        "num_celular" => $user['num_celular'],
        "correo" => $user['correo'],
        "domicilio" => $user['domicilio'],
        "rol" => "cliente"
    ]
]);
?>
