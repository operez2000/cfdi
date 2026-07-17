s<template>
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
      <v-card-title primary-title>
        Cancelación de Notas de Crédito y Facturas sin Relación
      </v-card-title>
      <v-card-text>
        <v-radio-group v-model="tipo" @change="changeTipo">
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
              :disabled="loaders.search || loaders.cancel"
              :prefix="serie"
              clearable
              append-outer-icon="mdi-magnify"
              @click:append-outer="buscarCFDI"
              @keyup.enter.prevent="buscarCFDI"
              id="folio"
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
          <v-col md="1" class="mt-1">
            <v-btn
              icon
              x-large
              @click="dialog.cancel = true"
              :disabled="!found"
              :loading="loaders.cancel"
            >
              <v-icon>mdi-cancel</v-icon>
            </v-btn>
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="mt-2" md="7" v-show="uuid != ''">
            <strong>UUID:</strong><br>{{ uuid }}
          </v-col>
        </v-row>
        <v-row>
          <v-col >
            <v-select
              v-model="motivoCancelacion"
              :items="motivosCancelacion"
              outlined
              label="Motivo de Cancelación"
              filled
              item-color="blue"
              dense
            />
          </v-col>
        </v-row>

      </v-card-text>

      <v-card-actions>
        <v-row class="mr-2 mb-2" justify="end">
          <v-btn
            class="white--text"
            :loading="loaders.cancel"
            :disabled="loaders.cancel || !found"
            color="primary"
            @click="dialog.cancel = true"
          >
            <v-icon
              left
              dark
            >
              mdi-cloud-upload
            </v-icon>
            Cancelar CFDI
          </v-btn>
        </v-row>
      </v-card-actions>
    </v-card>

    <!-- Dialogo para confirmar cancelacion -->
    <v-dialog
      v-model="dialog.cancel"
      persistent
      max-width="290"
    >
      <v-card>
        <v-card-title class="text-h5">
          Confirmación
        </v-card-title>
        <v-card-text>Una vez cancelada la factura no se podrá revertir, ¿Cancelar?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="dialog.cancel = false"
          >
            No
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            @click="CancelarFactura"
          >
            Si
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogo para Login -->
    <v-dialog v-model="dialog.login" persistent max-width="290">
        <v-card>
          <v-toolbar color="primary" dense>
            <v-toolbar-title dark>
              <v-icon class="mr-2">mdi-account</v-icon>
              Acceso
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon to="/">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text>
            <v-text-field
              class="mt-4"
              v-model="usuario"
              label="Usuario"
              :rules="[
                v => !!v || 'Requerido',
                v => v.length >= 2 || 'Mínimo 2 caractéres',
                v => v.length <= 10 || 'Máximo 10 caractéres'
              ]"
              maxlength="10"
              @keyup.enter.native="validaUsuario()"
              autofocus
            >
            </v-text-field>
            <v-text-field
              class="mt-4"
              v-model="clave"
              :append-icon="viewPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :type="viewPassword ? 'text' : 'password'"
              label="Contraseña"
              :rules="[
                v => !!v || 'Requerido',
              ]"
              maxlength="10"
              @click:append="viewPassword = !viewPassword"
              @keyup.enter.native="validaUsuario()"
            >
            </v-text-field>
          </v-card-text>
          <v-card-actions>
            <!-- <div class="flex-grow-1"></div> -->
            <v-btn color="primary" block dark @click.native="validaUsuario()" :disabled="!usuario || !clave" :loading="loaders.usuario">
              Continuar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog> <!-- Dialogo de login -->

      <snack-bar ref="snackBar"/>

  </v-layout>
</template>

<script>
import SnackBar from '@/components/SnackBar.vue'
import config from '@/config.json'
import utils from '@/assets/utils'

const Utils = new utils()

let pdfBase64 = "",
    xml = "",
    serie = ""

