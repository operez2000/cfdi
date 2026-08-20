<template>
  <div>

    <div class="d-flex justify-space-between">
      <span class="subtitle-1">Facturación - Serie: {{ serie }}</span>
      <v-btn ref="refBtnOpenPdf" color="primary" @click="openPdf" v-show="showBtnPdf">PDF</v-btn>
    </div>

    <v-dialog
      v-model="alert.active"
      width="500"
      persistent
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
            @click="alert.active = false; alert.msg = ''; alert.type = ''; cierraDialogo()"
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
        >
          <v-tab href="#cliente">Cliente</v-tab>
          <v-tab href="#factura">Detalle de Factura</v-tab>
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
              :footer-props="footerProps"
              item-key="NoIdentificacion"
              :loading="loaders.getVenta"
              loading-text="Leyendo..."
              no-data-text="Sin registros"
              dense
            >
              <template #top>
                <v-row class="mt-2">
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
                  <v-col md="1">
                    <v-text-field
                      v-model="folio"
                      label="# Factura"
                      type="number"
                      dense
                      :rules = "[
                        v => !!v || 'Obligatorio'
                      ]"
                      ref="refFolio"
                    />
                  </v-col>
                  <v-col md="1">
                    <v-select
                      v-model="factura.metodoPago"
                      :items="utils.metodosDePago"
                      outlined
                      filled
                      label="Método de pago"
                      :rules="[
                        v => !!v || 'Dato obligatorio'
                      ]"
                      ref="refMetodoPago"
                      dense
                    />
                  </v-col>
                  <v-col md="2">
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
                  <v-col md="3">
                    <v-select
                      v-model="factura.usoCfdi"
                      :items="utils.usosCfdi"
                      outlined
                      filled
                      label="Uso del CFDI"
                      :rules="[
                        v => !!v || 'Dato obligatorio'
                      ]"
                      ref="refUsoCfdi"
                      dense
                    />
                  </v-col>
                  <v-spacer />
                  <v-col md="auto">
                    <v-btn
                      color="primary"
                      :loading="loaders.generaFactura"
                      :disabled="venta.totalVenta == 0 || cliente.nuevo || !venta.caja || !venta.folio || !serie || !folio || !factura.formaPago || loaders.generaFactura"
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
<!--
              <template v-slot:item.ValorUnitario="{ item }">
                {{ utils.formatNumber(item.ValorUnitario, 6) }}
              </template>
              <template #item.subTotal="{ item }">
                {{ utils.formatNumber(item.subTotal) }}
              </template>
              <template #item.Descuento="{ item }">
                {{ utils.formatNumber(item.Descuento) }}
              </template>
              <template #item.total="{ item }">
                {{ utils.formatNumber(item.total) }}
              </template>
              <template #item.Impuestos.Traslados[0].TasaOCuota="{ item }">
                {{ utils.formatNumber(item.Impuestos.Traslados[0].TasaOCuota) }}
              </template>
              <template #item.Impuestos.Traslados[0].Importe="{ item }">
                {{ utils.formatNumber(item.Impuestos.Traslados[0].Importe) }}
              </template>
              <template #item.Traslados.totalNeto="{ item }">
                {{ utils.formatNumber(item.totalNeto) }}
              </template>
              -->
              <template slot="body.append">
                <tr class="light-green--text">
                  <th colspan="10" class="subtitle-2 text-center">Importe de la Venta: {{ venta.totalVentaFormat }} </th>
                </tr>
              </template>
            </v-data-table>
          </v-tab-item>

        </v-tabs-items>
      </v-card-text>

      <v-card-actions>
      </v-card-actions>
    </v-card>
    <!-- Modal to view the invoice in PDF -->
    <v-dialog v-model="modalFactura" fullscreen>
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn icon dark @click="modalFactura = false;reloadPage()">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Factura {{ serie + folio }}</v-toolbar-title>
        </v-toolbar>
        <VerFactura :pdf="factura.pdfBase64"/>
      </v-card>
    </v-dialog>

  </div>
</template>
<script>
//import { defineComponent } from '@vue/composition-api'
import ClientesComp from '@/components/ClientesComp'
import VerFactura from '@/components/VerFactura'
import Utils from '@/assets/utils'
import config from "../config.json"

const window_location = window.location

