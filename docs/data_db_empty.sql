------------- SQLite3 Dump File -------------

-- ------------------------------------------
-- Dump of "motivo_traspaso"
-- ------------------------------------------

drop table if exists "motivo_traspaso";
CREATE TABLE "motivo_traspaso"(
	"id" Integer PRIMARY KEY AUTOINCREMENT,
	"descripcion" Text NOT NULL,
	"activo" Integer NOT NULL DEFAULT 1,
	"fecha_registro" DateTime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"fecha_actualizacion" DateTime,
	"borrado" Integer NOT NULL DEFAULT 0,
	"fecha_borrado" DateTime,
CONSTRAINT "check activo IN (0,1)" CHECK (activo IN (0,1)),
CONSTRAINT "check borrado IN (0,1)" CHECK (borrado IN (0,1)) );

CREATE INDEX "ix_motivo_activo" ON "motivo_traspaso"( "activo" );
CREATE UNIQUE INDEX "ux_motivo_descripcion" ON "motivo_traspaso"( "descripcion" ) WHERE borrado = 0;

CREATE TRIGGER "trg_motivo_update"
	AFTER UPDATE
	ON "motivo_traspaso"
	FOR EACH ROW
BEGIN
    UPDATE motivo_traspaso
       SET fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;

BEGIN;

INSERT INTO "motivo_traspaso" ("id","descripcion","activo","fecha_registro","fecha_actualizacion","borrado","fecha_borrado") VALUES 
( 3, 'PUNTO DE REORDEN', 1, '2026-06-13 05:14:27', NULL, 0, NULL ),
( 4, 'FALTANTE', 1, '2026-06-13 05:14:36', NULL, 0, NULL );



COMMIT;

-- ------------------------------------------
-- Dump of "secuencia"
-- ------------------------------------------

drop table if exists "secuencia";
CREATE TABLE "secuencia"(
	"nombre" Text PRIMARY KEY,
	"valor" Integer NOT NULL );



-- ------------------------------------------
-- Dump of "sucursal"
-- ------------------------------------------

drop table if exists "sucursal";
CREATE TABLE "sucursal"(
	"id" Integer PRIMARY KEY AUTOINCREMENT,
	"abreviacion" Text NOT NULL,
	"nombre" Text NOT NULL,
	"domicilio" Text,
	"colonia" Text,
	"ciudad" Text,
	"codigo_postal" Text,
	"telefonos" Text,
	"activo" Integer NOT NULL DEFAULT 1,
	"fecha_registro" DateTime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"fecha_actualizacion" DateTime,
	"borrado" Integer NOT NULL DEFAULT 0,
	"fecha_borrado" DateTime,
CONSTRAINT "check activo IN (0,1)" CHECK (activo IN (0,1)),
CONSTRAINT "check borrado IN (0,1)" CHECK (borrado IN (0,1)) );

CREATE INDEX "ix_sucursal_nombre" ON "sucursal"( "nombre" );
CREATE UNIQUE INDEX "ux_sucursal_abreviacion" ON "sucursal"( "abreviacion" ) WHERE borrado = 0;

CREATE TRIGGER "trg_sucursal_update"
	AFTER UPDATE
	ON "sucursal"
	FOR EACH ROW
BEGIN
    UPDATE sucursal
       SET fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;

BEGIN;

