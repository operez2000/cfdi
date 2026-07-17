<template>
  <v-app id="lectura">

    <v-overlay :value="overlay">
      <v-progress-circular
        indeterminate
        size="60"
      ></v-progress-circular>
    </v-overlay>

    <v-container class=" column" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="12" md="8">
          <v-card class="elevation-12">
            <v-toolbar color="primary" dark flat dense>
              <v-toolbar-title>{{ usuario }}</v-toolbar-title>
              <v-spacer />
              <v-toolbar-title>{{ referencia }}</v-toolbar-title>
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
                  <v-btn
                    icon
                    v-bind="attrs"
                    v-on="on"
                    @click.stop="reporte"
                    :loading="loadingPdf"
                  >
                    <v-icon>mdi-file-pdf-box</v-icon>
                  </v-btn>
                </template>
                <span>Generar Reporte</span>
              </v-tooltip> -->

              <div class="text-center">
                <v-menu offset-y>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      icon
                      v-bind="attrs"
                      v-on="on"
                    >
                    <v-icon>mdi-file-pdf-box</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="reporte('usuario')">
                      <v-list-item-title>Por Usuario</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="reporte('area')">
                      <v-list-item-title>Por Área</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <!-- <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon v-bind="attrs" v-on="on" @click.stop="getLotes()" :loading="loadingLotes">
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>
                </template>
                <span>Cargar Lotes</span>
              </v-tooltip> -->

              <!-- <div class="flex-grow-1"></div> -->

              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon v-bind="attrs" v-on="on" @click.stop="abreDialogoFull">
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                </template>
                <span>Consulta de Inventario</span>
              </v-tooltip>

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
                  id="codigo"
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
              @blur="usuario = usuario.toUpperCase()"
              autofocus
            >
            </v-text-field>
            <br>
            <v-text-field
              v-model="referencia"
              label="Área"
              :rules="[
                v => !!v || 'Requerido',
                v => v.length >= 1 || 'Mínimo 1 caractér',
                v => v.length <= 10 || 'Máximo 10 caractéres'
              ]"
              maxlength="10"
              @keyup.enter.native="dialog = (!referencia)"
              @blur="referencia = referencia.toUpperCase()"
            >
            </v-text-field>
          </v-card-text>
          <v-card-actions>
            <!-- <div class="flex-grow-1"></div> -->
            <v-btn color="primary" block dark @click.native="dialog = false ; codigoFocus()" :disabled="!usuario || !referencia">Continuar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>

    <!-- Dialogo para consula de artículos -->
    <v-dialog
      v-model="dlgFull"
      fullscreen
      :scrim="false"
      transition="dialog-bottom-transition"
      persistent
    >
      <v-card>
        <v-toolbar
          dark
          color="indigo"
          dense
        >
          <v-btn
            icon
            dark
            @click="dialogClose"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-toolbar-title>Consulta de Inventario</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>

        <v-card-text>
          <br>
          <v-text-field
            label="Etiqueta o Código"
            append-icon="mdi-magnify"
            v-model="coderef"
            outlined
            :loading="producto.loading"
            @keyup.enter.native="buscarProducto"
            id="coderef"
            clearable
          />
          <p>Código: <strong>{{ producto.mCodigo}}</strong></p>
          <p>Código de Barras: <strong>{{ producto.mBarCode}}</strong></p>
          <p v-if="existe">Etiqueta: <strong>{{ producto.etiqueta}}</strong></p>
          <p>Descripción: <strong>{{ producto.mDesc}}</strong></p>
          <p>Existencia: <strong>{{ producto.mExiste}}</strong></p>
        </v-card-text>
      </v-card>
    </v-dialog>

    <snack-bar ref="snackBar"/>

  </v-app>
</template>

