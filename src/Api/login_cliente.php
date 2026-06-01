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

// Fetch without password check in SQL (to support bcrypt)
$sql = "
    SELECT cl.id_login, cl.pass,
           u.id_usuario, u.Nombre, u.Apellido_pat, u.Apellido_mat,
           u.num_celular, u.correo, u.domicilio
    FROM clientes_login cl
    JOIN usuarios u ON cl.id_usuario = u.id_usuario
    WHERE cl.usuario = ? AND cl.status = 1 AND u.status = 1
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
        $passwordOk = true;
        $esMd5      = true;
    }
}

if (!$passwordOk) {
    // ¿Las credenciales son válidas en el login de ADMINISTRADOR? (login equivocado)
    $chk = $conn->prepare("
        SELECT pass FROM user_admin WHERE usuario = ? AND status = 1 LIMIT 1
    ");
    $chk->bind_param("s", $usuario);
    $chk->execute();
    $otro = $chk->get_result()->fetch_assoc();
    $chk->close();

    if ($otro && (password_verify($pass, $otro['pass']) || md5($pass) === $otro['pass'])) {
        // Credenciales correctas pero en el login equivocado — no es un fallo real
        http_response_code(401);
        echo json_encode([
            "message"       => "Esta cuenta es de Administrador. Selecciona la pestaña \"Administrador\" para iniciar sesión.",
            "code"          => "WRONG_LOGIN",
            "tipo_correcto" => "admin"
        ]);
        exit;
    }

    rl_registrarFallo($conn, $ip);
    http_response_code(401);
    echo json_encode(["message" => "Credenciales incorrectas"]);
    exit;
}

// Upgrade legacy MD5 hash to bcrypt
if ($esMd5) {
    $newHash = password_hash($pass, PASSWORD_BCRYPT);
    $upd = $conn->prepare("UPDATE clientes_login SET pass = ? WHERE id_login = ?");
    $upd->bind_param("si", $newHash, $user['id_login']);
    $upd->execute();
    $upd->close();
}

// Login exitoso: limpiar rate limiting
rl_resetear($conn, $ip);

// Generate and store session token
$token = generarToken();
guardarSesion($conn, $token, (int)$user['id_usuario'], 'cliente');

http_response_code(200);
echo json_encode([
    "message" => "Login exitoso",
    "token"   => $token,
    "user" => [
        "id_usuario"   => $user['id_usuario'],
        "Nombre"       => $user['Nombre'],
        "Apellido_pat" => $user['Apellido_pat'],
        "Apellido_mat" => $user['Apellido_mat'],
        "num_celular"  => $user['num_celular'],
        "correo"       => $user['correo'],
        "domicilio"    => $user['domicilio'],
        "rol"          => "cliente",
        "token"        => $token,
    ]
]);
$conn->close();
