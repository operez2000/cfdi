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
              Total Piezas: <strong>{{ totalPiezas }}</strong>
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

        <template v-slot:item.cantidad="{ item }">
          <span class="font-weight-medium success--text text--darken-2">{{ item.cantidad }}</span>
        </template>

        <template v-slot:item.devolucion="{ item }">
          <span :class="item.devolucion > 0 ? 'error--text font-weight-bold' : ''">
            {{ item.devolucion }}
          </span>
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
        { text: 'Código', value: 'codigo', align: 'start', sortable: true },
        { text: 'Descripción', value: 'descripcion', sortable: true },
        { text: 'Fecha', value: 'fecha', sortable: true },
        { text: 'Hora', value: 'hora', sortable: true },
        { text: 'Folio', value: 'folio', sortable: true },
        { text: 'Tipo Mov.', value: 'tipo_movim', sortable: true },
        { text: 'Cant.', value: 'cantidad', align: 'end', sortable: true },
        { text: 'Dev.', value: 'devolucion', align: 'end', sortable: true },
        { text: 'Exist.', value: 'existencia', align: 'end', sortable: true },
        { text: 'Cód. Barras', value: 'barras', sortable: true },
        { text: 'Receta', value: 'receta', sortable: true },
        { text: 'Vendedor', value: 'vendedor', sortable: true },
        { text: 'Clasif.', value: 'clasificacion', sortable: true },
        { text: 'Concepto', value: 'concepto', sortable: true }
      ]
    }
  },

  computed: {
    formularioValido() {
      return Boolean(this.fecha_inicial && this.fecha_final && this.categoria)
    },

    totalPiezas() {
      return this.ventas.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0)
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

      try {
        const url = `${config.backEndUrl}/gusher/ws.prg?mod=ventas-por-categoria&fecha_inicial=${this.fecha_inicial}&fecha_final=${this.fecha_final}&categoria=${encodeURIComponent(this.categoria)}`
        const resp = await this.$axios.get(url)

        if (resp && resp.data) {
          if (resp.data.response === 200 || Array.isArray(resp.data.data)) {
            const data = resp.data.data || []
            this.ventas = data.map(item => ({
              codigo: (item.codigo || '').toString().trim(),
              descripcion: (item.descripcion || '').toString().trim(),
              fecha: (item.fecha || '').toString().trim(),
              hora: (item.hora || '').toString().trim(),
              folio: (item.folio || '').toString().trim(),
              devolucion: Number(item.devolucion || 0),
              cantidad: Number(item.cantidad || 0),
              concepto: (item.concepto || '').toString().trim(),
              barras: (item.barras || '').toString().trim(),
              existencia: Number(item.existencia || 0),
              receta: (item.receta || '').toString().trim(),
              vendedor: (item.vendedor || '').toString().trim(),
              clasificacion: (item.clasificacion || '').toString().trim(),
              tipo_movim: (item.tipo_movim || '').toString().trim()
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

        // Título principal
        ws.mergeCells('A1:N1')
        const titleCell = ws.getCell('A1')
        titleCell.value = 'FARMACIAS GUSHER - REPORTE DE VENTAS POR CATEGORÍA'
        titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
        titleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1976D2' }
        }
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
        ws.getRow(1).height = 28

        // Subtítulo con parámetros del reporte
        ws.mergeCells('A2:N2')
        const subtitleCell = ws.getCell('A2')
        subtitleCell.value = `Categoría: ${catTexto}   |   Periodo: ${this.fecha_inicial} al ${this.fecha_final}   |   Total Registros: ${this.ventas.length}   |   Total Piezas: ${this.totalPiezas}`
        subtitleCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF263238' } }
        subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
        ws.getRow(2).height = 20

        // Columnas
        const columns = [
          { header: 'Código', width: 12 },
          { header: 'Descripción', width: 35 },
          { header: 'Fecha', width: 14 },
          { header: 'Hora', width: 10 },
          { header: 'Folio', width: 12 },
          { header: 'Tipo Movimiento', width: 16 },
          { header: 'Cantidad', width: 12 },
          { header: 'Devolución', width: 12 },
          { header: 'Existencia', width: 12 },
          { header: 'Cód. Barras', width: 18 },
          { header: 'Receta', width: 12 },
          { header: 'Vendedor', width: 12 },
          { header: 'Clasificación', width: 14 },
          { header: 'Concepto', width: 22 }
        ]

        // Encabezados en Fila 4
        const headerRow = ws.getRow(4)
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

        // Filas de datos
        let currentRowIdx = 5
        this.ventas.forEach((item, index) => {
          const row = ws.getRow(currentRowIdx)
          row.values = [
            item.codigo,
            item.descripcion,
            item.fecha,
            item.hora,
            item.folio,
            item.tipo_movim,
            item.cantidad,
            item.devolucion,
            item.existencia,
            item.barras,
            item.receta,
            item.vendedor,
            item.clasificacion,
            item.concepto
          ]
          row.height = 20

          const isEven = index % 2 === 0
          const bgColor = isEven ? 'FFFFFFFF' : 'FFF9FBE7' // Zebra suave

          for (let i = 1; i <= columns.length; i++) {
            const cell = row.getCell(i)
            cell.font = { name: 'Calibri', size: 10 }
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

            // Alineación numérica o centrada según columna
            if ([7, 8, 9].includes(i)) {
              cell.alignment = { horizontal: 'right', vertical: 'middle' }
            } else if ([1, 3, 4, 5, 6, 10, 11, 12, 13].includes(i)) {
              cell.alignment = { horizontal: 'center', vertical: 'middle' }
            } else {
              cell.alignment = { horizontal: 'left', vertical: 'middle' }
            }
          }
          currentRowIdx++
        })

        // Fila de Totales
        const totalRow = ws.getRow(currentRowIdx)
        totalRow.getCell(2).value = 'TOTALES:'
        totalRow.getCell(2).font = { name: 'Calibri', size: 11, bold: true }
        totalRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }

        const totalCantidad = this.ventas.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0)
        const cellTotCant = totalRow.getCell(7)
        cellTotCant.value = totalCantidad
        cellTotCant.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1B5E20' } }
        cellTotCant.alignment = { horizontal: 'right', vertical: 'middle' }

        const totalDev = this.ventas.reduce((acc, curr) => acc + (Number(curr.devolucion) || 0), 0)
        const cellTotDev = totalRow.getCell(8)
        cellTotDev.value = totalDev
        cellTotDev.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFB71C1C' } }
        cellTotDev.alignment = { horizontal: 'right', vertical: 'middle' }

        for (let i = 1; i <= columns.length; i++) {
          const cell = totalRow.getCell(i)
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF424242' } },
            bottom: { style: 'double', color: { argb: 'FF424242' } }
          }
        }
        totalRow.height = 24

        // Asignación de anchos a columnas
        columns.forEach((col, idx) => {
          ws.getColumn(idx + 1).width = col.width
        })

        // Generación del archivo y descarga en navegador
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
