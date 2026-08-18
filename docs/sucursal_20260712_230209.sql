-- Valentina Studio --
-- MySQL dump --
-- ---------------------------------------------------------


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
-- ---------------------------------------------------------


-- CREATE TABLE "sucursal" -------------------------------------
CREATE TABLE `sucursal`( 
	`id` Int( 11 ) AUTO_INCREMENT NOT NULL,
	`abreviacion` Text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
	`nombre` Text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
	`domicilio` Text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
	`colonia` Text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
	`ciudad` Text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
	`codigo_postal` Text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
	`telefonos` Text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
	`activo` Int( 11 ) NOT NULL DEFAULT 1,
	`fecha_registro` DateTime NOT NULL DEFAULT current_timestamp(),
	`fecha_actualizacion` DateTime NULL DEFAULT NULL,
	`borrado` Int( 11 ) NOT NULL DEFAULT 0,
	`fecha_borrado` DateTime NULL DEFAULT NULL,
	PRIMARY KEY ( `id` ) )
CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
ENGINE = InnoDB
AUTO_INCREMENT = 6;
-- -------------------------------------------------------------


-- Dump data of "sucursal" ---------------------------------
BEGIN;

INSERT INTO `sucursal`(`id`,`abreviacion`,`nombre`,`domicilio`,`colonia`,`ciudad`,`codigo_postal`,`telefonos`,`activo`,`fecha_registro`,`fecha_actualizacion`,`borrado`,`fecha_borrado`) VALUES 
( '1', 'MON', 'SUC. PLAZA MONARCA', 'BLVD MANUEL J CLOUTHIER 18561-C16', 'FRACC. EL LAGO', 'TIJUANA, BC', '22210', '903-4300 Y 903-4100', '1', '2026-06-19 19:25:08', NULL, '0', NULL ),
( '2', 'OTA', 'SUC. PLAZA AMERICANA OTAY', 'CALZADA TECNOLÓGICO 2100-63', 'COL. NUEVA TIJUANA', 'TIJUANA, BC', '22435', '624-3291 Y 624-3296', '1', '2026-06-19 19:25:08', '2026-06-30 19:46:25', '0', NULL ),
( '3', 'PAL', 'SUC. PALMAS', 'BLVD. DIAZ ORDAZ 13251-A', 'LA ESCONDIDA', 'TIJUANA, BC', '22106', '608-9333 Y 608-9331', '1', '2026-06-19 19:25:08', NULL, '0', NULL ),
( '4', 'RIO', 'MATRIZ', 'AV. PASEO DE LOS HÉROES 9550-27 B', 'ZONA URBANA RIO', 'TIJUANA, BC', '22010', '684-0235 Y 684-0229', '1', '2026-06-19 19:25:08', '2026-06-19 19:35:59', '0', NULL ),
( '5', 'ROS', 'SUC. ROSARITO', 'BLVD. BENITO JUÁREZ 339', 'HACIENDA FLORESTA', 'PLAYAS DE ROSARITO, BC', '22703', '661-612-1722 Y 661-612-1845', '1', '2026-06-19 19:25:08', NULL, '0', NULL );
COMMIT;
-- ---------------------------------------------------------


-- CREATE INDEX "ix_sucursal_nombre" ---------------------------
CREATE INDEX `ix_sucursal_nombre` USING BTREE ON `sucursal`( `nombre`( 100 ) );
-- -------------------------------------------------------------



delimiter $$$ 
-- CREATE TRIGGER "trg_sucursal_update" ------------------------
CREATE DEFINER=`root`@`localhost` TRIGGER `trg_sucursal_update`
	BEFORE UPDATE ON `sucursal`
	FOR EACH ROW
	SET NEW.`fecha_actualizacion` = CURRENT_TIMESTAMP;
-- -------------------------------------------------------------

$$$ delimiter ;


/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
-- ---------------------------------------------------------


