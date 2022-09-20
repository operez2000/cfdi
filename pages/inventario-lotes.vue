<template>
  <v-app>

    <v-overlay :value="overlay">
      <v-progress-circular
        indeterminate
        size="60"
      ></v-progress-circular>
    </v-overlay>

    <v-container class="column" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="12" md="8">
          <v-card class="elevation-12">
            <v-system-bar color="primary" window height="26"> <!-- color="primary" dark flat dense> -->
              <v-toolbar-title style="font-size: 0.95em;">Inventario - Lotes</v-toolbar-title>
              <v-spacer />
              <v-toolbar-title style="font-size: 0.95em;">{{ usuario }}</v-toolbar-title>
              <v-spacer />

              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon v-bind="attrs" v-on="on" @click.stop="dialog.fecha = true">
                    <v-icon>mdi-file-document</v-icon>
                  </v-btn>
                </template>
                <span>Generar Reporte</span>
              </v-tooltip>
<!--
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon v-bind="attrs" v-on="on" @click.stop="dialog.lotes = true">
                    <v-icon>mdi-format-list-numbered</v-icon>
                  </v-btn>
                </template>
                <span>Consulta de Lotes</span>
              </v-tooltip> -->

              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon v-bind="attrs" v-on="on" @click.stop="dialog.login = true">
                    <v-icon>mdi-account</v-icon>
                  </v-btn>
                </template>
                <span>Información del Usuario</span>
              </v-tooltip>

              <!-- <div class="flex-grow-1"></div> -->
            </v-system-bar>
            <v-card-text>
              <v-form class="compact-form" ref="frmCodigo" v-model="frmCodigoValid" @submit.prevent>
                <v-row dense>
                  <v-col v-show="!labelScan">
                    <v-text-field
                      label="Etiqueta ó Código:"
                      name="codigo"
                      v-model="codigo"
                      dense
                      append-icon="mdi-magnify"
                      @click:append="getCodigo()"
                      type="text"
                      clearable
                      ref="codigo"
                      @input="codigo = (codigo) ? codigo.toUpperCase() : ''"
                      :disabled="loadingGrabar"
                      :loading="loading.codigo"
                      @keyup.enter.native="getCodigo()"
                      autocomplete="off"
                      autofocus
                    ></v-text-field>
                  </v-col>
                </v-row>
                <div v-show="item.barra">
                  <!-- <div class="text-center">Etiqueta: {{ item.barra }}</div> -->
                </div>
                <div v-show="item.mPart">
                  <div class="text-center">Código: {{ item.mPart }} / Cod Barras: {{ item.mBarCode }}</div>
                  <div class="text-center">{{ item.mDesc }}</div>
                  <div class="text-center subtitle-1"><strong>Existencia General: {{ item.mExiste }}</strong></div>
                  <div class="text-center subtitle-1" v-show="(item.existencia != undefined)">
                    <strong>Existencia en Lote: {{ item.existencia }}</strong>
                  </div>
                </div>
