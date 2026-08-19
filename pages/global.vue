<template>
  <div>

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

    <v-card
      class="mt-2"
      outlined
    >
      <v-card-text>
        <div class="d-flex justify-end">
          <v-btn
            ref="refBtnOpenPdf"
            plain
            dark
            v-show="showBtnPdf"
            @click="openPdf"
            title="Ver PDF"
          >
            <v-icon large color="primary">mdi-file-pdf-box</v-icon>
          </v-btn>
          <v-btn
            plain
            dark
            :disabled="tablaVentas.items.length == 0 || loaders.excel"
            @click="excel"
            :loading="loaders.excel || loaders.tablaFactura"
          >
            <v-icon large color="light-green">mdi-file-excel-outline</v-icon>
          </v-btn>
          <v-btn
            plain
            dark
            :disabled="tablaVentas.items.length == 0 || loaders.excel || loaders.tablaFactura || loaders.timbraFactura"
            :loading="loaders.timbraFactura"
            @click="timbrarFactura"
          >
            <v-icon large color="blue">mdi-content-save</v-icon>
          </v-btn>
        </div>
        <v-tabs
          class="mb-0"
          v-model="tab"
          color="primary"
          dark
          @change="tabChange"
        >
          <v-tab href="#factura">Facturas</v-tab>
          <!-- <v-tab href="#parciales">Parciales</v-tab> -->
          <v-tab href="#detalle_ventas">Detalle Ventas</v-tab>
        </v-tabs>
        <v-divider />
        <v-tabs-items v-model="tab" class="mb-2">
          <v-tab-item value="factura">
            <v-data-table
              :headers="tablaFactura.headers"
              :items="tablaFactura.items"
              class="mt-3"
              pagination.sync="tabla.pagination"
              :footer-props="footerProps"
              item-key="NoIdentificacion"
              :loading="loaders.tablaFactura"
              loading-text="Leyendo..."
              no-data-text="Sin registros"
              dense
            >
              <template #top>
                <v-row class="mt-2">
                  <v-col md="1">
                    <span class="subtitle-1">Serie: {{ serie }}</span>
                  </v-col>
                  <!-- Folio de Factura -->
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
                      readonly
                    />
                  </v-col>
                  <v-col md="2">
                    <!-- Fecha (Date picker) -->
                    <v-menu
                      ref="menu"
                      v-model="menuFecha"
                      :close-on-content-click="false"
                      :return-value.sync="fecha"
                      transition="scale-transition"
                      offset-y
                      min-width="auto"
                    >
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field
                          v-model="fecha"
                          label="Fecha"
                          prepend-icon="mdi-calendar"
                          readonly
                          v-bind="attrs"
                          v-on="on"
                          dense
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="fecha"
                        no-title
                        scrollable
                        locale="es-mx"
                      >
                        <v-spacer></v-spacer>
                        <v-btn
                          text
                          color="orange"
                          @click="menuFecha = false"
                        >
                          Cancelar
                        </v-btn>
                        <v-btn
                          text
                          color="green"
                          @click="$refs.menu.save(fecha); dateChange()"
                        >
                          OK
                        </v-btn>
                      </v-date-picker>
                    </v-menu>
                  </v-col> <!-- Fecha (date picker) -->
                  <v-col md="3">
                    <v-text-field
                      v-model="uuid_relacionado"
                      label="UUID Relacionado"
                      :counter="40"
                      maxlength="40"
                      dense
                    />
                  </v-col>
                  <v-spacer />
                  <v-col md="auto">
                    <v-btn
                      color="primary"
                      :loading="loaders.generaFactura"
                      :disabled="venta.totalVenta == 0 || !venta.caja || !venta.folio || !serie || !folio || !factura.formaPago"
                    >
                      <v-icon class="mr-2">mdi-check </v-icon>
                      Facturar
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col md="12">
                    <v-text-field
                      v-model="factura.comentarios"
                      label="Comentarios"
                      dense
                    />
                  </v-col>
                </v-row>
                <v-divider class="my-0" />
              </template>
            </v-data-table>
            <v-divider />
            <!-- Tabla de totales -->
            <v-data-table
              :headers="tablaSumas.headers"
              :items="tablaSumas.items"
              class="mt-6"
              :loading="loaders.tablaFactura"
              loading-text="Leyendo..."
              no-data-text="Sin registros"
              hide-default-footer
              dense
            />
          </v-tab-item>
          <v-tab-item value="detalle_ventas">
            <v-data-table
              :headers="tablaVentas.headers"
              :items="tablaVentas.items"
              class="mt-3"
              pagination.sync="tabla.pagination"
              :footer-props="footerProps"
              item-key="folio"
              :loading="loaders.getVenta"
              loading-text="Leyendo..."
              no-data-text="Sin registros"
              dense
            >
              <template slot="body.append">
                <tr class="light-green--text">
                  <th
                    colspan="10"
                    class="subtitle-2 text-center">
                    Suma: {{ utils.formatNumber( tablaVentas.items.reduce( (acum, obj) => acum + obj.importe, 0) ) }}
                  </th
                  >
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
          <v-toolbar-title>Factura Global {{ serie + folio }}</v-toolbar-title>
        </v-toolbar>
        <VerFactura :pdf="factura.pdfBase64"/>
      </v-card>
    </v-dialog>

  </div>
