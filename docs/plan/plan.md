# Especificación Técnica – Módulo de Traspasos

## Objetivo

Implementar un módulo completo de Traspasos compuesto por:

* Backend sobre Nuxt 2 Server Middleware.
* SQLite utilizando better-sqlite3.
* Frontend posterior en Nuxt 2 + Vue 2 + Vuetify 1.12.3.

El backend debe quedar completamente funcional para ser consumido posteriormente desde `/pages/Traspasos.vue`.

---

# Stack tecnológico

Frontend:

* Nuxt: 2.13.3
* Vue: 2.x
* Vuetify: 1.12.3

Backend:

* Nuxt Server Middleware
* Express
* SQLite
* better-sqlite3

Node:

* Compatible con Node 18 LTS

---

# Integración con Nuxt

Existe actualmente:

```js
serverMiddleware: ['~/api/index.js']
```

NO debe modificarse la estructura existente.

El archivo `api/index.js` utiliza:

```js
import Express from 'express'

const app = Express()

module.exports = {
    path: '/api',
    handler: app
}
```

Debe mantenerse este patrón.

Se pueden agregar routers mediante:

```js
app.use('/traspasos', traspasosRouter)
```

---

# Base de datos

Archivo SQLite:

```
/api/data.db
```

Usar:

```js
import Database from 'better-sqlite3'
```

Activar:

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
```

---

# Respuestas JSON

Todos los endpoints deben responder:

Éxito:

```json
{
  "response": 200,
  "msg": "Ok",
  "data": {}
}
```

Validación:

```json
{
  "response": 400,
  "msg": "Mensaje de validación",
  "data": null
}
```

No encontrado:

```json
{
  "response": 404,
  "msg": "Registro no encontrado",
  "data": null
}
```

Error inesperado:

```json
{
  "response": 500,
  "msg": "error.stack",
  "data": null
}
```

Usar:

```js
res.json(...)
```

No usar:

```js
res.status(...)
```

---

# Tabla secuencia

Crear automáticamente:

```sql
CREATE TABLE IF NOT EXISTS secuencia (
    nombre TEXT PRIMARY KEY,
    valor INTEGER NOT NULL
);
```

Inicializar:

```sql
INSERT INTO secuencia(nombre, valor)
VALUES ('traspaso_folio', 0);
```

si no existe.

---

# Estados del traspaso

Valores permitidos:

* BORRADOR
* GUARDADO
* CANCELADO

---

# Soft delete

Todas las tablas deben incluir:

```sql
borrado INTEGER DEFAULT 0
```

Reglas:

* 0 = activo
* 1 = borrado lógico

Las consultas normales deben incluir:

```sql
WHERE borrado = 0
```

---

# Cancelación

Tabla header:

```sql
cancelado INTEGER DEFAULT 0
```

Valores:

* 0 = vigente
* 1 = cancelado

No eliminar registros cancelados.

---

# Tablas

## sucursal

Campos:

* id
* abreviacion
* nombre
* domicilio
* colonia
* ciudad
* codigo_postal
* telefonos
* borrado
* fecha_registro
* fecha_actualizacion

---

## motivo_traspaso

Campos:

* id
* descripcion
* activo
* borrado
* fecha_registro
* fecha_actualizacion

---

## traspaso_header

Campos:

* id
* prefijo
* folio
* fecha
* fecha_hora
* persona_surte
* persona_captura
* persona_revisa
* persona_autoriza
* id_sucursal_origen
* observaciones
* estado
* cancelado
* borrado
* fecha_registro
* fecha_actualizacion

Reglas:

Prefijo fijo:

```
TRA
```

Folio:

* Consecutivo global.
* Longitud 6.
* Generado desde tabla secuencia.

Ejemplo:

```
TRA-000123
```

---

## traspaso_destino

Campos:

* id
* id_traspaso
* id_traspaso_destino
* id_motivo_traspaso
* borrado
* fecha_registro
* fecha_actualizacion

---

## traspaso_detail

Campos:

* id
* id_traspaso
* clave
* codigo_barras
* descripcion
* etiqueta
* lote
* fecha_caducidad
* cantidad
* id_traspaso_destino
* borrado
* fecha_registro
* fecha_actualizacion

---

# Backend

Crear router:

```
api/routes/traspasos.js
```

---

# Endpoints

GET /api/traspasos

Debe listar:

* borradores
* guardados
* cancelados

Filtrar:

```sql
borrado = 0
```

Incluir:

* id
* prefijo
* folio
* fecha
* sucursal origen
* estado
* cancelado

---

GET /api/traspasos/:id

Debe reconstruir JSON listo para edición.

Debe incluir:

Header.

Destinos:

```json
[
  {
    "id_traspaso_destino": 2,
    "id_motivo_traspaso": 1
  }
]
```

Detalle:

```json
[
  {
    "clave": "812",
    "codigo_barras": "...",
    "descripcion": "...",
    "cantidad": 1,
    "id_traspaso_destino": 2
  }
]
```

---

POST /api/traspasos

Debe usar:

```js
db.transaction(...)
```

Proceso:

1. Validar datos obligatorios.
2. Obtener siguiente folio.
3. Actualizar secuencia.
4. Insertar header.
5. Insertar destinos.
6. Insertar detalle.
7. Commit automático.

Retornar:

Header completo.

---

PUT /api/traspasos/:id

Usar transacción.

Proceso:

1. Actualizar header.
2. Soft delete destinos anteriores.
3. Soft delete detalle anterior.
4. Insertar nuevamente destinos.
5. Insertar nuevamente detalle.

No recalcular folio.

---

PATCH /api/traspasos/:id/cancelar

Actualizar:

```sql
cancelado = 1
estado = 'CANCELADO'
fecha_actualizacion = CURRENT_TIMESTAMP
```

---

DELETE /api/traspasos/:id

Soft delete:

Header:

```sql
borrado = 1
```

Destinos:

```sql
borrado = 1
```

Detalle:

```sql
borrado = 1
```

---

# Consulta de artículos

Existe endpoint externo:

```
${config.backEndUrl}/gusher/ws.prg?mod=codigo&id=${id}
```

Respuesta:

```json
{
  "response": 200,
  "msg": "Ok",
  "data": {
    "mPart": "812",
    "mDesc": "PAS DENT COLG MFP 150ML",
    "mBarCode": "7501035911017",
    "mExiste": 32,
    "barra": "L070000",
    "lote": "0332MX1113",
    "fCaduc": "2022-11-30",
    "codigo": "812",
    "existencia": 0
  }
}
```

---

# Frontend futuro

Crear:

```
/pages/Traspasos.vue
```

con:

* Captura rápida por Enter.
* Búsqueda mediante Catalogo.vue.
* Tabla editable.
* CRUD de sucursales.
* CRUD de motivos.
* Consulta de traspasos.
* PDF mediante pdfmake.
* Agrupación por sucursal destino.
* Una hoja por sucursal.
* Firmas.
* Observaciones.
* Motivo por sucursal.
* Modal fullscreen para PDF.

---

# Restricciones

* No generar pseudocódigo.
* Generar código completo.
* Generar sentencias SQL completas.
* Generar imports completos.
* Mantener compatibilidad con Nuxt 2.
* No modificar comportamiento existente del api/index.js.

