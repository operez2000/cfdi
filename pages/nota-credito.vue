<template>
  <div>
    <div class="d-flex justify-space-between">
      <span class="subtitle-1">Notas de Crédito - Serie: {{ serie }}</span>
    </div>

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

    <v-card
      class="mt-2"
      outlined
    >
      <v-card-text>
        <v-tabs
          class="mb-0"
          v-model="tab"
          color="primary"
          dark
          @change="tabClick"
        >
          <v-tab href="#cliente">Cliente</v-tab>
          <v-tab href="#factura">Detalle de la Venta</v-tab>
        </v-tabs>
        <v-divider />
        <v-tabs-items v-model="tab" class="mb-2">
          <v-tab-item value="cliente">
            <clientes-comp @facturasClientesComp="getCustomerData" />
          </v-tab-item>
          <v-tab-item value="factura">
            <v-data-table
              :headers="tablaFactura.headers"
              :items="tablaFactura.items"
              class="mt-3"
              pagination.sync="tabla.pagination"
              :footer-props="{
                showFirstLastPage: true
              }"
              item-key="NoIdentificacion"
              :loading="loaders.getVenta"
              loading-text="Leyendo..."
              no-data-text="Sin registros"
              dense
            >
              <template #top>
                <v-row class="mt-2">
                  <v-col md="2">
                    <v-text-field
                      v-model="folio"
                      label="# Nota"
                      type="number"
                      dense
                      :rules = "[
                        v => !!v || 'Obligatorio'
                      ]"
                      ref="refFolio"
                      append-outer-icon="mdi-magnify"
                      :loading="loaders.getNota"
                      :disabled="loaders.getNota"
                      @click:append-outer="onClick('BUSCAR_NOTA')"
                      @keyup.enter.prevent="onClick('BUSCAR_NOTA')"
                    />
                  </v-col>
                  <v-col md="1">
                    <v-text-field
                      v-model="venta.caja"
                      type="number"
                      label="Caja"
                      dense
                      :loading="loaders.getVenta"
                      :disabled="loaders.getVenta"
                      :rules = "[
                        v => !!v || 'Obligatorio'
                      ]"
                      ref="refCaja"
                      id="caja"
                    />
                  </v-col>
                  <v-col md="2">
                    <v-text-field
                      v-model="venta.folio"
                      type="number"
                      label="# Recibo"
                      dense
                      append-outer-icon="mdi-magnify"
                      @click:append-outer="onClick('BUSCAR_VENTA')"
                      @keyup.enter.prevent="onClick('BUSCAR_VENTA')"
                      :loading="loaders.getVenta"
                      :disabled="loaders.getVenta"
                      :rules = "[
                        v => !!v || 'Obligatorio'
                      ]"
                    />
                  </v-col>
                  <v-col md="3">
                    <v-select
                      v-model="factura.formaPago"
                      :items="utils.formasDePago"
                      outlined
                      filled
                      label="Forma de Pago"
                      :rules="[
                        v => !!v || 'Dato obligatorio'
                      ]"
                      ref="refFormaPago"
                      dense
                    />
                  </v-col>
                  <v-spacer />
                  <v-col md="auto">
                    <v-btn
                      color="primary"
                      :loading="loaders.generaFactura"
                      :disabled="venta.totalVenta == 0 || cliente.nuevo || !venta.caja || !venta.folio || !serie || !folio || !factura.formaPago"
                      @click="onClick('GENERAR_FACTURA')"
                    >
                      <v-icon class="mr-2">mdi-check </v-icon>
                      Facturar
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col md="3">
                    <v-radio-group
                      v-model="factura.condiciones"
                      class="my-0 py-0"
                      mandatory
                      row
                      dense
                    >
                      <v-radio
                        label="Contado"
                        value="Contado"
                        dense
                      ></v-radio>
                      <v-radio
                        label="Crédito"
                        value="Crédito"
                      ></v-radio>
                    </v-radio-group>
                  </v-col>
                  <v-col md="1">
                    <v-text-field
                      v-model="factura.numCtaPago"
                      label="# Cta pago"
                      dense
                    />
                  </v-col>
                  <v-col md="8">
                    <v-text-field
                      v-model="factura.comentarios"
                      label="Comentarios"
                      dense
                    />
                  </v-col>
                </v-row>
                <v-divider class="my-0" />
              </template>
              <template slot="body.append">
                <tr class="light-green--text">
                  <th colspan="11" class="subtitle-2 text-center">Importe de la Venta: {{ venta.totalVentaFormat }} </th>
                </tr>
              </template>

            </v-data-table>
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>
    </v-card>

  </div>
