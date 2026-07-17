<template>
  <v-snackbar v-model="snackBar" timeout="5000" :color="color">
    <div class="d-flex justify-space-between">
      <span class="white--text align-self-center">{{ text }}</span>
      <v-btn icon small @click="snackBar = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
  </v-snackbar>
</template>
<script>
export default {
  data() {
    return {
      snackBar: false,
      text: '',
      color: 'info',
    }
  }
}
</script>
