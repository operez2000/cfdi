-- MySQL Schema (migrated from SQLite)

DROP TABLE IF EXISTS `traspaso_detail`;
DROP TABLE IF EXISTS `traspaso_destino`;
DROP TABLE IF EXISTS `traspaso_header`;
DROP TABLE IF EXISTS `sucursal`;
DROP TABLE IF EXISTS `secuencia`;
DROP TABLE IF EXISTS `motivo_traspaso`;

-- ------------------------------------------
-- Table "motivo_traspaso"
-- ------------------------------------------

CREATE TABLE `motivo_traspaso`(
	`id` INT PRIMARY KEY AUTO_INCREMENT,
	`descripcion` varchar(100) NOT NULL,
	`activo` INT NOT NULL DEFAULT 1,
	`fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`fecha_actualizacion` DATETIME,
	`borrado` INT NOT NULL DEFAULT 0,
	`fecha_borrado` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `ix_motivo_activo` ON `motivo_traspaso`(`activo`);

CREATE TRIGGER `trg_motivo_update`
	BEFORE UPDATE ON `motivo_traspaso`
	FOR EACH ROW
	SET NEW.`fecha_actualizacion` = CURRENT_TIMESTAMP;

START TRANSACTION;

INSERT INTO `motivo_traspaso` (`descripcion`,`activo`,`fecha_registro`,`fecha_actualizacion`,`borrado`,`fecha_borrado`) VALUES
( 'Optimización y control de Inventario', 1, NOW(), NULL, 0, NULL ),
( 'Prevención de caducidades', 1, NOW(), NULL, 0, NULL ),
( 'Distribución de pedidos controlados', 1, NOW(), NULL, 0, NULL )
;

COMMIT;

-- ------------------------------------------
-- Table "secuencia"
-- ------------------------------------------

CREATE TABLE `secuencia`(
	`nombre` VARCHAR(100) PRIMARY KEY,
	`valor` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------
-- Table "sucursal"
-- ------------------------------------------

CREATE TABLE `sucursal`(
	`id` INT PRIMARY KEY AUTO_INCREMENT,
	`abreviacion` varchar(5) NOT NULL,
	`nombre` varchar(120) NOT NULL,
	`domicilio` varchar(120),
	`colonia` varchar(100),
	`ciudad` varchar(50),
	`codigo_postal` varchar(10),
	`telefonos` varchar(50),
	`email` varchar(60),
	`activo` INT NOT NULL DEFAULT 1,
	`fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`fecha_actualizacion` DATETIME,
	`borrado` INT NOT NULL DEFAULT 0,
	`fecha_borrado` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dump data of "sucursal" ---------------------------------

CREATE INDEX `ix_sucursal_nombre` ON `sucursal`(`nombre`(100));


CREATE TRIGGER `trg_sucursal_update`
	BEFORE UPDATE ON `sucursal`
	FOR EACH ROW
	SET NEW.`fecha_actualizacion` = CURRENT_TIMESTAMP;

START TRANSACTION;

INSERT INTO `sucursal` (`id`,`abreviacion`,`nombre`,`domicilio`,`colonia`,`ciudad`,`codigo_postal`,`telefonos`, `email`,`activo`,`fecha_registro`,`fecha_actualizacion`,`borrado`,`fecha_borrado`) VALUES
( 1, 'MON', 'SUC. PLAZA MONARCA', 'BLVD MANUEL J CLOUTHIER 18561-C16', 'FRACC. EL LAGO', 'TIJUANA, BC', '22210', '903-4300 Y 903-4100', 'suc.monarca@gusher.com.mx', 1, '2026-06-13 02:08:34', '2026-06-18 18:13:19', 0, NULL ),
( 2, 'OTA', 'SUC. PLAZA AMERICANA OTAY', 'CALZADA TECNOLÓGICO 2100-83', 'COL. NUEVA TIJUANA', 'TIJUANA, BC', '22435', '624-3291 Y 624-3296', 'suc.otay@gusher.com.mx', 1, '2026-06-13 02:15:15', '2026-06-18 18:14:33', 0, NULL ),
( 3, 'PAL', 'SUC. PALMAS', 'BLVD. DIAZ ORDAZ 13251-A', 'LA ESCONDIDA', 'TIJUANA, BC', '22106', '608-9333 Y 608-9331', 'suc.palmas@gusher.com.mx', 1, '2026-06-13 02:15:47', '2026-06-18 18:15:26', 0, NULL ),
( 4, 'RIO', 'MATRIZ', 'AV. PASEO DE LOS HÉROES 9550-27 B', 'ZONA URBANA RIO', 'TIJUANA, BC', '22010', '684-0235 Y 684-0229', 'suc.rio@gusher.com.mx', 1, '2026-06-13 02:16:18', '2026-06-18 18:16:19', 0, NULL ),
( 5, 'ROS', 'SUC. ROSARITO', 'BLVD. BENITO JUÁREZ 339', 'HACIENDA FLORESTA', 'PLAYAS DE ROSARITO, BC', '22703', '661-612-1722 Y 661-612-1845', 'suc.rosarito@gusher.com.mx', 1, '2026-06-13 02:16:42', '2026-06-18 18:17:38', 0, NULL );

COMMIT;

-- ------------------------------------------
-- Table "traspaso_header"
-- ------------------------------------------

CREATE TABLE `traspaso_header`(
	`id` INT PRIMARY KEY AUTO_INCREMENT,
	`prefijo` VARCHAR(10) NOT NULL DEFAULT 'TRA',
	`folio` INT NOT NULL,
	`fecha` DATETIME NOT NULL,
	`persona_surte` varchar(100),
	`persona_captura` varchar(100),
	`persona_revisa` varchar(100),
	`persona_autoriza` varchar(100),
	`chofer` varchar(100),
	`id_sucursal_origen` INT NOT NULL,
	`observaciones` varchar(250),
	`estado` VARCHAR(10) NOT NULL DEFAULT 'BORRADOR',
	`cancelado` INT NOT NULL DEFAULT 0,
	`fecha_cancelacion` DATETIME,
	`fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`fecha_actualizacion` DATETIME,
	`borrado` INT NOT NULL DEFAULT 0,
	`fecha_borrado` DATETIME,
	CONSTRAINT `fk_th_sucursal_origen` FOREIGN KEY (`id_sucursal_origen`) REFERENCES `sucursal`(`id`),
	CONSTRAINT `ck_th_estado` CHECK (`estado` IN ('BORRADOR','GUARDADO')),
	CONSTRAINT `ck_th_cancelado` CHECK (`cancelado` IN (0,1)),
	CONSTRAINT `ck_th_borrado` CHECK (`borrado` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `ix_traspaso_cancelado` ON `traspaso_header`(`cancelado`);
CREATE INDEX `ix_traspaso_estado` ON `traspaso_header`(`estado`);
CREATE INDEX `ix_traspaso_fecha` ON `traspaso_header`(`fecha`);
CREATE INDEX `ix_traspaso_origen` ON `traspaso_header`(`id_sucursal_origen`);
CREATE UNIQUE INDEX `ux_traspaso_folio` ON `traspaso_header`(`folio`);


CREATE TRIGGER `trg_th_update`
	BEFORE UPDATE ON `traspaso_header`
	FOR EACH ROW
	SET NEW.`fecha_actualizacion` = CURRENT_TIMESTAMP;

-- ------------------------------------------
-- Table "traspaso_destino"
-- ------------------------------------------

CREATE TABLE `traspaso_destino`(
	`id` INT PRIMARY KEY AUTO_INCREMENT,
	`id_traspaso` INT NOT NULL,
	`id_traspaso_destino` INT NOT NULL,
	`id_motivo_traspaso` INT NOT NULL,
	`caja` varchar(30),
	`fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`fecha_actualizacion` DATETIME,
	`borrado` INT NOT NULL DEFAULT 0,
	`fecha_borrado` DATETIME,
	CONSTRAINT `fk_td_traspaso_header` FOREIGN KEY (`id_traspaso`) REFERENCES `traspaso_header`(`id`),
	CONSTRAINT `fk_td_sucursal` FOREIGN KEY (`id_traspaso_destino`) REFERENCES `sucursal`(`id`),
	CONSTRAINT `fk_td_motivo_traspaso` FOREIGN KEY (`id_motivo_traspaso`) REFERENCES `motivo_traspaso`(`id`),
	CONSTRAINT `ck_td_borrado` CHECK (`borrado` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `ix_td_motivo` ON `traspaso_destino`(`id_motivo_traspaso`);
CREATE INDEX `ix_td_sucursal` ON `traspaso_destino`(`id_traspaso_destino`);

CREATE TRIGGER `trg_td_update`
	BEFORE UPDATE ON `traspaso_destino`
	FOR EACH ROW
	SET NEW.`fecha_actualizacion` = CURRENT_TIMESTAMP;

-- ------------------------------------------
-- Table "traspaso_detail"
-- ------------------------------------------

CREATE TABLE `traspaso_detail`(
	`id` INT PRIMARY KEY AUTO_INCREMENT,
	`id_traspaso` INT NOT NULL,
	`id_traspaso_destino` INT NOT NULL,
	`clave` varchar(15) NOT NULL,
	`codigo_barras` varchar(20),
	`descripcion` varchar(100),
	`etiqueta` varchar(10),
	`lote` varchar(30),
	`fecha_caducidad` DATE,
	`cantidad` INT NOT NULL DEFAULT 1,
	`fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`fecha_actualizacion` DATETIME,
	`borrado` INT NOT NULL DEFAULT 0,
	`fecha_borrado` DATETIME,
	CONSTRAINT `fk_detail_traspaso_header` FOREIGN KEY (`id_traspaso`) REFERENCES `traspaso_header`(`id`),
	CONSTRAINT `fk_detail_traspaso_destino` FOREIGN KEY (`id_traspaso_destino`) REFERENCES `traspaso_destino`(`id`),
	CONSTRAINT `ck_detail_cantidad` CHECK (`cantidad` > 0),
	CONSTRAINT `ck_detail_borrado` CHECK (`borrado` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `ix_detail_clave` ON `traspaso_detail`(`clave`(15));
CREATE INDEX `ix_detail_codigo_barras` ON `traspaso_detail`(`codigo_barras`(20));
CREATE INDEX `ix_detail_descripcion` ON `traspaso_detail`(`descripcion`(100));
CREATE INDEX `ix_detail_destino` ON `traspaso_detail`(`id_traspaso_destino`);
CREATE INDEX `ix_detail_traspaso` ON `traspaso_detail`(`id_traspaso`);

CREATE TRIGGER `trg_detail_update`
	BEFORE UPDATE ON `traspaso_detail`
	FOR EACH ROW
	SET NEW.`fecha_actualizacion` = CURRENT_TIMESTAMP;
