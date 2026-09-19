<template>
  <v-container fluid class="pa-4">
    <!-- Diálogo / Notificaciones -->
    <v-snackbar
      v-model="snackbar.active"
      :color="snackbar.color"
      :timeout="4000"
      top
      right
    >
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.active = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

    <!-- Tarjeta de Filtros de Búsqueda -->
    <v-card class="mb-4 elevation-3">
      <v-card-title class="py-2 primary white--text d-flex align-center">
        <v-icon left color="white">mdi-chart-box-outline</v-icon>
        <span class="text-h6">Consulta de Ventas por Categoría</span>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-row align="center">
          <!-- Fecha Inicial -->
          <v-col cols="12" sm="6" md="3">
            <v-menu
              v-model="menuFechaInicial"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="fecha_inicial"
                  label="Fecha Inicial"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  dense
                  outlined
                  hide-details
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="fecha_inicial"
                locale="es-mx"
                no-title
                scrollable
                @input="menuFechaInicial = false"
              ></v-date-picker>
            </v-menu>
          </v-col>

          <!-- Fecha Final -->
          <v-col cols="12" sm="6" md="3">
            <v-menu
              v-model="menuFechaFinal"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="fecha_final"
                  label="Fecha Final"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  dense
                  outlined
                  hide-details
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="fecha_final"
                locale="es-mx"
                no-title
                scrollable
                @input="menuFechaFinal = false"
              ></v-date-picker>
            </v-menu>
          </v-col>

          <!-- Categoría Select / Autocomplete -->
          <v-col cols="12" sm="8" md="4">
            <v-autocomplete
              v-model="categoria"
              :items="categorias"
              :loading="loaders.categorias"
              item-value="categoria"
              :item-text="item => `${item.categoria} - ${item.descripcion}`"
              label="Categoría"
              placeholder="Seleccionar categoría"
              dense
              outlined
              hide-details
              clearable
              no-data-text="Sin categorías disponibles"
              @keyup.enter="consultarVentas"
            ></v-autocomplete>
          </v-col>

          <!-- Botón Buscar -->
          <v-col cols="12" sm="4" md="2" class="d-flex justify-end">
            <v-btn
              color="primary"
              class="px-4"
              block
              :loading="loaders.ventas"
              :disabled="!formularioValido || loaders.ventas"
              @click="consultarVentas"
            >
              <v-icon left>mdi-magnify</v-icon>
              Buscar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tarjeta de Resultados y Tabla -->
    <v-card class="elevation-3">
      <!-- Barra superior de la tabla: Filtro general, resumen y botón Excel -->
      <v-card-title class="py-2">
        <v-row align="center" no-gutters class="w-100">
          <!-- Campo de búsqueda / filtro general -->
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="search"
              label="Filtrar en los resultados..."
              prepend-inner-icon="mdi-magnify"
              dense
              outlined
              hide-details
              clearable
              :disabled="ventas.length === 0"
            ></v-text-field>
          </v-col>

          <v-spacer></v-spacer>

          <!-- Resumen de registros y piezas -->
          <v-col cols="auto" class="d-flex align-center flex-wrap mr-2">
            <v-chip class="mr-2" color="primary" outlined small v-if="ventas.length > 0">
              <v-icon left small>mdi-format-list-numbered</v-icon>
              Registros: <strong>{{ ventas.length }}</strong>
            </v-chip>
            <v-chip color="secondary" outlined small v-if="ventas.length > 0">
              <v-icon left small>mdi-pill</v-icon>
              Total Salidas: <strong>{{ totalPiezas }}</strong>
            </v-chip>
          </v-col>

          <!-- Botón de Exportar a Excel -->
          <v-col cols="auto">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  color="success"
                  dark
                  :disabled="ventas.length === 0 || loaders.excel"
                  :loading="loaders.excel"
                  v-bind="attrs"
                  v-on="on"
                  @click="exportarExcel"
                >
                  <v-icon left>mdi-file-excel-outline</v-icon>
                  Excel
                </v-btn>
              </template>
              <span>Exportar datos de la tabla a archivo Excel (.xlsx)</span>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Tabla de Datos con Ordenamiento y Paginación -->
      <v-data-table
        :headers="headers"
        :items="ventas"
        :search="search"
        :loading="loaders.ventas"
        loading-text="Consultando ventas por categoría..."
        no-data-text="No hay datos para mostrar. Seleccione un rango de fechas y una categoría para consultar."
        no-results-text="No se encontraron registros que coincidan con el filtro."
        dense
        class="elevation-1"
        :items-per-page="15"
        :footer-props="{
          'items-per-page-options': [10, 15, 25, 50, 100, -1],
          'items-per-page-text': 'Filas por página',
          'items-per-page-all-text': 'Todos'
        }"
      >
        <!-- Slot personalizado para formatear columnas -->
        <template v-slot:item.codigo="{ item }">
          <span class="font-weight-bold text--primary">{{ item.codigo }}</span>
        </template>

        <template v-slot:item.salidas="{ item }">
          <span class="font-weight-medium success--text text--darken-2">{{ item.salidas }}</span>
        </template>

        <template v-slot:item.entradas="{ item }">
          <span class="font-weight-medium blue--text text--darken-2">{{ item.entradas }}</span>
        </template>

        <template v-slot:item.tipo_movim="{ item }">
          <v-chip
            x-small
            :color="item.tipo_movim === 'Venta' ? 'primary' : 'warning'"
            outlined
          >
            {{ item.tipo_movim }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import config from '../config.json'

export default {
  name: 'VentasCategoria',

  data() {
    return {
      // Filtros
      fecha_inicial: '',
      fecha_final: '',
      categoria: null,
      categorias: [],

      // Control de calendarios
      menuFechaInicial: false,
      menuFechaFinal: false,

      // Búsqueda en tabla y datos
      search: '',
      ventas: [],
      parametros: null,

      // Loaders
      loaders: {
        categorias: false,
        ventas: false,
        excel: false
      },

      // Notificaciones
      snackbar: {
        active: false,
        text: '',
        color: 'info'
      },

      // Encabezados de tabla
      headers: [
        { text: 'Código',      value: 'codigo',         align: 'start', sortable: true },
        { text: 'Descripción', value: 'descripcion',                     sortable: true },
        { text: 'Cód. Barras', value: 'barras',                          sortable: true },
        { text: 'Fecha',       value: 'fecha',                           sortable: true },
        { text: 'Hora',        value: 'hora',                            sortable: true },
        { text: 'Folio',       value: 'folio',                           sortable: true },
        { text: 'Tipo Mov.',   value: 'tipo_movim',                      sortable: true },
        { text: 'Entrada',     value: 'entradas',       align: 'end',    sortable: true },
        { text: 'Salida',      value: 'salidas',        align: 'end',    sortable: true },
        { text: 'Saldo',       value: 'saldo',          align: 'end',    sortable: true },
        { text: 'Receta',      value: 'receta',                          sortable: true },
        { text: 'Vendedor',    value: 'vendedor',                        sortable: true },
        { text: 'Usuario',     value: 'usuario',                         sortable: true },
        { text: 'Clasif.',     value: 'clasificacion',                   sortable: true },
        { text: 'Lote',        value: 'lote',                            sortable: true },
        { text: 'Caducidad',   value: 'caducidad',                       sortable: true },
        { text: 'Proveedor',   value: 'proveedor',                       sortable: true },
        { text: 'Observ.',     value: 'observaciones',                   sortable: true }
      ]
    }
  },

  computed: {
    formularioValido() {
      return Boolean(this.fecha_inicial && this.fecha_final && this.categoria)
    },

    totalPiezas() {
      return this.ventas.reduce((acc, curr) => acc + (Number(curr.salidas) || 0), 0)
    }
  },

  mounted() {
    this.inicializarFechas()
    this.cargarCategorias()
  },

  methods: {
    mostrarMensaje(mensaje, color = 'info') {
      this.snackbar.text = mensaje
      this.snackbar.color = color
      this.snackbar.active = true
    },

    inicializarFechas() {
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')

      // Por omisión: primer día del mes actual a la fecha de hoy
      this.fecha_inicial = `${yyyy}-${mm}-01`
      this.fecha_final = `${yyyy}-${mm}-${dd}`
    },

    async cargarCategorias() {
      this.loaders.categorias = true
      try {
        const resp = await this.$axios.get(`${config.backEndUrl}/gusher/ws.prg?mod=get-categorias`)
        if (resp && resp.data && resp.data.data) {
          this.categorias = (resp.data.data || []).map(cat => ({
            categoria: (cat.categoria || '').toString().trim(),
            descripcion: (cat.descripcion || '').toString().trim()
          }))
        } else {
          this.mostrarMensaje('No se recibieron categorías del servidor', 'warning')
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error)
        this.mostrarMensaje('Error al obtener categorías: ' + (error.message || error), 'error')
      } finally {
        this.loaders.categorias = false
      }
    },

    async consultarVentas() {
      if (!this.formularioValido) {
        this.mostrarMensaje('Por favor especifique fecha inicial, fecha final y categoría', 'warning')
        return
      }

      this.loaders.ventas = true
      this.ventas = []
      this.parametros = null

      try {
        const url = `${config.backEndUrl}/gusher/ws.prg?mod=ventas-por-categoria&fecha_inicial=${this.fecha_inicial}&fecha_final=${this.fecha_final}&categoria=${encodeURIComponent(this.categoria)}`
        const resp = await this.$axios.get(url)

        if (resp && resp.data) {
          if (resp.data.response === 200 || Array.isArray(resp.data.data)) {
            // Guardar parámetros del reporte
            this.parametros = resp.data.parametros || null

            const data = resp.data.data || []
            this.ventas = data.map(item => ({
              codigo: (item.codigo || '').toString().trim(),
              descripcion: (item.descripcion || '').toString().trim(),
              fecha: (item.fecha || '').toString().trim(),
              hora: (item.hora || '').toString().trim(),
              folio: (item.folio || '').toString().trim(),
              entradas: Number(item.entradas || 0),
              salidas: Number(item.salidas || 0),
              saldo: Number(item.saldo || 0),
              barras: (item.barras || '').toString().trim(),
              receta: (item.receta || '').toString().trim(),
              vendedor: (item.vendedor || '').toString().trim(),
              clasificacion: (item.clasificacion || '').toString().trim(),
              tipo_movim: (item.tipo_movim || '').toString().trim(),
              lote: (item.lote || '').toString().trim(),
              caducidad: (item.caducidad || '').toString().trim(),
              usuario: (item.usuario || '').toString().trim(),
              proveedor: (item.proveedor || '').toString().trim(),
              observaciones: (item.observaciones || '').toString().trim()
            }))

            if (this.ventas.length === 0) {
              this.mostrarMensaje('No se encontraron ventas para los criterios seleccionados', 'info')
            }
          } else {
            this.mostrarMensaje(resp.data.msg || 'Respuesta inesperada al consultar ventas', 'warning')
          }
        }
      } catch (error) {
        console.error('Error al consultar ventas por categoría:', error)
        this.mostrarMensaje('Error al consultar ventas: ' + (error.message || error), 'error')
      } finally {
        this.loaders.ventas = false
      }
    },

    async exportarExcel() {
      if (!this.ventas || this.ventas.length === 0) {
        this.mostrarMensaje('No hay registros en la tabla para exportar', 'warning')
        return
      }

      this.loaders.excel = true

      try {
        // Carga dinámica de ExcelJS bundle cliente
        const ExcelJS = require('exceljs/dist/exceljs.min.js')
        const wb = new ExcelJS.Workbook()
        wb.creator = 'Farmacias Gusher'
        wb.created = new Date()

        const ws = wb.addWorksheet('Ventas por Categoría')

        // Categoría seleccionada texto
        const catObj = this.categorias.find(c => c.categoria === this.categoria)
        const catTexto = catObj ? `${catObj.categoria} - ${catObj.descripcion}` : this.categoria

        // Número de columnas
        const NUM_COLS = 18
        const lastCol = String.fromCharCode(64 + NUM_COLS) // 'R' para 18 columnas

        // ── Fila 1: Nombre de la empresa ──────────────────────────────────────
        ws.mergeCells(`A1:${lastCol}1`)
        const empresaCell = ws.getCell('A1')
        empresaCell.value = this.parametros ? (this.parametros.empresa || 'FARMACIAS GUSHER').toUpperCase() : 'FARMACIAS GUSHER'
        empresaCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
        empresaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } }
        empresaCell.alignment = { horizontal: 'center', vertical: 'middle' }
        ws.getRow(1).height = 28

        // ── Fila 2: Sucursal ──────────────────────────────────────────────────
        ws.mergeCells(`A2:${lastCol}2`)
        const sucursalCell = ws.getCell('A2')
        sucursalCell.value = this.parametros ? (this.parametros.sucursal || '') : ''
        sucursalCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
        sucursalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } }
        sucursalCell.alignment = { horizontal: 'center', vertical: 'middle' }
        ws.getRow(2).height = 22

        // ── Fila 3: Dirección compuesta ───────────────────────────────────────
        ws.mergeCells(`A3:${lastCol}3`)
        const dirCell = ws.getCell('A3')
        if (this.parametros) {
          const dir = [this.parametros.direccion, this.parametros.colonia, this.parametros.ciudad]
            .filter(Boolean)
            .join(' | ')
          dirCell.value = dir
        } else {
          dirCell.value = ''
        }
        dirCell.font = { name: 'Calibri', size: 10, bold: false, color: { argb: 'FFFFFFFF' } }
        dirCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } }
        dirCell.alignment = { horizontal: 'center', vertical: 'middle' }
        ws.getRow(3).height = 18

        // ── Fila 4: Parámetros del reporte ────────────────────────────────────
        ws.mergeCells(`A4:${lastCol}4`)
        const subtitleCell = ws.getCell('A4')
        subtitleCell.value = `Reporte de Ventas por Categoría   |   Categoría: ${catTexto}   |   Periodo: ${this.fecha_inicial} al ${this.fecha_final}   |   Registros: ${this.ventas.length}   |   Total Salidas: ${this.totalPiezas}`
        subtitleCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF263238' } }
        subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
        subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
        ws.getRow(4).height = 20

        // ── Columnas ──────────────────────────────────────────────────────────
        const columns = [
          { header: '# Parte',        width: 12 },  // col 1  - codigo
          { header: 'Descripción',    width: 35 },  // col 2  - descripcion
          { header: 'Cód. Barras',    width: 18 },  // col 3  - barras
          { header: 'Fecha',          width: 14 },  // col 4  - fecha
          { header: 'Hora',           width: 10 },  // col 5  - hora
          { header: 'Folio',          width: 12 },  // col 6  - folio
          { header: 'Tipo Mov',       width: 14 },  // col 7  - tipo_movim
          { header: 'Entrada',        width: 12 },  // col 8  - entradas
          { header: 'Salida',         width: 12 },  // col 9  - salidas
          { header: 'Saldo',          width: 12 },  // col 10 - saldo
          { header: 'Receta',         width: 12 },  // col 11 - receta
          { header: 'Vend',           width: 12 },  // col 12 - vendedor
          { header: 'Usuario',        width: 14 },  // col 13 - usuario
          { header: 'Clasif',         width: 12 },  // col 14 - clasificacion
          { header: 'Lote',           width: 14 },  // col 15 - lote
          { header: 'Caducidad',      width: 14 },  // col 16 - caducidad
          { header: 'Proveedor',      width: 18 },  // col 17 - proveedor
          { header: 'Observaciones',  width: 30 }   // col 18 - observaciones
        ]

        // ── Encabezados en Fila 6 ─────────────────────────────────────────────
        const headerRow = ws.getRow(6)
        columns.forEach((col, idx) => {
          const cell = headerRow.getCell(idx + 1)
          cell.value = col.header
          cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2E7D32' } // Verde institucional
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFBDBDBD' } },
            left: { style: 'thin', color: { argb: 'FFBDBDBD' } },
            bottom: { style: 'medium', color: { argb: 'FF1B5E20' } },
            right: { style: 'thin', color: { argb: 'FFBDBDBD' } }
          }
        })
        headerRow.height = 24

        // ── Calcular anchos dinámicos (máx. valor de cada columna + padding) ──
        // Valores por columna en el mismo orden que row.values
        const colKeys = [
          'codigo', 'descripcion', 'barras', 'fecha', 'hora', 'folio',
          'tipo_movim', 'entradas', 'salidas', 'saldo', 'receta', 'vendedor',
          'usuario', 'clasificacion', 'lote', 'caducidad', 'proveedor', 'observaciones'
        ]
        // Ancho máximo absoluto por columna (en caracteres)
        const colMaxWidth = [20, 60, 22, 12, 8, 12, 12, 10, 10, 10, 12, 12, 18, 12, 18, 12, 24, 60]
        const PADDING = 2

        // Inicializar con el largo de cada header
        const colWidths = columns.map(col => col.header.length + PADDING)

        // Recorrer los datos y ajustar al valor más largo
        this.ventas.forEach(item => {
          colKeys.forEach((key, idx) => {
            const val = item[key] !== null && item[key] !== undefined ? String(item[key]).trim() : ''
            const len = val.length + PADDING
            if (len > colWidths[idx]) colWidths[idx] = len
          })
        })

        // Aplicar el tope máximo por columna
        colWidths.forEach((w, idx) => {
          colWidths[idx] = Math.min(w, colMaxWidth[idx])
        })

        // ── Filas de datos ────────────────────────────────────────────────────
        let currentRowIdx = 7
        this.ventas.forEach((item, index) => {
          const row = ws.getRow(currentRowIdx)
          row.values = [
            item.codigo,
            item.descripcion,
            item.barras,
            item.fecha,
            item.hora,
            item.folio,
            item.tipo_movim,
            item.entradas,
            item.salidas,
            item.saldo,
            item.receta,
            item.vendedor,
            item.usuario,
            item.clasificacion,
            item.lote,
            item.caducidad,
            item.proveedor,
            item.observaciones
          ]
          row.height = 20

          const isEven = index % 2 === 0
          const bgColor = isEven ? 'FFFFFFFF' : 'FFF9FBE7' // Zebra suave

          for (let i = 1; i <= columns.length; i++) {
            const cell = row.getCell(i)
            cell.font = { name: 'Calibri', size: 9 }
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: bgColor }
            }
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
              left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
              bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
              right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
            }

            // Alineación: numérica para entradas/salidas/saldo (cols 8,9,10), izq para descripción y observaciones
            if ([8, 9, 10].includes(i)) {
              cell.alignment = { horizontal: 'right', vertical: 'middle' }
            } else if ([2, 18].includes(i)) {
              cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
            } else {
              cell.alignment = { horizontal: 'center', vertical: 'middle' }
            }
          }
          currentRowIdx++
        })

        // ── Fila de Totales ───────────────────────────────────────────────────
        const totalRow = ws.getRow(currentRowIdx)
        totalRow.getCell(2).value = 'TOTALES:'
        totalRow.getCell(2).font = { name: 'Calibri', size: 11, bold: true }
        totalRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }

        const totalEntradas = this.ventas.reduce((acc, curr) => acc + (Number(curr.entradas) || 0), 0)
        const cellTotEnt = totalRow.getCell(8)
        cellTotEnt.value = totalEntradas
        cellTotEnt.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1565C0' } }
        cellTotEnt.alignment = { horizontal: 'right', vertical: 'middle' }

        const totalSalidas = this.ventas.reduce((acc, curr) => acc + (Number(curr.salidas) || 0), 0)
        const cellTotSal = totalRow.getCell(9)
        cellTotSal.value = totalSalidas
        cellTotSal.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1B5E20' } }
        cellTotSal.alignment = { horizontal: 'right', vertical: 'middle' }

        for (let i = 1; i <= columns.length; i++) {
          const cell = totalRow.getCell(i)
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF424242' } },
            bottom: { style: 'double', color: { argb: 'FF424242' } }
          }
        }
        totalRow.height = 24

        // ── Anchos dinámicos de columnas ──────────────────────────────────────
        colWidths.forEach((w, idx) => {
          ws.getColumn(idx + 1).width = w
        })

        // ── Márgenes estrechos (Narrow) ───────────────────────────────────────
        ws.pageSetup.margins = {
          left:   0.25,
          right:  0.25,
          top:    0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        }

        // ── Generar y descargar archivo ───────────────────────────────────────
        const buffer = await wb.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const link = document.createElement('a')
        const fileName = `ventas_cat_${this.categoria}_${this.fecha_inicial}_a_${this.fecha_final}.xlsx`
        link.href = window.URL.createObjectURL(blob)
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(link.href)

        this.mostrarMensaje(`Archivo "${fileName}" descargado exitosamente`, 'success')
      } catch (error) {
        console.error('Error al exportar a Excel:', error)
        this.mostrarMensaje('Error al exportar a Excel: ' + (error.message || error), 'error')
      } finally {
        this.loaders.excel = false
      }
    }
  }
}
</script>

<style scoped>
.w-100 {
  width: 100%;
}
</style>
