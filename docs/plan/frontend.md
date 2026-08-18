# Especificación Técnica Front-End – Módulo de Traspasos

## Objetivo

Desarrollar el módulo completo de captura, consulta y generación de PDF de Traspasos para una aplicación existente basada en Nuxt 2.

El código generado debe estar listo para producción y debe integrarse con la aplicación existente sin romper funcionalidad actual.

---

# Stack Tecnológico

Framework:

* Nuxt 2.13.3

Librerías:

* Vue 2.x
* Vuetify 1.12.3
* Axios (ya disponible en el proyecto)
* pdfmake (para PDF)

No utilizar Composition API.

Todo debe implementarse usando Vue 2 Options API.

---

# Archivos a generar

## Página principal

```text
/pages/Traspasos.vue
```

---

# Componentes existentes

Existe un componente reutilizable:

```text
/components/Catalogo.vue
```

NO debe modificarse su funcionalidad existente.

Debe ser reutilizado dentro de un diálogo.

---

# Objetivo funcional

La página debe permitir:

* Crear traspasos.
* Editar traspasos.
* Consultar traspasos existentes.
* Cancelar traspasos.
* Generar PDF.
* Capturar artículos rápidamente.
* Buscar artículos mediante catálogo.
* Administrar sucursales.
* Administrar motivos de traspaso.

---

# Layout general

Utilizar:

```html
<v-container fluid>
```

Estructura recomendada:

1. Toolbar superior.
2. Datos generales del traspaso.
3. Captura rápida de artículos.
4. Tabla detalle.
5. Botones de acción.
6. Diálogos.

---

# Toolbar superior

Debe incluir botones con íconos.

Orden sugerido:

Nuevo

```html
<v-btn icon>
    <v-icon>mdi-file-outline</v-icon>
</v-btn>
```

Consultar

```html
mdi-magnify
```

Guardar

```html
mdi-content-save
```

PDF

```html
mdi-file-pdf-box
```

CRUD Sucursales

```html
mdi-store-edit
```

CRUD Motivos

```html
mdi-format-list-bulleted
```

Cancelar Traspaso

```html
mdi-cancel
```

---

# Estados de botones

Guardar:

Habilitado solamente cuando:

* Existe sucursal origen.
* Existe al menos un detalle.
* Estado diferente de CANCELADO.

---

PDF

Habilitado solamente cuando:

* El traspaso fue guardado.
* Existe ID del traspaso.

---

Cancelar

Habilitado solamente cuando:

* El traspaso está guardado.
* No está cancelado.

---

# Datos generales

Campos:

Fecha

```html
<v-menu>
    <v-date-picker />
</v-menu>
```

Default:

Fecha actual.

---

Sucursal Origen

```html
<v-select>
```

Obligatorio.

Consumir:

```text
GET /api/sucursales
```

---

Sucursal Destino

```html
<v-select>
```

Obligatorio.

Debe excluir la sucursal origen.

Ejemplo:

Si origen = TIJ

Destino NO debe mostrar TIJ.

---

Motivo

```html
<v-select>
```

Consumir:

```text
GET /api/motivos
```

Motivo aplica por sucursal destino.

---

Personas

Campos manuales:

* Persona que surte
* Persona que captura
* Persona que revisa
* Persona que autoriza

Usar:

```html
<v-text-field>
```

---

Observaciones

```html
<v-textarea>
```

Máximo:

400 caracteres.

---

# Captura rápida

Debe existir:

Cantidad

```html
<v-text-field type="number">
```

Default:

```text
1
```

Sólo enteros.

---

Input principal

```html
<v-text-field>
```

Función:

Capturar ID del artículo.

---

Botón buscar

```html
<v-btn icon>
    <v-icon>mdi-magnify</v-icon>
</v-btn>
```

Abre diálogo con Catalogo.vue.

---

# Captura mediante Enter

Al presionar Enter:

Consumir:

```text
GET ${config.backEndUrl}/gusher/ws.prg?mod=codigo&id=${id}
```

El endpoint devuelve:

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

Agregar automáticamente a detalle.

---

# Integración Catalogo.vue

Abrir dentro de:

