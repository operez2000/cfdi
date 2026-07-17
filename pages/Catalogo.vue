<template>
  <v-data-table
    :headers="catalogo.headers"
    :items="catalogo.items"
    class="ma-y elevation-10 row-pointer"
    :loading="catalogo.loading"
    :search="catalogo.search"
    dense
    @click:row="rowClick"
  >
    <template #top>
      <v-row class="mx-2">
        <v-col cols="4">
          <v-text-field
            v-model="search"
            label="Buscar..."
            append-icon="mdi-magnify"
            filled
            dense
            @keyup.enter.prevent="onEnter"
            @click:append="onEnter"
            :disabled="catalogo.loading"
          />
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="4">
          <v-text-field
            v-model="catalogo.search"
            label="Filtrar..."
            filled
            dense
            v-show="catalogo.items.length > 0"
          />
        </v-col>
      </v-row>
    </template>
  </v-data-table>

</template>

<script>
import config from '../config.json'
export default {
  data () {
    return {
      search: '',
      catalogo: {
        headers: [
          { text: 'Código', align: 'start', value: 'mpart', },
          { text: 'Descripción', value: 'mdesc' },
          { text: 'Cód. de Barras', value: 'mbarcode' },
          { text: 'Precio', value: 'mpre1' },
          { text: 'Exist', value: 'mexiste' },
          { text: '# Dep', value: 'mdepto' },
          { text: 'Departamento', value: 'depto' },
          /*
          { text: '# Cat', value: 'mcate' },
          { text: 'Categoría', value: 'categ' },
          { text: '# Lin', value: 'mlinea' },
          { text: 'Línea', value: 'linea' },
          */
          { text: 'Fórmula', value: 'formula' },
        ],
        items: [],
        loading: false,
        search: '',
      }
    }
  }, // data()

  methods: {
    onEnter() {
      if (this.search) {
        this.catalogo.loading = true
        this.catalogo.items = []
        this.$axios({
          method: 'get',
          url: `${config.backEndUrl}/gusher/ws.prg`,
          params: {
            mod: 'consulta-catalogo',
            busqueda: 'contiene',
            descripcion: this.search
          }
        }).then(resp => {
          this.catalogo.items = resp.data.data
        }).catch(error => {
          alert(error)
          console.log("error", error)
        }).finally(() => {
          this.catalogo.loading = false
        })
      }
    }, // onEnter()

    rowClick(item) {
      console.log("item", item)
    },
  },


}
</script>
<style lang="css" scoped>
.row-pointer >>> tbody tr :hover {
  cursor: pointer;
}
</style>
