<?php
/**
 * security.php — Helper de seguridad compartido
 * Incluir con: require "security.php"      (desde api/)
 *              require "../security.php"   (desde api/Selectgeneric/, Insertgeneric/, etc.)
 */

// ══════════════════════════════════════════════════════════════
//  WHITELIST DE TABLAS PERMITIDAS
// ══════════════════════════════════════════════════════════════

define('TABLAS_PERMITIDAS', [
    'usuarios',
    'contratos',
    'pagos',
    'adeudos',
    'salidas',
    'aportacion_voluntaria',
    'clientes_login',
    'user_admin',
    'roles',
    'ubicaciones',
    'trazado_red',
]);

/**
 * Valida que un nombre de tabla simple esté en la whitelist.
 * Uso: Select_Gen, SelectWithWhere, insert, update_generic
 */
function validarTabla(string $tabla): bool {
    return in_array(strtolower(trim($tabla)), TABLAS_PERMITIDAS, true);
}

/**
 * Valida una expresión de tabla que puede contener JOINs.
 * Extrae el nombre de la tabla principal y los de cada JOIN
 * y verifica que todos estén en la whitelist.
 *
 * Ejemplo de entrada:
 *   "pagos p LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
 *    LEFT JOIN contratos c ON p.id_contrato = c.id_contrato"
 */
function validarTablaJoin(string $tableExpr): bool {
    // Extraer la primera palabra (tabla principal) y las palabras inmediatamente
    // después de cada JOIN (tabla secundaria), ignorando alias de 1-2 letras.
    preg_match_all(
        '/(?:^|\bJOIN\s+)([a-zA-Z_][a-zA-Z0-9_]*)/i',
        trim($tableExpr),
        $matches
    );

    $tablas = $matches[1] ?? [];

    // Debe haber al menos una tabla
    if (empty($tablas)) return false;

    foreach ($tablas as $tabla) {
        if (!in_array(strtolower($tabla), TABLAS_PERMITIDAS, true)) {
            return false;
        }
    }

    return true;
}

// ══════════════════════════════════════════════════════════════
//  RATE LIMITING DE LOGIN
// ══════════════════════════════════════════════════════════════

define('RL_MAX_INTENTOS',   5);   // Máximo de fallos permitidos
define('RL_VENTANA_MIN',   15);   // Ventana de tiempo en minutos
define('RL_BLOQUEO_MIN',   15);   // Minutos de bloqueo tras superar el límite

/**
 * Crea la tabla login_intentos si no existe.
 * Se llama una sola vez al inicio del script de login.
 */
function rl_crearTabla(mysqli $conn): void {
    $conn->query("
        CREATE TABLE IF NOT EXISTS login_intentos (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            ip              VARCHAR(45)  NOT NULL,
            intentos        INT          NOT NULL DEFAULT 0,
            ultimo_intento  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            bloqueado_hasta DATETIME              DEFAULT NULL,
            INDEX idx_ip (ip)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

/**
 * Devuelve la IP real del cliente, considerando proxies.
 */
function rl_obtenerIp(): string {
    foreach (['HTTP_X_FORWARDED_FOR','HTTP_CLIENT_IP','REMOTE_ADDR'] as $h) {
        if (!empty($_SERVER[$h])) {
            // X-Forwarded-For puede tener varias IPs separadas por coma
            $ip = trim(explode(',', $_SERVER[$h])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

/**
 * Verifica si la IP está bloqueada.
 * Retorna true si debe bloquearse (responde 429 automáticamente).
 */
function rl_estaBloqueado(mysqli $conn, string $ip): bool {
    $stmt = $conn->prepare(
        "SELECT intentos, bloqueado_hasta FROM login_intentos WHERE ip = ? LIMIT 1"
    );
    $stmt->bind_param("s", $ip);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) return false;

    // ¿Hay bloqueo activo?
    if ($row['bloqueado_hasta'] !== null) {
        $ahora    = new DateTime();
        $bloqueo  = new DateTime($row['bloqueado_hasta']);
        if ($ahora < $bloqueo) {
            $restantes = ceil(($bloqueo->getTimestamp() - $ahora->getTimestamp()) / 60);
            http_response_code(429);
            echo json_encode([
                "error"   => true,
                "message" => "Demasiados intentos fallidos. Intenta de nuevo en {$restantes} minuto(s)."
            ]);
            exit;
        }
        // El bloqueo ya expiró: limpiar el registro
        rl_resetear($conn, $ip);
        return false;
    }

    return false;
}

/**
 * Registra un intento fallido.
 * Si supera el límite, activa el bloqueo.
 */
function rl_registrarFallo(mysqli $conn, string $ip): void {
    $ventana  = date('Y-m-d H:i:s', strtotime("-" . RL_VENTANA_MIN . " minutes"));
    $bloqueoHasta = date('Y-m-d H:i:s', strtotime("+" . RL_BLOQUEO_MIN . " minutes"));

    // ¿Existe registro para esta IP?
    $stmt = $conn->prepare(
        "SELECT id, intentos, ultimo_intento FROM login_intentos WHERE ip = ? LIMIT 1"
    );
    $stmt->bind_param("s", $ip);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        // Primer intento: insertar
        $stmt = $conn->prepare(
            "INSERT INTO login_intentos (ip, intentos, ultimo_intento) VALUES (?, 1, NOW())"
        );
        $stmt->bind_param("s", $ip);
        $stmt->execute();
        $stmt->close();
        return;
    }

    // Si el último intento fue fuera de la ventana, reiniciar contador
    if ($row['ultimo_intento'] < $ventana) {
        rl_resetear($conn, $ip);
        $nuevosIntentos = 1;
    } else {
        $nuevosIntentos = $row['intentos'] + 1;
    }

    if ($nuevosIntentos >= RL_MAX_INTENTOS) {
        // Activar bloqueo
        $stmt = $conn->prepare(
            "UPDATE login_intentos
             SET intentos = ?, ultimo_intento = NOW(), bloqueado_hasta = ?
             WHERE ip = ?"
        );
        $stmt->bind_param("iss", $nuevosIntentos, $bloqueoHasta, $ip);
        $stmt->execute();
        $stmt->close();
    } else {
        // Solo actualizar contador
        $stmt = $conn->prepare(
            "UPDATE login_intentos
             SET intentos = ?, ultimo_intento = NOW(), bloqueado_hasta = NULL
             WHERE ip = ?"
        );
        $stmt->bind_param("is", $nuevosIntentos, $ip);
        $stmt->execute();
        $stmt->close();
    }
}

/**
 * Reinicia el contador de una IP tras login exitoso o bloqueo expirado.
 */
function rl_resetear(mysqli $conn, string $ip): void {
    $stmt = $conn->prepare(
        "DELETE FROM login_intentos WHERE ip = ?"
    );
    $stmt->bind_param("s", $ip);
    $stmt->execute();
    $stmt->close();
}