```html
<v-dialog>
```

Cuando el usuario seleccione un artículo:

Catalogo.vue debe emitir:

```js
this.$emit('fromChildRowClick', item)
```

Traspasos.vue debe escuchar:

```html
@fromChildRowClick
```

Cerrar diálogo.

Agregar artículo.

---

# Después de agregar artículo

Reglas:

Cantidad capturada:

Debe aplicarse al artículo.

Después:

Cantidad debe regresar a:

```text
1
```

El foco debe regresar automáticamente al input principal.

Usar:

```js
this.$refs.inputCodigo.focus()
```

---

# Tabla detalle

Usar:

```html
<v-data-table>
```

Con filtro general.

---

# Columnas

Eliminar

Clave

Código Barras

Descripción

Etiqueta

Lote

Fecha Caducidad

Cantidad

Sucursal Destino

Motivo

---

# Edición en línea

Usar:

```html
<v-edit-dialog>
```

Permitir editar:

Etiqueta

Lote

Fecha Caducidad

Cantidad

Sucursal Destino

Motivo

---

# Eliminar renglón

Botón:

```html
mdi-delete
```

Eliminar únicamente de la tabla.

---

# Consulta de Traspasos

Botón:

```html
mdi-magnify
```

Abrir diálogo.

---

# Diálogo consulta

Usar:

```html
<v-dialog max-width="1200">
```

Tabla con filtro.

Consumir:

```text
GET /api/traspasos
```

---

# Al seleccionar traspaso

Consumir:

```text
GET /api/traspasos/:id
```

Limpiar formulario.

Cargar información completa.

Permitir edición.

Habilitar PDF.

---

# CRUD Sucursales

Abrir mediante diálogo.

Usar:

```html
<v-dialog>
```

Tabla editable.

Consumir:

GET

POST

PUT

DELETE

de:

```text
/api/sucursales
```

Campos:

* abreviacion
* nombre
* domicilio
* colonia
* ciudad
* codigo_postal
* telefonos

---

# CRUD Motivos

Abrir mediante diálogo.

Consumir:

```text
/ api / motivos
```

Campos:

* descripcion
* activo

Permitir activar/desactivar.

---

# Guardar

Consumir:

```text
POST /api/traspasos
```

Si es edición:

```text
PUT /api/traspasos/:id
```

Mostrar:

Snackbar.

---

# PDF

Usar:

```text
pdfmake
```

No usar jsPDF.

---

# Visualización PDF

Mostrar dentro de:

```html
<v-dialog fullscreen>
```

Sin popup externo.

Usar iframe o blob.

---

# Agrupación PDF

Agrupar detalle por:

Sucursal destino.

Cada sucursal:

Debe generarse en hoja separada.

---

# Encabezado PDF

4 columnas.

Columna 1

Logo:

```text
/static/logo.png
```

Superior izquierda.

---

Columna 2

Título:

Origen

Datos sucursal origen.

---

Columna 3

Título:

Destino

Datos sucursal destino.

---

Columna 4

Rectángulo:

Folio

Formato:

```text
TRA-000123
```

Debajo:

Fecha.

Formato:

Día-MesNombre-Año.

Ejemplo:

```text
25-Junio-2026
```

---

# Footer PDF

Mostrar:

Motivo del traspaso.

Observaciones.

Firmas.

Campos:

* Surte
* Captura
* Revisa
* Autoriza

Número de página.

La numeración debe reiniciarse por cada sucursal.

---

# Nuevo

Debe limpiar completamente la forma.

Restablecer:

Fecha actual.

Cantidad = 1.

Detalle vacío.

PDF deshabilitado.

Guardar deshabilitado.

Foco al input principal.

---

# Restricciones

NO utilizar Composition API.

NO utilizar Vuex.

NO modificar Catalogo.vue.

NO modificar componentes existentes.

NO generar pseudocódigo.

Generar código completo.

El código debe estar listo para copiar y pegar.

Mantener compatibilidad con Nuxt 2.13.3 y Vuetify 1.12.3.

Debe ser ejecutable por un agente de IA sin necesidad de solicitar aclaraciones adicionales.
