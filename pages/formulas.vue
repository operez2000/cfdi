<template>
  <v-container>
    <v-text-field
      v-model="filter"
      append-icon="mdi-magnify"
      label="Buscar"
      single-line
      hide-details
      class="mb-4"
    ></v-text-field>
    <v-data-table :headers="headers" :items="items" :search="filter" class="elevation-1" :loading="loading.table">
      <template v-slot:[`item.formula`]="{ item }">
        <v-text-field v-model="item.formula" hide-details filled @keyup.enter="saveFormula(item)" style="width: 28rem;" />
      </template>
    </v-data-table>
    
    <!-- Diálogo para alertas -->
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
    <!-- Fin de diálogo para alertas -->

  </v-container>
  
</template>

<script>
import config from "../config.json"
export default {
  data() {
    return {
      headers: [
        { text: 'Código', value: 'codigo' },
        { text: 'Descripción', value: 'descripcion' },
        { text: 'Fórmula', value: 'formula' },
        { text: 'Departamento', value: 'departamento' },
        { text: 'Categoría', value: 'categoria' },
        { text: 'Línea', value: 'linea' },
      ],
      items: [
        {
          codigo: '001',
          descripcion: 'Producto 1',
          departamento: 'Ventas',
          categoria: 'A',
          linea: 'L1',
          formula: 'x + y'
        }
      ],
      alert: {
        msg: '',
        type: '',
        active: false,
      },
      loading: {
        save: false,
        table: false
      },
      filter: ''
    }
  },
  mounted() {
    this.items = []
    this.getCatalogo(1, 3000)
    // this.getCatalogo(3001, 6000)
    // this.getCatalogo(6001, 9000)
    // this.getCatalogo(9001, 12000)
  },
  methods: {
    async saveFormula(item) {
      // Handle formula save logic here
      console.log('Formula saved:', item)
      this.loading.table = true
      this.alert.msg = ''
      try {
        const resp = await this.$axios({
          method: 'POST',
          url: `${config.backEndUrl}/gusher/ws.prg?mod=cat-formula`,
          data: item
        })
        if (resp.data.response !== 200) {
          console.error('No se logró obtener la información del catálogo', resp.data)
          this.alert.msg = resp.data.msg
        }
      } catch (error) {
        console.error(error)
        this.alert.msg = error.message
      } finally {
        this.loading.table = false
        this.alert.active = (this.alert.msg !== '')
      }      
    }, // saveFormula()
    getCatalogo(desde, hasta) {
      this.loading.table = true      
      this.alert.msg = ""
      this.$axios({
        method: 'get',
        url: `${config.backEndUrl}/gusher/ws.prg?mod=lee-catalogo&desde=${desde}&hasta=${hasta}`
      })
        .then(resp => {
          if (resp.data.response === 200) {
            this.items = this.items.concat(resp.data.data)
            this.items.sort((a, b) => {
              return a.descripcion.localeCompare(b.descripcion);
            });
          } else {
            console.error('No se logró obtener la información del catálogo', resp.data)
            this.alert.msg = resp.data.msg
          }
        })
        .catch(error => {
          console.error(error)
          this.alert.msg = error.message
        })
        .finally(() => {
          this.alert.active = (this.alert.msg !== "")
          this.loading.table = false
        })
    }, // getCatalogo()
  }
}
</script>