INSERT INTO "sucursal" ("id","abreviacion","nombre","domicilio","colonia","ciudad","codigo_postal","telefonos","activo","fecha_registro","fecha_actualizacion","borrado","fecha_borrado") VALUES 
( 1, 'MON', 'SUC. PLAZA MONARCA', 'BLVD MANUEL J CLOUTHIER 18561-C16', 'FRACC. EL LAGO', 'TIJUANA, BC', '22210', '903-4300 Y 903-4100', 1, '2026-06-13 02:08:34', '2026-06-18 18:13:19', 0, NULL ),
( 2, 'OTA', 'SUC. PLAZA AMERICANA OTAY', 'CALZADA TECNOLÓGICO 2100-83', 'COL. NUEVA TIJUANA', 'TIJUANA, BC', '22435', '624-3291 Y 624-3296', 1, '2026-06-13 02:15:15', '2026-06-18 18:14:33', 0, NULL ),
( 3, 'PAL', 'SUC. PALMAS', 'BLVD. DIAZ ORDAZ 13251-A', 'LA ESCONDIDA', 'TIJUANA, BC', '22106', '608-9333 Y 608-9331', 1, '2026-06-13 02:15:47', '2026-06-18 18:15:26', 0, NULL ),
( 4, 'RIO', 'MATRIZ', 'AV. PASEO DE LOS HÉROES 9550-27 B', 'ZONA URBANA RIO', 'TIJUANA, BC', '22010', '684-0235 Y 684-0229', 1, '2026-06-13 02:16:18', '2026-06-18 18:16:19', 0, NULL ),
( 5, 'ROS', 'SUC. ROSARITO', 'BLVD. BENITO JUÁREZ 339', 'HACIENDA FLORESTA', 'PLAYAS DE ROSARITO, BC', '22703', '661-612-1722 Y 661-612-1845', 1, '2026-06-13 02:16:42', '2026-06-18 18:17:38', 0, NULL );



COMMIT;

-- ------------------------------------------
-- Dump of "traspaso_destino"
-- ------------------------------------------

drop table if exists "traspaso_destino";
CREATE TABLE "traspaso_destino"(
	"id" Integer PRIMARY KEY AUTOINCREMENT,
	"id_traspaso" Integer NOT NULL,
	"id_traspaso_destino" Integer NOT NULL,
	"id_motivo_traspaso" Integer NOT NULL,
	"fecha_registro" DateTime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"fecha_actualizacion" DateTime,
	"borrado" Integer NOT NULL DEFAULT 0,
	"fecha_borrado" DateTime,
	CONSTRAINT "traspaso_destino_traspaso_header_NO ACTION_NO ACTION_id_traspaso_id_0" FOREIGN KEY ( "id_traspaso" ) REFERENCES "traspaso_header"( "id" ),
	CONSTRAINT "traspaso_destino_sucursal_NO ACTION_NO ACTION_id_traspaso_destino_id_0" FOREIGN KEY ( "id_traspaso_destino" ) REFERENCES "sucursal"( "id" ),
	CONSTRAINT "traspaso_destino_motivo_traspaso_NO ACTION_NO ACTION_id_motivo_traspaso_id_0" FOREIGN KEY ( "id_motivo_traspaso" ) REFERENCES "motivo_traspaso"( "id" )
,
CONSTRAINT "check borrado IN (0,1)" CHECK (borrado IN (0,1)) );

CREATE INDEX "ix_td_motivo" ON "traspaso_destino"( "id_motivo_traspaso" );
CREATE INDEX "ix_td_sucursal" ON "traspaso_destino"( "id_traspaso_destino" );
CREATE UNIQUE INDEX "ux_traspaso_destino" ON "traspaso_destino"( "id_traspaso", "id_traspaso_destino" ) WHERE borrado = 0;

CREATE TRIGGER "trg_td_update"
	AFTER UPDATE
	ON "traspaso_destino"
	FOR EACH ROW
BEGIN
    UPDATE traspaso_destino
       SET fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;


-- ------------------------------------------
-- Dump of "traspaso_detail"
-- ------------------------------------------

