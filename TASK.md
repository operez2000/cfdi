# Implementación solicitada – Módulo de Traspasos

## Objetivo

Realizar las modificaciones necesarias tanto en el frontend (`/traspasos/traspasos.vue`) como en la API (`/api/routes/traspasos.js`) para soportar los nuevos campos **chofer** y **caja** en el proceso de Traspasos.

---

## Frontend (`/traspasos/traspasos.vue`)

### Encabezado

Actualmente se capturan los siguientes campos mediante `<v-text-field />`:

- `form.persona_surte`
- `form.persona_captura`
- `form.persona_revisa`
- `form.persona_autoriza`

### Cambio solicitado

Agregar un nuevo `<v-text-field />` para capturar:

- `form.chofer`

### Requerimientos

- Agregar la propiedad correspondiente al modelo (`form`).
- Incluir el campo en todas las operaciones donde se envía información a la API.
- Verificar que participe correctamente en:
  - Alta
  - Edición
  - Consulta
  - Cualquier otro evento relacionado con el encabezado del traspaso.

> **Nota:** El campo ya existe en el modelo de la tabla `traspaso_header` como `chofer`.

---

## Sucursal Destino

Agregar un nuevo campo:

- `caja`

Este campo corresponde al modelo:

- `traspaso_destino.caja`

### Consideraciones

Implementarlo de la misma manera en que actualmente se manejan los siguientes campos:

- `id_traspaso`
- `id_traspaso_destino`
- `id_motivo_traspaso`

---

## Backend (`/api/routes/traspasos.js`)

Realizar todas las modificaciones necesarias para soportar ambos campos.

### Encabezado

Incluir el campo:

- `chofer`

en todos los procesos que correspondan, tales como:

- Inserción
- Actualización
- Consulta
- Cualquier otra operación que involucre `traspaso_header`

---

### Detalle (Sucursal Destino)

Incluir el campo:

- `caja`

en todas las operaciones relacionadas con la tabla `traspaso_destino`, asegurando que participe correctamente en:

- Inserción
- Actualización
- Consulta
- Demás operaciones existentes

---

## Importante

Antes de comenzar la implementación, si existe cualquier duda respecto al comportamiento esperado, estructura de datos o flujo del proceso, favor de solicitar aclaraciones antes de proceder con el desarrollo.