</template>
<script>
//import { defineComponent } from '@vue/composition-api'
import Utils from '@/assets/utils'
import VerFactura from '@/components/VerFactura'
import config from "../config.json"
let parametros = {}
let globalData = {}
let formaDePago = "01"
let mes = ""
let ejercicio = ""
let fechaFactura = ""

const window_location = window.location

const fechaHoy = new Date().toLocaleDateString('fr-CA')

const fechaLetras = (fecha) => {
  if (!fecha || fecha.length < 10) return fecha || ''
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const mes = meses[parseInt(fecha.substring(5, 7), 10) - 1] || fecha.substring(5, 7)
  return fecha.substring(8, 10) + '/' + mes + '/' + fecha.substring(0, 4)
}

export default {
  components: {
    VerFactura,
  },
  data() {
    return {
      menuFecha: false,
      fecha: fechaHoy,
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
        excel: false,
        timbraFactura: false,
      },
      tablaFactura: {
        headers: [
          { text: 'Factura', value: 'factura', sortable: true },
          { text: 'Exento', value: 'formatExento', align: "right" },
          { text: 'Tasa 0', value: 'formatTasa0', align: "right" },
          { text: 'Gravable', value: 'formatGravable', align: "right" },
          { text: 'IVA', value: 'formatIva', align: "right" },
          { text: 'Total', value: 'formatImporte', align: 'right' },
          { text: 'Estatus', value: 'estatus' },
          { text: 'F Pago', value: 'formaDePago', align: 'center' },
          { text: 'Fecha', value: 'fecha' },
          { text: 'Folio Venta', value: 'folioVenta' },
          { text: 'UUID', value: 'uuid', align: 'left' },
        ],
        items: [],
        detalle: {}
      },
      tablaSumas: {
        headers: [
          { text: 'Concepto', value: 'concepto', sortable: true },
          { text: 'Exento', value: 'formatExento', align: "right" },
          { text: 'Tasa 0', value: 'formatTasa0', align: "right" },
          { text: 'Gravable', value: 'formatGravable', align: "right" },
          { text: 'IVA', value: 'formatIva', align: "right" },
          { text: 'Total', value: 'formatImporte', align: "right" },
        ],
        items: [],
        detalle: {}
      },
      tablaVentas: {
        headers: [
          { text: 'Caja Folio', value: 'folio', sortable: true },
          { text: 'Exento', value: 'formatExento', align: 'right' },
          { text: 'Tasa 0', value: 'formatTasa0', align: "right" },
          { text: 'Gravable', value: 'formatGravable', align: "right" },
          { text: 'IVA', value: 'formatIva', align: 'right' },
          { text: 'Importe', value: 'formatImporte', align: 'right' },
          { text: 'Imp Original', value: 'formatOriginal', align: 'right' },
          { text: 'Diferencia', value: 'formatDiferencia', align: 'right' },
          { text: 'F Pago', value: 'formaDePago', align: 'center' },
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
        comentarios: `Factura Global del ${fechaLetras(fechaHoy)}`,
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
      uuid_relacionado: '',
      modalFactura: false,
    } // return data()
  }, // data()
  mounted() {
    this.dateChange()
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
    dateChange() {
      fechaFactura = this.fecha.substring(8, 10) + '/' + this.fecha.substring(5, 7) + '/' + this.fecha.substring(0, 4)
      console.log('fecha', this.fecha, fechaFactura)
      if (!this.folio) {
        this.siguienteFactura()
      }
      this.factura.comentarios = `Factura Global del ${this.utils.oFecha(this.fecha)}`
      mes = this.fecha.substring(5, 7)
      ejercicio = this.fecha.substring(0, 4)
      this.globalInfo()
    },
    tabChange(item) {
      console.log('item', item);
    },
    globalInfo() {
//this.fecha = '20230106'
      this.loaders.tablaFactura = true
      this.tablaFactura.items = []
      this.tablaSumas.items = []
      this.tablaVentas.items = []
      globalData = {}
      this.$axios({
        method: 'post',
        url: `${config.backEndUrl}/gusher/ws.prg?mod=global&fecha=${this.fecha.replace(/\-/gm,'')}`
      }).then(resp => {
        console.log("globalInfo() resp", resp.data)
        if (resp.data.response == 200) {
          globalData = resp.data
          // Tabla de facturas
          this.tablaFactura.items = resp.data.facturas.sort((a, b) => a.factura - b.factura)
          // Tabla de sumas
          this.tablaSumas.items.push(resp.data.SumaFacturas)
          this.tablaSumas.items.push(resp.data.SumaVentas)
          this.tablaSumas.items.push(resp.data.SumaGlobales)
          // Tabla de ventas
          this.tablaVentas.items = resp.data.globales.filter(v => v.esGlobal )
          // Forma de pago de la venta con mayor importe
          // let sortArray = resp.data.globales
          // sortArray = sortArray.filter(v => v.esGlobal).sort((a, b) => b.importe - a.importe)
          // if (sortArray.length > 0) {
          //   formaDePago = sortArray[0].formaDePago
          // }
          // Creo arreglo de objetos para acumular importes por forma de pago
          let sumasPorFormaDePago = this.utils.formasDePago.map(v =>  {
            return {
              formaDePago: v.substring(0, 2),
              suma: 0
            }
          })
          // Realizo la acumulación
          sumasPorFormaDePago.forEach(element => {
            let findIndex = sumasPorFormaDePago.findIndex(v => v.formaDePago == element.formaDePago)
            let temp = this.tablaVentas.items  // ventas para global
            temp = temp.filter(v => v.formaDePago == element.formaDePago).reduce((acum, obj) => acum + obj.importe, 0)
            if (findIndex >= 0) {
              sumasPorFormaDePago[findIndex].suma = temp
            }
          })
          sumasPorFormaDePago = sumasPorFormaDePago.sort((a, b) => b.suma - a.suma)
          formaDePago = sumasPorFormaDePago[0].formaDePago
        }
      }).catch(error => {
        console.log("error", error)
      }).finally(() => {
        this.loaders.tablaFactura = false
        if (this.tablaFactura.items.length > 0) {
          this.revisarFacturasSinTimbrar()
        }
      })
    }, // globalInfo()

    async revisarFacturasSinTimbrar() {
      let index = 0
      this.loaders.tablaFactura = true
      for (const iterator of this.tablaFactura.items) {
        if (iterator.uuid == "") {
          try {
            const resp = await this.$axios({
              url: `/api/recuperarCFDI/${this.serie}${iterator.factura}`,
              method: 'get'
            })
            if (resp.data.result.retcode == 1) {
              this.tablaFactura.items[index].uuid = resp.data.result.result.uuid
            }
          } catch (error) {
            console.log('Error al recuperar', error, iterator)
          }
        }
        index++
      }
      this.loaders.tablaFactura = false
      globalData.facturas = this.tablaFactura.items
    }, // revisarFacturasSinTimbrar()

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
    reloadPage() {
      window_location.reload()
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
          parametros = resp.data
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
    async timbrarFactura() {
      let response
      this.loaders.timbraFactura = true
      this.alert.msg = ""
      if (!this.folio) {
        this.siguienteFactura()
      }
      globalData.parametros = parametros.data
      globalData.fecha = fechaFactura // this.utils.oFecha(this.fecha)
      globalData.fecha2 = this.fecha  // yyyy-mm-dd
      globalData.serie = this.serie
      globalData.folio = this.folio
      globalData.estructura = this.creaEstructura()
      try {
        response = await this.$axios({
          method: "post",
          url: "/api/timbra-global",
          data: globalData
        })
        if (response.data.result.retcode == 1) {
          // resp.data.result.retcode == 1 todo ok... mostrar factura
          this.loaders.timbraFactura = false
          this.factura.uuid = response.data.result.UUID
          this.factura.pdfBase64 = ""
          if (response.data.result.pdfBase64) {
            this.factura.pdfBase64 = response.data.result.pdfBase64
          } else if (response.data.result.result && response.data.result.result.pdfBase64) {
            this.factura.pdfBase64 = response.data.result.result.pdfBase64
          }
          if (response.data.result.data) {
            this.factura.xml = response.data.result.data
          }
          this.alert.type = "success"
          this.alert.msg = "Factura global generada correctamente"
          if (this.factura.pdfBase64 != "") {
            this.showBtnPdf = true
            this.modalFactura = true
          }
        } else {
          this.loaders.timbraFactura = false
          this.alert.msg = response.data.result.error
        }
      } catch (error) {
        this.alert.msg = "Se detectó un error: <br><pre>" + error + "</pre>"
      } finally {
        this.loaders.timbraFactura = false
        if (this.alert.msg != "") {
          this.alert.active = true
        }
      }
    }, // timbrarFactura()

    async onClick(origen) {
      if (origen == 'BUSCAR_VENTA') {

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

        this.$axios({
          method: "post",
          url: "/api/facturar",
          data: {
            data: this.creaEstructura(),
            factura: {
              folio: `${this.venta.caja}${this.venta.folio.padStart(8, ' ')}`,
              numero: this.cliente.numero,
              nombre: this.cliente.razonSocial1,
              rfc: this.cliente.rfc,
              email: this.cliente.email,
              factura: this.folio.toString().padStart(8, '0'),
              fecha: fechaFactura,
              importe: this.venta.total,
              iva: this.venta.iva,
              tasa0: this.venta.tasa0,
              gravable: this.venta.gravable,
              tipo: 'G',
              metodoPago: this.factura.formaPago.substring(0, 2),
              usoCfdi: this.factura.usoCfdi.substring(0, 3),
              tipoComp: this.factura.metodoPago,
              uuidRel: "",
              facRel: ""
            }
          }
        }).then(resp => {
          console.log("resp.data", resp.data)
          console.log('retcode', resp.data.result.retcode);
          console.log('base64', resp.data.result.pdfBase64);
          if (resp.data.result.retcode == -1) {
            if (resp.data.result.error) {
              this.alert.msg = resp.data.result.error
            } else if (resp.data.result.result.error) {
              this.alert.msg = resp.data.result.result.error
            } else {
              this.alert.msg = `Mensaje indefinido de iTimbre: ${resp.data.result}`
            }
          } else if (resp.data.result.retcode == 1 || resp.data.result.retcode == 0 || resp.data.result.pdfBase64) {
            data.pdfBase64 = resp.data.result.pdfBase64
            this.factura.uuid = resp.data.result.UUID
            this.alert.type = "success"
            this.alert.msg = "Factura generada correctamente"
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
            this.factura.pdfBase64 = data.pdfBase64
            this.showBtnPdf = true
            let win = window.open()
            let link = document.createElement('a')
            win.document.write(`<iframe title="${this.serie}${this.folio}" src="data:application/pdf;base64,${encodeURI(data.pdfBase64)}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`)
            win.document.title = this.serie + "-" + this.folio
            //link.href = 'data:application/octet-stream;base64,' + data.pdfBase64
            //link.click()
            link = null
          }
        }).catch(error => {
          console.log("Error", error)
          this.alert.msg = error
        }).finally(() => {
          this.loaders.generaFactura = false
          this.alert.active = (this.alert.msg != "")
          this.alert.active = (this.alert.msg != "")
          this.siguienteFactura() // Obtener siguiente folio de factura
        })
        // GENERAR_FACTURA
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
      const arrGlobales = globalData.globales.filter(v => v.esGlobal && v.importe != 0)
      let arrTasaCero = arrGlobales.filter(v => v.tasa0 > 0)
      let sumaTasaCero = arrTasaCero.reduce((acum, obj) => acum + obj.tasa0, 0)
      let arrGravable = arrGlobales.filter(v => v.gravable > 0)
      let sumaGravable = arrGravable.reduce((acum, obj) => acum + obj.gravable, 0)
      let sumaIva = arrGravable.reduce((acum, obj) => acum + obj.iva, 0)
      let datosFactura = {
        subTotal: arrGlobales.reduce((acum, obj) => acum + (obj.importe - obj.iva), 0),
        total: arrGlobales.reduce((acum, obj) => acum + obj.importe, 0)
      }

      const formaPago = arrGlobales.reduce((prev, current) => (prev.importe > current.importe) ? prev : current)
      let traslado = []
      if (sumaTasaCero > 0) {
        traslado.push({
          Base: sumaTasaCero.toFixed(2),
          Impuesto: "002",
          TipoFactor: "Tasa",
          TasaOCuota: "0.00",
          Importe: "0.00"
        })
      }
      if (sumaGravable > 0) {
        traslado.push({
          Base: sumaGravable.toFixed(2),
          Impuesto: "002",
          TipoFactor: "Tasa",
          TasaOCuota: (globalData.porIva * 0.01).toFixed(2),
          Importe: sumaIva.toFixed(2)
        })
      }
      let jsonCfdi = {
        method: 'nueva_factura',
        id_transaccion: 0,
        cuenta: config.pac.cuenta,
        user: config.pac.user,
        password: config.pac.password,
        getPdf: true,
        enviarFactura: false,
        cliente: {
          id: -1,
          UsoCFDI: 'S01',  // Sin efectos fiscales
          Nombre: 'PÚBLICO EN GENERAL',
          Rfc: 'XAXX010101000',
          DomicilioFiscalReceptor: this.emisor.domicilioFiscal,
          RegimenFiscalReceptor: "616"  // Sin obligaciones fiscales
        },
        datos_factura: {
          Serie: this.serie,
          Folio: ('' + this.folio).toString().padStart(8, '0'),
          FormaPago: formaPago.formaDePago,
          TipoCambio: "1",
          MetodoPago: "PUE",
          RegimenFiscal: config.emisor.regimenFiscal,
          LugarExpedicion: this.emisor.domicilioFiscal,
          Moneda: "MXN",
          TipoDeComprobante: "I",
          tipoDeComprobante: "0",
          no_sucursal: "0",
          Version: "4.0",
          cfdiVersion: "4.0",
          Exportacion: "01",
          // CondicionesDePago: this.factura.condiciones,  (NO DEBE EXISTIR)
          SubTotal: datosFactura.subTotal.toFixed(2),
          Total: datosFactura.total.toFixed(2),
          InformacionGlobal: {
            Periodicidad: "01",    // Diaria
            Meses: mes,
            Año: ejercicio
          },
          Impuestos: {
            TotalImpuestosTrasladados: (datosFactura.total - datosFactura.subTotal).toFixed(2),
            Traslados: traslado
          },
          comentarios: this.factura.comentarios
        },
        conceptos: this.creaEstructuraDetalle(),
      };



      // UUID Relacionado...
      if (this.uuid_relacionado) {
        console.log('con datos', this.uuid_relacionado)
        jsonCfdi.datos_factura.CfdiRelacionados = [{
          TipoRelacion: '01',
          CfdiRelacionado: {
            UUID: this.uuid_relacionado
          }
        }];
      } else {
        console.log('sin datos', this.uuid_relacionado)
      }

/*
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
*/
      return jsonCfdi  // return
    }, // creaEstructura()
    creaEstructuraDetalle() {
      let json = []
      const detalle = globalData.globales.filter(v => v.esGlobal && v.importe != 0)
      const formaPago = detalle.reduce((prev, current) => (prev.importe > current.importe) ? prev : current)
      for (const iterator of detalle) {
        let traslados = []
        // Gravable
        if (iterator.gravable != 0) {
          traslados.push({
            Base: iterator.gravable.toFixed(2),
            Impuesto: "002",
            TipoFactor: "Tasa",
            TasaOCuota: (globalData.porIva * 0.01).toFixed(2),
            Importe: iterator.iva.toFixed(2)
          })
        }
        // Tasa cero
        if (iterator.tasa0 > 0) {
          traslados.push({
            Base: iterator.tasa0.toFixed(2),
            Impuesto: "002",
            TipoFactor: "Tasa",
            TasaOCuota: "0.00",
            Importe: "0.00"
          })
        }
        json.push({
          ClaveProdServ: '01010101',
          ClaveUnidad: 'ACT',
          Importe: (iterator.exento + iterator.tasa0 + iterator.gravable).toFixed(2),
          NoIdentificacion: iterator.folio.replace(/\s+/g, '-'),
          noIdentificacion: iterator.folio.replace(/\s+/g, '-'),
          Cantidad: '1',
          Descripcion: 'Venta',
          ValorUnitario: (iterator.exento + iterator.tasa0 + iterator.gravable).toFixed(2),
          ObjetoImp: "02",
          Impuestos: {
            Traslados: traslados
          },
        })
      }
      return json
    }, // creaEstructuraDetalle()
    async excel() {
      let resp
      this.siguienteFactura()  // forzo a traer el sig folio de factura
      this.loaders.excel = true
      this.alert.msg = ""
      globalData.parametros = parametros.data
      globalData.fecha = this.utils.oFecha(this.fecha)
console.log('fecha', this.fecha)
      globalData.fecha2 = this.fecha  // yyyy-mm-dd
      globalData.serie = this.serie
      try {
        resp = await this.$axios({
          method: "post",
          url: "/api/global-excel",
          data: globalData
        })
        if (resp.data.response != 200) {
          this.alert.msg = resp.data.msg
        } else {
          // resp.data.response == 200 todo ok
          this.loaders.excel = false
          const windowFeatures = "left=100,top=100,width=320,height=320";
          const handle = window.open(
            `${config.baseUrl}/api/global-excel-download`,
            "mozillaWindow",
            //windowFeatures
          )
          if (!handle) {
            this.alert.msg = "El navegador no está configurado para abrir ventanas emergentes (popups)"
          }
        }
      } catch (error) {
        this.alert.msg = "Se detectó un error: <br><pre>" + error + "</pre>"
      } finally {
        this.loaders.excel = false
        if (this.alert.msg != "") {
          this.alert.active = true
        }
      }
      console.log('Excel...');
    }, // excel()
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
