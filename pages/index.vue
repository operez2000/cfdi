<template>
  <v-layout
    column
    justify-center
    align-center
  >
    <v-flex
      xs12
      sm8
      md6
    >
      <div class="text-center my-10">
        <vuetify-logo />
      </div>
      <v-card>
        <v-card-title class="headline flex justify-center">
          Farmacias Gusher
        </v-card-title>
        <v-card-text class="text-center">
          Punto de Venta
        </v-card-text>
        <hr class="my-3">
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import Logo from '~/components/Logo.vue'
import VuetifyLogo from '~/components/VuetifyLogo.vue'

export default {
  components: {
    Logo,
    VuetifyLogo
  }
}
</script>
