<template>
  <v-app id="lectura">

    <v-overlay :value="overlay">
      <v-progress-circular
        indeterminate
        size="60"
      ></v-progress-circular>
    </v-overlay>

    <v-container class="fill-height column" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="12" md="8">
          <v-card class="elevation-12">
            <v-toolbar color="primary" dark flat dense>
              <v-toolbar-title>Inventario General</v-toolbar-title>
              <v-spacer />
              <v-toolbar-title>{{ usuario }}</v-toolbar-title>
              <v-spacer />

              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon v-bind="attrs" v-on="on" @click.stop="dialog = true">
                    <v-icon>mdi-account</v-icon>
                  </v-btn>
                </template>
                <span>Información del Usuario</span>
              </v-tooltip>

              <!-- <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon v-bind="attrs" v-on="on" @click.stop="getItems()" :loading="loadingItems">
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>
                </template>
                <span>Cargar Catálogo</span>
              </v-tooltip>

              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon v-bind="attrs" v-on="on" @click.stop="getLotes()" :loading="loadingLotes">
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>
                </template>
                <span>Cargar Lotes</span>
              </v-tooltip> -->

              <!-- <div class="flex-grow-1"></div> -->
            </v-toolbar>
            <v-card-text>
              <v-form ref="form" v-model="valid" @keyup.enter.native="enterForm">
                <v-text-field
                  label="Código o Etiqueta"
                  name="codigo"
                  v-model="codigo"
                  class="mb-3"
                  prepend-icon="mdi-barcode"
                  type="text"
                  clearable
                  ref="codigo"
                  :rules="[rules.required, rules.codigo.min, rules.codigo.max]"
                  @input="codigo = (codigo) ? codigo.toUpperCase() : ''"
                  :disabled="loadingGrabar"
                  autocomplete="off"
                  autofocus
                ></v-text-field>
                <div v-show="item.MPART">
                  <div class="text-subtitle-1 text-center">Código: {{ item.MPART }}</div>
                  <div class="text-subtitle-1 text-center">{{ item.MDESC }}</div>
                  <div class="text-subtitle-1 text-center">Cod. Barras: {{ item.MBARCODE }}</div>
                  <div class="text-subtitle-1 text-center">Existencia: {{ item.MEXISTE }}</div>
                </div>
                <div v-show="item.LOTE">
                  <div class="text-subtitle-1 text-center">Lote: {{ item.LOTE }}</div>
                  <div class="text-subtitle-1 text-center">F. Caducidad: {{ item.FCADUC | formatFecha }}</div>
                </div>
                <v-text-field
                  v-model="cantidad"
                  class="mt-4"
                  label="Cantidad"
                  name="cantidad"
                  prepend-icon="mdi-numeric"
                  type="number"
                  :rules="[
                    v => !!v || 'La Cantidad es requerida',
                    v => (v >= -9999 && v <= 9999 && v != 0) || 'Cantidad incorrecta'
                  ]"
                ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <div class="flex-grow-1"></div>
              <v-btn color="primary" :loading="loadingGrabar" :disabled="!valid" @click="enterForm">Grabar</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-layout row justify-center>
      <v-dialog v-model="dialog" persistent max-width="290">
        <v-card>
          <v-toolbar color="primary" dense>
            <v-toolbar-title dark>Indicar Usuario</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-text-field
              class="mt-4"
              v-model="usuario"
              label="Usuario"
              :rules="[
                v => !!v || 'Requerido',
                v => v.length >= 3 || 'Mínimo 3 caractéres',
                v => v.length <= 10 || 'Máximo 10 caractéres'
              ]"
              maxlength="10"
              @keyup.enter.native="dialog = (!usuario)"
              autofocus
            >
            </v-text-field>
          </v-card-text>
          <v-card-actions>
            <!-- <div class="flex-grow-1"></div> -->
            <v-btn color="primary" block dark @click.native="dialog = false ; codigoFocus()" :disabled="!usuario">Continuar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>

    <snack-bar ref="snackBar"/>

  </v-app>
</template>

<script>
  import SnackBar from '../components/SnackBar.vue'
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
      cantidad: 1,
      codigo: '',
      descripcion: '',
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
      dialog: false,
      lotes: [],
      items: [],
      item: {},
      etiqueta: null,
      overlay: true,
      loadingItems: false,
      loadingLotes: false,
      loadingGrabar: false,
    }),  // data()

    mounted() {
      this.origin = window.location.origin // url (http://127.0.0.1:3001)
      this.getItems()
      this.getLotes()
    },

    methods: {
      getItems() {
        this.overlay = true
        this.loadingItems = true
        this.items = []
        this.$axios('/api/items')
          .then(resp => {
            this.items = resp.data
          })
          .catch(err => {
            console.log("err", err)
          })
          .finally(() => {
            this.overlay = false
            this.loadingItems = false
            console.log("Fin de carga (items)")
          })
      },

      getLotes() {
        this.overlay = true
        this.loadingLotes = true
        this.lotes = []
        this.$axios('/api/lotes')
          .then(resp => {
            this.lotes = resp.data
          })
          .catch(err => {
            console.log("err", err)
          })
          .finally(() => {
            this.overlay = false
            this.loadingLotes = false
            console.log("Fin de carga (lotes)")

            this.hostname = window.location.hostname
            if (this.usuario == '' || !this.usuario) {
              this.dialog = true
            } else {
              this.codigoFocus()
            }

          })
      },

      getLote(lote) {
        //let objLote = this.lotes.filter(i => i.BARRA == lote)
        //let objLote = this.lotes.find(i => i.BARRA == lote)
        //this.descripcion = objLote.BARCODE
      },

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
            this.item = this.items.find(i => i.MPART == this.lote.CODIGO)
            */
          } else {
            // En caso de no tener etiqueta de Lotes
            etiqueta = false
            url = `/api/catalogo/?opt=inventario&codigo=${this.codigo}&cantidad=${this.cantidad}`
            //this.item = this.items.find(i => (i.MPART == this.codigo) || (i.MBARCODE == this.codigo))
          }

          // if (!this.item) {
          //   alert("Código Inexistente...")
          // } else {
          //   this.grabar()
          // }

          this.loadingGrabar = true
          this.$axios.get(url)
            .then(resp => {
              console.log("resp", resp.data)
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

      codigoFocus() {
        this.$nextTick(() => {
          this.$refs.codigo.$el.getElementsByTagName('input')[0].focus()
        })
      }, // codigoFocus()

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
</style>
