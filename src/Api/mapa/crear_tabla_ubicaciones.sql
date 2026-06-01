-- ============================================================
--  Módulo Mapa de Tomas de Agua — ncomite
--  Ejecutar una sola vez en phpMyAdmin / MySQL de GoDaddy
-- ============================================================

CREATE TABLE IF NOT EXISTS ubicaciones (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    id_contrato     INT             NOT NULL,
    tipo            ENUM('cliente','valvula') NOT NULL DEFAULT 'cliente',
    sector          TINYINT         NOT NULL DEFAULT 1 COMMENT '1, 2 o 3',
    latitud         DECIMAL(10, 7)  NOT NULL,
    longitud        DECIMAL(10, 7)  NOT NULL,
    notas           VARCHAR(255)    NULL,
    creado_por      INT             NOT NULL COMMENT 'id_usuario del instalador',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_contrato  (id_contrato),
    INDEX idx_tipo      (tipo),
    INDEX idx_sector    (sector),

    CONSTRAINT fk_ubic_contrato
        FOREIGN KEY (id_contrato) REFERENCES contratos(id_contrato)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
