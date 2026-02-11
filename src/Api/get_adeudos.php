<?php
header("Content-Type: application/json");
require "../db.php";

$input = json_decode(file_get_contents("php://input"), true);

$id_usuario  = $input["id_usuario"] ?? null;
$id_contrato = $input["id_contrato"] ?? null;

if(!$id_usuario || !$id_contrato){
    echo json_encode(["error" => "Faltan parámetros"]);
    exit;
}

$sql = "SELECT * FROM adeudos 
        WHERE id_usuario = ? 
        AND id_contrato = ?
        ORDER BY anio ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_contrato);
$stmt->execute();

$res = $stmt->get_result();
$rows = [];

while($row = $res->fetch_assoc()){
    $rows[] = $row;
}

echo json_encode($rows);
