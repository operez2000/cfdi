<template>
  <!-- <v-app id="lectura"> -->
    <v-container
      class="fill-height"
      fluid
    >

      <v-expand-transition>
        <div class="flex align-center" v-if="consultaCatalogo">
          <catalogo @fromChildRowClick="getChildData" />
        </div>
      </v-expand-transition>

      <v-row
        align="center"
        justify="center"
      >
        <v-col
          cols="12"
        >
          <div class="d-block pa-2 red darken-4 white--text" v-if="showHelper">
            <div class="d-flex justify-space-between mx-2">
              <span class="caption">{{ errorMsg }}</span>
              <span @click="showHelper = false" style="cursor: pointer;">X</span>
            </div>
          </div>
          <v-data-table
            v-show="!consultaCatalogo"
            class="elevation-8 pa-2"
            :headers="[
              { text: '# Prov', align: 'start', value: 'mprov' },
              { text: 'Nombre del Proveedor', value: 'mprov2' },
              { text: 'Costo', value: 'mcosto', align: 'end' },
              { text: 'Referencia', value: 'mrefe' },
              { text: 'Fecha', value: 'mfecha' },
              { text: 'Cantidad', value: 'mcantidad' },
              //{ text: 'Fecha 2', value: 'dtos_mfecha' },
            ]"
            :sort-by="['dtos_mfecha']"
            :sort-desc="[true]"
            :items="items"
            :loading="loaders.tabla"
            dense
          >
            <template #top>
              <v-row>
                <v-col cols="5" sm="5" md="4">
                  <v-text-field
                    v-model="codigo"
                    class="mx-4"
                    label="Código"
                    append-outer-icon="mdi-magnify"
                    color="primary"
                    clearable
                    :loading="loaders.codigo"
                    @click:append-outer="consultaCatalogo = true"
                    @keyup.enter="buscarCodigo"
                    style="max-width: 200px"
                    ref="refCodigo"
                  />
                </v-col>
                <v-col class="mt-6" cols="7" sm="7" md="8">
                  <span :class="classDescripcion">
                    {{ descripcion }}
                  </span>
                </v-col>
              </v-row>
            </template>
          </v-data-table>

        </v-col>
      </v-row>
    </v-container>
  <!-- </v-app> -->
</template>

<script>
  import Catalogo from '@/components/Catalogo.vue'
  import config from '../config.json'

  export default {
    components: {
      Catalogo
    },
    props: {
      source: String,
    },
    data: () => ({
      codigo: '',
      descripcion: '',
      classDescripcion: 'white',
      loaders: {
        codigo: false,
        tabla: false
      },
      showHelper: false,
      errorMsg: '',
      items: [],
      consultaCatalogo: false
    }),  // data()

    mounted() {
      try {
        this.$refs.refCodigo.$el.getElementsByTagName('input')[0].focus()
      } catch (error) {
        console.log("Error", error)
      }
    },

    methods: {
      buscarCodigo() {
        let ok = false
        if (this.codigo) {
          this.loaders.codigo = true
          this.descripcion = ''
          this.errorMsg = ''
          this.items = []
          this.$axios({
            url: `${config.backEndUrl}/gusher/ws.prg/?mod=catalogo&id=${this.codigo}&opt=`
          }).then(resp => {
            if (resp.data.response == 403 || resp.data.response == 404) {
              this.errorMsg = resp.data.msg
              this.showHelper = true
            } else {
              this.classDescripcion = (resp.data.response == 500) ? 'deep-orange--text text--accent-2' : 'default'
              this.descripcion = (resp.data.response == 500) ? '- Registro inexistente -' : resp.data.data.MDESC
              ok = (resp.data.response == 200)
            }
          }).catch(err => {
            this.errorMsg = err
            this.showHelper = true
          }).finally(() => {
            this.loaders.codigo = false
            if (ok) { // No hay error, busco las compras
              this.buscaCompras()
            }
          }) // axios
        }
      }, // buscarCodigo()

      buscaCompras() {
        this.loaders.tabla = true
        this.errorMsg = ''
        this.items = []
        this.$axios({
          url: `${config.backEndUrl}/gusher/ws.prg/?mod=consulta-compras&mpart=${this.codigo}`
        }).then(resp => {
          if (resp.data.response == 403 || resp.data.response == 404) {
            this.errorMsg = resp.data.msg
            this.showHelper = true
          } else {
            this.items = resp.data.data
          }
        }).catch(err => {
          this.errorMsg = err
          this.showHelper = true
        }).finally(() => {
          this.loaders.tabla = false
        }) // axios

      }, // buscaCompras()

      getChildData(item) {
        this.codigo = item.mpart
        this.consultaCatalogo = false
        if (this.codigo) {
          this.buscarCodigo()
        }
      },

    }, // methods
  }
</script>
<style>
  .mayusculas {
    text-transform: uppercase
  }
</style>
