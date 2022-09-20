<template>
  <v-data-table
    :headers="catalogo.headers"
    :items="catalogo.items"
    class="my-2 elevation-10 row-pointer"
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
            label="Buscar por descripción..."
            append-icon="mdi-magnify"
            filled
            dense
            clearable
            @keyup.enter.prevent="onEnter"
            @click:append="onEnter"
            :loading="catalogo.loading"
            :disabled="catalogo.loading"
            ref="refBuscar"
          />
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="4">
          <v-text-field
            v-model="catalogo.search"
            label="Filtrar..."
            filled
            dense
            clearable
            v-show="catalogo.items.length > 0"
          />
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="1">
          <v-btn text @click="$emit('fromChildRowClick', {})">X</v-btn>
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

  mounted() {
    try {
      this.$refs.refBuscar.$el.getElementsByTagName('input')[0].focus()
    } catch (error) {
      console.log("Error", error)
    }
  },

  methods: {
    onEnter() {
      if (this.search) {
        this.catalogo.loading = true
        this.catalogo.items = []
        this.$axios({
          method: 'get',
          url: `/api/consulta-catalogo/${this.search}`,
          params: {
            busqueda: 'contiene'
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
      this.$emit('fromChildRowClick', item)
    },
  },


}
</script>
<style lang="css" scoped>
.row-pointer >>> tbody tr :hover {
  cursor: pointer;
}
</style>
