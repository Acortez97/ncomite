-- ============================================================
--  Ampliación del módulo Mapa — tipos de infraestructura,
--  sector opcional y trazado de la red (líneas)
--  Ejecutar una sola vez en phpMyAdmin / MySQL de GoDaddy
-- ============================================================

-- 1) Ampliar tipos de ubicación: además de cliente y válvula,
--    ahora también tubo y conexión (T / Y).
ALTER TABLE ubicaciones
  MODIFY tipo ENUM('cliente','valvula','tubo','conexion')
         NOT NULL DEFAULT 'cliente';

-- 2) Permitir sector NULL = "pendiente / sin cuadrante asignado".
ALTER TABLE ubicaciones
  MODIFY sector TINYINT NULL DEFAULT NULL COMMENT '1,2,3 o NULL si aún no se asigna';

-- 3) Tabla para el trazado de la red (tuberías / ramales = líneas).
CREATE TABLE IF NOT EXISTS trazado_red (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(150)  NOT NULL,
    descripcion  VARCHAR(255)  NULL,
    sector       TINYINT       NULL COMMENT '1,2,3 o NULL',
    coordenadas  MEDIUMTEXT    NOT NULL COMMENT 'JSON: [[lat,lng],[lat,lng],...]',
    creado_por   INT           NOT NULL,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sector (sector)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
