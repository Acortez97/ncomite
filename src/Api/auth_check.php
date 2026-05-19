<?php
/**
 * auth_check.php — Token-based authentication helpers
 *
 * Include this file after db.php in any endpoint that requires authentication.
 * Call verificarToken($conn) at the top of those endpoints.
 */

function crearTablaSesiones(mysqli $conn): void {
    $conn->query("CREATE TABLE IF NOT EXISTS sessions (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        token      VARCHAR(64)  NOT NULL UNIQUE,
        id_usuario INT          NOT NULL,
        tipo       VARCHAR(10)  NOT NULL,
        expires_at DATETIME     NOT NULL,
        INDEX idx_token (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function verificarToken(mysqli $conn): array {
    // Attempt to read Authorization header from multiple sources
    $auth = $_SERVER['HTTP_AUTHORIZATION']
         ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
         ?? '';

    if (!$auth && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (!preg_match('/^Bearer\s+(\S+)$/i', $auth, $m)) {
        http_response_code(401);
        echo json_encode(["error" => "No autorizado", "code" => "NO_TOKEN"]);
        exit;
    }

    $token = $m[1];

    $stmt = $conn->prepare(
        "SELECT id_usuario, tipo FROM sessions WHERE token = ? AND expires_at > NOW() LIMIT 1"
    );
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        http_response_code(401);
        echo json_encode(["error" => "Sesión expirada o inválida", "code" => "INVALID_TOKEN"]);
        exit;
    }

    return $row;
}

function generarToken(): string {
    return bin2hex(random_bytes(32)); // 64 hex chars
}

function guardarSesion(mysqli $conn, string $token, int $idUsuario, string $tipo): void {
    crearTablaSesiones($conn);
    // Expire in 8 hours
    $stmt = $conn->prepare(
        "INSERT INTO sessions (token, id_usuario, tipo, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))"
    );
    $stmt->bind_param("sis", $token, $idUsuario, $tipo);
    $stmt->execute();
    $stmt->close();
}
