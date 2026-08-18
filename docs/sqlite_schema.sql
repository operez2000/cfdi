CREATE TABLE sucursal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    abreviacion      TEXT NOT NULL,
    nombre           TEXT NOT NULL,
    domicilio        TEXT,
    colonia          TEXT,
    ciudad           TEXT,
    codigo_postal    TEXT,
    telefonos        TEXT,

    activo           INTEGER NOT NULL DEFAULT 1
                      CHECK(activo IN (0,1)),

    fecha_registro   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,

    borrado          INTEGER NOT NULL DEFAULT 0
                      CHECK(borrado IN (0,1)),
    fecha_borrado    DATETIME
);

CREATE UNIQUE INDEX ux_sucursal_abreviacion
ON sucursal(abreviacion)
WHERE borrado = 0;

CREATE INDEX ix_sucursal_nombre
ON sucursal(nombre);

CREATE TABLE motivo_traspaso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion      TEXT NOT NULL,
    activo           INTEGER NOT NULL DEFAULT 1
                      CHECK(activo IN (0,1)),
    fecha_registro   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    borrado          INTEGER NOT NULL DEFAULT 0
                      CHECK(borrado IN (0,1)),
    fecha_borrado    DATETIME
);
CREATE UNIQUE INDEX ux_motivo_descripcion
ON motivo_traspaso(descripcion)
WHERE borrado = 0;

CREATE INDEX ix_motivo_activo
ON motivo_traspaso(activo);

CREATE TABLE traspaso_header (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prefijo          TEXT NOT NULL DEFAULT 'TRA',
    folio            INTEGER NOT NULL,
    fecha            DATETIME NOT NULL,
    persona_surte    TEXT,
    persona_captura  TEXT,
    persona_revisa   TEXT,
    persona_autoriza TEXT,
    chofer           TEXT,
    id_sucursal_origen INTEGER NOT NULL,
    observaciones    TEXT,
    estado           TEXT NOT NULL DEFAULT 'BORRADOR'
                      CHECK(estado IN ('BORRADOR','GUARDADO')),
    cancelado        INTEGER NOT NULL DEFAULT 0
                      CHECK(cancelado IN (0,1)),
    fecha_cancelacion DATETIME,
    fecha_registro   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    borrado          INTEGER NOT NULL DEFAULT 0
                      CHECK(borrado IN (0,1)),
    fecha_borrado    DATETIME,

    FOREIGN KEY (id_sucursal_origen)
        REFERENCES sucursal(id)
);
CREATE UNIQUE INDEX ux_traspaso_folio
ON traspaso_header(folio);

CREATE INDEX ix_traspaso_fecha
ON traspaso_header(fecha);

CREATE INDEX ix_traspaso_estado
ON traspaso_header(estado);

CREATE INDEX ix_traspaso_cancelado
ON traspaso_header(cancelado);

CREATE INDEX ix_traspaso_origen
ON traspaso_header(id_sucursal_origen);


CREATE TABLE traspaso_destino (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_traspaso           INTEGER NOT NULL,
    id_traspaso_destino   INTEGER NOT NULL,
    id_motivo_traspaso    INTEGER NOT NULL,
    caja                  VARCHAR(30),
    fecha_registro        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion   DATETIME,
    borrado               INTEGER NOT NULL DEFAULT 0
                          CHECK(borrado IN (0,1)),
    fecha_borrado         DATETIME,
    FOREIGN KEY (id_traspaso)
        REFERENCES traspaso_header(id),
    FOREIGN KEY (id_traspaso_destino)
        REFERENCES sucursal(id),
    FOREIGN KEY (id_motivo_traspaso)
        REFERENCES motivo_traspaso(id)
);
CREATE UNIQUE INDEX ux_traspaso_destino
ON traspaso_destino(
    id_traspaso,
    id_traspaso_destino
)
WHERE borrado = 0;
CREATE INDEX ix_td_sucursal
ON traspaso_destino(id_traspaso_destino);

CREATE INDEX ix_td_motivo
ON traspaso_destino(id_motivo_traspaso);


CREATE TABLE traspaso_detail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_traspaso              INTEGER NOT NULL,
    id_traspaso_destino      INTEGER NOT NULL,
    clave                    TEXT NOT NULL,
    codigo_barras            TEXT,
    descripcion              TEXT,
    etiqueta                 TEXT,
    lote                     TEXT,
    fecha_caducidad          DATE,
    cantidad                 INTEGER NOT NULL DEFAULT 1
                              CHECK(cantidad > 0),
    fecha_registro           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion      DATETIME,
    borrado                  INTEGER NOT NULL DEFAULT 0
                              CHECK(borrado IN (0,1)),
    fecha_borrado            DATETIME,

    FOREIGN KEY (id_traspaso)
        REFERENCES traspaso_header(id),

    FOREIGN KEY (id_traspaso_destino)
        REFERENCES traspaso_destino(id)
);
CREATE INDEX ix_detail_traspaso
ON traspaso_detail(id_traspaso);

CREATE INDEX ix_detail_destino
ON traspaso_detail(id_traspaso_destino);

CREATE INDEX ix_detail_clave
ON traspaso_detail(clave);

CREATE INDEX ix_detail_codigo_barras
ON traspaso_detail(codigo_barras);

CREATE INDEX ix_detail_descripcion
ON traspaso_detail(descripcion);


CREATE TRIGGER trg_sucursal_update
AFTER UPDATE ON sucursal
BEGIN
    UPDATE sucursal
       SET fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;


CREATE TRIGGER trg_motivo_update
AFTER UPDATE ON motivo_traspaso
BEGIN
    UPDATE motivo_traspaso
       SET fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;

CREATE TRIGGER trg_th_update
AFTER UPDATE ON traspaso_header
BEGIN
    UPDATE traspaso_header
       SET fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;

CREATE TRIGGER trg_td_update
AFTER UPDATE ON traspaso_destino
BEGIN
    UPDATE traspaso_destino
       SET fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;

CREATE TRIGGER trg_detail_update
AFTER UPDATE ON traspaso_detail
BEGIN
    UPDATE traspaso_detail
       SET fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;

