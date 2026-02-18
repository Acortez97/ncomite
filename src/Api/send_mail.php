<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$nombre = $data["nombre"] ?? "";
$correo = $data["correo"] ?? "";
$telefono = $data["telefono"] ?? "";
$mensaje = $data["mensaje"] ?? "";

if (empty($nombre) || empty($correo) || empty($mensaje)) {
    echo json_encode(["error" => "Faltan datos obligatorios"]);
    exit;
}

$destino = "sangasparcomitedelagua@gmail.com"; // ← correo destino

$asunto = "Mensaje desde portal cliente";

$cuerpo = "
Nombre: $nombre
Correo: $correo
Teléfono: $telefono

Mensaje:
$mensaje
";

$headers = "From: $correo";

if (mail($destino, $asunto, $cuerpo, $headers)) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "No se pudo enviar"]);
}
