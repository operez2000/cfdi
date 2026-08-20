<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-2">
      <span class="subtitle-1 font-weight-bold">Notas de Crédito - Serie: {{ serie }}</span>
      <div>
        <v-btn
          color="secondary"
          class="mr-2"
          small
          outlined
          @click="nuevaNota"
        >
          <v-icon left small>mdi-plus</v-icon>
          Nueva Nota
        </v-btn>
        <v-btn
          ref="refBtnOpenPdf"
          color="primary"
          small
          @click="openPdf"
          v-show="showBtnPdf"
        >
          <v-icon left small>mdi-file-pdf-box</v-icon>
          Ver PDF
        </v-btn>
      </div>
    </div>

    <!-- Diálogo de Alerta / Mensajes -->
    <v-dialog
      v-model="alert.active"
      width="500"
      persistent
    >
      <v-card>
        <v-card-title
          :class="(alert.type == '') ? 'text-h6 mb-4 orange darken-3 white--text' : 'text-h6 mb-4 green darken-3 white--text'"
        >
          <v-icon dark left>{{ (alert.type == "") ? 'mdi-alert' : 'mdi-check-circle' }}</v-icon>
          <span>{{ (alert.type == "") ? 'Atención' : 'Operación Exitosa' }}</span>
        </v-card-title>

        <v-card-text
          :class="(alert.type == '') ? 'subtitle-1 orange--text text--darken-3' : 'subtitle-1 black--text'"
        >
          {{ alert.msg }}
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            @click="alert.active = false; alert.msg = ''; alert.type = ''"
          >
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card outlined>
      <v-card-text>
        <v-tabs
          v-model="tab"
          color="primary"
          dark
          @change="tabClick"
        >
          <v-tab href="#cliente">
            <v-icon left small>mdi-account</v-icon>
            Cliente
          </v-tab>
          <v-tab href="#factura">
            <v-icon left small>mdi-file-document-outline</v-icon>
            Detalle de la Nota de Crédito
          </v-tab>
        </v-tabs>
        <v-divider />

        <v-tabs-items v-model="tab" class="mb-2">
          <!-- TAB 1: CLIENTES -->
          <v-tab-item value="cliente">
            <clientes-comp @facturasClientesComp="getCustomerData" />
          </v-tab-item>

          <!-- TAB 2: DETALLE DE LA NOTA DE CREDITO -->
          <v-tab-item value="factura">
            <!-- Resumen del Cliente Seleccionado -->
            <v-alert
              v-if="!cliente.nuevo"
              dense
              text
              color="blue-grey"
              class="mt-2 mb-1 py-1"
            >
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption">
                  <strong>Cliente:</strong> [{{ cliente.numero }}] {{ cliente.razonSocial1 }} |
                  <strong>RFC:</strong> {{ cliente.rfc }} |
                  <strong>CP:</strong> {{ cliente.codPos }} |
                  <strong>Régimen:</strong> {{ cliente.regFiscal }}
                </span>
                <v-btn x-small text color="primary" @click="tab = 'cliente'">Cambiar Cliente</v-btn>
              </div>
            </v-alert>
            <v-alert
              v-else
              dense
              type="warning"
              outlined
              class="mt-2 mb-1 py-1 text-caption"
            >
              No has seleccionado un cliente. Ve a la pestaña <strong>Cliente</strong> para seleccionarlo.
            </v-alert>

            <!-- Cabecera de la Nota de Crédito -->
            <v-row class="mt-1" dense>
              <v-col cols="12" md="1">
                <v-text-field
                  v-model="folio"
                  label="# Nota"
                  type="number"
                  dense
                  outlined
                  :rules="[v => !!v || 'Obligatorio']"
                  ref="refFolio"
                  append-outer-icon="mdi-magnify"
                  :loading="loaders.getNota"
                  :disabled="loaders.getNota"
                  @click:append-outer="onClick('BUSCAR_NOTA')"
                  @keyup.enter.prevent="onClick('BUSCAR_NOTA')"
                  hint="Enter o lupa para buscar nota existente"
                  persistent-hint
                />
              </v-col>

              <v-col cols="6" md="1">
                <v-text-field
                  v-model="venta.caja"
                  type="number"
                  label="Caja"
                  dense
                  outlined
                  :loading="loaders.getVenta"
                  :disabled="loaders.getVenta"
                  :rules="[
                    v => !!v || 'Obligatorio',
                    v => (Number(v) >= 1 && Number(v) <= 5) || '1-5'
                  ]"
                  @blur="formatCaja"
                  ref="refCaja"
                  id="caja"
                />
              </v-col>

              <v-col cols="6" md="2">
                <v-text-field
                  v-model="venta.folio"
                  type="number"
                  label="# Recibo"
                  dense
                  outlined
                  append-outer-icon="mdi-magnify"
                  @click:append-outer="onClick('BUSCAR_VENTA')"
                  @keyup.enter.prevent="onClick('BUSCAR_VENTA')"
                  :loading="loaders.getVenta"
                  :disabled="loaders.getVenta"
                  :rules="[v => !!v || 'Obligatorio']"
                  hint="Enter o lupa para buscar venta"
                  persistent-hint
                />
              </v-col>

              <v-col cols="6" md="1">
                <v-text-field
                  v-model="venta.fecha"
                  label="Fecha Venta"
                  dense
                  outlined
                  disabled
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-text-field
                  v-model="factura.uuidRel"
                  label="UUID Relacionado (CFDI 4.0)"
                  dense
                  outlined
                  :loading="loaders.getUuid"
                  clearable
                  append-outer-icon="mdi-refresh"
                  @click:append-outer="buscarUuidRelacionado"
                  hint="Factura origen o Global del día"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="2">
                <v-select
                  v-model="factura.formaPago"
                  :items="utils.formasDePago"
                  outlined
                  label="Forma de Pago"
                  :rules="[v => !!v || 'Dato obligatorio']"
                  ref="refFormaPago"
                  dense
                />
              </v-col>

              <v-col cols="12" md="2">
                <v-select
                  v-model="factura.usoCfdi"
                  :items="usosCfdiFiltrados"
                  outlined
                  label="Uso del CFDI"
                  :rules="[v => !!v || 'Dato obligatorio']"
                  ref="refUsoCfdi"
                  dense
                />
              </v-col>
            </v-row>

            <v-row class="mt-0" dense>
              <v-col cols="12" md="2">
                <v-radio-group
                  v-model="factura.condiciones"
                  class="my-0 py-0"
                  mandatory
                  row
                  dense
                >
                  <v-radio label="Contado" value="Contado" dense></v-radio>
                  <v-radio label="Crédito" value="Crédito" dense></v-radio>
                </v-radio-group>
              </v-col>

              <v-col cols="12" md="2">
                <v-text-field
                  v-model="factura.numCtaPago"
                  label="# Cta pago (opcional)"
                  dense
                  outlined
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="factura.comentarios"
                  label="Observaciones / Comentarios"
                  dense
                  outlined
                />
              </v-col>

              <v-col cols="12" md="2" class="text-right">
                <v-btn
                  color="primary"
                  block
                  :loading="loaders.generaFactura"
                  :disabled="selectedItems.length == 0 || cliente.nuevo || !venta.caja || !venta.folio || !serie || !folio || !factura.formaPago || !factura.usoCfdi"
                  @click="onClick('GENERAR_FACTURA')"
                >
                  <v-icon left>mdi-check-decagram</v-icon>
                  Facturar Nota
                </v-btn>
              </v-col>
            </v-row>

            <v-divider class="my-2" />

            <!-- Tabla de Partidas con Selección Múltiple -->
            <v-data-table
              v-model="selectedItems"
              show-select
              :headers="tablaFactura.headers"
              :items="tablaFactura.items"
              class="elevation-1 mt-1"
              :footer-props="{
                showFirstLastPage: true,
                itemsPerPageOptions: [10, 20, 50, -1]
              }"
              item-key="NoIdentificacion"
              :loading="loaders.getVenta"
              loading-text="Leyendo partidas de la venta..."
              no-data-text="No hay partidas cargadas. Busca una venta con Caja y Recibo."
              dense
            >
              <template #[`item.ValorUnitario`]="{ item }">
                {{ formatCurrency(item.ValorUnitario) }}
              </template>
              <template #[`item.subTotal`]="{ item }">
                {{ formatCurrency(item.subTotal) }}
              </template>
              <template #[`item.Descuento`]="{ item }">
                {{ formatCurrency(item.Descuento) }}
              </template>
              <template #[`item.impIva`]="{ item }">
                {{ formatCurrency(item.impIva) }}
              </template>
              <template #[`item.totalNeto`]="{ item }">
                {{ formatCurrency(item.totalNeto) }}
              </template>

              <!-- Footer con Totales de Venta vs Totales de Nota de Crédito -->
              <template slot="body.append">
                <tr class="grey lighten-4">
                  <td colspan="12" class="py-2">
                    <v-row no-gutters class="text-caption">
                      <v-col cols="12" md="6" class="blue-grey--text text--darken-2">
                        <strong>Venta Original:</strong>
                        Subtotal: {{ venta.subtotal || '$0.00' }} |
                        IVA: {{ venta.iva || '$0.00' }} |
                        <strong>Total: {{ venta.totalVentaFormat || '$0.00' }}</strong>
                      </v-col>
                      <v-col cols="12" md="6" class="text-right green--text text--darken-3 font-weight-bold">
                        <span>Partidas seleccionadas: {{ selectedItems.length }} de {{ tablaFactura.items.length }} | </span>
                        <span>SubTotal Nota: {{ totalesNota.subtotalFormat }} | </span>
                        <span>IVA: {{ totalesNota.ivaFormat }} | </span>
                        <span class="text-subtitle-2">Total Nota: {{ totalesNota.totalFormat }}</span>
                      </v-col>
                    </v-row>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>
    </v-card>

    <!-- Modal para Visualizar PDF de la Nota de Crédito -->
    <v-dialog v-model="modalFactura" fullscreen>
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn icon dark @click="modalFactura = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Nota de Crédito {{ serie + folio }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            text
            outlined
            small
            class="mr-2"
            v-if="factura.xml"
            @click="xmlDownload"
          >
            <v-icon left small>mdi-code-json</v-icon>
            Descargar XML
          </v-btn>
          <v-btn
            text
            outlined
            small
            v-if="factura.pdfBase64"
            @click="pdfDownload"
          >
            <v-icon left small>mdi-download</v-icon>
            Descargar PDF
          </v-btn>
        </v-toolbar>
        <VerFactura :pdf="factura.pdfBase64" />
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import ClientesComp from '@/components/ClientesComp'
import VerFactura from '@/components/VerFactura'
import Utils from '@/assets/utils'
import config from "../config.json"

