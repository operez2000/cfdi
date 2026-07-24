<template>
  <v-container fluid>
    <SnackBar ref="snackBar" />

    <v-toolbar dense color="primary" dark flat>
      <v-toolbar-title>Traspaso de Mercancía a Sucursales</v-toolbar-title>
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
          <v-btn icon v-on="on" @click="dialog.consulta = true">
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </template>
        <span>Consultar</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on" :disabled="form.estado === 'CANCELADO'" :loading="loading.guardar" @click="guardar">
            <v-icon>mdi-content-save</v-icon>
          </v-btn>
        </template>
        <span>Guardar</span>
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
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on" @click="abrirMotivos">
            <v-icon>mdi-format-list-bulleted</v-icon>
          </v-btn>
        </template>
        <span>Motivos</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on" :disabled="!puedeCancelar" :loading="loading.cancelar" @click="cancelarTraspaso">
            <v-icon>mdi-cancel</v-icon>
          </v-btn>
        </template>
        <span>Cancelar traspaso</span>
      </v-tooltip>
    </v-toolbar>

    <v-card class="mt-3 pa-3" flat outlined>
      <v-row dense>
        <v-col cols="12" sm="6" md="1">
          <v-text-field
            :value="folioDisplay"
            label="Folio"
            readonly
            dense
            filled
          />
        </v-col>
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
                :disabled="form.estado === 'CANCELADO'"
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
            :disabled="form.estado === 'CANCELADO'"
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="form.id_traspaso_destino"
            :items="sucursalesDestino"
            item-text="nombre"
            item-value="id"
            label="Sucursal Destino *"
            dense
            filled
            :disabled="form.estado === 'CANCELADO'"
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="form.id_motivo_traspaso"
            :items="motivosActivos"
            item-text="descripcion"
            item-value="id"
            label="Motivo *"
            dense
            filled
            clearable
            :disabled="form.estado === 'CANCELADO'"
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="form.caja"
            label="Caja"
            dense
            filled
            :disabled="form.estado === 'CANCELADO'"
          />
        </v-col>
        <v-col cols="12" sm="6" md="1">
          <v-chip :color="estadoColor" small label class="mt-4">{{ form.estado }}</v-chip>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12" sm="6" md="3">
          <v-text-field v-model="form.persona_surte" label="Persona que surte" dense filled :disabled="form.estado === 'CANCELADO'" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field v-model="form.persona_captura" label="Persona que captura" dense filled :disabled="form.estado === 'CANCELADO'" />
        </v-col>
        <!-- <v-col cols="12" sm="6" md="2">
          <v-text-field v-model="form.persona_revisa" label="Persona que revisa" dense filled :disabled="form.estado === 'CANCELADO'" />
        </v-col> -->
        <v-col cols="12" sm="6" md="3">
          <v-text-field v-model="form.persona_autoriza" label="Persona que autoriza" dense filled :disabled="form.estado === 'CANCELADO'" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field v-model="form.chofer" label="Chofer" dense filled :disabled="form.estado === 'CANCELADO'" />
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12">
          <v-textarea
            v-model="form.observaciones"
            label="Observaciones"
            rows="1"
            counter="400"
            maxlength="400"
            dense
            filled
            :disabled="form.estado === 'CANCELADO'"
          />
        </v-col>
      </v-row>
    </v-card>

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
            :disabled="form.estado === 'CANCELADO'"
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
            :disabled="form.estado === 'CANCELADO'"
            @click:append="dialog.catalogo = true"
            @keyup.enter.native="capturarCodigo"
          />
        </v-col>
        <v-col cols="12" sm="2" md="2">
          <v-btn block color="primary" :disabled="form.estado === 'CANCELADO'" @click="dialog.catalogo = true">
            Catálogo
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="mt-3" flat outlined>
      <v-data-table
        :headers="headersDetalle"
        :items="detalle"
        :search="filtroDetalle"
        dense
        class="elevation-1"
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
          <v-btn icon small color="error" :disabled="form.estado === 'CANCELADO'" @click="eliminarRenglon(item)">
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>

        <template v-slot:item.etiqueta="{ item }">
          <v-edit-dialog
            :return-value.sync="item.etiqueta"
            large
            cancel-text="Cancelar"
            save-text="Ok"
            @save="() => {}"
          >
            {{ item.etiqueta || '—' }}
            <template v-slot:input>
              <v-text-field v-model="item.etiqueta" label="Etiqueta" single-line counter />
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.lote="{ item }">
          <v-edit-dialog
            :return-value.sync="item.lote"
            large
            cancel-text="Cancelar"
            save-text="Ok"
            @save="() => {}"
          >
            {{ item.lote || '—' }}
            <template v-slot:input>
              <v-text-field v-model="item.lote" label="Lote" single-line counter />
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.fecha_caducidad="{ item }">
          <v-edit-dialog
            :return-value.sync="item.fecha_caducidad"
            large
            cancel-text="Cancelar"
            save-text="Ok"
            @save="() => item.fecha_caducidad = formatDateYMD(item.fecha_caducidad)"
          >
            {{ formatDateYMD(item.fecha_caducidad) || '—' }}
            <template v-slot:input>
              <v-text-field v-model="item.fecha_caducidad" label="Fecha caducidad" type="text" placeholder="yyyy-mm-dd" single-line />
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.cantidad="{ item }">
          <v-edit-dialog
            :return-value.sync="item.cantidad"
            large
            cancel-text="Cancelar"
            save-text="Ok"
            @save="() => normalizarCantidad(item)"
          >
            {{ item.cantidad }}
            <template v-slot:input>
              <v-text-field v-model.number="item.cantidad" label="Cantidad" type="number" min="1" single-line />
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.id_traspaso_destino="{ item }">
          <v-edit-dialog
            :return-value.sync="item.id_traspaso_destino"
            large
            cancel-text="Cancelar"
            save-text="Ok"
            @save="() => sincronizarRelacionRenglon(item)"
          >
            {{ nombreSucursal(item.id_traspaso_destino) }}
            <template v-slot:input>
              <v-select
                v-model="item.id_traspaso_destino"
                :items="sucursalesDestino"
                item-text="nombre"
                item-value="id"
                label="Sucursal destino"
                single-line
              />
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.id_motivo_traspaso="{ item }">
          <v-edit-dialog
            :return-value.sync="item.id_motivo_traspaso"
            large
            cancel-text="Cancelar"
            save-text="Ok"
            @save="() => sincronizarRelacionRenglon(item)"
          >
            {{ nombreMotivo(item.id_motivo_traspaso) }}
            <template v-slot:input>
              <v-select
                v-model="item.id_motivo_traspaso"
                :items="motivosActivos"
                item-text="descripcion"
                item-value="id"
                label="Motivo"
                single-line
                clearable
              />
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.caja="{ item }">
          <v-edit-dialog
            :return-value.sync="item.caja"
            large
            cancel-text="Cancelar"
            save-text="Ok"
            @save="() => sincronizarRelacionRenglon(item)"
          >
            {{ item.caja || '—' }}
            <template v-slot:input>
              <v-text-field v-model="item.caja" label="Caja" single-line counter />
            </template>
          </v-edit-dialog>
        </template>
      </v-data-table>
    </v-card>

    <!-- Consulta -->
    <v-dialog v-model="dialog.consulta" max-width="1200">
      <v-card>
        <v-card-title>
          <v-app-bar color="blue-grey" dense>
            Consulta de Traspasos
            <v-spacer />
            <v-btn icon @click="dialog.consulta = false"><v-icon>mdi-close</v-icon></v-btn>
          </v-app-bar>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="filtroConsulta" label="Filtrar..." dense filled clearable append-icon="mdi-magnify" class="my-2" />
          <v-data-table
            :headers="headersConsulta"
            :items="listaTraspasos"
            :search="filtroConsulta"
            :loading="loading.consulta"
            dense
            @click:row="cargarTraspaso"
            class="row-pointer"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

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
          <Catalogo @fromChildRowClick="seleccionCatalogo" />
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
            <v-col cols="12" md="3"><v-text-field v-model="sucursalForm.email" label="Email" type="email" dense filled /></v-col>
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

    <!-- Motivos CRUD -->
    <v-dialog v-model="dialog.motivos" max-width="800" scrollable persistent>
      <v-card>
        <v-card-title>
          <v-app-bar color="blue-grey" dense>
            Motivos de Traspaso
            <v-spacer />
            <v-btn icon @click="dialog.motivos = false"><v-icon>mdi-close</v-icon></v-btn>
          </v-app-bar>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model="motivoForm.descripcion" label="Descripción" dense filled /></v-col>
            <v-col cols="12" md="2" class="d-flex align-center">
              <v-switch v-model="motivoForm.activo" label="Activo" />
            </v-col>
            <v-col cols="12" md="3" class="d-flex align-center">
              <v-btn color="primary" :loading="loading.motivo" @click="guardarMotivo">
                {{ motivoForm.id ? 'Actualizar' : 'Agregar' }}
              </v-btn>
              <v-btn text class="ml-2" @click="limpiarMotivoForm">Limpiar</v-btn>
            </v-col>
          </v-row>
          <v-data-table :headers="headersMotivos" :items="motivos" dense class="mt-3">
            <template v-slot:item.activo="{ item }">
              <v-chip x-small :color="item.activo ? 'success' : 'grey'">{{ item.activo ? 'Sí' : 'No' }}</v-chip>
            </template>
            <template v-slot:item.acciones="{ item }">
              <v-btn icon small @click="editarMotivo(item)"><v-icon small>mdi-pencil</v-icon></v-btn>
              <v-btn icon small color="error" @click="eliminarMotivo(item)"><v-icon small>mdi-delete</v-icon></v-btn>
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
          <v-toolbar-title>{{ pdfFolioDisplay || 'Vista previa PDF' }}</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="abrirDialogoEmail"><v-icon>mdi-email</v-icon></v-btn>
          <v-btn icon @click="descargarPdf"><v-icon>mdi-download</v-icon></v-btn>
        </v-toolbar>
        <iframe v-if="pdfUrl" :src="pdfUrl" style="width:100%; height: calc(100vh - 48px); border: none;" />
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog.email" max-width="700">
      <v-card>
        <v-card-title class="headline">Enviar PDF por correo</v-card-title>
        <v-card-text>
          <v-text-field v-model="emailForm.to" label="Correo destino" dense filled hint="Puedes agregar más de una cuenta de correo separadas con coma (,)" />
          <v-text-field v-model="emailForm.cc" label="CC" dense filled hint="Puedes agregar más de una cuenta separadas con coma (,)" />
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

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default {
  name: 'Traspasos',
  components: { SnackBar, Catalogo },

  data () {
    return {
      menuFecha: false,
      filtroDetalle: '',
      filtroConsulta: '',
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
      motivos: [],
      listaTraspasos: [],
      detalle: [],
      destinoMotivos: {},
      captura: {
        codigo: '',
        cantidad: 1
      },
      form: this.formInicial(),
      sucursalForm: this.sucursalFormInicial(),
      motivoForm: this.motivoFormInicial(),
      loading: {
        codigo: false,
        guardar: false,
        cancelar: false,
        consulta: false,
        sucursal: false,
        motivo: false,
        pdf: false,
        email: false,
      },
      dialog: {
        consulta: false,
        catalogo: false,
        sucursales: false,
        motivos: false,
        pdf: false,
        email: false
      },
      headersDetalle: [
        { text: '', value: 'acciones', sortable: false, width: '60px' },
        { text: 'Clave', value: 'clave' },
        { text: 'Código Barras', value: 'codigo_barras' },
        { text: 'Descripción', value: 'descripcion' },
        { text: 'Etiqueta', value: 'etiqueta' },
        { text: 'Lote', value: 'lote' },
        { text: 'Fecha Caducidad', value: 'fecha_caducidad' },
        { text: 'Cantidad', value: 'cantidad', width: '90px' },
        { text: 'Sucursal Destino', value: 'id_traspaso_destino' },
        { text: 'Motivo', value: 'id_motivo_traspaso' },
        { text: 'Caja', value: 'caja' }
      ],
      headersConsulta: [
        { text: 'Folio', value: 'folio_display' },
        { text: 'Fecha', value: 'fecha' },
        { text: 'Origen', value: 'sucursal_origen' },
        { text: 'Estado', value: 'estado' },
        { text: 'Cancelado', value: 'cancelado_texto' }
      ],
      headersSucursales: [
        { text: 'Abrev.', value: 'abreviacion' },
        { text: 'Nombre', value: 'nombre' },
        { text: 'Email', value: 'email' },
        { text: 'Ciudad', value: 'ciudad' },
        { text: 'Teléfonos', value: 'telefonos' },
        { text: '', value: 'acciones', sortable: false }
      ],
      headersMotivos: [
        { text: 'Descripción', value: 'descripcion' },
        { text: 'Activo', value: 'activo' },
        { text: '', value: 'acciones', sortable: false }
      ]
    }
  },

  computed: {
    folioDisplay () {
      if (!this.form.folio) return ''
      const folio = String(this.form.folio).padStart(5, '0')
      return `${this.form.prefijo || 'TRA'}-${folio}`
    },
    pdfFolioDisplay () {
      return this.getPdfFolioDisplay(this.form.id_traspaso_destino)
    },
    sucursalesDestino () {
      if (!this.form.id_sucursal_origen) return this.sucursales
      return this.sucursales.filter(s => s.id !== this.form.id_sucursal_origen)
    },
    motivosActivos () {
      return this.motivos.filter(m => m.activo)
    },
    puedeGuardar () {
      const { destinos, sinMotivo } = this.validarDestinosParaGuardar()
      return this.form.estado !== 'CANCELADO' &&
        !!this.form.fecha &&
        !!this.form.id_sucursal_origen &&
        destinos.length > 0 &&
        sinMotivo.length === 0 &&
        this.detalle.length > 0
    },
    puedePdf () {
      return !!this.form.id && this.form.estado !== 'BORRADOR' && this.detalle.length > 0
    },
    puedeCancelar () {
      return !!this.form.id && this.form.estado === 'GUARDADO' && !this.form.cancelado
    },
    estadoColor () {
      if (this.form.estado === 'CANCELADO') return 'error'
      if (this.form.estado === 'GUARDADO') return 'success'
      return 'grey'
    }
  },

  watch: {
    'dialog.consulta' (val) {
      if (val) this.cargarListaTraspasos()
    },
    'form.caja' (val) {
      this.detalle.forEach(r => {
        if (r.id_traspaso_destino === this.form.id_traspaso_destino) {
          r.caja = val
        }
      })
      this.sincronizarDestinoActual()
    },
    'form.id_motivo_traspaso' (val) {
      this.detalle.forEach(r => {
        if (r.id_traspaso_destino === this.form.id_traspaso_destino) {
          r.id_motivo_traspaso = val
        }
      })
      this.sincronizarDestinoActual()
    },
    'form.id_traspaso_destino' () {
      this.sincronizarDestinoActual()
    }
  },

  mounted () {
    this.cargarCatalogos()
    this.nuevo()
  },

  beforeDestroy () {
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl)
  },

  methods: {
    formInicial () {
      return {
        id: null,
        prefijo: 'TRA',
        folio: null,
        fecha: new Date().toISOString().substr(0, 10),
        persona_surte: '',
        persona_captura: '',
        persona_revisa: '',
        persona_autoriza: '',
        chofer: '',
        id_sucursal_origen: null,
        id_traspaso_destino: null,
        id_motivo_traspaso: null,
        caja: '',
        observaciones: '',
        estado: 'BORRADOR',
        cancelado: 0
      }
    },

    sucursalFormInicial () {
      return {
        id: null,
        abreviacion: '',
        nombre: '',
        domicilio: '',
        colonia: '',
        ciudad: '',
        email: '',
        codigo_postal: '',
        telefonos: ''
      }
    },

    motivoFormInicial () {
      return { id: null, descripcion: '', activo: true }
    },

    showSnack (text, color = 'info') {
      this.$refs.snackBar.text = text
      this.$refs.snackBar.color = color
      this.$refs.snackBar.snackBar = true
    },

    nombreSucursal (id) {
      const s = this.sucursales.find(v => v.id === id)
      return s ? s.nombre : '—'
    },

    nombreMotivo (id) {
      const m = this.motivos.find(v => v.id === id)
      return m ? m.descripcion : '—'
    },

    focusInputCodigo () {
      this.$nextTick(() => {
        try {
          this.$refs.inputCodigo.focus()
        } catch (e) { /* noop */ }
      })
    },

    async cargarCatalogos () {
      try {
        const [respSuc, respMot] = await Promise.all([
          this.$axios.get('/api/sucursales'),
          this.$axios.get('/api/motivos')
        ])
        if (respSuc.data.response === 200) this.sucursales = respSuc.data.data
        if (respMot.data.response === 200) this.motivos = respMot.data.data.map(m => ({
          ...m,
          activo: !!m.activo
        }))
      } catch (err) {
        this.showSnack('Error al cargar catálogos', 'error')
      }
    },

    nuevo () {
      this.form = this.formInicial()
      this.detalle = []
      this.destinoMotivos = {}
      this.captura.codigo = ''
      this.captura.cantidad = 1
      if (this.pdfUrl) {
        URL.revokeObjectURL(this.pdfUrl)
        this.pdfUrl = ''
      }
      this.pdfBlob = null
      this.pdfPrinter = null
      this.pdfFileName = ''
      this.focusInputCodigo()
    },

    normalizarCantidad (item) {
      const n = Math.floor(Number(item.cantidad))
      item.cantidad = (n > 0) ? n : 1
    },

    agregarArticulo (data) {
      if (!this.form.id_traspaso_destino) {
        this.showSnack('Seleccione sucursal destino', 'warning')
        return
      }
      const cantidad = Math.floor(Number(this.captura.cantidad)) || 1
      this.detalle.push({
        _uid: Date.now() + Math.random(),
        clave: data.mPart || data.codigo || data.mpart || '',
        codigo_barras: data.mBarCode || data.mbarcode || '',
        descripcion: data.mDesc || data.mdesc || '',
        etiqueta: data.barra || '',
        lote: data.lote || '',
        fecha_caducidad: this.formatDateYMD(data.fCaduc) || '',
        cantidad,
        id_traspaso_destino: this.form.id_traspaso_destino,
        id_motivo_traspaso: this.form.id_motivo_traspaso,
        caja: this.form.caja || ''
      })
      this.sincronizarDestinoActual()
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
        console.log('resp.data', resp.data)
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

    seleccionCatalogo (item) {
      this.dialog.catalogo = false
      if (!item || !item.mpart) return
      this.agregarArticulo({
        mPart: item.mpart,
        mDesc: item.mdesc,
        mBarCode: item.mbarcode,
        barra: '',
        lote: '',
        fCaduc: ''
      })
    },

    eliminarRenglon (item) {
      this.detalle = this.detalle.filter(r => r._uid !== item._uid)
    },

    sincronizarDestinoActual () {
      if (!this.form.id_traspaso_destino) return
      const destinoId = parseInt(this.form.id_traspaso_destino, 10)
      if (!destinoId) return
      this.$set(this.destinoMotivos, destinoId, {
        id_motivo_traspaso: this.form.id_motivo_traspaso != null ? this.form.id_motivo_traspaso : (this.destinoMotivos[destinoId] && this.destinoMotivos[destinoId].id_motivo_traspaso) || null,
        caja: this.form.caja != null ? this.form.caja : (this.destinoMotivos[destinoId] && this.destinoMotivos[destinoId].caja) || null
      })
    },

    sincronizarRelacionRenglon (item) {
      if (!item || !item.id_traspaso_destino) return
      const destinoId = parseInt(item.id_traspaso_destino, 10)
      if (!destinoId) return
      this.$set(this.destinoMotivos, destinoId, {
        id_motivo_traspaso: item.id_motivo_traspaso != null ? item.id_motivo_traspaso : (this.destinoMotivos[destinoId] && this.destinoMotivos[destinoId].id_motivo_traspaso) || null,
        caja: item.caja != null ? item.caja : (this.destinoMotivos[destinoId] && this.destinoMotivos[destinoId].caja) || null
      })
    },

    buildDestinos () {
      const map = {}
      for (const [destinoId, relacion] of Object.entries(this.destinoMotivos || {})) {
        const id = parseInt(destinoId, 10)
        if (!id) continue
        map[id] = {
          id_motivo_traspaso: relacion && relacion.id_motivo_traspaso != null ? relacion.id_motivo_traspaso : null,
          caja: relacion && relacion.caja != null ? relacion.caja : null
        }
      }

      for (const row of this.detalle) {
        const destinoId = parseInt(row.id_traspaso_destino, 10)
        if (!destinoId) continue
        const existente = map[destinoId] || {}
        map[destinoId] = {
          id_motivo_traspaso: row.id_motivo_traspaso != null ? row.id_motivo_traspaso : existente.id_motivo_traspaso || null,
          caja: row.caja != null ? row.caja : existente.caja || null
        }
      }

      if (this.form.id_traspaso_destino) {
        const destinoId = parseInt(this.form.id_traspaso_destino, 10)
        const existente = map[destinoId] || {}
        map[destinoId] = {
          id_motivo_traspaso: this.form.id_motivo_traspaso != null ? this.form.id_motivo_traspaso : existente.id_motivo_traspaso || null,
          caja: this.form.caja != null ? this.form.caja : existente.caja || null
        }
      }

      return Object.keys(map).map(id => ({
        id_traspaso_destino: parseInt(id, 10),
        id_motivo_traspaso: map[id].id_motivo_traspaso,
        caja: map[id].caja
      }))
    },

    validarDestinosParaGuardar () {
      const destinos = this.buildDestinos()
      const sinMotivo = destinos.filter(dest => dest.id_traspaso_destino && (dest.id_motivo_traspaso == null || dest.id_motivo_traspaso === ''))
      return { destinos, sinMotivo }
    },

    buildPayload () {
      return {
        fecha: this.form.fecha,
        persona_surte: this.form.persona_surte,
        persona_captura: this.form.persona_captura,
        persona_revisa: this.form.persona_revisa,
        persona_autoriza: this.form.persona_autoriza,
        chofer: this.form.chofer,
        id_sucursal_origen: this.form.id_sucursal_origen,
        observaciones: this.form.observaciones,
        estado: 'GUARDADO',
        destinos: this.buildDestinos(),
        detalle: this.detalle.map(r => ({
          clave: r.clave,
          codigo_barras: r.codigo_barras,
          descripcion: r.descripcion,
          etiqueta: r.etiqueta,
          lote: r.lote,
          fecha_caducidad: r.fecha_caducidad,
          cantidad: r.cantidad,
          id_traspaso_destino: r.id_traspaso_destino
        }))
      }
    },

    aplicarTraspaso (data) {
      const h = data.header
      this.destinoMotivos = {}
      this.form = {
        id: h.id,
        prefijo: h.prefijo,
        folio: h.folio,
        fecha: this.formatDateYMD(h.fecha),
        persona_surte: h.persona_surte || '',
        persona_captura: h.persona_captura || '',
        persona_revisa: h.persona_revisa || '',
        persona_autoriza: h.persona_autoriza || '',
        chofer: h.chofer || '',
        id_sucursal_origen: h.id_sucursal_origen,
        id_traspaso_destino: null,
        id_motivo_traspaso: null,
        caja: '',
        observaciones: h.observaciones || '',
        estado: h.estado,
        cancelado: h.cancelado
      }
      if (data.destinos && data.destinos.length) {
        this.form.id_traspaso_destino = data.destinos[0].id_traspaso_destino
        this.form.id_motivo_traspaso = data.destinos[0].id_motivo_traspaso
        this.form.caja = data.destinos[0].caja || ''
      }
      const motivosPorDestino = {}
      const cajaPorDestino = {}
      ;(data.destinos || []).forEach(d => {
        motivosPorDestino[d.id_traspaso_destino] = d.id_motivo_traspaso
        cajaPorDestino[d.id_traspaso_destino] = d.caja
        this.$set(this.destinoMotivos, d.id_traspaso_destino, {
          id_motivo_traspaso: d.id_motivo_traspaso || null,
          caja: d.caja || null
        })
      })
      this.detalle = (data.detalle || []).map((r, i) => ({
        _uid: `${h.id}-${i}`,
        clave: r.clave,
        codigo_barras: r.codigo_barras,
        descripcion: r.descripcion,
        etiqueta: r.etiqueta,
        lote: r.lote,
        fecha_caducidad: this.formatDateYMD(r.fecha_caducidad),
        cantidad: r.cantidad,
        id_traspaso_destino: r.id_traspaso_destino,
        id_motivo_traspaso: motivosPorDestino[r.id_traspaso_destino] || null,
        caja: cajaPorDestino[r.id_traspaso_destino] || ''
      }))
    },

    async guardar () {
      if (!this.form.fecha) {
        this.showSnack('La fecha es obligatoria', 'warning')
        return
      }
      if (!this.form.id_sucursal_origen) {
        this.showSnack('La sucursal origen es obligatoria', 'warning')
        return
      }
      if (!this.detalle || this.detalle.length === 0) {
        this.showSnack('Debe agregar al menos un artículo en el detalle', 'warning')
        return
      }
      const { destinos, sinMotivo } = this.validarDestinosParaGuardar()
      if (!destinos.length) {
        this.showSnack('Debe agregar al menos una sucursal destino', 'warning')
        return
      }
      if (sinMotivo.length > 0) {
        this.showSnack('Cada sucursal destino debe tener un motivo', 'warning')
        return
      }
      if (!this.puedeGuardar) return
      this.loading.guardar = true
      try {
        const payload = this.buildPayload()
        let resp
        if (this.form.id) {
          resp = await this.$axios.put(`/api/traspasos/${this.form.id}`, payload)
        } else {
          resp = await this.$axios.post('/api/traspasos', payload)
        }
        if (resp.data.response === 200) {
          this.aplicarTraspaso(resp.data.data)
          this.showSnack('Traspaso guardado correctamente', 'success')
        } else {
          this.showSnack(resp.data.msg || 'Error al guardar', 'error')
        }
      } catch (err) {
        this.showSnack('Error al guardar traspaso', 'error')
      } finally {
        this.loading.guardar = false
      }
    },

    async cargarListaTraspasos () {
      this.loading.consulta = true
      try {
        const resp = await this.$axios.get('/api/traspasos')
        if (resp.data.response === 200) {
          this.listaTraspasos = resp.data.data.map(t => ({
            ...t,
            fecha: this.formatDateYMD(t.fecha),
            folio_display: `${t.prefijo}-${String(t.folio).padStart(5, '0')}`,
            cancelado_texto: t.cancelado ? 'Sí' : 'No'
          }))
        }
      } catch (err) {
        this.showSnack('Error al consultar traspasos', 'error')
      } finally {
        this.loading.consulta = false
      }
    },

    async cargarTraspaso (item) {
      try {
        const resp = await this.$axios.get(`/api/traspasos/${item.id}`)
        if (resp.data.response === 200) {
          this.aplicarTraspaso(resp.data.data)
          this.dialog.consulta = false
          this.showSnack('Traspaso cargado', 'info')
        } else {
          this.showSnack(resp.data.msg || 'No encontrado', 'warning')
        }
      } catch (err) {
        this.showSnack('Error al cargar traspaso', 'error')
      }
    },

    async cancelarTraspaso () {
      if (!this.puedeCancelar) return
      if (!confirm('¿Cancelar este traspaso?')) return
      this.loading.cancelar = true
      try {
        const resp = await this.$axios.patch(`/api/traspasos/${this.form.id}/cancelar`)
        if (resp.data.response === 200) {
          this.aplicarTraspaso(resp.data.data)
          this.showSnack('Traspaso cancelado', 'warning')
        } else {
          this.showSnack(resp.data.msg || 'Error al cancelar', 'error')
        }
      } catch (err) {
        this.showSnack('Error al cancelar traspaso', 'error')
      } finally {
        this.loading.cancelar = false
      }
    },

    abrirSucursales () {
      this.limpiarSucursalForm()
      this.dialog.sucursales = true
    },

    abrirMotivos () {
      this.limpiarMotivoForm()
      this.dialog.motivos = true
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

    editarMotivo (item) {
      this.motivoForm = { ...item, activo: !!item.activo }
    },

    limpiarMotivoForm () {
      this.motivoForm = this.motivoFormInicial()
    },

    async guardarMotivo () {
      if (!this.motivoForm.descripcion) {
        this.showSnack('La descripción es obligatoria', 'warning')
        return
      }
      this.loading.motivo = true
      try {
        const payload = {
          descripcion: this.motivoForm.descripcion,
          activo: this.motivoForm.activo ? 1 : 0
        }
        let resp
        if (this.motivoForm.id) {
          resp = await this.$axios.put(`/api/motivos/${this.motivoForm.id}`, payload)
        } else {
          resp = await this.$axios.post('/api/motivos', payload)
        }
        if (resp.data.response === 200) {
          await this.cargarCatalogos()
          this.limpiarMotivoForm()
          this.showSnack('Motivo guardado', 'success')
        } else {
          this.showSnack(resp.data.msg || 'Error', 'error')
        }
      } catch (err) {
        this.showSnack('Error al guardar motivo', 'error')
      } finally {
        this.loading.motivo = false
      }
    },

    async eliminarMotivo (item) {
      if (!confirm(`¿Eliminar motivo ${item.descripcion}?`)) return
      try {
        const resp = await this.$axios.delete(`/api/motivos/${item.id}`)
        if (resp.data.response === 200) {
          await this.cargarCatalogos()
          this.showSnack('Motivo eliminado', 'success')
        }
      } catch (err) {
        this.showSnack('Error al eliminar motivo', 'error')
      }
    },

    formatDateYMD (isoDate) {
      if (!isoDate) return ''
      const datePart = isoDate.includes('T') ? isoDate.split('T')[0] : isoDate.split(' ')[0]
      const parts = datePart.split('-')
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return datePart
        } else if (parts[2].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      }
      return datePart
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

    formatPdfFolio (value) {
      return (value || '').replace(/0/g, 'Ø')
    },

    getPdfFolioDisplay (destinoId) {
      if (!this.form.folio) return ''
      const folio = String(this.form.folio).padStart(5, '0')
      const destino = this.sucursales.find(s => s.id === parseInt(destinoId, 10)) || {}
      const abre = (destino.abreviacion || '').toString().substring(0, 2).toUpperCase()
      return `${this.form.prefijo || 'TRA'}${folio}${abre}`
    },

    getEmailDocumentoNombre () {
      const destinoId = this.form.id_traspaso_destino || (this.detalle[0] && this.detalle[0].id_traspaso_destino)
      return this.getPdfFolioDisplay(destinoId)
    },

    getDefaultEmailDestinos () {
      const destinoIds = this.buildDestinos().map(dest => parseInt(dest.id_traspaso_destino, 10)).filter(Boolean)
      const emails = this.sucursales
        .filter(s => destinoIds.includes(s.id) && s.email)
        .map(s => (s.email || '').trim())
        .filter(Boolean)
      return [...new Set(emails)].join(', ')
    },

    abrirDialogoEmail () {
      if (!this.pdfBlob) {
        this.showSnack('Primero genera el PDF para enviarlo', 'warning')
        return
      }
      const nombreDocumento = this.getEmailDocumentoNombre() || 'traspaso'
      this.emailForm = {
        to: this.getDefaultEmailDestinos(),
        cc: '',
        subject: `Envío de documento - Traspaso ${nombreDocumento}`,
        body: `Envío de documento - Traspaso ${nombreDocumento}`
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
        const pdfName = `${this.getEmailDocumentoNombre() || 'traspaso'}.pdf`
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
        } else {
          this.showSnack(resp.data.msg || 'No se pudo enviar el correo', 'error')
        }
      } catch (err) {
        this.showSnack('Error al enviar el correo', 'error')
      } finally {
        this.loading.email = false
      }
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

    async generarPdf () {
      console.log('generarPdf - Palmas')
      if (!this.puedePdf) return
      try {

        this.loading.pdf = true

        // 1. Importas la librería pdfmake
        const pdfMakeModule = await import('pdfmake/build/pdfmake')
        const pdfMake = pdfMakeModule.default

        // 2. Importas el archivo de fuentes
        const vfsModule = await import('pdfmake/build/vfs_fonts')
        
        // 3. ESTA LÍNEA CAMBIA: Accedemos al objeto pdfMake interno de vfs_fonts
        const pdfFonts = vfsModule.default || vfsModule
        pdfMake.vfs = pdfFonts.pdfMake.vfs 

        // Opcional y preventivo: Asegurar que mapee el nombre exacto de la fuente que reclama
        pdfMake.fonts = {
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf'
          }
        }

        const logo = await this.loadLogoBase64()
        const origen = this.sucursales.find(s => s.id === this.form.id_sucursal_origen) || {}
        const grupos = {}
        const motivoPorDestino = {}
        for (const row of this.detalle) {
          if (!grupos[row.id_traspaso_destino]) grupos[row.id_traspaso_destino] = []
          grupos[row.id_traspaso_destino].push(row)

          const destinoId = row.id_traspaso_destino
          if (destinoId && !motivoPorDestino[destinoId] && row.id_motivo_traspaso) {
            motivoPorDestino[destinoId] = row.id_motivo_traspaso
          }
        }

        const content = []
        const destinoIds = Object.keys(grupos)
        const pageRanges = []
        let currentPageStart = 1

        destinoIds.forEach((destId) => {
          const items = grupos[destId]
          const itemsPerPage = 37
          const footerRows = 12
          const itemPages = Math.max(1, Math.ceil(items.length / itemsPerPage))
          const lastPageItems = items.length - itemsPerPage * (itemPages - 1)
          const estimatedPages = (lastPageItems + footerRows > itemsPerPage) ? itemPages + 1 : itemPages

          pageRanges.push({
            destId,
            startPage: currentPageStart,
            endPage: currentPageStart + estimatedPages - 1,
            pageCount: estimatedPages
          })
          currentPageStart += estimatedPages
        })

        destinoIds.forEach((destId, idxGrupo) => {
          const destino = this.sucursales.find(s => s.id === parseInt(destId, 10)) || {}
          const items = grupos[destId]
          const motivoId = motivoPorDestino[destId] || this.form.id_motivo_traspaso
          const folioDestino = this.getPdfFolioDisplay(destId)
          const motivo = this.motivos.find(m => m.id === motivoId)
          const caja = items[0] && items[0].caja

          if (idxGrupo > 0) content.push({ text: '', pageBreak: 'before' })

          const noBorder = [false, false, false, false]
          const emptyColSpanCells = [{}, {}, {}, {}, {}, {}]

          content.push({
            table: {
              headerRows: 3,
              widths: [31, 71, '*', 44, 56, 55, 20],
              body: [
                [
                  {
                    colSpan: 7,
                    border: noBorder,
                    stack: [
                      { text: 'SALIDA DE MERCANCÍA A SUCURSALES', style: 'sectionTitle', fontSize: 16, alignment: 'center' },
                      { text: '', fontSize: 6 }
                    ]
                  },
                  ...emptyColSpanCells
                ],
                [
                  {
                    colSpan: 7,
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
                          { text: `${origen.colonia || ''} ${origen.ciudad || ''}, CP ${origen.codigo_postal}`.trim(), fontSize: 8 },
                          { text: origen.telefonos || '', fontSize: 8 }
                        ]
                      },
                      {
                        width: '33%',
                        stack: [
                          { text: 'Destino', style: 'sectionTitle' },
                          { text: destino.nombre || '', style: 'small' },
                          { text: destino.domicilio || '', fontSize: 8 },
                          { text: `${destino.colonia || ''} ${destino.ciudad || ''}, CP ${destino.codigo_postal}`.trim(), fontSize: 8 },
                          { text: destino.telefonos || '', fontSize: 8 }
                        ]
                      },
                      {
                        width: '16%',
                        stack: [
                          {
                            table: {
                              widths: ['*'],
                              body: [[{ text: this.formatPdfFolio(folioDestino), alignment: 'center', bold: true, margin: [4, 8, 4, 8], font: 'Roboto', fontSize: 11 }]]
                            },
                            layout: {
                              hLineWidth: () => 1,
                              vLineWidth: () => 1
                            }
                          },
                          { text: this.formatFechaPdf(this.form.fecha), alignment: 'center', margin: [16, 4, 0, 0], style: 'small' }
                        ]
                      }
                    ]
                  },
                  ...emptyColSpanCells
                ],
                [
                  { text: 'Clave', style: 'tableHeader' },
                  { text: 'Barras', style: 'tableHeader' },
                  { text: 'Descripción', style: 'tableHeader' },
                  { text: 'Etiqueta', style: 'tableHeader' },
                  { text: 'Lote', style: 'tableHeader' },
                  { text: 'Caducidad', style: 'tableHeader' },
                  { text: 'Cant.', style: 'tableHeader' }
                ],
                ...items.map(it => [
                  it.clave,
                  it.codigo_barras || '',
                  it.descripcion || '',
                  it.etiqueta || '',
                  it.lote || '',
                  this.formatFechaPdf(it.fecha_caducidad) || '',
                  { text: String(it.cantidad), alignment: 'center' }
                ])
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16]
          })


          content.push(
            { text: `Motivo: ${motivo ? motivo.descripcion : '—'}`, style: 'small', margin: [0, 0, 0, 4] },
            { text: `Caja: ${caja || '—'}`, style: 'small', margin: [0, 0, 0, 4] },
            { text: `Observaciones: ${this.form.observaciones || '—'}`, style: 'small', margin: [0, 0, 0, 12] },
            {
              columns: [
                { text: `Surte:\n\n_______________________________\n${this.form.persona_surte}`, style: 'firma' },
                { text: `Captura:\n\n_______________________________\n${this.form.persona_captura}`, style: 'firma' },
               // { text: `Revisa:\n\n________________________\n${this.form.persona_revisa}`, style: 'firma' },
                { text: `Autoriza:\n\n_______________________________\n${this.form.persona_autoriza}`, style: 'firma' },
                { text: `Chofer:\n\n_______________________________\n${this.form.chofer}`, style: 'firma' }
              ],
              margin: [0, 8, 0, 0]
            }
          )
        })

        const docDefinition = {
          pageSize: 'LETTER',
          pageMargins: [40, 40, 40, 50],
          info: {
            title: this.pdfFolioDisplay || 'traspaso'
          },
          ...(logo ? { images: { logo } } : {}),
          content,
          header: (currentPage) => {
            const section = pageRanges.find(range => currentPage >= range.startPage && currentPage <= range.endPage)
            const relativePage = section ? currentPage - section.startPage + 1 : currentPage
            const totalPages = section ? section.pageCount : 1
            return {
              text: `Pag: ${relativePage}/${totalPages}`,
              alignment: 'right',
              fontSize: 7,
              margin: [0, 30, 40, 0]
            }
          },
          styles: {
            sectionTitle: { bold: true, fontSize: 11, margin: [0, 0, 0, 4] },
            small: { fontSize: 9 },
            tableHeader: { bold: true, fontSize: 8, fillColor: '#eeeeee' },
            firma: { fontSize: 9, alignment: 'center' }
          },
          defaultStyle: { fontSize: 9 }
        }

        const pdfName = `${this.pdfFolioDisplay || 'traspaso'}.pdf`
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
      const pdfName = this.pdfFileName || `${this.pdfFolioDisplay || 'traspaso'}.pdf`
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
