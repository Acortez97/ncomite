-- Ejecutar en phpMyAdmin para permitir válvulas sin contrato
ALTER TABLE ubicaciones
  MODIFY id_contrato INT NULL,
  DROP FOREIGN KEY fk_ubic_contrato;

ALTER TABLE ubicaciones
  ADD CONSTRAINT fk_ubic_contrato
    FOREIGN KEY (id_contrato) REFERENCES contratos(id_contrato)
    ON DELETE CASCADE;