</template>

<script>
import ClientesComp from '@/components/ClientesComp'
import Utils from '@/assets/utils'
import config from "../config.json"

export default {
  components: {
    ClientesComp
  },
  data() {
    return {
      alert: {
        active: false,
        msg: "prueba",
        type: ""
      },
      emisor: {
        domicilioFiscal: "",
        razonSocial: "FARMACIA GUSHER"
      },
      tab: null,
      serie: "",
      folio: "",
      tablaFactura: {
        headers: [
          { text: 'Cantidad', value: 'Cantidad', sortable: true, align: "center" },
          { text: 'Código', value: 'NoIdentificacion' },
          { text: 'Clave SAT', value: 'ClaveProdServ' },
          { text: 'Descripción', value: 'Descripcion' },
          { text: 'Precio Unit', value: 'ValorUnitario', align: "right" },
          { text: 'Sub-Total', value: 'subTotal', align: "right" },
          { text: 'Descuento', value: 'Descuento', align: 'right' },
          { text: 'Sub-Total', value: 'total', align: 'right' },
          { text: 'Tasa', value: 'porIva', align: 'center' },
          { text: 'Impuesto', value: 'impIva', align: 'right' },
          { text: 'Total', value: 'totalNeto', align: 'right' },
        ],
        items: [],
        detalle: {}
      },
      loaders: {
        tablaFactura: false,
        generaFactura: false,
        getVenta: false,
        getNota: false,
      },
      venta: {
        caja: "",
        folio: "",
        bruto: "",
        descuento: "",
        subtotal: "",
        iva: "",
        total: "",
        totalVenta: "",
        totalVentaFormat: "",
        exento: "",
        tasa0: "",
        gravable: "",
        factorIva: "",
        formaDePago: "",
        comentarios: "",
        numCtaPago: "",
        data: []
      },
      factura: {
        metodoPago: "PUE",
        formaPago: "",
        usoCfdi: "",
        condiciones: "Contado",
        numCtaPago: "",
        comentarios: "",
        importe: 0,
        totalFactura: 0,
        data: {
          Total: 0,
        },
        detalle: {
          Total: 0,
        },
        descuento: 0,
        uuid: "",
        pdfBase64: "",
        xml: "",
      },
      cliente: {
        nuevo: true,
      },
      utils: new Utils(),
    }
  },
  mounted() {
    this.getParametros() // Parametros
  },
  methods: {
    getParametros() {
      this.alert.msg = ""
      this.$axios({
        method: "get",
        url: `${config.backEndUrl}/gusher/ws.prg?mod=parametros`,//"/api/parametros"
      }).then(resp => {
        console.log("parametros", resp.data)
        if (resp.data.response == 200) {
          this.serie = 'NC' + resp.data.data.serie
          this.emisor.domicilioFiscal = resp.data.data.codPos
          this.siguienteFolioNota()
        } else {
          this.alert.msg = `Problemas con el Servidor (${resp.data.response} ${resp.data.msg})`
        }
      }).catch(error => {
        this.alert.msg = error
      }).finally(() => {
        this.alert.active = (this.alert.msg != "")
      })
    }, // getParametros()
    getCustomerData(item) {
      console.log("getCustomerData", item)
      this.cliente = item
      this.cliente.nuevo = false
      this.tab = 'factura'
      setTimeout(() => {
        const idCaja = document.getElementById("caja")
        idCaja.focus()
      }, 500);
    }, // getCustomerData(item)
    async onClick(origen) {
      if (origen == 'BUSCAR_VENTA') {
        // Validación de caja y folio obligatorios
        if (! this.venta.caja || !this.venta.folio) {
          this.alert.msg = "Es necesario indicar la Caja y el Folio de la Venta"
          this.alert.active = true
          return
        }
        this.siguienteFolioNota() // Obtener siguiente folio de Nota de Crédito
        // Validación de Nota timbrada
        try {
          this.venta.caja = this.venta.caja.padStart(2, '0')
          this.venta.bruto = ""
          this.venta.descuento = ""
          this.venta.subtotal = ""
          this.venta.iva = ""
          this.venta.total = ""
          this.venta.totalVenta = 0
          this.venta.totalVentaFormat = ""
          this.venta.exento = ""
          this.venta.tasa0 = ""
          this.venta.gravable = ""
          this.venta.factorIva = ""
          this.venta.formaDePago = ""
          this.venta.comentarios = ""
          this.venta.numCtaPago = ""
          this.venta.data = []

          this.factura.formaPago = null
          this.factura.numCtaPago = ""
          this.factura.comentarios = ""
          this.tablaFactura.items = []

          this.alert.msg = ""
          this.loaders.getVenta = true
          const resp = await this.$axios({
            method: 'get',
            url: `${config.backEndUrl}/gusher/ws.prg?mod=getVenta&caja=${this.venta.caja}&folio=${this.venta.folio}&tipo=nc`
          })
          console.log("onClick BUSCAR_VENTA", resp.data)
          if (resp.data.response == 200) {
            // No hay errores
            this.venta.bruto = resp.data.venta.bruto
            this.venta.descuento = resp.data.venta.descuento
            this.venta.subtotal = resp.data.venta.subtotal
            this.venta.iva = resp.data.venta.iva
            this.venta.total = resp.data.venta.total
            this.venta.totalVenta = parseFloat(this.venta.total.trim().replace(/,/g, ''))
            this.venta.totalVentaFormat = resp.data.venta.totalVentaFormat
            this.venta.exento = resp.data.venta.exento
            this.venta.tasa0 = resp.data.venta.tasa0
            this.venta.gravable = resp.data.venta.gravable
            this.venta.factorIva = resp.data.venta.factorIva
            this.venta.formaDePago = resp.data.venta.formaDePago
            this.venta.comentarios = resp.data.venta.comentarios
            this.venta.numCtaPago = resp.data.venta.numCtaPago
            this.venta.data = resp.data.venta.data
            this.tablaFactura.items = resp.data.venta.data
            this.factura.formaPago = this.utils.formasDePago.find(v => v.substring(0, 2) == resp.data.venta.formaDePago)
            this.factura.numCtaPago = resp.data.venta.numCtaPago
            this.factura.comentarios = resp.data.venta.comentarios
          } else {  // Error
            this.alert.msg = resp.data.msg
          }
        } catch (error) {
          this.alert.msg = error
          console.log('Error...', error)
        } finally {
          this.alert.active = (this.alert.msg != "")
          this.loaders.getVenta = false
        }
        // onClick('BUSCAR_VENTA')
      } else if (origen == 'BUSCAR_NOTA') {
        this.alert.msg = ''
        this.loaders.getNota = true
        try {
          let response = await this.$axios({
            url: `/api/lee-nota-credito/${this.serie}/${this.folio}`,
            method: 'get'
          })
          console.log('response lee-nota-credito', response.data)
        } catch (error) {
          this.alert.msg = error
        } finally {
          this.loaders.getNota = false
          this.alert.active = (this.alert.msg !== '')
        }

        // onClick('BUSCAR_NOTA')
      }
    }, // onClick()
    tabClick(item) {
      if (item === 'factura') {
        setTimeout(() => {
          this.$refs.refCaja.focus()
        },100)
      }
    }, // tabClick(item)
    async siguienteFolioNota() {
      let response = null
      try {
        response = await this.$axios({
          url: `/api/siguiente-folio-nota/${this.serie}`,
          method: 'get'
        })
        if (response.data.response === 200) {
          this.folio = response.data.data
        }
      } catch (error) {
        console.log('error en ultimoFolioNota()', error)
        this.alert.msg = `Problemas con el Servidor: (${error.message}`
      }
    },
  }
}
</script>
<style scoped>
  .v-text-field >>> input {
    font-size: 0.9rem;
  }
  .v-text-field >>> label {
    font-size: 0.9rem;
  }
  .v-text-field >>> button {
    font-size: 0.9rem;
  }
</style>
