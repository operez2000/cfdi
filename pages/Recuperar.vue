<template>
  <v-layout
    column
    justify-center
    align-center
  >
    <v-dialog
      v-model="alert.active"
      width="500"
    >
      <v-card>
        <v-card-title
          :class="(alert.type == '') ? 'text-h6 mb-4 orange darken-3' : 'text-h6 mb-4 green darken-3'"
        >
          <v-icon>{{ ( (alert.type == "") ?  'mdi-alert' : 'mdi-check' ) }}</v-icon>
          <span class="ml-2">Atención</span>
        </v-card-title>

        <v-card-text
          :class="(alert.type == '') ? 'subtitle-1 orange--text text--darken-3' : 'text-h6'"
        >
          {{ alert.msg }}
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue lighten-2"
            plain
            @click="alert.active = false; alert.msg = ''; alert.type = ''"
          >
            Ok
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card
      class="mt-2"
      outlined
      width="800"
    >
      <v-card-title primary-title class="d-flex justify-space-between align-center">
        <span>Recuperación de Facturas y Notas de Crédito</span>
        <v-btn
          color="primary"
          outlined
          @click="abrirDialogoConsulta"
        >
          <v-icon left>mdi-database-search</v-icon>
          Consulta
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-radio-group v-model="tipo">
          <v-radio label="Factura" color="primary" value="f"></v-radio>
          <v-radio label="Nota de Crédito" color="primary" value="nc"></v-radio>
        </v-radio-group>
      </v-card-text>
      <v-card-text>
        <v-row>
          <v-col md="3">
            <v-text-field
              v-model="folio"
              maxlength="8"
              label="Folio"
              outlined
              :loading="loaders.search"
              :disabled="loaders.search"
              :prefix="serie"
              clearable
              append-outer-icon="mdi-magnify"
              @click:append-outer="buscarCFDI"
              @keyup.enter.prevent="buscarCFDI"
            />
          </v-col>
          <v-col md="1" class="mt-1">
            <v-btn
              icon
              x-large
              @click="openPdf"
              :disabled="!found"
            >
              <v-icon>mdi-file-pdf-box</v-icon>
            </v-btn>
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="mt-2" md="7" v-show="uuid != ''">
            <strong>UUID:</strong><br>{{ uuid }}
          </v-col>
        </v-row>
        <v-row>
          <v-col md="12">
            <v-text-field
              v-model="email"
              label="Email"
              outlined
              :loading="loaders.send"
              :disabled="loaders.send"
              clearable
              @keyup.enter.prevent="sendEmail"
              :rules="[
                v => !!v || 'El Correo es obligatorio',
                v => validEmail() || 'Formato de Correo incorrecto'
              ]"
            >
              <template #append-outer>
                <v-btn
                  icon
                  small
                  @click="sendEmail"
                  :loading="loaders.send"
                  :disabled="!found || loaders.send"
                >
                  <v-icon>mdi-send</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
      </v-card-actions>
    </v-card>

    <!-- Diálogo de Consulta de Facturas MySQL -->
    <v-dialog
      v-model="dialogoConsulta"
      max-width="1200px"
      scrollable
    >
      <v-card>
        <v-toolbar dark color="primary" dense flat>
          <v-icon left>mdi-database-search</v-icon>
          <v-toolbar-title>Consulta de Facturas y Notas de Crédito (MySQL)</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="cargarFacturas" :loading="cargandoFacturas" title="Actualizar datos">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <v-btn icon dark @click="dialogoConsulta = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="pt-4">
          <v-row class="mb-1" align="center">
            <v-col cols="12" md="8">
              <v-text-field
                v-model="filtroConsulta"
                append-icon="mdi-magnify"
                label="Filtrar por serie, folio, RFC, razón social, observaciones..."
                single-line
                hide-details
                outlined
                dense
                clearable
              />
            </v-col>
            <v-col cols="12" md="4" class="text-right caption text--secondary">
              <span v-if="facturasList.length > 0">
                Mostrando {{ facturasList.length }} registros
              </span>
            </v-col>
          </v-row>

          <v-data-table
            :headers="headersConsulta"
            :items="facturasList"
            :search="filtroConsulta"
            :loading="cargandoFacturas"
            loading-text="Cargando facturas desde la base de datos..."
            no-data-text="No se encontraron registros en la tabla factura"
            no-results-text="No hay registros que coincidan con la búsqueda"
            dense
            class="elevation-1 tabla-consulta mt-2"
            :items-per-page="10"
            :footer-props="{
              'items-per-page-options': [10, 25, 50, 100],
              'items-per-page-text': 'Registros por página:'
            }"
            @click:row="seleccionarFactura"
          >
            <template #[`item.total`]="{ item }">
              <span class="font-weight-medium">
                ${{ Number(item.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </span>
            </template>

            <template #[`item.tipo_factura`]="{ item }">
              <v-chip
                x-small
                :color="item.tipo_factura === 'Nota de Crédito' ? 'deep-purple' : (item.tipo_factura === 'Global' ? 'teal' : 'primary')"
                dark
              >
                {{ item.tipo_factura || 'Normal' }}
              </v-chip>
            </template>

            <template #[`item.fecha_facturacion`]="{ item }">
              <span>{{ item.fecha_facturacion ? item.fecha_facturacion.substring(0, 19) : '' }}</span>
            </template>

            <template #[`item.observaciones`]="{ item }">
              <span class="text-truncate d-inline-block" style="max-width: 250px;" :title="item.observaciones">
                {{ item.observaciones || '-' }}
              </span>
            </template>
          </v-data-table>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-icon small color="info" class="mr-1">mdi-information-outline</v-icon>
          <span class="caption text--secondary">
            Haga clic en cualquier renglón para seleccionar el comprobante.
          </span>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="dialogoConsulta = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal to view the invoice in PDF -->
    <v-dialog v-model="modalFactura" fullscreen>
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn icon dark @click="modalFactura = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Factura {{ serie + folio }}</v-toolbar-title>
        </v-toolbar>
        <VerFactura :pdf="pdfBase64"/>
      </v-card>
    </v-dialog>

  </v-layout>
</template>

<script>
import VerFactura from '@/components/VerFactura.vue'
import config from '@/config.json'
let xml = ''

export default {
  components: {
    VerFactura
  },

  data: () => ({
    alert: {
      active: false,
      msg: '',
      type: '',
    },
    loaders: {
      search: false,
      send: false,
    },
    serie: '',
    folio: '',
    uuid: '',
    email: '',
    found: false,
    tipo: 'f',
    modalFactura: false,
    pdfBase64: '',

    // Consulta MySQL
    dialogoConsulta: false,
    cargandoFacturas: false,
    filtroConsulta: '',
    facturasList: [],
    headersConsulta: [
      { text: 'Serie', value: 'serie', width: '80px' },
      { text: 'Folio', value: 'folio', width: '90px' },
      { text: 'RFC Receptor', value: 'rfc_receptor', width: '130px' },
      { text: 'Razón Social', value: 'razon_social' },
      { text: 'Fecha', value: 'fecha_facturacion', width: '160px' },
      { text: 'Total', value: 'total', align: 'end', width: '110px' },
      { text: 'Tipo', value: 'tipo_factura', width: '130px' },
      { text: 'Observaciones', value: 'observaciones', width: '220px' },
    ],
  }),

  mounted () {
    this.getParametros() // Parametros
  },
  methods: {
    getParametros() {
      this.alert.msg = ""
      this.$axios({
        method: "get",
        url: `${config.backEndUrl}/gusher/ws.prg?mod=parametros`,//"/api/parametros"
      }).then(resp => {
        console.log("parametros", resp.data)
        if (resp.data.response == 200) {
          this.serie = resp.data.data.serie
        } else {
          this.alert.msg = `Problemas con el Servidor (${resp.data.response} ${resp.data.msg})`
        }
      }).catch(error => {
        this.alert.msg = error
      }).finally(() => {
        this.alert.active = (this.alert.msg != "")
      })
    }, // getParametros()
    abrirDialogoConsulta() {
      this.dialogoConsulta = true
      if (this.facturasList.length === 0) {
        this.cargarFacturas()
      }
    },
    cargarFacturas() {
      this.cargandoFacturas = true
      this.$axios({
        method: 'get',
        url: '/api/facturacion/listado'
      }).then(resp => {
        if (resp.data && resp.data.data) {
          this.facturasList = resp.data.data
        }
      }).catch(error => {
        console.error('Error al cargar facturas de MySQL:', error)
        this.alert.msg = `Error al consultar MySQL: ${(error.response && error.response.data && error.response.data.message) || error.message || error}`
        this.alert.type = ''
        this.alert.active = true
      }).finally(() => {
        this.cargandoFacturas = false
      })
    },
    seleccionarFactura(item) {
      if (!item) return
      
      // Adaptar el tipo de documento (Factura o Nota de Crédito)
      const tipoDoc = String(item.tipo_factura || '').trim().toLowerCase()
      if (tipoDoc.includes('nota') || tipoDoc.includes('crédito') || tipoDoc.includes('credito') || tipoDoc === 'nc' || tipoDoc === 'egreso') {
        this.tipo = 'nc'
      } else {
        this.tipo = 'f'
      }

      // Asignar el folio al modelo
      this.folio = item.folio ? String(item.folio) : ''

      // Cerrar el diálogo
      this.dialogoConsulta = false
    },
    buscarCFDI() {
      this.alert.msg = ""
      this.found = false
      this.uuid = ""
      let prefijo = (this.tipo == 'f') ? '' : 'NC'
      this.pdfBase64 = ''
      xml = ''
      if (this.folio) {
        if (this.tipo == 'f') {
          this.folio = this.folio.padStart(8, '0')
        }
        this.loaders.search = true
        this.$axios({
          method: 'get',
          url: `/api/recuperarCFDI/${prefijo}${this.serie}${this.folio}`
        }).then(resp => {
          console.log("resp", resp.data)
          if (resp.data.result.retcode != 1) {
            this.alert.msg = resp.data.result.result.error
          } else if (resp.data.result.retcode == 1) {
            this.found = true
            this.pdfBase64 = resp.data.result.result.pdfBase64
            xml = resp.data.result.result.xml
            this.uuid = resp.data.result.result.uuid
            this.modalFactura = true
          } else {
            this.alert.msg = "Error desconocido de iTimbre, favor de comunicarlo"
          }
        }).catch(error => {
          this.alert.msg = error
        }).finally(() => {
          this.loaders.search = false
          this.alert.active = (this.alert.msg != "")
        })
      }
    }, // buscarCFDI()
    sendEmail() {
      if (this.email) {
        this.loaders.send = true
        this.$axios({
          method: 'post',
          url: `/api/enviar-cfdi/${this.serie}${this.folio}`,
          data: {
            email: this.email,
            pdfBase64: this.pdfBase64,
            xml
          }
        }).then(resp => {
          this.alert.msg = resp.data.msg
          this.alert.type = (resp.data.response == 200) ? 'success' : ''
        }).catch(error => {
          this.alert.msg = error
        }).finally(() => {
          this.alert.active = true
          this.loaders.send = false
        })
      }
    }, // sendEmail()
    validEmail() {
      return /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(this.email)
    }, // validEmail()
    openPdf() {
      this.modalFactura = true
    },
  },

}
</script>

<style scoped>
.tabla-consulta >>> tbody tr {
  cursor: pointer;
}
.tabla-consulta >>> tbody tr:hover {
  background-color: rgba(25, 118, 210, 0.08) !important;
}
</style>
