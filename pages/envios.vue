<template>
  <v-container fluid>
    <SnackBar ref="snackBar" />

    <v-toolbar dense color="primary" dark flat>
      <v-toolbar-title>Envíos de Mercancía a Sucursales</v-toolbar-title>
      <v-spacer />
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on" @click="nuevo">
            <v-icon>mdi-file-outline</v-icon>
          </v-btn>
        </template>
        <span>Nuevo</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on" :disabled="!puedePdf" @click="generarPdf" :loading="loading.pdf">
            <v-icon>mdi-file-pdf-box</v-icon>
          </v-btn>
        </template>
        <span>PDF</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on" @click="abrirSucursales">
            <v-icon>mdi-store-edit</v-icon>
          </v-btn>
        </template>
        <span>Sucursales</span>
      </v-tooltip>
    </v-toolbar>

    <!-- Encabezado -->
    <v-card class="mt-3 pa-3" flat outlined>
      <v-row dense>
        <v-col cols="12" sm="6" md="2">
          <v-menu
            v-model="menuFecha"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            min-width="290px"
          >
            <template v-slot:activator="{ on }">
              <v-text-field
                :value="formatDateYMD(form.fecha)"
                label="Fecha *"
                readonly
                dense
                filled
                v-on="on"
              />
            </template>
            <v-date-picker v-model="form.fecha" locale="es-MX" @input="menuFecha = false" />
          </v-menu>
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="form.id_sucursal_origen"
            :items="sucursales"
            item-text="nombre"
            item-value="id"
            label="Sucursal Origen *"
            dense
            filled
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="form.id_sucursal_destino"
            :items="sucursalesDestino"
            item-text="nombre"
            item-value="id"
            label="Sucursal Destino *"
            dense
            filled
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Captura -->
    <v-card class="mt-3 pa-3" flat outlined>
      <v-row dense align="center">
        <v-col cols="12" sm="2" md="1">
          <v-text-field
            v-model.number="captura.cantidad"
            label="Cantidad"
            type="number"
            min="1"
            step="1"
            dense
            filled
            @keyup.enter.native="focusInputCodigo"
          />
        </v-col>
        <v-col cols="12" sm="8" md="9">
          <v-text-field
            ref="inputCodigo"
            v-model="captura.codigo"
            label="Código / Etiqueta / Barras"
            dense
            filled
            clearable
            append-icon="mdi-magnify"
            :loading="loading.codigo"
            @click:append="dialog.catalogo = true"
            @keyup.enter.native="capturarCodigo"
          />
        </v-col>
        <v-col cols="12" sm="2" md="2">
          <v-btn block color="primary" @click="dialog.catalogo = true">
            Catálogo
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Tabla detalle -->
    <v-card class="mt-3" flat outlined>
      <v-data-table
        :headers="headersDetalle"
        :items="detalleFlat"
        :search="filtroDetalle"
        dense
        class="elevation-1"
        :items-per-page="-1"
        hide-default-footer
      >
        <template v-slot:top>
          <v-text-field
            v-model="filtroDetalle"
            label="Filtrar detalle..."
            class="mx-4 my-2"
            dense
            filled
            clearable
            append-icon="mdi-magnify"
          />
        </template>

        <template v-slot:item.acciones="{ item }">
          <v-btn icon small color="error" @click="eliminarRenglon(item)">
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>

        <template v-for="suc in sucursales" v-slot:[slotName(suc.id)]="{ item }">
          <v-edit-dialog
            :key="'edit-' + suc.id + '-' + item._uid"
            :return-value.sync="item.sucursales[suc.id]"
            large
            cancel-text="Cancelar"
            save-text="Ok"
            @save="() => guardarCantidadSucursal(item, suc.id)"
          >
            {{ item.sucursales[suc.id] || '' }}
            <template v-slot:input>
              <v-text-field
                v-model.number="item.sucursales[suc.id]"
                :label="suc.nombre"
                type="number"
                min="0"
                single-line
              />
            </template>
          </v-edit-dialog>
        </template>
      </v-data-table>
    </v-card>

    <!-- Catálogo -->
    <v-dialog v-model="dialog.catalogo" max-width="1200" scrollable>
      <v-card>
        <v-card-title>
          <v-app-bar color="blue-grey" dense>
            Catálogo de Artículos
            <v-spacer />
            <v-btn icon @click="dialog.catalogo = false"><v-icon>mdi-close</v-icon></v-btn>
          </v-app-bar>
        </v-card-title>
        <v-card-text>
          <Catalogo @fromChildRowClick="seleccionaCatalogo" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Sucursales CRUD -->
    <v-dialog v-model="dialog.sucursales" max-width="1000" scrollable persistent>
      <v-card>
        <v-card-title>
          <v-app-bar color="blue-grey" dense>
            Administración de Sucursales
            <v-spacer />
            <v-btn icon @click="dialog.sucursales = false"><v-icon>mdi-close</v-icon></v-btn>
          </v-app-bar>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="2"><v-text-field v-model="sucursalForm.abreviacion" maxlength="3" label="Abreviación" dense filled /></v-col>
            <v-col cols="12" md="3"><v-text-field v-model="sucursalForm.nombre" label="Nombre" dense filled /></v-col>
            <v-col cols="12" md="3"><v-text-field v-model="sucursalForm.domicilio" label="Domicilio" dense filled /></v-col>
            <v-col cols="12" md="2"><v-text-field v-model="sucursalForm.colonia" label="Colonia" dense filled /></v-col>
            <v-col cols="12" md="2"><v-text-field v-model="sucursalForm.ciudad" label="Ciudad" dense filled /></v-col>
            <v-col cols="12" md="2"><v-text-field v-model="sucursalForm.codigo_postal" label="C.P." dense filled /></v-col>
            <v-col cols="12" md="3"><v-text-field v-model="sucursalForm.telefonos" label="Teléfonos" dense filled /></v-col>
            <v-col cols="12" md="3" class="d-flex align-center">
              <v-btn color="primary" :loading="loading.sucursal" @click="guardarSucursal">
                {{ sucursalForm.id ? 'Actualizar' : 'Agregar' }}
              </v-btn>
              <v-btn text class="ml-2" @click="limpiarSucursalForm">Limpiar</v-btn>
            </v-col>
          </v-row>
          <v-data-table
            :headers="headersSucursales"
            :items="sucursales"
            dense
            class="mt-3"
          >
            <template v-slot:item.acciones="{ item }">
              <v-btn icon small @click="editarSucursal(item)"><v-icon small>mdi-pencil</v-icon></v-btn>
              <v-btn icon small color="error" @click="eliminarSucursal(item)"><v-icon small>mdi-delete</v-icon></v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- PDF fullscreen -->
    <v-dialog v-model="dialog.pdf" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn icon @click="dialog.pdf = false"><v-icon>mdi-close</v-icon></v-btn>
          <v-toolbar-title>Vista previa PDF - Envíos</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="abrirDialogoEmail" :disabled="!pdfBlob"><v-icon>mdi-email</v-icon></v-btn>
          <v-btn icon @click="descargarPdf"><v-icon>mdi-download</v-icon></v-btn>
        </v-toolbar>
        <iframe v-if="pdfUrl" :src="pdfUrl" style="width:100%; height: calc(100vh - 48px); border: none;" />
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog.email" max-width="700">
      <v-card>
        <v-card-title class="headline">Enviar PDF por correo</v-card-title>
        <v-card-text>
          <v-text-field v-model="emailForm.to" label="Correo destino" dense filled hint="Puedes agregar más de una cuenta separadas con coma (,)"></v-text-field>
          <v-text-field v-model="emailForm.cc" label="CC" dense filled hint="Puedes agregar más de una cuenta separadas con coma (,)"></v-text-field>
          <v-text-field v-model="emailForm.subject" label="Asunto" dense filled />
          <v-textarea v-model="emailForm.body" label="Mensaje" rows="4" dense filled />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialog.email = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="loading.email" @click="enviarPdfPorEmail">Enviar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import SnackBar from '../components/SnackBar.vue'