<!--
                <v-btn
                  class="mt-2"
                  block
                  small
                  color="primary"
                  @click="iniciarLotes()"
                  :disabled="(!item.mPart)"
                  :loading="loading.btnCodigo"
                >
                  Iniciar Lotes a Cero
                </v-btn> -->

              </v-form>

              <hr class="my-4" />

              <v-form ref="form" v-model="valid" @submit.prevent v-show="labelScan"> <!-- @keyup.enter.native="enterForm"> -->

                <v-row dense>
                  <v-col cols="8">
                    <v-text-field
                      v-model="label.barra"
                      dense
                      type="text"
                      name="barra"
                      ref="label"
                      label="Etiqueta de Lote"
                      append-icon="mdi-magnify"
                      @click:append="getEtiqueta()"
                      clearable
                      @input="label.barra = (label.barra) ? label.barra.toUpperCase() : '' ; inputEtiqueta()"
                      @keyup.enter.native="getEtiqueta()"
                      :loading="loading.labelBarra"
                      autocomplete="off"
                      autofocus
                    />
                  </v-col>
                  <v-col cols="4">
                    <!-- Cantidad -->
                    <v-text-field
                      v-model.number="cantidad"
                      dense
                      type="number"
                      label="Cantidad"
                      name="cantidad"
                      :rules="[
                        v => !!v || 'La Cantidad es requerida',
                        v => (v >= -9999 && v <= 9999 && v != 0) || 'Cantidad incorrecta'
                      ]"
                      @keyup.enter.native="onEnter('cantidad')"
                    />
                  </v-col>
                </v-row>

                <div v-show="label.lote">
                  <div class="text-center">Etiqueta: {{ label.id }} / Código: {{ label.mPart }}</div>
                  <div class="text-center">{{ label.mDesc }}</div>
                  <div class="text-center">Lote: {{ label.lote }} / Caducidad: {{ label.fCaducFormat }}</div>
                  <div class="text-center subtitle-1"><strong>Existencia general: {{ label.existencia }}</strong></div>
                  <div class="text-center subtitle-1" v-show="(item.existencia != undefined)">
                    <strong>Existencia en Lote: {{ item.existencia }}</strong>
                  </div>
                </div>

              </v-form>
            </v-card-text>
            <v-card-actions v-show="labelScan">
              <div class="flex-grow-1">
                <v-btn block color="info" :loading="loadingFinalizar" @click="finalizar()">Finalizar
                  <v-badge class="ml-6" color="orange darken-3">
                    <span slot="badge">Diferencia: {{ item.mExiste - sumaLotes }}</span>
                  </v-badge>
                </v-btn>
              </div>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-layout justify="center">
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
            <div class="compact-form">
              <v-text-field
                class="mt-4"
                v-model="usuario"
                dense
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
                dense
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
            </div>
          </v-card-text>
          <v-card-actions>
            <!-- <div class="flex-grow-1"></div> -->
            <v-btn color="primary" block dark @click.native="validaUsuario()" :disabled="!usuario || !clave" :loading="loading.usuario">
              Continuar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>

    <!-- Dialogo confirmar inicio de lotes a ceros -->
    <v-layout justify="center">
      <v-dialog v-model="dialog.ceros" persistent max-width="320">
        <v-card>
          <v-toolbar color="primary" dense>
            <v-toolbar-title dark>Confirmar</v-toolbar-title>
             <v-spacer></v-spacer>
             <v-btn icon dark @click="dialog.ceros = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          </v-toolbar>
          <v-card-text>
            <div class="subtitle-2 mt-4 mb-4">
              <div class="text-center">Código: {{ item.mPart }} / Cod Barras: {{ item.mBarCode }}</div>
              <div class="text-center">{{ item.mDesc }}</div>
              <div class="text-center">Existencia general: {{ item.mExiste }}</div>
              <div class="text-center" v-show="(item.existencia != undefined)">
                <strong>Existencia en Lote: {{ item.existencia }}</strong>
              </div>

            </div>
            <v-divider></v-divider>
            <div class="subtitle-1 mt-4">¿Iniciar en Ceros las existencias de Lotes?</div>
          </v-card-text>
          <v-card-actions>
            <!-- <div class="flex-grow-1"></div> -->
            <v-btn color="primary" block dark @click.native="iniciarLotes()" :loading="loading.ceros">
              Continuar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialogo para consulta de Lotes -->
      <v-row justify="center">
        <v-dialog
          v-model="dialog.lotes"
          fullscreen
          hide-overlay
          transition="dialog-bottom-transition"
        >
          <v-card>
            <v-toolbar dark color="primary" dense>
              <v-btn icon dark @click="dialog.lotes = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-toolbar-title style="font-size: 0.95em;">Consulta de Lotes</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-toolbar-items>
                <v-btn dark text @click="dialog.lotes = false">
                  Regresar
                </v-btn>
              </v-toolbar-items>
            </v-toolbar>
            <v-data-table
              :headers="headers"
              :items="lotes"
              class="elevation-1"
              :footer-props="{
                itemsPerPageText: 'Reng X Página',
                itemsPerPageAllText: 'Todos'
              }"
              :loading="loading.tablaLotes"
              loading-text="Cargando... Un momento por favor"
              no-data-text="No se encontraron registros"
              locale='es-MX'
              dense
            ></v-data-table>
          </v-card>
        </v-dialog>
      </v-row> <!-- dialog (lotes) full screen -->

    </v-layout>

    <!-- Fecha del reporte -->
    <v-dialog
      ref="dialog"
      v-model="dialog.fecha"
      :return-value.sync="fechaReporte"
      persistent
      width="290px"
    >
      <v-date-picker
        v-model="fechaReporte"
        scrollable
        locale="es-mx"
      >
        <v-spacer></v-spacer>
        <v-btn
          text
          color="primary"
          @click="dialog.fecha = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          text
          color="primary"
          :loading="loading.reporte"
          @click="$refs.dialog.save(fechaReporte); reporteData()"
        >
          OK
        </v-btn>
      </v-date-picker>
    </v-dialog>

    <snack-bar ref="snackBar"/>

  </v-app>