drop table if exists "traspaso_detail";
CREATE TABLE "traspaso_detail"(
	"id" Integer PRIMARY KEY AUTOINCREMENT,
	"id_traspaso" Integer NOT NULL,
	"id_traspaso_destino" Integer NOT NULL,
	"clave" Text NOT NULL,
	"codigo_barras" Text,
	"descripcion" Text,
	"etiqueta" Text,
	"lote" Text,
	"fecha_caducidad" DATE,
	"cantidad" Integer NOT NULL DEFAULT 1,
	"fecha_registro" DateTime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"fecha_actualizacion" DateTime,
	"borrado" Integer NOT NULL DEFAULT 0,
	"fecha_borrado" DateTime,
	CONSTRAINT "traspaso_detail_traspaso_header_NO ACTION_NO ACTION_id_traspaso_id_0" FOREIGN KEY ( "id_traspaso" ) REFERENCES "traspaso_header"( "id" ),
	CONSTRAINT "traspaso_detail_traspaso_destino_NO ACTION_NO ACTION_id_traspaso_destino_id_0" FOREIGN KEY ( "id_traspaso_destino" ) REFERENCES "traspaso_destino"( "id" )
,
CONSTRAINT "check cantidad > 0" CHECK (cantidad > 0),
CONSTRAINT "check borrado IN (0,1)" CHECK (borrado IN (0,1)) );

CREATE INDEX "ix_detail_clave" ON "traspaso_detail"( "clave" );
CREATE INDEX "ix_detail_codigo_barras" ON "traspaso_detail"( "codigo_barras" );
CREATE INDEX "ix_detail_descripcion" ON "traspaso_detail"( "descripcion" );
CREATE INDEX "ix_detail_destino" ON "traspaso_detail"( "id_traspaso_destino" );
CREATE INDEX "ix_detail_traspaso" ON "traspaso_detail"( "id_traspaso" );

CREATE TRIGGER "trg_detail_update"
	AFTER UPDATE
	ON "traspaso_detail"
	FOR EACH ROW
BEGIN
    UPDATE traspaso_detail
       SET fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;


-- ------------------------------------------
-- Dump of "traspaso_header"
-- ------------------------------------------

drop table if exists "traspaso_header";
CREATE TABLE "traspaso_header"(
	"id" Integer PRIMARY KEY AUTOINCREMENT,
	"prefijo" Text NOT NULL DEFAULT 'TRA',
	"folio" Integer NOT NULL,
	"fecha" DateTime NOT NULL,
	"persona_surte" Text,
	"persona_captura" Text,
	"persona_revisa" Text,
	"persona_autoriza" Text,
	"id_sucursal_origen" Integer NOT NULL,
	"observaciones" Text,
	"estado" Text NOT NULL DEFAULT 'BORRADOR',
	"cancelado" Integer NOT NULL DEFAULT 0,
	"fecha_cancelacion" DateTime,
	"fecha_registro" DateTime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"fecha_actualizacion" DateTime,
	"borrado" Integer NOT NULL DEFAULT 0,
	"fecha_borrado" DateTime,
	CONSTRAINT "traspaso_header_sucursal_NO ACTION_NO ACTION_id_sucursal_origen_id_0" FOREIGN KEY ( "id_sucursal_origen" ) REFERENCES "sucursal"( "id" )
,
CONSTRAINT "check estado IN ('BORRADOR','GUARDADO')" CHECK (estado IN ('BORRADOR','GUARDADO')),
CONSTRAINT "check cancelado IN (0,1)" CHECK (cancelado IN (0,1)),
CONSTRAINT "check borrado IN (0,1)" CHECK (borrado IN (0,1)) );

CREATE INDEX "ix_traspaso_cancelado" ON "traspaso_header"( "cancelado" );
CREATE INDEX "ix_traspaso_estado" ON "traspaso_header"( "estado" );
CREATE INDEX "ix_traspaso_fecha" ON "traspaso_header"( "fecha" );
CREATE INDEX "ix_traspaso_origen" ON "traspaso_header"( "id_sucursal_origen" );
CREATE UNIQUE INDEX "ux_traspaso_folio" ON "traspaso_header"( "folio" );

CREATE TRIGGER "trg_th_update"
	AFTER UPDATE
	ON "traspaso_header"
	FOR EACH ROW
BEGIN
    UPDATE traspaso_header
       SET fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;