import Catalogo from '../components/Catalogo.vue'
import config from '../config.json'
import Utils from '../assets/utils'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const LS_KEY = 'envios_data'
const utils = new Utils()

export default {
  name: 'Envios',
  components: { SnackBar, Catalogo },

  data () {
    return {
      menuFecha: false,
      filtroDetalle: '',
      pdfUrl: '',
      pdfBlob: null,
      pdfPrinter: null,
      pdfFileName: '',
      emailForm: {
        to: '',
        cc: '',
        subject: '',
        body: ''
      },
      sucursales: [],
      detalle: [],
      captura: {
        codigo: '',
        cantidad: 1
      },
      form: {
        fecha: utils.todayYMD(),
        id_sucursal_origen: null,
        id_sucursal_destino: null
      },
      sucursalForm: this.sucursalFormInicial(),
      loading: {
        codigo: false,
        sucursal: false,
        pdf: false,
        email: false
      },
      dialog: {
        catalogo: false,
        sucursales: false,
        pdf: false,
        email: false
      },
      headersSucursales: [
        { text: 'Abrev.', value: 'abreviacion' },
        { text: 'Nombre', value: 'nombre' },
        { text: 'Ciudad', value: 'ciudad' },
        { text: 'Teléfonos', value: 'telefonos' },
        { text: '', value: 'acciones', sortable: false }
      ]
    }
  },

  computed: {
    puedePdf () {
      return this.detalle.length > 0
    },

    getDefaultEmailDestino () {
      const totalsBySucursal = this.sucursales.reduce((acc, suc) => {
        acc[suc.id] = 0
        return acc
      }, {})

      this.detalle.forEach(item => {
        this.sucursales.forEach(suc => {
          const value = Number(item.sucursales[suc.id])
          if (!Number.isNaN(value)) {
            totalsBySucursal[suc.id] += value
          }
        })
      })

      const destino = this.sucursales.find(suc => totalsBySucursal[suc.id] === 0 && suc.email)
      return destino ? (destino.email || '').trim() : ''
    },

    sucursalesDestino () {
      if (!this.form.id_sucursal_origen) return this.sucursales
      return this.sucursales.filter(s => s.id !== this.form.id_sucursal_origen)
    },

    headersDetalle () {
      const fixed = [
        { text: '', value: 'acciones', sortable: false, width: '50px' },
        { text: 'Código', value: 'codigo' },
        { text: 'Descripción', value: 'descripcion' },
        { text: 'Código barras', value: 'barcode', sortable: false, width: '130px' }
      ]
      const dynamic = this.sucursales.map(suc => ({
        text: suc.abreviacion || suc.nombre,
        value: 'suc_' + suc.id,
        sortable: false,
        width: '80px',
        align: 'center'
      }))
      return [...fixed, ...dynamic]
    },

    detalleFlat () {
      return this.detalle.map(item => {
        const flat = { ...item }
        flat.barcode = item.mBarCode || item.barcode || item.codigoBarras || ''
        this.sucursales.forEach(suc => {
          flat['suc_' + suc.id] = item.sucursales[suc.id] || ''
        })
        return flat
      })
    }
  },

  watch: {
    detalle: {
      handler () {
        this.guardarLocalStorage()
      },
      deep: true
    },
    form: {
      handler () {
        this.guardarLocalStorage()
      },
      deep: true
    }
  },

  mounted () {
    this.cargarCatalogos()
  },

  beforeDestroy () {
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl)
  },

  methods: {
    sucursalFormInicial () {
      return {
        id: null,
        abreviacion: '',
        nombre: '',
        domicilio: '',
        colonia: '',
        ciudad: '',
        codigo_postal: '',
        telefonos: ''
      }
    },

    showSnack (text, color = 'info') {
      this.$refs.snackBar.text = text
      this.$refs.snackBar.color = color
      this.$refs.snackBar.snackBar = true
    },

    getEmailDocumentoNombre () {
      return this.pdfFileName || `envios_${this.formatDateYMD(this.form.fecha)}`
    },

    nombreSucursal (id) {
      const s = this.sucursales.find(v => v.id === id)
      return s ? s.nombre : '—'
    },

    focusInputCodigo () {
      this.$nextTick(() => {
        try {
          this.$refs.inputCodigo.focus()
        } catch (e) { /* noop */ }
      })
    },

    slotName (sucId) {
      return 'item.suc_' + sucId
    },

    normalizarCantidad (item) {
      const n = Math.floor(Number(item.cantidad))
      item.cantidad = (n > 0) ? n : 1
    },

    normalizarCantidadSucursal (item, sucId) {
      const val = item.sucursales[sucId]
      const n = Math.floor(Number(val))
      this.$set(item.sucursales, sucId, (n > 0) ? n : null)
    },

    guardarCantidadSucursal (flatItem, sucId) {
      // Find the original item in detalle and update it
      const original = this.detalle.find(r => r._uid === flatItem._uid)
      if (!original) return
      const val = flatItem.sucursales[sucId]
      const n = Math.floor(Number(val))
      this.$set(original.sucursales, sucId, (n > 0) ? n : null)
    },

    agregarArticulo (data) {
      // Siempre usar el campo 'codigo' de la respuesta
      const codigo = data.codigo || data.mPart || data.mpart || ''
      const descripcion = data.mDesc || data.mdesc || data.descripcion || ''
      const mBarCode = data.mBarCode || data.mBarcode || data.barcode || data.codigoBarras || ''

      // Verificar si el artículo ya existe en la tabla
      const existente = this.detalle.find(r => r.codigo === codigo)
      if (existente) {
        // Si ya existe, solo incrementar la cantidad en la sucursal destino seleccionada
        const cantidad = Math.floor(Number(this.captura.cantidad)) || 1
        if (this.form.id_sucursal_destino) {
          const actual = existente.sucursales[this.form.id_sucursal_destino] || 0
          this.$set(existente.sucursales, this.form.id_sucursal_destino, actual + cantidad)
        }
        if (mBarCode && !existente.mBarCode) {
          existente.mBarCode = mBarCode
        }
        this.captura.codigo = ''
        this.captura.cantidad = 1
        this.focusInputCodigo()
        return
      }

      const cantidad = Math.floor(Number(this.captura.cantidad)) || 1
      const sucursalesObj = {}
      this.sucursales.forEach(suc => {
        sucursalesObj[suc.id] = null
      })
      // Si hay sucursal destino seleccionada, poner la cantidad ahí
      if (this.form.id_sucursal_destino) {
        sucursalesObj[this.form.id_sucursal_destino] = cantidad
      }

      this.detalle.push({
        _uid: Date.now() + Math.random(),
        codigo,
        descripcion,
        mBarCode,
        sucursales: sucursalesObj
      })

      this.captura.codigo = ''
      this.captura.cantidad = 1
      this.focusInputCodigo()
    },

    async capturarCodigo () {
      const id = (this.captura.codigo || '').trim()
      if (!id) return
      this.loading.codigo = true
      try {
        const resp = await this.$axios.get(`${config.backEndUrl}/gusher/ws.prg?mod=codigo&id=${id}`)
        if (resp.data.response === 200) {
          this.agregarArticulo(resp.data.data)
        } else {
          this.showSnack(resp.data.msg || 'Artículo no encontrado', 'warning')
        }
      } catch (err) {
        this.showSnack('Error al consultar artículo', 'error')
      } finally {
        this.loading.codigo = false
      }
    },

    seleccionaCatalogo (item) {
      this.dialog.catalogo = false
      if (!item || !item.mpart) return
      this.agregarArticulo({
        codigo: item.mpart,
        mDesc: item.mdesc,
        mBarCode: item.mbarcode
      })
    },

    eliminarRenglon (item) {
      this.detalle = this.detalle.filter(r => r._uid !== item._uid)
    },

    abrirSucursales () {
      this.limpiarSucursalForm()
      this.dialog.sucursales = true
    },

    editarSucursal (item) {
      this.sucursalForm = { ...item }
    },

    limpiarSucursalForm () {
      this.sucursalForm = this.sucursalFormInicial()
    },

    async guardarSucursal () {
      if (!this.sucursalForm.abreviacion || !this.sucursalForm.nombre) {
        this.showSnack('Abreviación y nombre son obligatorios', 'warning')
        return
      }
      this.loading.sucursal = true
      try {
        let resp
        if (this.sucursalForm.id) {
          resp = await this.$axios.put(`/api/sucursales/${this.sucursalForm.id}`, this.sucursalForm)
        } else {
          resp = await this.$axios.post('/api/sucursales', this.sucursalForm)
        }
        if (resp.data.response === 200) {
          await this.cargarCatalogos()
          this.limpiarSucursalForm()
          this.showSnack('Sucursal guardada', 'success')
        } else {
          this.showSnack(resp.data.msg || 'Error', 'error')
        }
      } catch (err) {
        this.showSnack('Error al guardar sucursal', 'error')
      } finally {
        this.loading.sucursal = false
      }
    },

    async eliminarSucursal (item) {
      if (!confirm(`¿Eliminar sucursal ${item.nombre}?`)) return
      try {
        const resp = await this.$axios.delete(`/api/sucursales/${item.id}`)
        if (resp.data.response === 200) {
          await this.cargarCatalogos()
          this.showSnack('Sucursal eliminada', 'success')
        }
      } catch (err) {
        this.showSnack('Error al eliminar sucursal', 'error')
      }
    },

    async cargarCatalogos () {
      try {
        const respSuc = await this.$axios.get('/api/sucursales')
        if (respSuc.data.response === 200) {
          this.sucursales = respSuc.data.data
        }
      } catch (err) {
        this.showSnack('Error al cargar sucursales', 'error')
      }
      // Después de cargar sucursales, restaurar localStorage
      this.cargarLocalStorage()
    },

    nuevo () {
      this.form = {
        fecha: utils.todayYMD(),
        id_sucursal_origen: null,
        id_sucursal_destino: null
      }
      this.detalle = []
      this.captura.codigo = ''
      this.captura.cantidad = 1
      if (this.pdfUrl) {
        URL.revokeObjectURL(this.pdfUrl)
        this.pdfUrl = ''
      }
      this.pdfBlob = null
      this.pdfPrinter = null
      this.pdfFileName = ''
      this.limpiarLocalStorage()
      this.focusInputCodigo()
    },

    guardarLocalStorage () {
      try {
        const data = {
          form: this.form,
          detalle: this.detalle
        }
        localStorage.setItem(LS_KEY, JSON.stringify(data))
      } catch (e) { /* noop */ }
    },

    cargarLocalStorage () {
      try {
        const raw = localStorage.getItem(LS_KEY)
        if (!raw) return
        const data = JSON.parse(raw)
        if (data.form) {
          this.form = { ...this.form, ...data.form }
          if (this.form.fecha) {
            this.form.fecha = this.formatDateYMD(this.form.fecha) || utils.todayYMD()
          }
        }
        if (data.detalle && Array.isArray(data.detalle)) {
          // Asegurar que cada item tiene las sucursales actuales
          this.detalle = data.detalle.map(item => {
            const sucObj = { ...item.sucursales }
            // Agregar sucursales nuevas que no existan en el item guardado
            this.sucursales.forEach(suc => {
              if (sucObj[suc.id] === undefined) {
                sucObj[suc.id] = null
              }
            })
            return { ...item, sucursales: sucObj }
          })
        }
      } catch (e) { /* noop */ }
    },

    limpiarLocalStorage () {
      try {
        localStorage.removeItem(LS_KEY)
      } catch (e) { /* noop */ }
    },

    formatDateYMD (isoDate) {
      return utils.formatDateYMD(isoDate)
    },

    formatFechaPdf (fechaIso) {
      const normalized = this.formatDateYMD(fechaIso)
      if (!normalized || normalized.length < 10) return normalized || ''
      const parts = normalized.split('-')
      if (parts.length !== 3) return normalized
      const year = parts[0]
      const monthIndex = parseInt(parts[1], 10) - 1
      const day = parts[2]
      const dd = day.padStart(2, '0')
      let mmm = ''
      if (monthIndex >= 0 && monthIndex < 12) {
        const mName = MESES[monthIndex]
        mmm = mName.substring(0, 3)
        mmm = mmm.charAt(0).toUpperCase() + mmm.slice(1).toLowerCase()
      } else {
        mmm = '???'
      }
      const yy = year.substring(2)
      return `${dd}-${mmm}-${yy}`
    },

    async loadLogoBase64 () {
      try {
        const resp = await fetch('../logo.png')
        if (!resp.ok) return null
        const blob = await resp.blob()
        return await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = () => resolve(null)
          reader.readAsDataURL(blob)
        })
      } catch (e) {
        return null
      }
    },

    async abrirDialogoEmail () {
      if (!this.pdfBlob) {
        this.showSnack('Primero genera el PDF para enviarlo', 'warning')
        return
      }
      const nombreDocumento = this.getEmailDocumentoNombre() || 'envios'
      this.emailForm = {
        to: this.getDefaultEmailDestino,
        cc: '',
        subject: `Envío de documento - Envíos ${nombreDocumento}`,
        body: `Envío de documento - Envíos ${nombreDocumento}`
      }
      this.dialog.email = true
    },

    async convertirBlobABase64 (blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result.split(',')[1])
        reader.onerror = () => reject(new Error('No se pudo leer el PDF'))
        reader.readAsDataURL(blob)
      })
    },

    async enviarPdfPorEmail () {
      if (!this.emailForm.to) {
        this.showSnack('El correo destino es obligatorio', 'warning')
        return
      }
      if (!this.pdfBlob) {
        this.showSnack('No existe un PDF listo para enviar', 'warning')
        return
      }

      this.loading.email = true
      try {
        const pdfName = this.getEmailDocumentoNombre() || 'envios.pdf'
        const pdfBase64 = await this.convertirBlobABase64(this.pdfBlob)
        const payload = {
          ...this.emailForm,
          pdfName,
          pdfBase64
        }
        const resp = await this.$axios.post('/api/traspasos/email', payload)
        if (resp.data && resp.data.response === 200) {
          this.dialog.email = false
          this.showSnack('PDF enviado por correo', 'success')
          return
        }
        this.showSnack(resp.data.msg || 'No se pudo enviar el correo', 'error')
      } catch (err) {
        console.error(err)
        this.showSnack('Error al enviar el correo', 'error')
      } finally {
        this.loading.email = false
      }
    },

    async generarPdf () {
      if (!this.puedePdf) return
      try {
        this.loading.pdf = true

        // const pdfMake = (await import('pdfmake/build/pdfmake')).default
        // const vfs = await import('pdfmake/build/vfs_fonts')
        // pdfMake.vfs = vfs.default || vfs

        
        // 1. Importas la librería pdfmake
        const pdfMakeModule = await import('pdfmake/build/pdfmake')
        const pdfMake = pdfMakeModule.default

        // 2. Importas el archivo de fuentes
        const vfsModule = await import('pdfmake/build/vfs_fonts')
        
        // 3. ESTA LÍNEA CAMBIA: Accedemos al objeto pdfMake interno de vfs_fonts
        const pdfFonts = vfsModule.default || vfsModule
        pdfMake.vfs = pdfFonts.pdfMake.vfs 


        const logo = await this.loadLogoBase64()
        const origen = this.sucursales.find(s => s.id === this.form.id_sucursal_origen) || {}
        const destino = this.sucursales.find(s => s.id === this.form.id_sucursal_destino) || {}

        // Construir columnas de sucursales dinámicas
        const sucCols = this.sucursales.map(s => ({
          id: s.id,
          abreviacion: s.abreviacion || s.nombre
        }))

        // Anchos de tabla: Código | Descripción | Código barras | suc1 | suc2 | ...
        const colWidths = [55, '*', 65, ...sucCols.map(() => 30)]

        // Headers de la tabla
        const tableHeaders = [
          { text: 'Código', style: 'tableHeader' },
          { text: 'Descripción', style: 'tableHeader' },
          { text: 'Código barras', style: 'tableHeader', alignment: 'center' },
          ...sucCols.map(sc => ({ text: sc.abreviacion, style: 'tableHeader', alignment: 'center' }))
        ]

        // Filas de datos
        const dataRows = this.detalle.map(item => [
          { text: item.codigo || '', fontSize: 8 },
          { text: item.descripcion || '', fontSize: 8 },
          { text: item.mBarCode || item.barcode || item.codigoBarras || '', fontSize: 8, alignment: 'center' },
          ...sucCols.map(sc => ({
            text: item.sucursales[sc.id] ? String(item.sucursales[sc.id]) : '',
            alignment: 'center',
            fontSize: 8
          }))
        ])

        const noBorder = [false, false, false, false]
        const emptyColSpanCells = Array(colWidths.length - 1).fill({})

        const content = [
          {
            table: {
              headerRows: 3,
              widths: colWidths,
              body: [
                // Título
                [
                  {
                    colSpan: colWidths.length,
                    border: noBorder,
                    stack: [
                      { text: 'TRASPASOS', style: 'sectionTitle', fontSize: 16, alignment: 'center' },
                      { text: '', fontSize: 6 }
                    ]
                  },
                  ...emptyColSpanCells
                ],
                // Encabezado con logo, origen, destino, fecha
                [
                  {
                    colSpan: colWidths.length,
                    border: noBorder,
                    margin: [0, 0, 0, 12],
                    columns: [
                      {
                        width: '18%',
                        stack: logo
                          ? [{ image: 'logo', width: 80, margin: [0, 0, 0, 5] }]
                          : [{ text: 'GUSHER', bold: true, fontSize: 14 }]
                      },
                      {
                        width: '33%',
                        stack: [
                          { text: 'Origen', style: 'sectionTitle' },
                          { text: origen.nombre || '', style: 'small' },
                          { text: origen.domicilio || '', fontSize: 8 },
                          { text: `${origen.colonia || ''} ${origen.ciudad || ''}, CP ${origen.codigo_postal || ''}`.trim(), fontSize: 8 },
                          { text: origen.telefonos || '', fontSize: 8 }
                        ]
                      },
                      {
                        width: '33%',
                        stack: [
                          { text: 'Destino', style: 'sectionTitle' },
                          { text: destino.nombre || '', style: 'small' },
                          { text: destino.domicilio || '', fontSize: 8 },
                          { text: `${destino.colonia || ''} ${destino.ciudad || ''}, CP ${destino.codigo_postal || ''}`.trim(), fontSize: 8 },
                          { text: destino.telefonos || '', fontSize: 8 }
                        ]
                      },
                      {
                        width: '16%',
                        stack: [
                          { text: this.formatFechaPdf(this.form.fecha), alignment: 'center', margin: [0, 4, 0, 0], style: 'small' }
                        ]
                      }
                    ]
                  },
                  ...emptyColSpanCells
                ],
                // Headers de la tabla
                tableHeaders,
                // Filas de datos
                ...dataRows
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16]
          }
        ]

        const docDefinition = {
          pageSize: 'LETTER',
          pageOrientation: 'portrait',
          pageMargins: [30, 40, 30, 50],
          info: {
            title: 'Envíos de Mercancía'
          },
          ...(logo ? { images: { logo } } : {}),
          content,
          footer: (currentPage, pageCount) => ({
            text: `Pag ${currentPage}/${pageCount}`,
            alignment: 'center',
            fontSize: 7,
            margin: [0, 8, 0, 0]
          }),
          styles: {
            sectionTitle: { bold: true, fontSize: 11, margin: [0, 0, 0, 4] },
            small: { fontSize: 9 },
            tableHeader: { bold: true, fontSize: 8, fillColor: '#eeeeee' },
            firma: { fontSize: 9, alignment: 'center' }
          },
          defaultStyle: { fontSize: 9 }
        }

        const pdfName = `envios_${this.formatDateYMD(this.form.fecha)}.pdf`
        this.pdfFileName = pdfName
        const pdfDoc = pdfMake.createPdf(docDefinition)
        this.pdfPrinter = pdfDoc

        pdfDoc.getBlob(blob => {
          if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl)
          this.pdfBlob = new File([blob], pdfName, { type: 'application/pdf' })
          this.pdfUrl = URL.createObjectURL(this.pdfBlob)
          this.dialog.pdf = true
        })
      } catch (err) {
        console.error(err)
        this.showSnack('Error al generar PDF', 'error')
      } finally {
        this.loading.pdf = false
      }
    },

    descargarPdf () {
      const pdfName = this.pdfFileName || 'envios.pdf'
      if (this.pdfPrinter) {
        this.pdfPrinter.download(pdfName)
        return
      }
      if (!this.pdfBlob) return
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(this.pdfBlob, pdfName)
        return
      }
      const url = URL.createObjectURL(this.pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.setAttribute('download', pdfName)
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 0)
    }
  }
}
</script>

<style scoped>
.row-pointer >>> tbody tr:hover {
  cursor: pointer;
}
</style>
