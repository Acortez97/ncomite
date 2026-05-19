<?php
header("Content-Type: application/json");
require "db.php";
require "security.php";
require "auth_check.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido"]);
    exit;
}

// ── Rate limiting ─────────────────────────────────────────────
rl_crearTabla($conn);
$ip = rl_obtenerIp();
rl_estaBloqueado($conn, $ip);
// ─────────────────────────────────────────────────────────────

$input   = json_decode(file_get_contents("php://input"), true);
$usuario = $input['usuario'] ?? null;
$pass    = $input['pass']    ?? null;

if (!$usuario || !$pass) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos"]);
    exit;
}

// Fetch user without checking password in SQL (to support bcrypt)
$sql = "
    SELECT
        u.idusers,
        u.usuario,
        u.Nombre,
        u.pass,
        u.permisos,
        r.nombre AS rol
    FROM user_admin u
    JOIN roles r ON r.id_rol = u.id_rol
    WHERE u.usuario = ?
      AND u.status = 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $usuario);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Verify password: bcrypt first, then MD5 fallback
$passwordOk = false;
$esMd5      = false;

if ($user) {
    if (password_verify($pass, $user['pass'])) {
        $passwordOk = true;
    } elseif (md5($pass) === $user['pass']) {
        // Legacy MD5 — upgrade to bcrypt automatically
        $passwordOk = true;
        $esMd5      = true;
    }
}

if (!$passwordOk) {
    rl_registrarFallo($conn, $ip);
    http_response_code(401);
    echo json_encode(["message" => "Credenciales incorrectas"]);
    exit;
}

// Upgrade legacy MD5 hash to bcrypt
if ($esMd5) {
    $newHash = password_hash($pass, PASSWORD_BCRYPT);
    $upd = $conn->prepare("UPDATE user_admin SET pass = ? WHERE idusers = ?");
    $upd->bind_param("si", $newHash, $user['idusers']);
    $upd->execute();
    $upd->close();
}

// Login exitoso: limpiar rate limiting
rl_resetear($conn, $ip);

// Generate and store session token
$token = generarToken();
guardarSesion($conn, $token, (int)$user['idusers'], 'admin');

echo json_encode([
    "message" => "Login exitoso",
    "token"   => $token,
    "user" => [
        "id"       => $user['idusers'],
        "usuario"  => $user['usuario'],
        "Nombre"   => $user['Nombre'] ?? $user['usuario'],
        "rol"      => $user['rol'],
        "tipo"     => "admin",
        "permisos" => $user['permisos'] ? json_decode($user['permisos'], true) : null,
        "token"    => $token,
    ]
]);
$conn->close();
