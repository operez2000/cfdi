<template>
  <v-app id="lectura">
    <v-container
      class="fill-height"
      fluid
    >
      <v-row
        align="center"
        justify="center"
      >
        <v-col
          cols="12"
          sm="8"
          md="4"
        >
          <v-card class="elevation-12">
            <v-toolbar
              color="primary"
              dark
              flat
              dense
            >
              <v-toolbar-title>Lectura de Inventario</v-toolbar-title>
              <div class="flex-grow-1"></div>
            </v-toolbar>
            <v-card-text>
              <v-form ref="form" v-model="valid" @keyup.enter.native="enter">
                <v-text-field
                  label="Usuario"
                  name="usuario"
                  v-model="usuario"
                  prepend-icon="mdi-account"
                  type="text"
                  :rules="[rules.required, rules.usuario.min, rules.usuario.max]"
                  counter
                  autofocus
                ></v-text-field>
                <v-text-field
                  v-model="cantidad"
                  label="Cantidad"
                  name="cantidad"
                  prepend-icon="mdi-numeric-1"
                  type="number"
                  :rules="[rules.required, rules.cantidad.cant]"
                ></v-text-field>
                <v-text-field
                  label="Codigo"
                  name="codigo"
                  v-model="codigo"
                  prepend-icon="mdi-barcode"
                  type="text"
                  ref="codigo"
                  :rules="[rules.required, rules.codigo.min, rules.codigo.max]"
                ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <div class="flex-grow-1"></div>
              <v-btn color="primary" :disabled="!valid" @click="grabar">Grabar</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
  export default {
    props: {
      source: String,
    },
    data: () => ({
      drawer: null,
      valid: true,
      usuario: '',
      cantidad: 1,
      codigo: '',
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
          min: v => v.length >= 2 || 'Mínimo 2 caractéres',
          max: v => v.length <= 16 || 'Máximo 16 caractéres',
        }
      },
      origin: '',
	  hostname: '',
    }),  // data()

    mounted() {
      this.origin = window.location.origin
	    this.hostname = window.location.hostname
    },

    methods: {
      grabar () {
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
          this.$nextTick(() => {
            this.$refs.codigo.$el.getElementsByTagName('input')[0].focus()
          })
        })
      }, // grabar()

      enter (t) {
        if (this.valid) {
          this.grabar()
        } else {
          console.log('sin datos')
        }
      } // enter

    }, // methods
  }
</script>
<style>
  .mayusculas {
    text-transform: uppercase
  }
</style>
