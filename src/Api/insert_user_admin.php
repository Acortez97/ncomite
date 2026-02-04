<?php
header("Content-Type: application/json");
require "../db.php"; // conexión

$input = json_decode(file_get_contents("php://input"), true);

$usuario = $input["usuario"] ?? "";
$pass = $input["pass"] ?? "";
$id_rol = $input["id_rol"] ?? "";
$nombre = $input["nombre"] ?? "";
$apellido = $input["apellido"] ?? "";
$status = $input["status"] ?? 1;
$fecha = $input["fecha_creacion"] ?? date("Y-m-d");

if (!$usuario || !$pass || !$id_rol) {
    echo json_encode(["error" => "Faltan campos obligatorios"]);
    exit;
}

$passMd5 = md5($pass);

$sql = "INSERT INTO user_admin (usuario, pass, id_rol, status, fecha_creacion, nombre, apellido)
        VALUES (?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("sssisss", $usuario, $passMd5, $id_rol, $status, $fecha, $nombre, $apellido);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "id" => $conn->insert_id]);
} else {
    echo json_encode(["error" => $conn->error]);
}
$stmt->close();
$conn->close();