export default {
  components: {
    ClientesComp,
    VerFactura,
  },
  data() {
    return {
      emisor: {
        domicilioFiscal: "",
        razonSocial: "FARMACIA GUSHER"
      },
      alert: {
        active: false,
        msg: "prueba",
        type: ""
      },
      tab: null,
      cliente: {
        nuevo: true,
      },
      folio: "",
      loaders: {
        tablaFactura: false,
        generaFactura: false,
        getVenta: false,
      },
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
//          { text: 'Lote', value: 'lote', align: 'left' },
//          { text: 'Caducidad', value: 'fCaducidad', align: 'left' },
        ],
        items: [],
        detalle: {}
      },
      footerProps: {
        showFirstLastPage: true,
//        'items-per-page-text':'Registros por pag.',
//        'items-per-page-all-text': 'Todos',
//        'page=text': 'Página'
      },
      serie: "",
      folio: "",
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
        metodoPago: "",
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
      showBtnPdf: false,
      utils: new Utils(),
      timbrada: false,
      modalFactura: false,
    } // return data()
  }, // data()
  mounted() {
    this.factura.metodoPago = this.utils.metodosDePago[0] // default PUE
    this.factura.usoCfdi = this.utils.usosCfdi[1]         // default Gastos en General
    this.getParametros() // Parametros
    this.globalConsec() // Agregar global al consecutivo de facturas FacCli02.dbf
    this.siguienteFactura() // Obtener siguiente folio de factura

    //let btn = this.$refs.refBtnOpenPdf.$el.click()
    /*
    this.$axios({
      url: "/api/recuperar_cfdi",
      method: "post",
      data: {
        method: "recuperar",
        cuenta: "gusher",
        user: "administrador",
        password: "$9KVnl81",
        folio: "B00064223",
        getPdf: true
      }
    }).then(resp => {
      console.log("resp recuperar", resp.data)
    }).catch(error => {
      console.log("error", error)
    }).finally(() => {
      console.log("Final...");
    })
    */
  },
  methods: {
    openPdf() {
      this.modalFactura = true
    },  // openPdf()

    async globalConsec() {
      const response = await this.$axios({
        method: 'get',
        url: `${config.backEndUrl}/gusher/ws.prg?mod=global_consec`
      })
      console.log('globalConsec', response.data)
    }, // globalConsec()
    getCustomerData(item) {
      console.log("getCustomerData", item)
      this.cliente = item
      this.cliente.nuevo = false
      this.tab = 'factura'
      setTimeout(() => {
        const idCaja = document.getElementById("caja")
        idCaja.focus()
      }, 500);
    },
    getParametros() {
      this.alert.msg = ""
      this.$axios({
        method: "get",
        url: `${config.backEndUrl}/gusher/ws.prg?mod=parametros`,//"/api/parametros"
      }).then(resp => {
        console.log("parametros", resp.data)
        if (resp.data.response == 200) {
          this.serie = resp.data.data.serie
          this.emisor.domicilioFiscal = resp.data.data.codPos
        } else {
          this.alert.msg = `Problemas con el Servidor (${resp.data.response} ${resp.data.msg})`
        }
      }).catch(error => {
        this.alert.msg = error
      }).finally(() => {
        this.alert.active = (this.alert.msg != "")
      })
    }, // getParametros()
    async siguienteFactura() {
      let response = await this.$axios({
        method: "get",
        url: `${config.backEndUrl}/gusher/ws.prg?mod=siguiente-factura`  //"/api/siguiente-factura"
      })
      this.folio = Number(response.data.data.folio)
    }, // siguienteFactura()
    async onClick(origen) {
      if (origen == 'BUSCAR_VENTA') {
        // Validación de caja y folio obligatorios
        if (! this.venta.caja || !this.venta.folio) {
          this.alert.msg = "Es necesario indicar la Caja y el Folio de la Venta"
          this.alert.active = true
          return
        }
        await this.siguienteFactura() // Obtener siguiente folio de factura
        // Validación de Factura timbrada
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
            url: `${config.backEndUrl}/gusher/ws.prg?mod=getVenta&caja=${this.venta.caja}&folio=${this.venta.folio}`
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
        // 'BUSCAR_VENTA'
      } else if (origen == "GENERAR_FACTURA") {
        // Validar información obligatoria
        if (!this.factura.metodoPago) {
          this.alert.msg = "Es necesario indicar el Método de Pago" ; this.alert.active = true
          this.$nextTick(() => {
            this.$refs.refMetodoPago.focus()
          })
          return
        }
        if (!this.factura.formaPago) {
          this.alert.msg = "Es necesario indicar la Forma de Pago" ; this.alert.active = true
          this.$nextTick(() => {
            this.$refs.refFormaPago.focus()
          })
          return
        }
        if (!this.factura.usoCfdi) {
          this.alert.msg = "Es necesario indicar el uso del CFDI" ; this.alert.active = true
          this.$nextTick(() => {
            this.$refs.refUsoCfdi.focus()
          })
          return
        }
        if (!this.folio) {
          this.alert.msg = "Es necesario indicar Folio" ; this.alert.active = true
          this.$nextTick(() => {
            this.$refs.refFolio.focus()
          })
          return
        }
        if (!this.venta.caja || !this.venta.folio) {
          this.alert.msg = "Es necesario indicar la Caja y Folio de la venta" ; this.alert.active = true
          return
        }

        // Validación para buscar si el folio de venta ya se facturó
        const res = await this.$axios({
          method: 'get',
          url: `${config.backEndUrl}/gusher/ws.prg?mod=getVenta&caja=${this.venta.caja}&folio=${this.venta.folio}`
        })
        console.log("Validando que no se haya timbrado la misma venta", res.data)
        if (res.data.response == 500) {
          this.alert.msg = res.data.msg
          this.alert.active = true
          return
        }
        // Información del cliente
        this.factura.correo = this.cliente.email
        this.factura.idCliente = this.cliente.numero
        this.factura.domicilioFiscalReceptor = this.cliente.codPos
        this.factura.regimenFiscalReceptor = this.cliente.regFiscal
        this.factura.nombre = this.cliente.razonSocial1
        this.factura.rfc = this.cliente.rfc
        this.factura.serie = this.serie
        let data = this.factura
        data.pdfBase64 = ""
        data.xml = ""
        // Factura nueva
        this.factura.folio = this.folio
        this.factura.uuid = ""

        this.loaders.generaFactura = true
        this.alert.msg = "" ; this.alert.type = ""
        this.showBtnPdf = false
        this.factura.pdfBase64 = ""

        try {
          const resp = await this.$axios({
            method: "post",
            url: "/api/facturar",
            data: {
              data: this.creaEstructura(),
              factura: {
                folio: `${this.venta.caja}${this.venta.folio.padStart(8, ' ')}`,
                caja: this.venta.caja,
                folioVenta: this.venta.folio,
                numero: this.cliente.numero,
                nombre: this.cliente.razonSocial1,
                rfc: this.cliente.rfc,
                email: this.cliente.email,
                factura: this.folio.toString().padStart(8, '0'),
                fecha: (new Date().toLocaleDateString('fr-FR')),
                importe: this.venta.total,
                iva: this.venta.iva,
                tasa0: this.venta.tasa0,
                gravable: this.venta.gravable,
                metodoPago: this.factura.formaPago.substring(0, 2),
                usoCfdi: this.factura.usoCfdi.substring(0, 3),
                tipoComp: this.factura.metodoPago,
                uuidRel: "",
                facRel: ""
              }
            }
          })          
          console.log("resp.data", resp.data)
          console.log('retcode', resp.data.result.retcode);
          console.log('base64', resp.data.result.pdfBase64);
          console.log('Compara', resp.data.result.retcode == -1 || resp.data.result.retcode > 1) 
          if (resp.data.result.retcode == -1 || resp.data.result.retcode > 1) {
            if (resp.data.result.error) {
              this.alert.msg = resp.data.result.error
            } else if (resp.data.result.result.error) {
              this.alert.msg = resp.data.result.result.error
            } else {
              this.alert.msg = `Mensaje indefinido de iTimbre: ${resp.data.result}`
            }
          } else if (resp.data.result.retcode == 1 || resp.data.result.retcode == 0) {
            if (resp.data.result.pdfBase64) {
              data.pdfBase64 = resp.data.result.pdfBase64
            } else if (resp.data.result.result) {
              if (resp.data.result.result.pdfBase64) {
                data.pdfBase64 = resp.data.result.result.pdfBase64
              }
            }
            this.factura.uuid = resp.data.result.UUID
            this.alert.type = "success"
            this.alert.msg = "Factura generada correctamente"
            this.venta.caja = ""
            this.venta.folio = ""
            // Abro una pestaña con el PDF
          } else {
            this.alert.msg = resp.data.result
          }
          if (data.pdfBse64 == "") {
            if (resp.data.result.result) {
              if (resp.data.result.result.pdfBase64) {
                data.pdfBase64 = resp.data.result.result.pdfBase64
              }
            }
          }
          if (data.pdfBase64 != "") {
            this.timbrada = true
            this.factura.pdfBase64 = data.pdfBase64
            this.showBtnPdf = true
            /*
            let win = window.open()
            //let link = document.createElement('a')
            win.document.write(`<iframe title="${this.serie}${this.folio}" src="data:application/pdf;base64,${encodeURI(data.pdfBase64)}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`)
            win.document.title = this.serie + "-" + this.folio
            if (!win) {
              this.alert.msg = "El navegador no está configurado para abrir ventanas emergentes (popups)"
            }
            */

            /*
            link.href = 'data:application/octet-stream;base64,' + data.pdfBase64
            link.click()
            link = null
            Opcion para mostrar el PDF en modal
            */

            this.modalFactura = true
          }
        } catch(error) {
          console.log("Error", error)
          this.alert.msg = error
        } finally {
          this.loaders.generaFactura = false
          // this.alert.active = (this.alert.msg != "")
          this.siguienteFactura() // Obtener siguiente folio de factura
          if (this.showBtnPdf) {
            // Si se timbró entonces recargo la página
            //this.reloadPage()
          }
          if (this.alert.msg !== '') {
            this.alert.active = true
          }
        } // GENERAR_FACTURA
      }
    }, // onClick()

    async recuperafactura(folioFactura) {
      let resultado
      this.loaders.getVenta = true
      try {
        const resp = await this.$axios({
          method: 'get',
          url: `/api/recuperarCFDI/${folioFactura}`
        })
        resultado = resp.data
      } catch (error) {
        resultado = error
      } finally {
        this.loaders.getVenta = false
        return resultado
      }
    }, // recuperafactura()

    creaEstructura () {
      this.globalConsec() // Agregar global al consecutivo de facturas FacCli02.dbf
      this.siguienteFactura()  // Leer el siguiente folio en FacCli02.dbf
      let jsonCfdi = {
        id_transaccion: 0,
        cliente: {
          id: this.cliente.numero,
          UsoCFDI: this.factura.usoCfdi.substring(3, 0),
          nombre: this.cliente.razonSocial1,
          rfc: this.cliente.rfc,
          DomicilioFiscalReceptor: this.cliente.codPos,
          RegimenFiscalReceptor: this.cliente.regFiscal.substring(0, 3),
          correo: this.cliente.email,
        },
        datos_factura: {
          Serie: this.serie,
          Folio: ('' + this.folio).padStart(8, '0'),
          Version: "4.0",
          cfdiVersion: "4.0",
          FormaPago: this.factura.formaPago.substring(0, 2),
          TipoCambio: "1",
          MetodoPago: this.factura.metodoPago,
          RegimenFiscal: config.emisor.regimenFiscal,
          LugarExpedicion: this.emisor.domicilioFiscal,
          Moneda: "MXN",
          TipoDeComprobante: "I",
          tipoDeComprobante: "0",
          Exportacion: "01",
          CondicionesDePago: this.factura.condiciones,
          no_sucursal: "0",
          SubTotal: this.venta.bruto,
          Descuento: this.venta.descuento,
          Total: this.venta.total,
          Impuestos: {
            TotalImpuestosTrasladados: this.venta.iva,
            Traslados: []
          },
          comentarios: this.factura.comentarios
        },
        conceptos: this.creaEstructuraDetalle(),
      }
      // Impuestos traslados (IVA)
      if (this.venta.gravable != "0.00") {
        jsonCfdi.datos_factura.Impuestos.Traslados.push({
          Base: this.venta.gravable,
          Impuesto: "002",
          TipoFactor: "Tasa",
          TasaOCuota: this.venta.factorIva,
          Importe: this.venta.iva
        })
      }
      // Impuestos trasladados (Tasa 0%)
      if (this.venta.tasa0 != "0.00") {
        jsonCfdi.datos_factura.Impuestos.Traslados.push({
          Base: this.venta.tasa0,
          Impuesto: "002",
          TipoFactor: "Tasa",
          TasaOCuota: "0.000000",
          Importe: "0.00"
        })
      }
      // Descuento
      if (jsonCfdi.datos_factura.Descuento == "0.00") {
        delete jsonCfdi.datos_factura.Descuento
      }
      return jsonCfdi  // return
    }, // creaEstructura()
    creaEstructuraDetalle() {
      let json = []
      for (const iterator of this.venta.data) {
        json.push({
          Cantidad: iterator.Cantidad.trim(),
          ClaveProdServ: iterator.ClaveProdServ.trim(),
          ClaveUnidad: iterator.ClaveUnidad,
          Descripcion: iterator.Descripcion,
          Descuento: this.utils.formatSat(iterator.Descuento),
          Importe: this.utils.formatSat(iterator.Importe),
          NoIdentificacion: iterator.NoIdentificacion,
          noIdentificacion: iterator.NoIdentificacion,
          Unidad: iterator.Unidad,
          ValorUnitario: this.utils.formatSat(iterator.ValorUnitario),
          subTotal: this.utils.formatSat(iterator.subTotal),
          total: this.utils.formatSat(iterator.total),
          ObjetoImp: "02",
          Numero_CuentaPredial: "",
          Impuestos: {
            Traslados: [
                {
                  Base: this.utils.formatSat(iterator.total),
                  Impuesto: "002",
                  TipoFactor: "Tasa",
                  TasaOCuota: iterator.porIva,
                  Importe: this.utils.formatSat(iterator.impIva),
                }
              ]
          },
        })
        if (json[json.length -1].Descuento == "0.00") {
          delete json[json.length -1].Descuento
        }
      }
      return json
    }, // creaEstructuraDetalle()
    cierraDialogo() {
      if (this.timbrada) {
        this.alert.active = false
        this.timbrada = false
        this.reloadPage()
      }
    },
    reloadPage() {
      window_location.reload()
    },
  }, // methods
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