export default {
  components: {
    SnackBar
  },
  data: () => ({
    alert: {
      active: false,
      msg: '',
      type: '',
    },
    warning: {
      active: false,
      msg: '',
      type: ''
    },
    loaders: {
      search: false,
      cancel: false,
      usuario: false,
    },
    serie: '',
    folio: '',
    uuid: '',
    found: false,
    dialog: {
      cancel: false,
      login: true
    },
    usuario: "",
    clave: '',
    viewPassword: false,
    motivosCancelacion: null,
    motivoCancelacion: null,
    tipo: 'f',
  }),

  mounted () {
    this.motivosCancelacion = Utils.motivosCancelacion
    this.motivosCancelacion.shift() // elimino el 1er elemento "01 - Comprobante emitido con errores con relación"
    this.motivosCancelacion.pop() // elimino el último elemento "04 - Operación nominativa relacionada en la factura global"
    this.motivoCancelacion = this.motivosCancelacion[0] // Default "02 - Comprobante emitido con errores sin relación"
    this.getParametros() // Parametros
    this.$nextTick(() => {
      document.getElementById("folio").focus()
    }, 100)
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
          serie = this.serie
        } else {
          this.alert.msg = `Problemas con el Servidor (${resp.data.response} ${resp.data.msg})`
        }
      }).catch(error => {
        this.alert.msg = error
      }).finally(() => {
        this.alert.active = (this.alert.msg != "")
      })
    }, // getParametros()
    buscarCFDI() {
      this.alert.msg = ""
      this.found = false
      this.uuid = ""
      pdfBase64 = ''
      xml = ''
      if (this.folio != undefined) {
        this.folio = (this.tipo === 'f') ? this.folio.padStart(8, '0') : this.folio
        console.log('tipo', this.tipo, 'folio', this.folio)
        this.loaders.search = true
        this.$axios({
          method: 'get',
          url: `/api/recuperarCFDI/${this.serie}${this.folio}`
        }).then(resp => {
          console.log("resp", resp.data)
          if (resp.data.result.retcode != 1) {
            this.alert.msg = resp.data.result.result.error
          } else if (resp.data.result.retcode == 1) {
            this.found = true
            pdfBase64 = resp.data.result.result.pdfBase64
            xml = resp.data.result.result.xml
            this.uuid = resp.data.result.result.uuid
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

    CancelarFactura() {
      this.dialog.cancel = false
      this.loaders.cancel = true
      const data = {
        dataPac: {
          uuid: this.uuid,
          Motivo: this.motivoCancelacion.substring(0, 2),
          //FolioSustitucion: ""
        },
        dataFact: {
          factura: this.folio, //.padStart(8, "0"),
          facRel: "",
          motivoCanc: this.motivoCancelacion.substring(0, 2),
          motivo: this.motivoCancelacion,
          uuidRel: "",
          usuario: this.usuario,
          folio: ""
        },
        serie: this.serie,
        folio: this.folio
      }
      this.$axios({
        method: 'post',
        url: `/api/cancelarFactura`,
        data
      }).then(resp => {
        console.log("cancelaFactura() resp.data", resp.data)
        // Validacion de la respuesta (result)
        if (resp.data.result) {
          if (resp.data.result.retcode == 1) {
            this.alert.msg = 'Cancelación realizada correctamente' ; this.alert.type = 'success'
          } else {
            this.alert.msg = 'Respuesta indefinido por parte de iTimbre' ; this.alert.type = 'yellow'
          }
        } else {
          // Sin resultado, indefinido
          this.alert.msg = 'Respuesta indefinido por parte de iTimbre' ; this.alert.type = 'yellow'
        }
      }).catch(error => {
        console.log("Error", error)
        this.alert.msg = error
      }).finally(() => {
        this.loaders.cancel = false
        this.alert.active = (this.alert.msg != "")
        this.warning.active = (this.warning.msg != "")
      })
    }, // CancelarFactura()

    openPdf() {
      let win = window.open()
      win.document.title = this.serie + "-" + this.folio
      win.document.header = this.serie + "-" + this.folio
      win.document.write(`
        <iframe
          id="Pdf"
          title="Pdf..."
          alt="PDF..."
          src="data:application/pdf;base64,${pdfBase64}"
          frameborder="0"
          style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;"
          allowfullscreen>
        </iframe>`)
    }, // openPdf()

    validaUsuario() {
      let msg
      if (this.usuario && this.usuario.length > 0 && this.clave && this.clave.length > 0) {
        this.loaders.usuario = true
        this.$axios({
          method: 'get',
          url: `${config.backEndUrl}/gusher/ws.prg?mod=usuario`, //`api/usuario/${this.usuario}`,
          params: {
            id: this.usuario,
            clave: this.clave,
            opt: "canfac"
          }
        }).then(resp => {
          if (resp.data && resp.data.response == 200) {
            this.dialog.login = false
          } else if (resp.data && resp.data.response == 404) {
            this.$refs.snackBar.text = resp.data.msg
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          } else if (resp.data && resp.data.response == 500) {
            this.$refs.snackBar.text = resp.data.msg
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          } else {
            msg = (resp.data.msg) ? resp.data.msg : resp.data
            this.$refs.snackBar.text = "Error: " + msg
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          }
        }).catch(err => {
          console.log("resp err", err)
          this.$refs.snackBar.text = (typeof err == 'object') ? JSON.stringify(err) : err
          this.$refs.snackBar.color = "orange darken-4"
          this.$refs.snackBar.snackBar = true
        }).finally(() => {
          this.loaders.usuario = false
        })
      }
    }, // validaUsuario()
    changeTipo() {
      let prefijo = (this.tipo == 'f') ? '' : 'NC'
      this.serie = prefijo + serie
      this.$nextTick(() => {
        document.getElementById("folio").focus()
      }, 100)
    }, // changeTipo()

  }, // methods {}

}
</script>
