-- Schema MySQL para la base de datos `facturacion`

CREATE DATABASE IF NOT EXISTS `facturacion` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `facturacion`;

CREATE TABLE IF NOT EXISTS `factura` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `serie` VARCHAR(10) NOT NULL,
  `folio` VARCHAR(20) NOT NULL,
  `observaciones` TEXT NULL,
  `rfc_receptor` VARCHAR(15) NOT NULL,
  `no_cliente` VARCHAR(20) NULL DEFAULT '',
  `razon_social` VARCHAR(255) NULL DEFAULT '',
  `fecha_facturacion` DATETIME NULL,
  `importe_tasa_cero` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `importe_exento` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `importe_gravable` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `importe_iva` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `forma_pago` VARCHAR(10) NULL DEFAULT '',
  `metodo_pago` VARCHAR(10) NULL DEFAULT '',
  `uso_cfdi` VARCHAR(10) NULL DEFAULT '',
  `cuenta_pago` VARCHAR(50) NULL DEFAULT '',
  `tipo_factura` VARCHAR(30) NOT NULL DEFAULT 'Normal',
  `estatus` VARCHAR(20) NOT NULL DEFAULT 'Activa',
  `usuario_cancela` VARCHAR(50) NULL DEFAULT NULL,
  `motivo_cancelacion` VARCHAR(255) NULL DEFAULT NULL,
  `fecha_cancelacion` DATETIME NULL DEFAULT NULL,
  `uuid` VARCHAR(40) NULL DEFAULT NULL,
  `uuid_relacionado` VARCHAR(40) NULL DEFAULT NULL,
  `xml` MEDIUMTEXT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX `ix_factura_serie_folio` (`serie`, `folio`),
  INDEX `ix_factura_uuid` (`uuid`),
  INDEX `ix_factura_uuid_relacionado` (`uuid_relacionado`),
  INDEX `ix_factura_rfc_receptor` (`rfc_receptor`),
  INDEX `ix_factura_fecha_facturacion` (`fecha_facturacion`),
  INDEX `ix_factura_estatus` (`estatus`),
  INDEX `ix_factura_tipo` (`tipo_factura`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
