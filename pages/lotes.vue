<template>
  <v-layout
    column
    justify-center
    align-center
  >
    <v-flex>
      <v-toolbar dark color="primary" dense>
        <v-toolbar-title>Consulta de Etiquetas de Lotes</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn text icon v-on="on" @click="dialogFocus()">
                <v-icon>mdi-file</v-icon>
              </v-btn>
            </template>
            <span>Generar archivo para importación</span>
          </v-tooltip>
        </v-toolbar-items>
      </v-toolbar>

      <v-card :width="1200">
        <v-card-title class="headline">
          <v-spacer></v-spacer>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Buscar"
            single-line
            hide-details
          ></v-text-field>
        </v-card-title>
        <v-card-text>
          <!-- <hr class="my-1">-->
          <v-data-table
            :headers="tblLotes.headers"
            :items="tblLotes.lotes"
            :items-per-page="15"
            :loading="tblLotes.loading"
            :search="search"
            locale="es-MX"
            loading-text="Cargando información..."
            dense
          >
            <template v-slot:no-data>
              <v-alert
                :value="true"
                color="info"
              >
                No hay Lotes para mostrar
              </v-alert>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-flex>
    <!-- dialogo para capturar el rango -->
    <v-dialog v-model="openDialogRange" persistent max-width="380px">
      <!--
      <template v-slot:activator="{ on }">
        <v-btn color="primary" dark v-on="on">Open Dialog</v-btn>
      </template>
      -->
      <v-card>
        <v-card-title>
          <span class="headline">Generar archivo de Etiquetas</span>
        </v-card-title>
        <v-card-text>
          <v-container grid-list-md>
            <v-layout wrap>
              <v-form v-model="frmValidate" ref="frm">
                <v-flex xs6 sm5 md4>
                  <v-text-field
                    v-model="etiq1"
                    label="Inicial"
                    hint="# Etiqueta"
                    ref="inicial"
                    :rules="[etiq.rules.required, etiq.rules.min, etiq.rules.numeros]"
                    @focus="$event.target.select()"
                  ></v-text-field>
                </v-flex>
                <v-flex xs6 sm5 md4>
                  <v-text-field
                    v-model="etiq2"
                    label="Final"
                    hint="# Etiqueta"
                    :rules="[etiq.rules.required, etiq.rules.min, etiq.rules.numeros]"
                  ></v-text-field>
                </v-flex>
            </v-form>
            </v-layout>
          </v-container>
          <small>Sólo valor numérico sin la letra "L"</small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="openDialogRange = false">Cerrar</v-btn>
          <v-btn color="blue darken-1" text :disabled="!frmValidate" @click="validaForma()">Aceptar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>  <!-- dialogo para captura de rango -->
    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.snackbar"
      :color="snackbar.color"
      :multi-line="true"
      :timeout="snackbar.timeout"
      :vertical="false"
      :top="snackbar.y === 'top'"
      :bottom="snackbar.y === 'bottom'"
    >
      {{ snackbar.text }}
      <v-btn
        class="ml-10"
        dark
        color="blue"
        @click = "snackbar.snackbar = false"
      >
        Cerrar
      </v-btn>
    </v-snackbar>
    <!-- Dialogo para procso... -->
    <v-dialog
      v-model="dialog"
      hide-overlay
      persistent
      width="300"
    >
      <v-card color="light-blue">
        <v-card-text>
          Un momento por favor...
          <v-progress-linear
            indeterminate
            color="white"
            class="mb-0"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>

export default {
  components: {
  },

  data: () => ({
    tblLotes: {
      headers: [
        {
          text: 'Etiqueta',
          value: 'etiqueta'
        },
        {
          text: 'Código',
          value: 'codigo'
        },
        {
          text: 'Lote',
          value: 'lote'
        },
        {
          text: 'Caducidad',
          value: 'caducidad'
        },
        {
          text: 'Sucursal',
          value: 'sucursal'
        }
      ],
      lotes: [],
      loading: true
    },
    search: '',
    openDialogRange: false,
    etiq1: '000001',
    etiq2: '999999',
    etiq: {
      rules: {
        required: value => !!value || 'Requerido',
        min: v => v.length >= 6 || '6 Digitos',
        numeros: v => /^\d*$/.test(v) || 'Sólo Números',
      }
    },
    frmValidate: true,
    snackbar: {
      snackbar: false,
      text: 'Mensaje inicial',
      color: 'light-blue',
      y: 'top',
      timeout: 6000
    },
    dialog: false
  }),

  mounted () {
    this.buscaLotes()
    window.setInterval(() => {
      this.buscaLotes()
    }, 60000)
  },

  methods: {
    buscaLotes () {
      let fecha = new Date()
      this.tblLotes.loading = true
      this.$axios.$get(
        'http://code-ware.com/proyectos/gusher/server/lotes.php?opcion=consulta'
      ).then(response => {
        this.tblLotes.lotes = response.data
      }).catch(response => {
        console.log('Error', response)
      }).finally(() => {
        this.tblLotes.loading = false
      })
    }, // buscaLotes()

    validaForma () {
      this.frmValidate = this.$refs.frm.validate()
      if (this.frmValidate) {
        if (this.etiq1 <= this.etiq2) {
          // cierro el diálogo y le pido al server local (Node) que procese el archivo texto
          this.openDialogRange = false
          localStorage.ultimoGuardado = this.etiq2
          this.procesaLotes()
        } else {
          this.snackbar.text = "La etiqueta final no puede ser menor que la inicial"
          this.snackbar.snackbar = true
        }
      }

    }, // validaForma

    procesaLotes () {
//      let url = 'http://127.0.0.1:3000/rango?&etiq1=' + this.etiq1 + '&etiq2=' + this.etiq2
//      let url = `http://code-ware.com/proyectos/gusher/server/lotes.php?opcion=rango&etiq1=${this.etiq1}&etiq2=${this.etiq2}`
      this.dialog = true
      this.$axios.$get(
        `/api/rango/?etiq1=${this.etiq1}&etiq2=${this.etiq2}`
      ).then(response => {
        this.snackbar.text = response.msg
      }).catch(response => {
        this.snackbar.text = response
      }).finally(() => {
        this.dialog = false
        this.snackbar.snackbar = true
      } )
    }, // ProcesaLotes

    dialogFocus () {
      this.dialog = true
      this.$axios.$get(
        'http://code-ware.com/proyectos/gusher/server/lotes.php?opcion=ultima'
      ).then(response => {
        if (response.result == 200) {
          this.etiq1 = this.etiq2 = response.data.registro
        }
      }).then(response => {
        console.log('Err', response)
      }).finally( () => {
        if (localStorage.ultimoGuardado) {
          if (localStorage.ultimoGuardado < this.etiq2) {
            this.etiq1 = ( Number(localStorage.ultimoGuardado) + 1 ).toString().padStart('0', 6)
          }
        }
        this.openDialogRange = true // forma para capturar rango de lotes
        this.dialog = false // loading
        this.$nextTick(() => {
            this.$refs.inicial.$el.getElementsByTagName('input')[0].focus()
          }
        )
      })
    },

  },

  watch: {
    etiq1: function(val) {
      val = val.padStart(6, 0)
      this.etiq1 = val.substr(-6)
    },

    etiq2: function(val) {
      val = val.padStart(6, 0)
      this.etiq2 = val.substr(-6)
    }

  }, // watch

}
</script>
<style type="text/css" media="print">
  @page {
    size: auto;   /* auto is the initial value */
    margin: 0;  /* this affects the margin in the printer settings */
  }
</style>
