-- 1. Agregar las nuevas columnas para la validación de Caja y Folio de origen
ALTER TABLE `factura` 
ADD COLUMN `ticket_caja` VARCHAR(10) NULL DEFAULT NULL AFTER `observaciones`,
ADD COLUMN `ticket_folio` VARCHAR(30) NULL DEFAULT NULL AFTER `ticket_caja`;

-- 2. Crear un índice compuesto para agilizar búsquedas de duplicados
CREATE INDEX `ix_factura_ticket_origen` ON `factura` (`ticket_caja`, `ticket_folio`, `fecha_registro`);

-- 3. Migración histórica (Backfill)
-- Solo se aplica a las facturas que tengan la estructura "Caja-Folio: XX-XXXXX" en sus observaciones.
-- Nota: SUBSTRING_INDEX extrae la porción de texto antes o después de un delimitador.
UPDATE `factura`
SET 
  -- Extrae el número de caja (lo que está entre "Caja-Folio: " y el guión "-")
  `ticket_caja` = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(observaciones, 'Caja-Folio: ', -1), '-', 1)),
  -- Extrae el folio (lo que está entre el guión "-" de la caja y el pipe " |")
  `ticket_folio` = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(observaciones, 'Caja-Folio: ', -1), ' |', 1), '-', -1))
WHERE `observaciones` LIKE '%Caja-Folio: %';