</template>

<script>
  import SnackBar from '../components/SnackBar.vue'
  import JSPDF from 'jspdf'
  import "jspdf-barcode"
  import config from '../config.json'

  export default {
    components: {
      SnackBar
    },
    // props: {
    //   source:
    //     SnackBarString,
    // },
    data: () => ({
      drawer: null,
      valid: true,
      usuario: '',
      clave: '',
      cantidad: 1,
      codigo: '',
      descripcion: '',
      frmCodigo: null,
      frmCodigoValid: true,
      label: {
        barra: '',
        codigo: '',
        mPart: '',
        mDesc: '',
        lote: '',
        fCaduc: '',
        fCaducFormat: '',
        existencia: 0,
        diferencia: 0,
      },

      rules: {
        required: value => !!value || 'Requerido',
        usuario: {
          min: v => v.length >= 3 || 'Mínimo 3 caractéres',
          max: v => v.length <= 10 || 'Máximo 10 caractéres',
        },
        cantidad: {
          cant: value => value != 0 || 'Incorrecto'
        },
        codigo: {
          min: v => v.length >= 1 || 'Mínimo 1 caractér',
          max: v => v.length <= 16 || 'Máximo 16 caractéres',
        }
      },
      origin: '',
      hostname: '',
      dialog: {
        login: false,
        lotes: false,
        ceros: false,
        fecha: false,
      },
      headers: [
        {
          text: 'Etiqueta',
          align: 'start',
          sortable: true,
          value: 'registro',
        },
        { text: 'Código', value: 'codigo' },
        { text: 'Lote', value: 'lote' },
        { text: 'Caducidad', value: 'fCaduc' },
        { text: 'Cant', value: 'cant', align: 'end' },
        { text: 'Existencia', value: 'existencia' },
      ],
      lotes: [],
      etiquetasLeidas: [],
      sumaLotes: 0,

      items: [],
      item: {},
      etiqueta: null,
      overlay: false,
      loading: {
        usuario: false,
        codigo: false,
        tablaLotes: false,
        btnCodigo: false,
        labelBarra: false,
        ceros: false,
        reporte: false,
      },

      loadingItems: false,
      loadingLotes: false,
      loadingGrabar: false,
      loadingFinalizar: false,
      viewPassword: false,
      labelScan: false,
      fechaReporte: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10), // YYYY-MM-DD
    }),  // data()

    mounted() {
      this.origin = window.location.origin // url (http://127.0.0.1:3001)
      this.dialog.login = true
    },

    methods: {
      getLote(lote) {
        //let objLote = this.lotes.filter(i => i.BARRA == lote)
        //let objLote = this.lotes.find(i => i.BARRA == lote)
        //this.descripcion = objLote.BARCODE
      },

      getCodigo() {
        // Búsqueda del primer campo (codigo) para indicar con cuál se hará el bloque de lotes
        let msg
        let id = this.codigo
        this.$refs.frmCodigo.reset()
        if (id && id.length > 0) {
          this.loading.codigo = true
          this.item = {}
          this.$axios({
            method: 'get',
            url: '/api/codigo',
            params: {
              id: id
            }
          }).then(resp => {
            if (resp.data.response == 200) {
              this.item.mPart = resp.data.data.mPart
              this.item.mDesc = resp.data.data.mDesc
              this.item.mBarCode = resp.data.data.mBarCode
              this.item.mExiste = resp.data.data.mExiste
              this.item.existencia = resp.data.data.existencia
              this.item.barra = (resp.data.data.barra) ? resp.data.data.barra : null
              this.dialog.ceros = true
            } else {
              msg = (resp.data.msg) ? resp.data.msg : resp.data
              this.$refs.snackBar.text = msg
              this.$refs.snackBar.color = "orange darken-4"
              this.$refs.snackBar.snackBar = true
            }
          }).catch(err => {
            let txtError = (typeof err == "object") ? JSON.stringify(err) : err
            this.$refs.snackBar.text = txtError
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          }).finally(() => {
            this.loading.codigo = false
          }) // axios
        } // Si tiene info el código
      }, // getCodigo()

      iniciarLotes() {
        let msg
        this.etiquetasLeidas = []
        this.loading.ceros = true
        this.$axios({
          method: 'get',
          url: '/api/inicia-ceros',
          params: {
            mPart: this.item.mPart
          }
        }).then(resp => {
          if (resp.data.response == 200) {
            this.labelScan = true
            this.$refs.snackBar.text = "Los Lotes se han iniciado correctamente a Ceros"
            this.$refs.snackBar.color = "green darken-4"
            this.$refs.snackBar.snackBar = true
          } else {
            msg = (resp.data.msg) ? resp.data.msg : resp.data
            this.$refs.snackBar.text = msg
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          }
        }).catch(err => {
          let txtError = (typeof err == "object") ? JSON.stringify(err) : err
          this.$refs.snackBar.text = txtError
          this.$refs.snackBar.color = "orange darken-4"
          this.$refs.snackBar.snackBar = true
        }).finally(() => {
          this.loading.ceros = false
          this.dialog.ceros = false
          this.labelFocus()
          this.$refs.form.reset()
          this.cantidad = 1
        }) // axios
      },  //iniciarLotes()

      getEtiqueta() {
        let id = this.label.barra
        let msg

        // Validación para que el código (mPart) se capture antes de procesar la etiqueta
        if (! this.item.mPart || this.item.mPart.length == 0) {
          this.$refs.snackBar.text = "Es necesario capturar el Código antes de procesar la Etiqueta"
          this.$refs.snackBar.color = "orange darken-4"
          this.$refs.snackBar.snackBar = true
          this.codigoFocus()
          return
        }

        if (id && id.length > 0 && (this.cantidad != 0 && this.cantidad >= -9999 && this.cantidad <= 9999)) {
          let idxEtiqueta = -1
          id = id.substr(0,1).toUpperCase() + id.substr(1).padStart(6, '0')
          this.label.barra = id
          this.loading.labelBarra = true
          this.label = {
            barra: '',
            codigo: '',
            mPart: '',
            mDesc: '',
            lote: '',
            fCaduc: '',
            fCaducFormat: '',
            existencia: 0,
            diferencia: 0,
          }

          this.$axios({
            method: 'get',
            url: `/api/etiqueta/${id}`,
            params: {
              mPart: this.item.mPart,
              cantidad: this.cantidad
            }
          }).then(resp => {
            if (resp.data.response == 200) {
              this.label.id = resp.data.data.id
              this.label.barra = resp.data.data.barra
              this.label.codigo = resp.data.data.codigo
              this.label.mPart = resp.data.data.mPart
              this.label.mDesc = resp.data.data.mDesc
              this.label.mExiste = this.item.mExiste = resp.data.data.mExiste
              this.label.lote = resp.data.data.lote
              this.label.fCaduc = resp.data.data.fCaduc
              this.label.fCaducFormat = resp.data.data.fCaducFormat
              this.label.existencia = resp.data.data.existencia
              this.label.diferencia = resp.data.data.diferencia
              idxEtiqueta = this.etiquetasLeidas.findIndex(v => v.barra == this.label.barra)
              if (idxEtiqueta == -1) {
                // Agrego la etiqueta al arreglo de lotes leidos
                this.etiquetasLeidas.push({
                  barra: this.label.barra,
                  cantidad: 0
                })
                idxEtiqueta = 0
              }
              this.etiquetasLeidas[idxEtiqueta].cantidad += this.cantidad
              // Acumulo la cantidad en la etiqueta actual
              this.sumaLotes = this.etiquetasLeidas.reduce( (sum, v) => sum + v.cantidad, 0 )
            } else {
              msg = (resp.data.msg) ? resp.data.msg : resp.data
              this.$refs.snackBar.text = msg
              this.$refs.snackBar.color = "orange darken-4"
              this.$refs.snackBar.snackBar = true
            }
          }).catch(err => {
            let txtError = (typeof err == "object") ? JSON.stringify(err) : err
            this.$refs.snackBar.text = txtError
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          }).finally(() => {
            this.loading.labelBarra = false
            this.label.barra = ""
            this.cantidad = 1
          }) // axios
        } else { // Si tiene info el código
          this.$refs.snackBar.text = "Información incompleta"
          this.$refs.snackBar.color = "orange darken-4"
          this.$refs.snackBar.snackBar = true
        }
      }, // getEtiqueta()
/*
      fechaLocal(fecha) {
console.log("fecha", fecha)
        return (fecha) ? fecha.substr(8, 2) + "/" + fecha.substr(5, 2) + "/" + fecha.substr(0, 4) : ''
      },
*/

      enterForm () {
        let etiqueta = false
        this.item = {}
        if (this.valid) {
          let url = ''
          // Busco por etiqueta primero
          if (this.codigo && this.codigo.substr(0, 1) == "L") {
            etiqueta = true
            this.codigo = this.codigo.substr(0, 1) + this.codigo.substr(1).padStart(6, "0")
            //url = `${this.origin}/ws.prg?mod=lotes&id=${this.codigo}`
            url = `/api/lote/?opt=inventario&codigo=${this.codigo}&cantidad=${this.cantidad}`
            /*
            this.lote = this.lotes.find(i => i.BARRA == this.codigo)
            this.item = items.find(i => i.MPART == this.lote.CODIGO)
            */
          } else {
            // En caso de no tener etiqueta de Lotes
            etiqueta = false
            url = `/api/catalogo/?opt=inventario&codigo=${this.codigo}&cantidad=${this.cantidad}`
            //this.item = items.find(i => (i.MPART == this.codigo) || (i.MBARCODE == this.codigo))
          }

          // if (!this.item) {
          //   alert("Código Inexistente...")
          // } else {
          //   this.grabar()
          // }

          this.loadingGrabar = true
          this.$axios.get(url)
            .then(resp => {
              if (resp.data.response == 200) {
                this.item = resp.data.data
                this.codigo = ""
              } else {
                this.$refs.snackBar.text = "Producto Inexistente"
                this.$refs.snackBar.color = "orange darken-4"
                this.$refs.snackBar.snackBar = true
              }
              this.cantidad = 1
            })
            .catch(err => {
              console.log("Error", err)
              this.$refs.snackBar.text = err
              this.$refs.snackBar.color = "orange darken-4"
              this.$refs.snackBar.snackBar = true
            })
            .finally(() => {
              this.loadingGrabar = false
              this.codigoFocus()
            })

        } else {
          // Forma invalida  (!this.valid)
          if (this.cantidad) {
            if (!this.codigo) {
              this.codigoFocus()
            }
          }
        }
      }, // enterForm()

      grabar () {
console.log("wait...")
return
		    let url = "http://" + this.hostname + ":3000" + '/svr_lectura?usuario=' + this.usuario + '&cantidad=' + this.cantidad + '&codigo=' + this.codigo
        this.$axios.$get(
          //'http://127.0.0.1:3001/svr_lectura?usuario=' + this.usuario + '&cantidad=' + this.cantidad + '&codigo=' + this.codigo
		      // http://127.0.0.1:3000/svr_lectura?usuario=user&cantidad=2&codigo=2344
          //this.origin + '/svr_lectura?usuario=' + this.usuario + '&cantidad=' + this.cantidad + '&codigo=' + this.codigo
		      "http://" + this.hostname + ":3000" + '/svr_lectura?usuario=' + this.usuario + '&cantidad=' + this.cantidad + '&codigo=' + this.codigo
        ).then( response => {
          console.log('Ok', response)
        }).catch( response => {
          console.log('Error', response)
        }).finally( () => {
          console.log('Fin de proceso')
          this.codigo = ''
          this.codigoFocus()
          this.cantidad = 1
/*
          this.$nextTick(() => {
            this.$refs.codigo.$el.getElementsByTagName('input')[0].focus()
          })
*/
        })
      }, // grabar()

      validaUsuario() {
        let msg
        if (this.usuario && this.usuario.length > 0 && this.clave && this.clave.length > 0) {
          this.loading.usuario = true
          this.$axios({
            method: 'get',
            url: `${config.backEndUrl}/gusher/ws.prg`, //`api/usuario/${this.usuario}`,
            params: {
              mod: 'usuario',
              id: this.usuario,
              clave: this.clave,
              opt: "invlotes"
            }
          }).then(resp => {
            if (resp.data && resp.data.response == 200) {
              this.dialog.login = false
              this.codigoFocus()
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
            this.loading.usuario = false
          })
        }
      }, // validaUsuario()

      onEnter(origen) {
        if (origen == 'cantidad') {
          if (this.cantidad == 0) {
            this.cantidad = 1
          }
          this.labelFocus()
        }
      },

      codigoFocus() {
        this.$nextTick(() => {
          this.$refs.codigo.$el.getElementsByTagName('input')[0].focus()
        })
      }, // codigoFocus()

      labelFocus() {
        this.$nextTick(() => {
          this.$refs.label.$el.getElementsByTagName('input')[0].focus()
        })
      }, // codigoFocus()

      inputEtiqueta() {
        if (! this.cantidad || this.cantidad == undefined || this.cantidad == null) {
          this.cantidad = 1
        }
      }, // inputEtiqueta()

      finalizar() {
        let msg
        this.loadingFinalizar = true
        this.$axios({
          method: 'get',
          url: '/api/final-lotes',
          params: {
            codigo: this.item.mPart,
            descrip: this.item.mDesc,
            cantidad: this.item.mExiste - this.sumaLotes,
            usuario: this.usuario
          }
        }).then(resp => {
          msg = (resp.data.msg) ? resp.data.msg : resp.data
          if (resp.data.response == 200) {
            this.$refs.snackBar.text = msg
            this.$refs.snackBar.color = "green darken-4"
            this.$refs.snackBar.snackBar = true
          } else {
            this.$refs.snackBar.text = msg
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          }
        }).catch(err => {
          let txtError = (typeof err == "object") ? JSON.stringify(err) : err
          this.$refs.snackBar.text = txtError
          this.$refs.snackBar.color = "orange darken-4"
          this.$refs.snackBar.snackBar = true
        }).finally(() => {
          this.loadingFinalizar = false
          this.labelScan = false
          this.item.mPart = null
          this.label.lote = null
        }) // axios
      }, // finalizar()

      reporteData() {
        let msg
        this.loading.reporte = true
        this.$axios({
          method: 'get',
          url: `/api/faltantes-lotes/${this.fechaReporte}`,
          params: {}
        }).then(resp => {
          msg = (resp.data.msg) ? resp.data.msg : resp.data
          if (resp.data.response == 200) {
            this.reportePDF(resp.data.data)
          } else {
            this.$refs.snackBar.text = msg
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          }
        }).catch(err => {
          let txtError = (typeof err == "object") ? JSON.stringify(err) : err
          this.$refs.snackBar.text = txtError
          this.$refs.snackBar.color = "orange darken-4"
          this.$refs.snackBar.snackBar = true
        }).finally(() => {
          this.loading.reporte = false
        }) // axios
      }, // reporteData()

      reportePDF(items) {

        let row = 300
        let col = 10
        let doc = new JSPDF()
        let totalPagesExp = '{total_pages_count_string}'
        let totalPaginas = 0
        let index = 0
        let margins = {
          top: 37,
          bottom: 10,
          left: 40,
          width: 522
        }
        let barras = []

        doc.setProperties({
          title: "Reporte de Faltantes"
        })
        doc.page = 0
        doc.pages = 1

/*
row = 50
        let renglon = 0
        items.forEach(element => {
console.log("element", element)
          doc.text(++renglon, 10, row)
//          doc.text(element.codigo, 30, row)
          row += 10
        });
*/

        // Detalle
        row = 300
        for (index = 0; index < items.length; index++) {

          // Control de encabezado y pie de pag.
          if (row > 276) {
            // Avanzo una página en caso de que sea mayor a la primera
            if (doc.page > 0) {
              doc.addPage()
            }
            doc.page++
            this.docHeaderFooter(doc)
            row = 32
          } // header and footer

          // Cambio de color en detalle
          if ((index % 2) == 1) {
            doc.setFillColor(239, 239, 239)
            doc.rect(10, row+2, 190, 6, 'F')
          }
          row += 6
          doc.text((index+1).toString(), col +=6 , row, 'right')
          doc.text(items[index].codigo, col += 5, row)
          doc.text(items[index].descrip, col += 18, row)
          doc.text(items[index].cantidad.toLocaleString(), col += 80, row, 'right')
          doc.text(items[index].usuario, col += 11, row)

          barras.push({
            codigo: items[index].codigo,
            col: col + 21,
            row: row + 1
          })
          /*
          doc.barcode(items[index].codigo, {
            fontSize: 12,
            textColor: "#000000",
            x: col += 21,
            y: row
          })
          */
          col = 10

        } // for items

        barras.forEach(element => {
          doc.barcode(element.codigo, {
            fontSize: 12,
            textColor: "#000000",
            x: element.col,
            y: element.row
          })
        });

        doc.setDrawColor(31, 78, 121)
        doc.line(10, row+=3, 200, row)


        // header y footer final (cuando aplica)
        if ( (doc.page+1) == doc.pages ) {
          this.docHeaderFooter(doc)
        }

        doc.output('datauristring')
  //  			doc.output('datauri'); //dataurlnewwindow');
        doc.save('faltantes.pdf')

      }, // exportarPDF()

      // Generar el encabezado y el pié de pag. del PDF
      docHeaderFooter(doc) {
        // Header
        let row = 15
        let fecha = this.fechaReporte.substr(8, 2) + '-' + this.fechaReporte.substr(5, 2) + '-' + this.fechaReporte.substr(0, 4)
        let imagen = new Image()
        imagen.src = "logo.png"

        doc.addImage(imagen, 'PNG', 10, 10, 16, 16)
//        doc.addImage(this.images.linea, 'JPEG', 10, 28, 190, 0)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(12)
        doc.text(`Reporte de Faltantes - Inventario de Lotes / Fecha ${fecha}`, 55, row)
        doc.setTextColor('#000')
        doc.setFont('helvetica', 'normal') ; doc.setFontSize(8)
        doc.setFontSize(10)
        //doc.setLineWidth(0.5)

        doc.setFillColor(31, 78, 121)
        doc.rect(10, row+12, 190, 6, 'F')
        doc.setTextColor('#FFF')
        doc.text('    #    Código        Descripción                                                      Cantidad     Usuario         C. de Barras', 10, row += 16)
        doc.setTextColor('#000')

        // Footer
        doc.setFont('helvetica', 'italic') ; doc.setFontSize(7)
        doc.text(`Pag. ${doc.page}-${doc.pages}`, 10, 288)
        doc.text(new Date().toLocaleDateString('fr-FR'), 187, 288)
        doc.setFont('helvetica', 'normal') ; doc.setFontSize(8)

      }, // docHeaderFooter()

    }, // methods

    filters: {
      formatFecha: function(value) {
        let strFecha
        if (value && value != "") {
          strFecha = new Date(value)
        } else {
          strFecha = new Date()
        }
        return strFecha.toLocaleString('es-MX', {
          timeZone: 'America/Tijuana',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      }
    },

  }
</script>
<style>
.mayusculas {
  text-transform: uppercase
}
.compact-form {
  transform: scale(0.95);
  transform-origin: left;
}
</style>