<script>
  import SnackBar from '../components/SnackBar.vue'
  import JSPDF from 'jspdf'
  import config from '../config.json'

  let datos = {}

  export default {
    components: {
      SnackBar,
    },
    // props: {
    //   source:
    //     SnackBarString,
    // },
    data: () => ({
      drawer: null,
      valid: true,
      usuario: '',
      referencia: '',
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
      loadingPdf: false,
      dlgFull: false,
      coderef: '',
      existe: true,
      producto: {
        mCodigo: '',
        mBarCode: '',
        etiqueta: '',
        mDesc: '',
        mExiste: 0,
        loading: false,
      }
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
            url = `/api/lote/?opt=inventario&codigo=${this.codigo}&cantidad=${this.cantidad}&usuario=${this.usuario}&referencia=${this.referencia}`
            /*
            this.lote = this.lotes.find(i => i.BARRA == this.codigo)
            this.item = this.items.find(i => i.MPART == this.lote.CODIGO)
            */
          } else {
            // En caso de no tener etiqueta de Lotes
            etiqueta = false
            url = `/api/catalogo/?opt=inventario&codigo=${this.codigo}&cantidad=${this.cantidad}&usuario=${this.usuario}&referencia=${this.referencia}`
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

      async reporte(orden = 'usuario') {
console.log('reporte', orden)
        let items

        try {
          this.loadingPdf = true
          const resp = await this.$axios({
            method: 'GET',
            url: `${config.backEndUrl}/gusher/ws.prg`,
            params: {
              mod: 'capinv',
              usuario: this.usuario,
              area: this.referencia
            }
          })
          items = await resp.data.data
          datos.fechaMovimientos = resp.data.fecha.substring(6, 8) + "-" + resp.data.fecha.substring(4, 6) + "-" + resp.data.fecha.substring(0, 4)
        } catch (error) {
          console.log('error', error)
          this.loadingPdf = false
          this.$refs.snackBar.text = "Error detectado " + error ; this.$refs.snackBar.color = "orange darken-4" ; this.$refs.snackBar.snackBar = true
          return
        }

        // Inicio del reporte, definición del diseño
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
          title: "Registro de Inventario - Usuario: " + this.usuario
        })
        doc.page = 0
        doc.pages = 1

        if (orden == 'area') {
          // Si es por orden de área, sorteo el arreglo
          items.sort((a, b) => {
            const areaA = a.mrefe.toUpperCase()
            const areaB = b.mrefe.toUpperCase()
            if (areaA < areaB) {
              return -1
            }
            if (areaA > areaB) {
              return 1
            }
            return 0
          })
        }

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
          doc.text(items[index].mpart, col += 5, row)
          doc.text(items[index].mdesc, col += 18, row)
          doc.text(items[index].mcantidad.toLocaleString(), col += 80, row, 'right')
          doc.text(items[index].mrefe, col += 11, row)
          col = 10

        } // for items

        doc.setDrawColor(31, 78, 121)
        doc.line(10, row+=3, 200, row)

        // header y footer final (cuando aplica)
        if ( (doc.page+1) == doc.pages ) {
          this.docHeaderFooter(doc)
        }

        doc.output('datauristring')
        //  			doc.output('datauri'); //dataurlnewwindow');
        doc.save(`${this.usuario}.pdf`)

        this.loadingPdf = false

      }, // reporte()

      // Generar el encabezado y el pié de pag. del PDF
      docHeaderFooter(doc) {
        // Header
        let row = 15
        let imagen = new Image()
        imagen.src = "logo.png"

//        doc.addImage(imagen, 'PNG', 10, 10, 16, 16)
//        doc.addImage(this.images.linea, 'JPEG', 10, 28, 190, 0)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(12)
        doc.text(`Reporte de Inventario / Fecha ${datos.fechaMovimientos} / ${this.usuario}`, 55, row)
        doc.setTextColor('#000')
        doc.setFont('helvetica', 'normal') ; doc.setFontSize(8)
        doc.setFontSize(10)
        //doc.setLineWidth(0.5)

        doc.setFillColor(31, 78, 121)
        doc.rect(10, row+12, 190, 6, 'F')
        doc.setTextColor('#FFF')
        doc.text('    #    Código        Descripción                                                      Cantidad     Referencia', 10, row += 16)
        doc.setTextColor('#000')

        // Footer
        doc.setFont('helvetica', 'italic') ; doc.setFontSize(7)
        doc.text(`Pag. ${doc.page}-${doc.pages}`, 10, 288)
        doc.text(new Date().toLocaleDateString('fr-FR'), 187, 288)
        doc.setFont('helvetica', 'normal') ; doc.setFontSize(8)

      }, // reporte()

      abreDialogoFull() {
        setTimeout(() => {
          const refcoderef = document.getElementById('coderef')
          refcoderef.focus()
        }, 500);
        this.dlgFull = true
      }, //abreDialogoFull

      async buscarProducto() {
        this.producto.loading = true
        console.log(this.productoa)
        this.limpiaProudcto()
        try {
          const resp = await this.$axios({
            method: 'GET',
            url: `${config.backEndUrl}/gusher/ws.prg`,
            params: {
              mod: 'consulta-inventario',
              id: this.coderef
            }
          })
          //this.producto.loading = false
          if (resp.data.response == 200) {
            this.producto =  {
              mCodigo: resp.data.data.mCodigo,
              mBarCode: resp.data.data.mBarCode,
              etiqueta: resp.data.data.etiqueta,
              mDesc: resp.data.data.mDesc,
              mExiste: resp.data.data.mExiste,
            }
          } else {
            this.limpiaProudcto()
          }
        } catch (error) {
          console.log('error', error)
        } finally {
          this.coderef = ''
          //this.producto.loading = false
        }
      }, // buscarProducto

      limpiaProudcto() {
        this.producto = {
          mCodigo: '(INEXISTENTE)',
          mBarCode: '',
          etiqueta: '',
          mDesc: '',
          mExiste: 0,
        }
      },

      dialogClose() {
        this.dlgFull = false
        const idCodigo = document.getElementById('codigo')
        setTimeout(() => {
          idCodigo.focus()
        }, 100);
      },

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
