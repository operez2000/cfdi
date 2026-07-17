<template>
  <div>
    <iframe v-if="pdf" :src="pdfSource" class="full-height-iframe" title="Factura..."></iframe>
  </div>
</template>

<script>
export default {
  props: {
    pdf: {
      type: String,
      required: true
    }
  },
  computed: {
    pdfSource() {
      return `data:application/pdf;base64,${this.pdf}`;
    }
  }
}
</script>

<style scoped>
 .full-height-iframe {
    width: 100%;
    height: 92vh;
    border: none; /* Remove border if any */
    margin: 0px;
    padding: 0%;
  }
</style>
