<template>
  <v-app dark>

    <v-navigation-drawer
      v-model="drawer"
      :mini-variant="miniVariant"
      :clipped="clipped"
      fixed
      app
    >
      <!-- <v-list>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          router
          exact
          dense
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
      </v-list> -->

      <v-list class="my-0 py-0">
        <v-list-item to="/">
          <v-list-item-action>
             <v-icon>mdi-home-outline</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="'Principal'" />
          </v-list-item-content>
        </v-list-item>
        <v-list-item to="/lotes">
          <v-list-item-action>
             <v-icon>mdi-label-multiple-outline</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="'Consulta de Lotes'" />
          </v-list-item-content>
        </v-list-item>
        <v-list-item to="/inventario-lotes">
          <v-list-item-action>
             <v-icon>mdi-page-next-outline</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="'Inventario por Lotes'" />
          </v-list-item-content>
        </v-list-item>
        <v-list-group
          dense
          prepend-icon="mdi-receipt-outline"
        >
          <template v-slot:activator>
            <v-list-item-title>Facturación</v-list-item-title>
          </template>
          <!--
          <v-list-item
            class="pl-10"
            dense
            link
            to="/facturas"
          >
            <v-list-item-title v-text="'Facturas'"></v-list-item-title>
          </v-list-item> -->
          <v-list-item
            class="pl-10"
            dense
            link
            to="/refacturacion"
          >
            <v-list-item-title v-text="'Refacturación'"></v-list-item-title>
          </v-list-item>
          <!-- <v-list-item
            class="pl-10"
            dense
            link
            to="/cancelacion"
          >
            <v-list-item-title v-text="'Cancelación'"></v-list-item-title>
          </v-list-item> -->
        </v-list-group>
        <v-list-group
          dense
          prepend-icon="mdi-currency-usd"
        >
          <template v-slot:activator>
            <v-list-item-title>Compras</v-list-item-title>
          </template>
          <v-list-item
            class="pl-10"
            dense
            link
            to="/consulta-compras"
          >
            <v-list-item-title v-text="'Consulta'"></v-list-item-title>
          </v-list-item>
          <!-- <v-list-item
            class="pl-10"
            dense
            link
            to="/refacturacion"
          >
            <v-list-item-title v-text="'Refacturación'"></v-list-item-title>
          </v-list-item>
          <v-list-item
            class="pl-10"
            dense
            link
            to="/cancelacion"
          >
            <v-list-item-title v-text="'Cancelación'"></v-list-item-title>
          </v-list-item> -->
        </v-list-group>
      </v-list>

    </v-navigation-drawer>
    <v-app-bar
      :clipped-left="clipped"
      fixed
      app
      dense
      color="primary"
      height="36"
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-btn
        icon
        @click.stop="miniVariant = !miniVariant"
      >
        <v-icon>mdi-{{ `chevron-${miniVariant ? 'right' : 'left'}` }}</v-icon>
      </v-btn>
      <!-- <v-btn
        icon
        @click.stop="clipped = !clipped"
      >
      </v-btn> -->
      <v-toolbar-title v-text="`Gusher / ${$route.name.toUpperCase()}`" />
      <v-spacer />
      <!-- <v-btn
        icon
        @click.stop="rightDrawer = !rightDrawer"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn> -->
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <nuxt />
      </v-container>
    </v-main>
    <!--
    <v-navigation-drawer
      v-model="rightDrawer"
      :right="right"
      temporary
      fixed
    >
      <v-list>
        <v-list-item @click.native="right = !right">
          <v-list-item-action>
            <v-icon light>
              mdi-repeat
            </v-icon>
          </v-list-item-action>
          <v-list-item-title>Cambiar el menú (click)</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    -->
    <v-footer
      :fixed="fixed"
      app
      class="text-center"
    >
      <v-spacer></v-spacer>
      <span>&copy; 2021-{{ year }}</span>
      <v-spacer></v-spacer>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  data () {
    return {
      clipped: false,
      drawer: false,
      fixed: false,
      items: [
        {
          icon: 'mdi-home-outline',
          title: 'Inicio',
          to: '/'
        },
        {
          icon: 'mdi-label-multiple-outline',
          title: 'Consulta de Lotes',
          to: '/lotes'
        },
        {
          icon: 'mdi-page-next-outline',
          title: 'Inventario por Lotes',
          to: '/inventario-lotes'
        },
      ],
      miniVariant: false,
      right: true,
      rightDrawer: false,
      year: new Date().getFullYear()
    } // return data()
  }, // data()

  mounted() {
    // Locales
    this.$vuetify.lang.locales.en.close = 'Cerrar'
    this.$vuetify.lang.locales.en.dataTable.itemsPerPageText = 'Reg. por Pág.'
    this.$vuetify.lang.locales.en.dataTable.sortBy = 'Orden por'
    this.$vuetify.lang.locales.en.dataFooter.itemsPerPageText = 'Reg por pág.'
    this.$vuetify.lang.locales.en.dataFooter.itemsPerPageAll = 'Todos'
    this.$vuetify.lang.locales.en.dataFooter.nextPage = 'Sig página'
    this.$vuetify.lang.locales.en.dataFooter.prevPage = 'Pág anterior'
    this.$vuetify.lang.locales.en.dataFooter.firstPage = '1er Página'
    this.$vuetify.lang.locales.en.dataFooter.lastPage = 'Última página'
    this.$vuetify.lang.locales.en.dataFooter.pageText = '{0}-{1} de {2}'
    this.$vuetify.lang.locales.en.dataIterator.noResultsText = 'No se encontraron registros'
    this.$vuetify.lang.locales.en.dataIterator.loadingText = 'Leyendo...'
    this.$vuetify.lang.locales.en.noDataText = 'No hay información'
  }, // mounted()

}
</script>