export default {
  components: {
    ClientesComp,
    VerFactura
  },
  data() {
    return {
      alert: {
        active: false,
        msg: "",
        type: ""
      },
      emisor: {
        domicilioFiscal: "",
        razonSocial: "FARMACIA GUSHER",
        regimenFiscal: "601"
      },
      tab: 'cliente',
      serie: "",
      folio: "",
      showBtnPdf: false,
      modalFactura: false,
      selectedItems: [],
      tablaFactura: {
        headers: [
          { text: 'Cantidad', value: 'Cantidad', sortable: true, align: "center" },
          { text: 'Código', value: 'NoIdentificacion' },
          { text: 'Clave SAT', value: 'ClaveProdServ' },
          { text: 'Descripción', value: 'Descripcion' },
          { text: 'Precio Unit', value: 'ValorUnitario', align: "right" },
          { text: 'Sub-Total', value: 'subTotal', align: "right" },
          { text: 'Descuento', value: 'Descuento', align: 'right' },
          { text: 'Tasa', value: 'porIva', align: 'center' },
          { text: 'Impuesto', value: 'impIva', align: 'right' },
          { text: 'Total', value: 'totalNeto', align: 'right' },
        ],
        items: []
      },
      loaders: {
        tablaFactura: false,
        generaFactura: false,
        getVenta: false,
        getNota: false,
        getUuid: false
      },
      venta: {
        caja: "",
        folio: "",
        fecha: "",
        bruto: "",
        descuento: "",
        subtotal: "",
        iva: "",
        total: "",
        totalVenta: 0,
        totalVentaFormat: "",
        exento: "",
        tasa0: "",
        gravable: "",
        factorIva: "",
        formaDePago: "",
        comentarios: "",
        numCtaPago: "",
        cajeroId: "",
        vendedorId: "",
        data: []
      },
      factura: {
        metodoPago: "PUE",
        formaPago: "",
        usoCfdi: "G02 - Devoluciones, descuentos o bonificaciones",
        condiciones: "Contado",
        numCtaPago: "",
        comentarios: "",
        uuidRel: "",
        uuid: "",
        pdfBase64: "",
        xml: ""
      },
      cliente: {
        nuevo: true,
        numero: "",
        razonSocial1: "",
        rfc: "",
        codPos: "",
        regFiscal: "",
        email: ""
      },
      utils: new Utils()
    }
  },
  computed: {
    usosCfdiFiltrados() {
      return this.utils.usosCfdi.filter(u => u.startsWith('S01') || u.startsWith('G02'))
    },
    totalesNota() {
      let subtotal = 0
      let descuento = 0
      let iva = 0
      let gravable = 0
      let tasa0 = 0
      let exento = 0

      for (const item of this.selectedItems) {
        const cant = Number(item.Cantidad) || 0
        const precUnit = Number(item.ValorUnitario) || 0
        const desc = Number(item.Descuento) || 0
        const itemSubtotal = (cant * precUnit) - desc
        const itemIva = Number(item.impIva) || 0
        const porIva = Number(item.porIva) || 0
        const tipoIva = String(item.tipoIva || item.mTIva || '').toUpperCase()

        subtotal += itemSubtotal
        descuento += desc
        iva += itemIva

        if (tipoIva === 'A') {
          exento += itemSubtotal
        } else if (tipoIva === 'B' || porIva === 0) {
          tasa0 += itemSubtotal
        } else {
          gravable += itemSubtotal
        }
      }

      const total = subtotal + iva

      return {
        subtotal: Number(subtotal.toFixed(2)),
        descuento: Number(descuento.toFixed(2)),
        iva: Number(iva.toFixed(2)),
        total: Number(total.toFixed(2)),
        gravable: Number(gravable.toFixed(2)),
        tasa0: Number(tasa0.toFixed(2)),
        exento: Number(exento.toFixed(2)),
        subtotalSat: subtotal.toFixed(2),
        descuentoSat: descuento.toFixed(2),
        ivaSat: iva.toFixed(2),
        totalSat: total.toFixed(2),
        subtotalFormat: this.formatCurrency(subtotal),
        ivaFormat: this.formatCurrency(iva),
        totalFormat: this.formatCurrency(total)
      }
    }
  },
  mounted() {
    this.getParametros()
  },
  methods: {
    formatCaja() {
      if (this.venta.caja) {
        let val = Number(this.venta.caja)
        if (val >= 1 && val <= 5) {
          this.venta.caja = String(val).padStart(2, '0')
        }
      }
    },
    formatCurrency(value) {
      const num = Number(value) || 0
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
      }).format(num)
    },

    openPdf() {
      this.modalFactura = true
    },

    xmlDownload() {
      if (!this.factura.xml) return
      const blob = new Blob([this.factura.xml], { type: 'application/xml;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${this.serie}${this.folio}.xml`
      link.click()
      URL.revokeObjectURL(link.href)
    },

    pdfDownload() {
      if (!this.factura.pdfBase64) return
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${this.factura.pdfBase64}`
      link.download = `${this.serie}${this.folio}.pdf`
      link.click()
    },

    nuevaNota() {
      this.venta = {
        caja: "",
        folio: "",
        fecha: "",
        bruto: "",
        descuento: "",
        subtotal: "",
        iva: "",
        total: "",
        totalVenta: 0,
        totalVentaFormat: "",
        exento: "",
        tasa0: "",
        gravable: "",
        factorIva: "",
        formaDePago: "",
        comentarios: "",
        numCtaPago: "",
        cajeroId: "",
        vendedorId: "",
        data: []
      }
      this.factura.uuidRel = ""
      this.factura.uuid = ""
      this.factura.pdfBase64 = ""
      this.factura.xml = ""
      this.factura.comentarios = ""
      this.factura.numCtaPago = ""
      this.factura.formaPago = ""
      this.factura.usoCfdi = "G02 - Devoluciones, descuentos o bonificaciones"
      this.showBtnPdf = false
      this.tablaFactura.items = []
      this.selectedItems = []
      this.siguienteFolioNota()
    },

    getParametros() {
      this.alert.msg = ""
      this.$axios({
        method: "get",
        url: `${config.backEndUrl}/gusher/ws.prg?mod=parametros`,
      }).then(resp => {
        if (resp.data.response == 200) {
          this.serie = 'NC' + resp.data.data.serie
          this.emisor.domicilioFiscal = resp.data.data.codPos
          this.emisor.regimenFiscal = config.emisor?.regimenFiscal || "601"
          this.siguienteFolioNota()
        } else {
          this.alert.msg = `Problemas con el Servidor (${resp.data.response} ${resp.data.msg})`
        }
      }).catch(error => {
        this.alert.msg = error.message || String(error)
      }).finally(() => {
        this.alert.active = (this.alert.msg !== "")
      })
    },

    getCustomerData(item) {
      this.cliente = {
        nuevo: false,
        numero: item.numero || item.mnumero || item.id || "",
        razonSocial1: item.razonSocial1 || item.mnombre || item.nombre || "",
        rfc: (item.rfc || item.mrfc || "").replace(/-/g, ""),
        codPos: item.codPos || item.mzp || "",
        regFiscal: item.regFiscal || item.regimenFiscal || "",
        email: item.email || item.mEmail || ""
      }
      this.tab = 'factura'
      setTimeout(() => {
        const idCaja = document.getElementById("caja")
        if (idCaja) idCaja.focus()
      }, 500)
    },

    tabClick(item) {
      if (item === 'factura') {
        setTimeout(() => {
          if (this.$refs.refCaja) this.$refs.refCaja.focus()
        }, 100)
      }
    },

    async siguienteFolioNota() {
      try {
        const response = await this.$axios({
          url: `/api/siguiente-folio-nota/${this.serie}`,
          method: 'get'
        })
        if (response.data.response === 200) {
          this.folio = response.data.data
        }
      } catch (error) {
        console.log('error en siguienteFolioNota()', error)
      }
    },

    async buscarUuidRelacionado() {
      if (!this.venta.caja || !this.venta.folio) return
      this.loaders.getUuid = true
      try {
        const fechaParam = this.venta.fecha || ''
        const resp = await this.$axios({
          method: 'get',
          url: `/api/facturacion/buscar-uuid-relacionado?caja=${this.venta.caja}&folio=${this.venta.folio}&fecha=${fechaParam}`
        })
        if (resp.data && resp.data.result && resp.data.result.uuid) {
          const facturaInfo = resp.data.result.factura || {}
          this.factura.uuidRel = resp.data.result.uuid
          
          if (facturaInfo.tipo_factura === 'Global') {
            this.cliente.rfc = 'XAXX010101000'
            this.cliente.razonSocial1 = 'PUBLICO EN GENERAL'
            this.cliente.numero = '000000'
            
            const usoS01 = this.usosCfdiFiltrados.find(u => u.startsWith('S01'))
            if (usoS01) this.factura.usoCfdi = usoS01
          } else {
            const usoG02 = this.usosCfdiFiltrados.find(u => u.startsWith('G02'))
            if (usoG02) this.factura.usoCfdi = usoG02
          }
        }
      } catch (e) {
        console.warn('No se pudo recuperar UUID relacionado:', e)
      } finally {
        this.loaders.getUuid = false
      }
    },

    async onClick(origen) {
      if (origen === 'BUSCAR_VENTA') {
        if (!this.venta.caja || !this.venta.folio) {
          this.alert.msg = "Es necesario indicar la Caja y el Folio de la Venta"
          this.alert.active = true
          return
        }

        this.siguienteFolioNota()

        try {
          this.venta.caja = this.venta.caja.toString().padStart(2, '0')
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

          this.factura.uuidRel = ""
          this.tablaFactura.items = []
          this.selectedItems = []

          this.alert.msg = ""
          this.loaders.getVenta = true

          const resp = await this.$axios({
            method: 'get',
            url: `${config.backEndUrl}/gusher/ws.prg?mod=getVenta&caja=${this.venta.caja}&folio=${this.venta.folio}&tipo=nc`
          })

          if (resp.data.response == 200) {
            const vData = resp.data.venta
            this.venta.fecha = vData.fecha || vData.Fecha || ""
            this.venta.bruto = vData.bruto
            this.venta.descuento = vData.descuento
            this.venta.subtotal = vData.subtotal
            this.venta.iva = vData.iva
            this.venta.total = vData.total
            this.venta.totalVenta = parseFloat(String(vData.total || '0').trim().replace(/,/g, ''))
            this.venta.totalVentaFormat = vData.totalVentaFormat
            this.venta.exento = vData.exento
            this.venta.tasa0 = vData.tasa0
            this.venta.gravable = vData.gravable
            this.venta.factorIva = vData.factorIva
            this.venta.formaDePago = vData.formaDePago
            this.venta.cajeroId = vData.cajeroId || vData.cajero || ""
            this.venta.vendedorId = vData.vendedorId || vData.vendedor || ""

            // Formato partidas
            const itemsProcesados = (vData.data || []).map(p => {
              return {
                ...p,
                NoIdentificacion: p.NoIdentificacion || p.parte || p.codigo || '',
                ClaveProdServ: p.ClaveProdServ || p.cveSat || '01010101',
                Descripcion: p.Descripcion || p.descripcion || '',
                Cantidad: Number(p.Cantidad || p.cantidad || 1),
                ValorUnitario: Number(p.ValorUnitario || p.precio || p.Precio || 0),
                subTotal: Number(p.subTotal || p.subtotal || p.SubTotal || 0),
                Descuento: Number(p.Descuento || p.descuento || 0),
                porIva: Number(p.porIva || p.porIVA || 0),
                impIva: Number(p.impIva || p.impIVA || 0),
                totalNeto: Number(p.totalNeto || p.total || p.Total || 0),
                tipoIva: p.tipoIva || p.mTIva || (Number(p.porIva) > 0 ? 'C' : 'B')
              }
            })

            this.tablaFactura.items = itemsProcesados
            // Seleccionar todas las partidas por defecto
            this.selectedItems = [...itemsProcesados]

            // Asignar forma de pago sugerida
            if (vData.formaDePago) {
              const matchedFp = this.utils.formasDePago.find(v => v.substring(0, 2) === vData.formaDePago)
              if (matchedFp) this.factura.formaPago = matchedFp
            }
            if (!this.factura.formaPago && this.utils.formasDePago.length > 0) {
              this.factura.formaPago = this.utils.formasDePago[0]
            }

            // Comentarios por defecto
            if (vData.comentarios) {
              this.factura.comentarios = vData.comentarios
            } else {
              const fechaVentaFormat = vData.fecha ? vData.fecha : new Date().toLocaleDateString('es-MX')
              this.factura.comentarios = `Caja: ${this.venta.caja} | Recibo: ${this.venta.folio} | Fecha Venta: ${fechaVentaFormat}`
            }

            // Búsqueda automática de Factura Global / UUID relacionado
            await this.buscarUuidRelacionado()
          } else {
            this.alert.msg = resp.data.msg || "No se encontró la venta solicitada"
          }
        } catch (error) {
          this.alert.msg = error.message || String(error)
        } finally {
          this.alert.active = (this.alert.msg !== "")
          this.loaders.getVenta = false
        }
      } else if (origen === 'BUSCAR_NOTA') {
        if (!this.folio) {
          this.alert.msg = "Indica el folio de la nota a consultar"
          this.alert.active = true
          return
        }

        this.alert.msg = ''
        this.loaders.getNota = true
        try {
          const response = await this.$axios({
            url: `/api/lee-nota-credito/${this.serie}/${this.folio}`,
            method: 'get'
          })

          if (response.data && response.data.response === 200 && response.data.data) {
            const nData = response.data.data
            this.venta.caja = nData.Caja || ""
            this.venta.folio = nData.FolioVenta || ""
            this.factura.uuidRel = nData.UUIDOrigen || ""
            this.factura.uuid = nData.UUID || ""
            this.factura.comentarios = nData.observaciones || nData.comentarios || ""

            if (nData.formaDePago) {
              const fpMatch = this.utils.formasDePago.find(v => v.substring(0, 2) === nData.formaDePago)
              if (fpMatch) this.factura.formaPago = fpMatch
            }

            if (nData.UsoCFDI) {
              const usoMatch = this.utils.usosCfdi.find(v => v.substring(0, 3) === nData.UsoCFDI)
              if (usoMatch) this.factura.usoCfdi = usoMatch
            }

            const itemsNota = (nData.items || []).map(p => ({
              ...p,
              NoIdentificacion: p.NoIdentificacion || p.Parte || '',
              ClaveProdServ: p.ClaveProdServ || p.cveSat || '',
              Descripcion: p.Descripcion || p.descripcion || '',
              Cantidad: Number(p.Cantidad || 1),
              ValorUnitario: Number(p.ValorUnitario || p.Precio || 0),
              subTotal: Number(p.subTotal || p.Importe || 0),
              Descuento: Number(p.Descuento || p.ImpDes || 0),
              porIva: Number(p.porIva || p.PorIVA || 0),
              impIva: Number(p.impIva || p.ImpIVA || 0),
              totalNeto: Number(p.totalNeto || p.Importe || 0),
              tipoIva: p.tipoIva || p.tipoIVA || 'C'
            }))

            this.tablaFactura.items = itemsNota
            this.selectedItems = [...itemsNota]
            this.showBtnPdf = !!nData.UUID
          } else {
            this.alert.msg = response.data.message || "Nota de Crédito no encontrada"
          }
        } catch (error) {
          this.alert.msg = error.message || String(error)
        } finally {
          this.loaders.getNota = false
          this.alert.active = (this.alert.msg !== '')
        }
      } else if (origen === 'GENERAR_FACTURA') {
        // Validaciones previas
        if (this.cliente.nuevo || !this.cliente.rfc) {
          this.alert.msg = "Es necesario seleccionar un Cliente válido"
          this.alert.active = true
          this.tab = 'cliente'
          return
        }
        if (this.selectedItems.length === 0) {
          this.alert.msg = "Debes seleccionar al menos un producto para la Nota de Crédito"
          this.alert.active = true
          return
        }
        if (!this.factura.formaPago) {
          this.alert.msg = "Es necesario indicar la Forma de Pago"
          this.alert.active = true
          return
        }
        if (!this.factura.usoCfdi) {
          this.alert.msg = "Es necesario indicar el Uso del CFDI"
          this.alert.active = true
          return
        }
        if (!this.folio) {
          this.alert.msg = "Indica el número de Folio de la Nota"
          this.alert.active = true
          return
        }

        if (!this.factura.uuidRel || this.factura.uuidRel.trim() === '') {
          if (!confirm("El UUID relacionado está vacío, ¿aún así deseas continuar?")) {
            return
          }
        }

        this.loaders.generaFactura = true
        this.alert.msg = ""
        this.alert.type = ""
        this.showBtnPdf = false

        try {
          const estructuraCfdi = this.creaEstructura()
          const payload = {
            data: estructuraCfdi,
            factura: {
              serie: this.serie,
              folioNota: this.folio,
              factura: this.folio,
              folioVenta: this.venta.folio,
              caja: this.venta.caja,
              numero: this.cliente.numero,
              nombre: this.cliente.razonSocial1,
              rfc: this.cliente.rfc,
              email: this.cliente.email,
              fecha: new Date().toLocaleDateString('es-MX'),
              fechaVenta: this.venta.fecha || new Date().toLocaleDateString('es-MX'),
              subTotal: this.totalesNota.subtotal,
              iva: this.totalesNota.iva,
              total: this.totalesNota.total,
              formaPago: this.factura.formaPago.substring(0, 2),
              usoCfdi: this.factura.usoCfdi.substring(0, 3),
              metodoPago: this.factura.condiciones === 'Crédito' ? 'PPD' : 'PUE',
              tipo: 'NC',
              tipoVenta: this.factura.condiciones === 'Crédito' ? 'CR' : 'CO',
              uuidRel: this.factura.uuidRel ? this.factura.uuidRel.trim() : '',
              observaciones: this.factura.comentarios || '',
              numCtaPago: this.factura.numCtaPago || '',
              cajeroId: this.venta.cajeroId || '',
              vendedorId: this.venta.vendedorId || '',
              items: this.selectedItems
            }
          }

          const resp = await this.$axios({
            method: "post",
            url: "/api/facturar",
            data: payload
          })

          const resData = resp.data
          if (resData.result && (resData.result.retcode == 1 || resData.result.retcode == 0)) {
            this.factura.uuid = resData.result.UUID || ""
            this.factura.pdfBase64 = resData.result.pdfBase64 || ""
            this.factura.xml = resData.result.data || ""
            this.showBtnPdf = true
            this.alert.type = "success"
            this.alert.msg = `Nota de Crédito timbrada exitosamente (UUID: ${this.factura.uuid})`
            this.modalFactura = true
          } else {
            const errorMsg = (resData.result && (resData.result.error || resData.result.message)) ||
                             (resData.result && resData.result.result && resData.result.result.error) ||
                             JSON.stringify(resData.result || resData)
            this.alert.msg = `Error de timbrado iTimbre: ${errorMsg}`
          }
        } catch (error) {
          console.error("Error al generar Nota de Crédito:", error)
          this.alert.msg = error.message || String(error)
        } finally {
          this.loaders.generaFactura = false
          this.alert.active = (this.alert.msg !== "")
        }
      }
    },
    async buscarUuidRelacionado() {
      try {
        if (!this.venta.caja || !this.venta.folio) return

        const resp = await this.$axios({
          url: '/api/facturacion/buscar-uuid-relacionado',
          method: 'get',
          params: {
            caja: this.venta.caja,
            folio: this.venta.folio,
            fecha: this.venta.fecha
          }
        })

        if (resp.data.response === 200) {
          const uuid = resp.data.data.uuid
          const factura = resp.data.data.factura
          if (uuid && factura) {
            this.factura.uuidRel = uuid
            if (factura.rfc_receptor) {
              this.cliente.rfc = factura.rfc_receptor
              if (factura.rfc_receptor === 'XAXX010101000') {
                this.cliente.razonSocial1 = 'PUBLICO EN GENERAL'
              }
            }
          } else {
            this.factura.uuidRel = ""
            // this.cliente.rfc = "" // Dejamos en blanco si se prefiere
          }
        }
      } catch (error) {
        console.error("Error al buscar UUID relacionado:", error)
      }
    },

    creaEstructura() {
      const tot = this.totalesNota
      const formaPagoCod = this.factura.formaPago.substring(0, 2)
      const usoCfdiCod = this.factura.usoCfdi.substring(0, 3)
      const metodoPagoCod = this.factura.condiciones === 'Crédito' ? 'PPD' : 'PUE'

      const jsonCfdi = {
        id_transaccion: 0,
        cliente: {
          id: this.cliente.numero,
          UsoCFDI: usoCfdiCod,
          nombre: this.cliente.razonSocial1,
          rfc: this.cliente.rfc,
          DomicilioFiscalReceptor: this.cliente.codPos || this.emisor.domicilioFiscal,
          RegimenFiscalReceptor: this.cliente.regFiscal ? this.cliente.regFiscal.substring(0, 3) : "616",
          correo: this.cliente.email || ""
        },
        datos_factura: {
          Serie: this.serie,
          Folio: String(this.folio).padStart(8, '0'),
          Version: "4.0",
          cfdiVersion: "4.0",
          FormaPago: formaPagoCod,
          TipoCambio: "1",
          MetodoPago: metodoPagoCod,
          RegimenFiscal: this.emisor.regimenFiscal || "601",
          LugarExpedicion: this.emisor.domicilioFiscal || "22010",
          Moneda: "MXN",
          TipoDeComprobante: "E",
          tipoDeComprobante: "6",
          Exportacion: "01",
          CondicionesDePago: this.factura.condiciones,
          no_sucursal: "0",
          SubTotal: tot.subtotalSat,
          Descuento: tot.descuento > 0 ? tot.descuentoSat : undefined,
          Total: tot.totalSat,
          Impuestos: {
            TotalImpuestosTrasladados: tot.ivaSat,
            Traslados: []
          },
          comentarios: this.factura.comentarios
        },
        conceptos: this.creaEstructuraDetalle()
      }

      // Impuestos Traslados Globales
      if (tot.gravable > 0) {
        jsonCfdi.datos_factura.Impuestos.Traslados.push({
          Base: tot.gravable.toFixed(2),
          Impuesto: "002",
          TipoFactor: "Tasa",
          TasaOCuota: "0.160000",
          Importe: tot.ivaSat
        })
      }
      if (tot.tasa0 > 0) {
        jsonCfdi.datos_factura.Impuestos.Traslados.push({
          Base: tot.tasa0.toFixed(2),
          Impuesto: "002",
          TipoFactor: "Tasa",
          TasaOCuota: "0.000000",
          Importe: "0.00"
        })
      }

      // Nodo CFDI Relacionados (Tipo 01 - Nota de crédito)
      if (this.factura.uuidRel && this.factura.uuidRel.trim() !== '') {
        jsonCfdi.datos_factura.CfdiRelacionados = {
          TipoRelacion: "01",
          CfdiRelacionado: {
            UUID: this.factura.uuidRel.trim()
          }
        }
      }

      return jsonCfdi
    },

    creaEstructuraDetalle() {
      return this.selectedItems.map(it => {
        const cant = Number(it.Cantidad) || 1
        const desc = Number(it.Descuento) || 0
        const subTot = (Number(it.ValorUnitario) * cant) - desc
        const baseSat = subTot.toFixed(2)
        const porIva = Number(it.porIva) || 0
        const impIva = Number(it.impIva) || 0
        const valorUnitarioSat = Number(it.ValorUnitario).toFixed(2)

        const concepto = {
          Cantidad: cant.toString(),
          ClaveProdServ: it.ClaveProdServ || "01010101",
          ClaveUnidad: "ACT",
          Descripcion: it.Descripcion || "PRODUCTO",
          Importe: (cant * Number(it.ValorUnitario)).toFixed(2),
          NoIdentificacion: it.NoIdentificacion || it.parte || "",
          noIdentificacion: it.NoIdentificacion || it.parte || "",
          Unidad: 'Pza',
          ValorUnitario: valorUnitarioSat,
          subTotal: subTot.toFixed(2),
          total: subTot.toFixed(2),
          ObjetoImp: "02",
          Descuento: desc > 0 ? desc.toFixed(2) : undefined,
          Numero_CuentaPredial: '',
          Impuestos: {
            Traslados: [
              {
                Base: baseSat,
                Impuesto: "002",
                TipoFactor: "Tasa",
                TasaOCuota: (porIva / 100).toFixed(6),
                Importe: impIva.toFixed(2)
              }
            ]
          }
        }

        return concepto
      })
    }
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

