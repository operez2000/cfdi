<template>
  <div class="mx-2">
    <v-row class="mt-4">
      <!-- <v-col md="3">
        <p class="mb-2 text-h5">Refacturación</p>
      </v-col> -->

      <!-- <v-col></v-col>
      <v-col class="ml-auto" md="1">
        <v-btn color="primary" small @click="onClick('RESET_FORM')">Reiniciar</v-btn>
      </v-col> -->

    </v-row>

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

    <v-form ref="form1">
      <v-row>
        <v-col md="1">
          <v-text-field
            label="Serie"
            v-model="serie"
            dense
            readonly
          />
        </v-col>
        <v-col md="2">
          <v-text-field
            v-model="facturaOriginal.folio"
            type="number"
            label="Folio a Cancelar"
            dense
            :loading="loaders.recuperarFolio"
            :disabled="loaders.recuperarFolio"
            @keyup.enter.prevent="onClick('RECUPERAR_FOLIO')"
          >
            <template #append>
              <v-btn
                icon
                small
                @click="onClick('RECUPERAR_FOLIO')"
                :loading="loaders.recuperarFolio"
              >
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
              <v-btn
                icon
                small
                color="green lighten-1"
                :disabled="facturaOriginal.pdfBase64 == ''"
                :loading="loaders.abrirPdf"
                @click="xmlDownload() ; onClick('ABRIR_PDF')"
              >
                <v-icon>mdi-download</v-icon>
              </v-btn>
            </template>
          </v-text-field>
        </v-col>
        <v-col md="4">
          <v-text-field
            label="UUID"
            v-model="facturaOriginal.uuid"
            dense
            style="font-size: 0.95rem"
            readonly
            :loading="loaders.recuperarFolio"
          />
        </v-col>
        <v-col md="1">
          <v-text-field
            label="Caja-Folio"
            v-model="recibo.cajaFolio"
            dense
            style="font-size: 0.91rem"
            readonly
          />
        </v-col>
        <v-col md="2">
          <v-text-field
            label="Fecha"
            v-model="recibo.fecha"
            dense
            readonly
          />
        </v-col>
        <v-col md="1">
          <v-text-field
            label="Importe"
            v-model="recibo.importe"
            style="font-size: 0.93rem"
            dense
            readonly
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col md="5">
          <v-select
            v-model="motivoCancelacion"
            :items="motivosCancelacion"
            outlined
            label="Motivo de Cancelación"
            filled
            item-color="blue"
            readonly
            dense
          />
        </v-col>
        <v-col md='7'>
          <v-alert
            v-model="warning.active"
            border="left"
            :color="warning.type"
            dismissible
            elevation="10"
            icon="mdi-alert"
            outlined
            type="warning"
          >
            <div class="text-t5">{{ warning.msg }}</div>
          </v-alert>
        </v-col>
      </v-row>

    </v-form>

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

            <v-form ref="frmCliente" v-model="forms.cliente">

              <v-row class="mt-2">

                <v-col md="1">
                  <v-btn
                    color="primary"
                    dark
                    fab
                    @click="onClick('DLG_SEARCH')"
                    >
                      <v-icon>mdi-magnify</v-icon>
                    </v-btn>
                </v-col>

                <v-col md="2">
                  <v-text-field
                    label="R.F.C. Cliente"
                    v-model="cliente.rfc"
                    style="font-size: 0.9rem"
                    dense
                    hint="Sin guiones"
                    maxlength="13"
                    :rules="[
                      v => (v != null && (v.length >= 12 && v.length <= 13)) || '12 o 13 Caractéres'
                    ]"
                    ref="refRfc"
                    :disabled="loaders.buscarCliente"
                    @keyup="cliente.rfc = cliente.rfc.toUpperCase()"
                    @keyup.enter.prevent="onClick('BUSCAR_CLIENTE')"
                  >
                    <template #append>
                      <v-btn
                        icon
                        @click="onClick('BUSCAR_CLIENTE')"
                        :loading="loaders.buscarCliente"
                        :disabled="cliente.rfc.length < 12 || cliente.rfc.length > 13"
                      >
                        <v-icon>mdi-magnify</v-icon>
                      </v-btn>
                    </template>
                  </v-text-field>
                </v-col>

                <v-col md="1">
                  <v-chip
                    class="mt-2"
                    color="success"
                    outlined
                    v-show="cliente.nuevo"
                  >
                    Nuevo
                  </v-chip>
                </v-col>

                <v-spacer />

                <v-col md="7">
                  <v-select
                    v-model="cliente.regFiscal"
                    label="Régimen Fiscal"
                    item-color="blue"
                    :items="regimenesFiscales"
                    outlined
                    filled
                    dense
                    @change="onChangeRegimenFiscal"
                    ref="regFiscal"
                  />
                </v-col>
              </v-row>

              <v-row class="my-0 py-0 pr-1">
                <v-col md="12">
                  <v-text-field
                    label="Razón Social (para timbrar)"
                    v-model="cliente.razonSocial1"
                    style="font-size: 0.9rem"
                    dense
                    maxlength="160"
                    append-outer-icon="mdi-arrow-down"
                    @click:append-outer="onClick('ALTERNAR_RAZON_SOCIAL')"
                    :rules="[
                      v => (v != null && (v.length >= 1 && v.length <= 160)) || 'Dato obligatorio'
                    ]"
                    ref="razonSocial1"
                  />
                </v-col>
              </v-row>

              <v-row class="my-0 py-0 pr-1">
                <v-col md="12">
                  <v-text-field
                    label="Razón Social (Alternativo)"
                    v-model="cliente.razonSocial2"
                    style="font-size: 0.9rem"
                    dense
                    maxlength="160"
                    append-outer-icon="mdi-arrow-up"
                    @click:append-outer="onClick('ALTERNAR_RAZON_SOCIAL')"
                  />
                </v-col>
              </v-row>

              <v-row class="my-0 py-0">
                <v-col md="12">
                  <v-text-field
                    label="Domicilio"
                    v-model="cliente.domicilio"
                    dense
                    maxlength="55"
                  />
                </v-col>
              </v-row>

              <v-row class="my-0 py-0">
                <v-col md="1">
                  <v-text-field
                    label="# Exterior"
                    v-model="cliente.numExterior"
                    dense
                    maxlength="10"
                  />
                </v-col>
                <v-col md="1">
                  <v-text-field
                    label="# Interior"
                    v-model="cliente.numInterior"
                    dense
                    maxlength="10"
                  />
                </v-col>
                <v-col md="3">
                  <v-text-field
                    label="Colonia"
                    v-model="cliente.colonia"
                    dense
                    maxlength="55"
                  />
                </v-col>
                <v-col md="2">
                  <v-text-field
                    label="Ciudad"
                    v-model="cliente.ciudad"
                    dense
                    maxlength="20"
                  />
                </v-col>
                <v-col md="2">
                  <v-text-field
                    label="Estado"
                    v-model="cliente.estado"
                    dense
                    maxlength="15"
                  />
                </v-col>
                <v-col md="1">
                  <v-text-field
                    v-model="cliente.codPos"
                    type="number"
                    label="C.P."
                    dense
                    maxlength="5"
                    :rules="[
                      v => v.length == 5 || 'Incorrecto'
                    ]"
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col md="2">
                  <v-text-field
                    v-model="cliente.tel1"
                    label="Teléfono 1"
                    dense
                    maxlength="15"
                  />
                </v-col>
                <v-col md="2">
                  <v-text-field
                    v-model="cliente.tel2"
                    label="Teléfono 2"
                    dense
                    maxlength="15"
                  />
                </v-col>
                <v-col md="2">
                  <v-text-field
                    v-model="cliente.curp"
                    label="CURP"
                    dense
                    maxlength="20"
                  />
                </v-col>
                <v-col md="6">
                  <v-text-field
                    v-model="cliente.email"
                    label="Email"
                    dense
                    maxlength="50"
                    :rules="[
                      v => !!v || 'El Correo es obligatorio',
                      v => /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(v) || 'Formato de Correo incorrecto'
                    ]"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-spacer></v-spacer>
                <v-col md="auto">
                  <v-btn
                    color="primary"
                    :loading="loaders.grabaCliente"
                    @click="onClick('ACTUALIZAR_CLIENTE')"
                    :disabled="!forms.cliente"
                  >
                      <v-icon class="mr-2">mdi-content-save</v-icon>
                    Actualizar Cliente
                  </v-btn>
                </v-col>
              </v-row>

            </v-form>

          </v-tab-item>

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
                  <v-text-field
                    label="Folio"
                    v-model="folio"
                    dense
                    style="font-size: 0.99em"
                    :rules = "[
                      v => !!v || 'Obligatorio'
                    ]"
                    ref="refFolio"
                  />
                </v-col>
                <v-col md="2">
                  <v-select
                    v-model="facturaOriginal.metodoPago"
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
                <v-col md="3">
                  <v-select
                    v-model="facturaOriginal.formaPago"
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
                    v-model="facturaOriginal.usoCfdi"
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
                <v-col md="1">
                  <v-radio-group
                    v-model="facturaOriginal.condiciones"
                    class="my-0 py-0"
                    mandatory
                    dense
                  >
                    <v-radio
                      label="Contado"
                      value="Contado"
                    ></v-radio>
                    <v-radio
                      label="Crédito"
                      value="Crédito"
                    ></v-radio>
                  </v-radio-group>
                </v-col>
                <v-spacer />
                <v-col md="auto">
                  <v-btn
                    color="primary"
                    :loading="loaders.generaFactura"
                    @click="onClick('GENERAR_FACTURA')"
                    :disabled="Number(facturaOriginal.detalle.Total) == 0 || cliente.nuevo || recibo.cancelada == 'S'"
                  >
                    <v-icon class="mr-2">mdi-check </v-icon>
                    Facturar
                  </v-btn>
                </v-col>
              </v-row>
              <v-divider class="my-0" />
            </template>
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
            <template slot="body.append">
              <tr class="light-green--text">
                <th colspan="10" class="subtitle-2 text-center">Total Factura: {{ utils.formatNumber(Number(facturaOriginal.data.Total)) }} </th>
              </tr>
            </template>

            </v-data-table>
          </v-tab-item>

        </v-tabs-items>
      </v-card-text>

      <v-card-actions>
      </v-card-actions>
    </v-card>


    <v-dialog
      v-model="dlgBuscar"
      scrollable
      persistent
      :overlay="false"
      max-width="620px"
      transition="dialog-transition"
    >
      <v-card
        class=""
        elevation=""
        max-width=""
      >
        <v-system-bar
          class="mb-2"
          color="primary"
        >
          <span>Búsqueda de Clientes</span>
          <v-spacer></v-spacer>
          <div class="text--primary d-flex justify-end">
            <v-btn icon small @click="dlgBuscar = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-system-bar>

        <v-card-text class="mt-3">
          <v-text-field
            v-model="search"
            label="Buscar"
            background-color="oscuro"
            dense
            solo
            hide-details=""
            :disabled="loaders.search"
            ref="search"
            @keyup.enter.prevent="onClick('BUSCAR_CLIENTES')"
          >
            <template #append>
              <v-btn
                icon
                @click="onClick('BUSCAR_CLIENTES')"
                :loading="loaders.search"
              >
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
            </template>
          </v-text-field>
          <v-card-text>
            <v-data-table
              :headers="tabla.headers"
              :items="tabla.clientes"
              class="elevation-4"
              item-key="recNo"
              :loading="loaders.search"
              loading-text="Leyendo..."
              no-data-text="No se encontraron registros"
              :footer-props="footerProps"
              dense
              @click:row="onClickRow"
            >

            </v-data-table>
          </v-card-text>
        </v-card-text>
      </v-card>
    </v-dialog>


    <!-- <v-layout justify="center"> -->
      <!-- Dialogo para Login -->
      <v-dialog v-model="dialog.login" persistent max-width="290">
        <v-card>
          <v-toolbar color="primary" dense>
            <v-toolbar-title dark>
              <v-icon class="mr-2">mdi-account</v-icon>
              Acceso
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon to="/">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text>
            <v-text-field
              class="mt-4"
              v-model="usuario"
              label="Usuario"
              :rules="[
                v => !!v || 'Requerido',
                v => v.length >= 2 || 'Mínimo 2 caractéres',
                v => v.length <= 10 || 'Máximo 10 caractéres'
              ]"
              maxlength="10"
              @keyup.enter.native="validaUsuario()"
              autofocus
            >
            </v-text-field>
            <v-text-field
              class="mt-4"
              v-model="clave"
              :append-icon="viewPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :type="viewPassword ? 'text' : 'password'"
              label="Contraseña"
              :rules="[
                v => !!v || 'Requerido',
              ]"
              maxlength="10"
              @click:append="viewPassword = !viewPassword"
              @keyup.enter.native="validaUsuario()"
            >
            </v-text-field>
          </v-card-text>
          <v-card-actions>
            <!-- <div class="flex-grow-1"></div> -->
            <v-btn color="primary" block dark @click.native="validaUsuario()" :disabled="!usuario || !clave" :loading="loaders.usuario">
              Continuar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    <!-- </v-layout> -->

    <snack-bar ref="snackBar"/>

  </div>
</template>

<script>
import SnackBar from '../components/SnackBar.vue'
import Utils from "../assets/utils"
import config from "../config.json"

export default {
  components: {
    SnackBar
  },
  data() {
    return {
      dialog: {
        login: true
      },
      usuario: "",
      clave: '',
      viewPassword: false,
      alert: {
        active: false,
        msg: "",
        type: ""
      },
      warning: {
        active: false,
        msg: '',
        type: ''
      },
      serie: "",
      folio: "",
      domicilioFiscal: "",
      facturaOriginal: {
        folio: "",
        pdfBase64: "",
        xml: "",
        uuid: "",
        fecha: "",
        metodoPago: "",
        formaPago: "",
        usoCfdi: "",
        condiciones: "Contado",
        data: {
          Total: 0,
        },
        detalle: {
          Total: 0,
        },
      },
      recibo: {
        caja: "",
        folio: "",
        cajaFolio: "",
        fecha: "",
        importe: 0,
        tipo: "",
        cancelada: "",
      },
      cliente: {
        recNo: 0,
        rfc: "",
        numero: "",
        razonSocial: "",
        razonSocial1: "",
        razonSocial2: "",
        domicilio: "",
        numExterior: "",
        numInterior: "",
        colonia: "",
        ciudad: "",
        estado: "",
        codPos: "",
        tel1: "",
        tel2: "",
        curp: "",
        email: "",
        regFiscal: '',
        nuevo: true
      },
      factura: {
        folio: '',
        pdfBase64: "",
        xml: "",
        uuid: "",
      },
      loaders: {
        usuario: false,
        recuperarFolio: false,
        abrirPdf: false,
        buscarCliente: false,
        autoComplete: false,
        search: false,
        grabaCliente: false,
        tablaFactura: false,
        generaFactura: false,
      },
      motivosCancelacion: null,
      motivoCancelacion: null,
      tab: null,
      regimenesFiscales: [],
      autoComplete: '',
      clientes: [],
      search: "",
      dlgBuscar: false,
      tabla: {
        headers: [
          { text: 'Nombre del Cliente', value: 'mNombre', sortable: true },
          { text: 'RFC', value: 'mRFC' },
        ],
        clientes: [],
        pagination: {
          page: 1,
          itemsPerPage: 10,
          pageStart: 1,
          pageStop: 0,
          pageCount: 0,
          itemsLenght: 1,
        }
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
          { text: 'Tasa', value: 'Impuestos.Traslados[0].TasaOCuota', align: 'center' },
          { text: 'Impuesto', value: 'Impuestos.Traslados[0].Importe', align: 'right' },
          { text: 'Total', value: 'totalNeto', align: 'right' },
        ],
        items: [],
        detalle: {}
      },
      footerProps: {
        showFirstLastPage: true,
        'items-per-page-text':'Registros por pag.',
        'items-per-page-all-text': 'Todos',
        'page=text': 'Página'
      },
      forms:{
        cliente: false,
        detalle: false,
      },
      formaPago: null,
      metodoPago: null,
      usoCfd: null,
      utils: new Utils(),
    } // return (data)
  }, // data()

  created() {
  },

  mounted() {
    this.getParametros()
    this.motivosCancelacion = this.utils.motivosCancelacion
    this.motivosCancelacion.pop() // elimino el último elemento "04 - Operación nominativa relacionada en la factura global"
    this.motivoCancelacion = this.motivosCancelacion[0] // en Refacturación siempre será "01 - Comprobante emitido con errores con relación"
    this.regimenesFiscales = this.utils.regimenesFiscales
    this.siguienteFactura()
  },

  methods: {
    validaUsuario() {
      let msg
      if (this.usuario && this.usuario.length > 0 && this.clave && this.clave.length > 0) {
        this.loaders.usuario = true
        this.$axios({
          method: 'get',
          url: `${config.backEndUrl}/gusher/ws.prg?mod=usuario`, //`api/usuario/${this.usuario}`,
          params: {
            id: this.usuario,
            clave: this.clave,
            opt: "canfac"
          }
        }).then(resp => {
          if (resp.data && resp.data.response == 200) {
            this.dialog.login = false
          } else if (resp.data && resp.data.response == 404) {
            this.$refs.snackBar.text = resp.data.msg
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          } else if (resp.data && resp.data.response == 500) {
            this.$refs.snackBar.text = resp.data.msg
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          } else {
            msg = (resp.data.msg) ? resp.data.msg : resp.data
            this.$refs.snackBar.text = "Error: " + msg
            this.$refs.snackBar.color = "orange darken-4"
            this.$refs.snackBar.snackBar = true
          }
        }).catch(err => {
          console.log("resp err", err)
          this.$refs.snackBar.text = (typeof err == 'object') ? JSON.stringify(err) : err
          this.$refs.snackBar.color = "orange darken-4"
          this.$refs.snackBar.snackBar = true
        }).finally(() => {
          this.loaders.usuario = false
        })
      }
    }, // validaUsuario()

    getParametros() {
      this.alert.msg = ""
      this.$axios({
        method: "get",
        url: `${config.backEndUrl}/gusher/ws.prg?mod=parametros`,//"/api/parametros"
      }).then(resp => {
        if (resp.data.response == 200) {
          this.serie = resp.data.data.serie
          this.domicilioFiscal = resp.data.data.codPos
        } else {
          this.alert.msg = `Problemas con el Servidor (${resp.data.response} ${resp.data.msg})`
        }
      }).catch(error => {
        this.alert.msg = error
      }).finally(() => {
        this.alert.active = (this.alert.msg != "")
      })
    }, // getParametros()

    onClick(origen, opcion = "rfc", valor = "") {
      if (origen == "RECUPERAR_FOLIO") {
        // Recibo de venta (FacCli02.dbf)
        this.alert.msg = ''
        this.warning.msg = '' ; this.warning.active = false
        this.recibo.caja = ""
        this.recibo.folio = ""
        this.recibo.cajaFolio = ""
        this.recibo.fecha = ""
        this.recibo.importe = 0
        this.recibo.tipo = ""
        this.recibo.cancelada = ""
        this.$axios({
          method: "get",
          url: `/api/recibo/${this.facturaOriginal.folio.toString().padStart(8, "0")}/get`
        }).then(resp => {
          if (resp.data.response == 200) {
            if (resp.data.data.tipo == "G") { // Global
              this.alert.msg = "La Factura es de tipo Global, no se puede Refacturar"
            } else {
              this.recibo = resp.data.data
              this.recibo.cajaFolio = resp.data.data.caja + "-" + resp.data.data.folio
              if (this.recibo.cancelada == 'S') {
                this.warning.type = 'yellow'
                this.warning.msg = `La Factura ${this.facturaOriginal.folio} ya se canceló`
                this.alert.msg = `La Factura ${this.facturaOriginal.folio} ya se canceló`
              }
            }
          } else {
            this.warning.msg = 'La venta (Caja y Folio) no se ha encontrado'
            this.warning.active = true
          }
        }).catch(error => {
          console.log("Error al recuperar el Recibo de Venta", error)
          this.alert.msg = error
        }).finally(() => {
          this.alert.active = (this.alert.msg != "")
          this.warning.active = (this.warning.msg != "")
        })

        // Recuperar CFDI desde iTimbre
        this.loaders.recuperarFolio = true
        this.facturaOriginal.pdfBase64 = ""
        this.facturaOriginal.xml = ""
        this.facturaOriginal.uuid = ""
        this.alert.msg = ""
        // CFDI
        this.$axios({
          method: "get",
          url: `/api/recuperarCFDI/${this.serie}${this.facturaOriginal.folio.toString().padStart(8, "0")}`
        }).then(resp => {
          if (resp.data.result.retcode == 1) {
            this.facturaOriginal.pdfBase64 = resp.data.result.result.pdfBase64
            this.facturaOriginal.xml = resp.data.result.result.xml
            this.facturaOriginal.uuid = resp.data.result.result.uuid
            this.XmlParse()
          } else {
            if (resp.data.result.result.error == undefined) {
              this.alert.msg = "Se detectó un error indefinido por parte de iTimbre"
            } else {
              this.alert.msg = resp.data.result.result.error
            }
          }
        }).catch(error => {
          console.log("Error al recuperar CFDI", error)
          this.alert.msg = error
        }).finally(() => {
          this.loaders.recuperarFolio = false
          this.alert.active = (this.alert.msg != "")
        })

      } else if (origen == "ABRIR_PDF") {
        this.loaders.abrirPdf = true
        let win = window.open()
        win.document.write(`<iframe src="data:application/pdf;base64,${this.facturaOriginal.pdfBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`)
        win.document.title = this.serie + "-" + this.facturaOriginal.folio
        this.loaders.abrirPdf = false

      } else if (origen == "BUSCAR_CLIENTE") {
        let url = url = `/api/cliente/${opcion}`
        let rfc
        this.cliente.rfc = this.cliente.rfc.toUpperCase()
        if (this.cliente.rfc.length < 12 || this.cliente.rfc.length > 13) {
          return
        }
        rfc = (this.cliente.rfc.length == 12) ? " " + this.cliente.rfc : this.cliente.rfc
        rfc = `${rfc.substring(0, 4)}-${rfc.substring(4, 10)}-${rfc.substring(10, 13)}`
        this.loaders.buscarCliente = true
        this.alert.msg = ""
        this.cliente.recNo = 0
        this.cliente.numero = ""
        this.cliente.razonSocial = ""
        this.cliente.razonSocial1 = ""
        this.cliente.razonSocial2 = ""
        this.cliente.domicilio = ""
        this.cliente.numExterior = ""
        this.cliente.numInterior = ""
        this.cliente.colonia = ""
        this.cliente.ciudad = ""
        this.cliente.estado = ""
        this.cliente.codPos = ""
        this.cliente.tel1 = ""
        this.cliente.tel2 = ""
        this.cliente.curp = ""
        this.cliente.email = ""
        this.cliente.regFiscal = null
        this.cliente.nuevo = true

        if (opcion == "recno") {
          url += `/${valor}`
        } else {
          url += `/${rfc}`
        }

        this.$axios({
          method: "get",
          url: url,
        }).then(resp => {
          console.log("resp.data", resp.data)
          if (resp.data.response == 200 || resp.data.response == 500) {
            this.cliente.recNo = resp.data.data.recNo
            this.cliente.numero = resp.data.data.mNumero
            this.cliente.razonSocial = resp.data.data.mNombre
            this.cliente.razonSocial1 = resp.data.data.mNombre
            this.cliente.razonSocial2 = resp.data.data.razon01
            this.cliente.domicilio = resp.data.data.mDomi1
            this.cliente.numExterior = resp.data.data.mNumExt
            this.cliente.numInterior = resp.data.data.mNumInt
            this.cliente.colonia = resp.data.data.mDomi2
            this.cliente.ciudad = resp.data.data.mCiudad
            this.cliente.estado = resp.data.data.mEstado
            this.cliente.codPos = resp.data.data.mZP
            this.cliente.tel1 = resp.data.data.mTele1
            this.cliente.tel2 = resp.data.data.mTele2
            this.cliente.curp = resp.data.data.mCurp
            this.cliente.email = resp.data.data.mEmail
            this.cliente.regFiscal = this.regimenesFiscales.find(v => v.substring(0, 3) == resp.data.data.regFiscal)
            this.cliente.regFiscal = (this.cliente.regFiscal == null || this.cliente.regFiscal == undefined) ? '' : this.cliente.regFiscal
            this.cliente.nuevo = (resp.data.response != 200)
          } else {
            this.alert.msg = resp.data.msg
          }
        }).catch(error => {
          this.alert.msg = error
        }).finally(() => {
          this.alert.active = (this.alert.msg != "")
          this.loaders.buscarCliente = false
        })

      } else if (origen == "BUSCAR_CLIENTES") {
        this.loaders.search = true
        this.alert.msg = ""
        this.tabla.clientes = []
        this.$axios({
          method: "get",
          url: `/api/clientes/${this.search}`
        }).then(resp => {
          if (resp.data.response == 200) {
            this.tabla.clientes = resp.data.data
          } else {
            this.alert.msg = `Problemas con el Servidor (${resp.data.response} ${resp.data.msg})`
          }
        }).catch(error => {
          this.alert.msg = error
        }).finally(() => {
          this.loaders.search = false
          this.alert.active = (this.alert.msg != "")
        })

      } else if (origen == "ACTUALIZAR_CLIENTE") {
        this.warning.msg = ''
        const fecha = new Date().toLocaleDateString('en-CA')
        // 1-Jul-2022 obligatorio Régimen fiscal
        if (fecha >= '2022-07-01' && !this.cliente.regFiscal) {
          this.warning.msg = 'El Régimen Fiscal es obligatorio'
          this.warning.active = true
          this.$nextTick(() => {
            this.$refs.regFiscal.focus()
          })
          return
        }
        // Validacion del RFC
        if (this.cliente.rfc == null || this.cliente.rfc == undefined || this.cliente.rfc == '') {
          this.warning.msg = 'Es necesario el RFC del Cliente'
          this.warning.active = true
          this.$nextTick(() => {
            this.$refs.refRfc.focus()
          })
          return
        }
        // Validación de la Razón Social
        if (!this.cliente.razonSocial1) {
          this.warning.msg = 'Es necesaria la Razón Social'
          this.warning.active = true
          this.$nextTick(() => {
            this.$refs.razonSocial1.focus()
          })
          return
        }

        this.cliente.rfc = this.cliente.rfc.toUpperCase()

        let rfc = (this.cliente.rfc.length == 12) ? " " + this.cliente.rfc : this.cliente.rfc
        rfc = `${rfc.substring(0, 4)}-${rfc.substring(4, 10)}-${rfc.substring(10, 13)}`
        this.loaders.grabaCliente = true
        this.alert.msg = ""
        this.alert.type = ""
        this.warning.msg = "" ; this.warning.type = ""
        this.$axios({
          method: "post",
          url: "/api/cliente",
          data: {
            rfc: rfc,
            recno: this.cliente.recNo,
            numero: this.cliente.numero,
            nombre: this.cliente.razonSocial1,
            razon01: this.cliente.razonSocial2,
            domi1: this.cliente.domicilio,
            numExt: this.cliente.numExterior,
            numInt: this.cliente.numInterior,
            domi2: this.cliente.colonia,
            ciudad: this.cliente.ciudad,
            estado: this.cliente.estado,
            zp: this.cliente.codPos,
            tele1: this.cliente.tel1,
            tele2: this.cliente.tel2,
            curp: this.cliente.curp,
            email: this.cliente.email,
            regFiscal: (this.cliente.regFiscal ? this.cliente.regFiscal.substring(0, 3) : '')
          }
        }).then(resp => {
          console.log("resp.data", resp.data)
          if (resp.data.response == 200) {
            this.cliente.nuevo = false
            this.warning.msg = "Cliente actualizado correctamente"
            this.warning.type = "success"
          } else {
            this.alert.msg = resp.data.msg
            this.alert.type = "yellow"
          }
        }).catch(error => {
          this.alert.msg = error
        }).finally(() => {
          this.loaders.grabaCliente = false
          this.alert.active = (this.alert.msg != "")
          this.warning.active = (this.warning.msg != "")
        })

      } else if (origen == 'DLG_SEARCH') {
        this.dlgBuscar = true
        this.$nextTick(() => {
          this.$refs.search.focus()
        })

      } else if (origen == 'ALTERNAR_RAZON_SOCIAL') {
        const razonSocial1 = this.cliente.razonSocial1
        const razonSocial2 = this.cliente.razonSocial2
        this.cliente.razonSocial1 = razonSocial2
        this.cliente.razonSocial2 = razonSocial1

      } else if (origen == "GENERAR_FACTURA") {
        // Validar información obligatoria
        if (!this.facturaOriginal.metodoPago) {
          this.warning.msg = "Es necesario indicar el Método de Pago" ; this.warning.active = true
          this.$nextTick(() => {
            this.$refs.refMetodoPago.focus()
          })
          return
        }
        if (!this.facturaOriginal.formaPago) {
          this.warning.msg = "Es necesario indicar la Forma de Pago" ; this.warning.active = true
          this.$nextTick(() => {
            this.$refs.refFormaPago.focus()
          })
          return
        }
        if (!this.facturaOriginal.usoCfdi) {
          this.warning.msg = "Es necesario indicar el uso del CFDI" ; this.warning.active = true
          this.$nextTick(() => {
            this.$refs.refUsoCfdi.focus()
          })
          return
        }
        if (!this.folio) {
          this.warning.msg = "Es necesario indicar Folio" ; this.warning.active = true
          this.$nextTick(() => {
            this.$refs.refFolio.focus()
          })
          return
        }
        // Información del cliente
        this.facturaOriginal.correo = this.cliente.email
        this.facturaOriginal.idCliente = this.cliente.numero
        this.facturaOriginal.domicilioFiscalReceptor = this.cliente.codPos
        this.facturaOriginal.regimenFiscalReceptor = this.cliente.regFiscal
        this.facturaOriginal.nombre = this.cliente.razonSocial1
        this.facturaOriginal.rfc = this.cliente.rfc
        this.facturaOriginal.serie = this.serie
        let data = this.facturaOriginal
        data.pdfBase64 = ""
        data.xml = ""
        // Factura nueva
        this.factura.folio = this.folio
        this.factura.uuid = ""

        this.loaders.generaFactura = true
        this.alert.msg = "" ; this.alert.type = ""
        this.warning.msg = "" ; this.warning.type = ""
        let cancelaOriginal = false

        this.$axios({
          method: "post",
          url: "/api/facturar",
          data: {
            data: this.creaEstructura(),
            factura: {
              folio: `${this.recibo.caja}${this.recibo.folio.padStart(8, ' ')}`,
              numero: this.cliente.numero,
              nombre: this.cliente.razonSocial1,
              rfc: this.cliente.rfc,
              factura: this.folio,
              fecha: (new Date().toLocaleDateString('fr-FR')),
              importe: this.facturaOriginal.data.Total,
              iva: this.facturaOriginal.data.Impuestos.TotalImpuestosTrasladados,
              tasa0: this.facturaOriginal.bases.exento.base.toFixed(2),
              gravable: this.facturaOriginal.bases.gravable.base.toFixed(2),
              metodoPago: this.facturaOriginal.formaPago,
              usoCfdi: this.facturaOriginal.usoCfdi.substring(0, 3),
              tipoComp: this.facturaOriginal.metodoPago,
              uuid: '',
              uuidRel: this.facturaOriginal.uuid,
              facRel: this.recibo.mFactura
            }
          }
        }).then(resp => {
          console.log("resp.data", resp.data)
          if (resp.data.result.retcode == -1) {
            if (resp.data.result.error) {
              this.alert.msg = resp.data.result.error
            } else if (resp.data.result.result.error) {
              this.alert.msg = resp.data.result.result.error
            } else {
              this.alert.msg = `Mensaje indefinido de iTimbre: ${resp.data.result}`
            }
          } else if (resp.data.result.retcode == 1) {
            cancelaOriginal = true
            this.factura.uuid = resp.data.result.UUID
            this.warning.type = "success"
            this.warning.msg = "Factura generada correctamente"
            let win = window.open()
            win.document.write(`<iframe src="data:application/pdf;base64,${resp.data.result.pdfBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`)
            win.document.title = this.serie + "-" + this.folio
            this.recibo.cancelada = 'S'
          } else {
            this.alert.msg = resp.data.result
          }
        }).catch(error => {
          console.log("Error", error)
          this.alert.msg = error
        }).finally(() => {
          this.loaders.generaFactura = false
          this.alert.active = (this.alert.msg != "")
          this.warning.active = (this.warning.msg != "")
          if (cancelaOriginal) {
            this.cancelaFactura()
          }
        })

      } else if (origen == 'RESET_FORM') {
        //this.$refs.form1.reset()
        //this.$refs.form2.resetValidation()
        //this.$refs.form2.reset()

      }

    }, // onClick()

    onClickRow(item) {
      console.log("item", item)
      this.cliente.rfc = item.mRFC
      this.cliente.recNo = item.recNo
      this.onClick("BUSCAR_CLIENTE", "recno", item.recNo)
      this.dlgBuscar = false

    }, // onClickRow()

    dialogoBuscar() {
      this.dlgBuscar = true
      this.$refs["search"].$refs.input.focus()
    }, // dialogoBuscar()

    onChangeRegimenFiscal(item) {
      this.warning.msg = ''
      this.warning.active = false
    },

    xmlDownload() {
      const element = document.createElement('a')
		  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.facturaOriginal.xml))
		  element.setAttribute('download', `${this.serie}${this.facturaOriginal.folio}.xml`)
		  element.style.display = 'none'
		  document.body.appendChild(element)
		  element.click()
		  document.body.removeChild(element)
/*
      let win = window.open()
      win.document.write(`<iframe src="data:Application/octet-stream,${encodeURIComponent(this.facturaOriginal.xml)}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`)
      win.document.title = this.serie + "-" + this.facturaOriginal.folio
*/
    }, // xmlDownload()

    XmlParse() {
      try {
        this.facturaOriginal.data = {}
        this.facturaOriginal.detalle = []
        let parser = (new DOMParser())
        let xmlDoc = parser.parseFromString(this.facturaOriginal.xml, "text/xml")
        let emisor = xmlDoc.getElementsByTagName("cfdi:Emisor")[0]
        //let receptor = xmlDoc.getElementsByTagName("cfdi:Receptor")[0]
        let data = {
          Emisor: {
            Nombre: emisor.getAttribute("Nombre"),
            RegimenFiscal: emisor.getAttribute("RegimenFiscal"),
            Rfc: emisor.getAttribute("Rfc")
          },
          Serie: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Serie"),
          Folio: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Folio"),
          MetodoPago: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("MetodoPago"),
          FormaPago: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("FormaPago"),
          CondicionesDePago: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("CondicionesDePago"),
          Nombre: xmlDoc.getElementsByTagName("cfdi:Receptor")[0].getAttribute("Nombre"),
          Rfc: xmlDoc.getElementsByTagName("cfdi:Receptor")[0].getAttribute("Rfc"),
          UsoCFDI: xmlDoc.getElementsByTagName("cfdi:Receptor")[0].getAttribute("UsoCFDI"),
          Version: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Version"),
          Fecha: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Fecha"),
          FechaTimbrado: xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0].getAttribute("FechaTimbrado"),
          NoCertificado: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("NoCertificado"),
          LugarExpedicion: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("LugarExpedicion"),
          cfdiVersion: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Version"),
          RfcProvCertif: xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0].getAttribute("RfcProvCertif"),
          uuid: xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0].getAttribute("UUID"),
          //Sello: xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0].getAttribute("SelloCFD"),
          //SelloSAT: xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0].getAttribute("SelloSAT"),
          versionXML: xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0].getAttribute("Version"),
          NoCertificadoSAT: xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0].getAttribute("NoCertificadoSAT"),
          SubTotal: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("SubTotal"),
          Total: xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Total"),
        }
        let children = xmlDoc.getElementsByTagName("cfdi:Conceptos")[0]
        let traslados = xmlDoc.getElementsByTagName("cfdi:Traslados")
        // Información importante
        //console.log("traslados", traslados.childNodes) // Dentro del nodo Conceptos (detalle)
        //console.log("traslados[0]", traslados[0]) // En la sección de sumas de impuestos
        //console.log("traslados[1]", traslados[1]) // En la sección de sumas de impuestos
        //console.log("traslados[2]", traslados[2]) // En la sección de sumas de impuestos

        //data.TotalImpuestosRetenidos = "0.00"
        data.TotalImpuestosTrasladados = 0
        let detalle = []
        let tasa = {
          exento: { base: 0, suma: 0, factor: 0, incluir: false },
          gravable: { base: 0, suma: 0, factor: 0, incluir: false }
        }
        for (let index = 0;index < children.childElementCount; index++) {
          let child = children.childNodes[index]
          let descuento = (child.getAttribute("Descuento") ? child.getAttribute("Descuento") : "0.00")
          let tasaOCuota = traslados[index].childNodes[0].getAttribute("TasaOCuota")
          if (Number(tasaOCuota) == 0) {
            tasa.exento.base += Number(traslados[index].childNodes[0].getAttribute("Base"))
            tasa.exento.suma += Number(traslados[index].childNodes[0].getAttribute("Importe"))
            tasa.exento.factor = tasaOCuota
            tasa.exento.incluir = true
          } else {
            tasa.gravable.base += Number(traslados[index].childNodes[0].getAttribute("Base"))
            tasa.gravable.suma += Number(traslados[index].childNodes[0].getAttribute("Importe"))
            tasa.gravable.factor = tasaOCuota
            tasa.gravable.incluir = true
          }
          detalle.push({
            Cantidad: child.getAttribute("Cantidad"),
            ClaveProdServ: child.getAttribute("ClaveProdServ"),
            ClaveUnidad: child.getAttribute("ClaveUnidad"),
            Descripcion: child.getAttribute("Descripcion"),
            Descuento: descuento,
            Importe: child.getAttribute("Importe"),
            NoIdentificacion: child.getAttribute("NoIdentificacion"),
            Unidad: child.getAttribute("Unidad"),
            ValorUnitario: child.getAttribute("ValorUnitario"),
            subTotal: child.getAttribute("Importe"),
            total: (Number(child.getAttribute("Importe")) - Number(descuento)).toString(),
            ObjetoImp: "02",
            Impuestos: {
              Traslados: [
                {
                  Base: traslados[index].childNodes[0].getAttribute("Base"),
                  Importe: traslados[index].childNodes[0].getAttribute("Importe"),
                  Impuesto: traslados[index].childNodes[0].getAttribute("Impuesto"),
                  TasaOCuota: tasaOCuota,
                  TipoFactor: traslados[index].childNodes[0].getAttribute("TipoFactor")
                }
              ]
            },
            totalNeto: (Number(child.getAttribute("Importe")) - Number(descuento) + Number(traslados[index].childNodes[0].getAttribute("Importe")) ).toString()
          })
          data.TotalImpuestosTrasladados += Number( traslados[index].childNodes[0].getAttribute("Importe") )
        }

        data.Impuestos = {
          //TotalImpuestosRetenidos: "0.00",
          TotalImpuestosTrasladados: data.TotalImpuestosTrasladados.toString(),
          Traslados: []
        }
        // Gravable
        if (tasa.gravable.incluir) {
          data.Impuestos.Traslados.push({
            Base: tasa.gravable.base.toFixed(2),
            Impuesto: "002",
            TipoFactor: "Tasa",
            TasaOCuota: tasa.gravable.factor,
            Importe: tasa.gravable.suma.toFixed(2)
          })
        }
        // Exentos
        if (tasa.exento.incluir) {
          data.Impuestos.Traslados.push({
            Base: tasa.exento.base.toFixed(2),
            Impuesto: "002",
            TipoFactor: "Tasa",
            TasaOCuota: tasa.exento.factor,
            Importe: tasa.exento.suma.toFixed(2)
          })
        }
        data.detalle = detalle
        this.facturaOriginal.data = data
        this.facturaOriginal.bases = tasa
console.log('data....', this.facturaOriginal.data)
        this.tablaFactura.items = data.detalle
        this.cliente.rfc = data.Rfc
        // Método de Pago original (default para v-select)
        let index
        index = this.utils.metodosDePago.findIndex(v => v == data.MetodoPago )
        this.facturaOriginal.metodoPago = (index >= 0) ? this.utils.metodosDePago[index] : null
        // Forma de Pago original (default para v-select)s
        index = this.utils.formasDePago.findIndex(v => v.substring(0, 2) == data.FormaPago )
        this.facturaOriginal.formaPago = (index >= 0) ? this.utils.formasDePago[index] : null
        // Uso del CFDI
        index = this.utils.usosCfdi.findIndex(v => v.substring(0, 3) == data.UsoCFDI)
        this.facturaOriginal.usoCfdi = (index >= 0) ? this.utils.usosCfdi[index] : null
        // Condiciones de pago
        this.facturaOriginal.condiciones = data.CondicionesDePago

        this.onClick('BUSCAR_CLIENTE')
      } catch (error) {
        console.log("Error", error)
        this.warning.msg = error
        this.warning.active = true
      }

    }, // XmlParse()

    sumField(key) {
      let suma = this.utils.formatNumber(this.tablaFactura.items.reduce( (a, b) => a + (b[ key ] || 0), 0))
      return this.utils.formatNumber(this.tablaFactura.items.reduce( (a, b) => a + (b[ key ] || 0), 0))
    }, // sumField()

    onChange(item) {
    },

    creaEstructura () {
      this.siguienteFactura()  // Leer el siguiente folio en FacCli02.dbf
      return {
        id_transaccion: 0,
        cliente: {
          id: this.cliente.numero,
          UsoCFDI: this.facturaOriginal.usoCfdi.substring(3, 0),
          nombre: this.cliente.razonSocial1,
          rfc: this.cliente.rfc,
          DomicilioFiscalReceptor: this.cliente.codPos,
          RegimenFiscalReceptor: this.cliente.regFiscal.substring(0, 3),
          correo: this.cliente.email,
        },
        datos_factura: {
          Serie: this.serie,
          Folio: this.folio,
          Version: "4.0",
          cfdiVersion: "4.0",
          FormaPago: this.facturaOriginal.formaPago.substring(0, 2),
          TipoCambio: "1",
          MetodoPago: this.facturaOriginal.metodoPago,
          RegimenFiscal: this.facturaOriginal.data.Emisor.RegimenFiscal,
          LugarExpedicion: this.facturaOriginal.data.LugarExpedicion,
          Moneda: "MXN",
          TipoDeComprobante: "I",
          Exportacion: "01",
          CondicionesDePago: this.facturaOriginal.condiciones,
          no_sucursal: "0",
          SubTotal: this.facturaOriginal.data.SubTotal,
          Total: this.facturaOriginal.data.Total,
          Impuestos: this.facturaOriginal.data.Impuestos,
          CfdiRelacionados: [
            {
              TipoRelacion: "04",   // Sustituci'on de los CFDI previos
              CfdiRelacionado: [
                {
                  UUID: this.facturaOriginal.uuid
                }
              ]
            }
          ],
        },
        conceptos: this.facturaOriginal.data.detalle,
        comentarios: `Caja-Folio: ${this.recibo.cajaFolio} | ${this.recibo.fecha} | Cajero ${this.recibo.cajero} | Vendedor ${this.recibo.vendedor} | Cuenta ${this.recibo.cuenta}`
      } // return

    }, // creaEstructura()

    async siguienteFactura() {
      let response = await this.$axios({
        method: "get",
        url: `${config.backEndUrl}/gusher/ws.prg?mod=siguiente-factura`  //"/api/siguiente-factura"
      })
      this.folio = response.data.data.folio
    }, // siguienteFactura()

    cancelaFactura() {
      this.loaders.generaFactura = true
      this.alert.msg = ""
      this.warning.msg = ""
      this.$axios({
        method: 'post',
        url: `/api/cancelarFactura`,
        data: {
          dataPac: {
            uuid: this.facturaOriginal.uuid,
            Motivo: this.motivoCancelacion.substring(0, 2),
            FolioSustitucion: this.factura.uuid
          },
          dataFact: {
            factura: this.facturaOriginal.folio.padStart(8, "0") ,
            facRel: this.folio.padStart(8, "0"),
            motivoCanc: this.motivoCancelacion.substring(0, 2),
            motivo: `${this.motivoCancelacion.substring(0, 2)} - Datos Incorrectos del Cliente`,
            uuidRel: this.factura.uuid,
            usuario: this.usuario
          }
        }
      }).then(resp => {
        console.log("cancelaFactura() resp.data", resp.data)
        if (resp.data.result.retcode == -1) {
          if (resp.data.result.error) {
            this.alert.msg = resp.data.result.error
          } else if (resp.data.result.result.error) {
            this.alert.msg = resp.data.result.result.error
          } else {
            this.alert.msg = `Mensaje indefinido de iTimbre: ${resp.data.result}`
          }
        } else if (resp.data.result.retcode == 1) {
          this.warning.type = "success"
          if (resp.data.result.folios) {
            this.warning.msg = resp.data.result.folios[0]
          } else {
            this.warning.msg = "Cancelación realizada correctamente"
          }
        } else {
          this.warning.msg = resp.data.result ; this.warning.type = 'yellow'
          this.alert.msg = resp.data.result ; this.alert.type = 'yellow'
        }
      }).catch(error => {
        console.log("Error", error)
        this.alert.msg = error
      }).finally(() => {
        this.loaders.generaFactura = false
        this.alert.active = (this.alert.msg != "")
        this.warning.active = (this.warning.msg != "")
      })
    }, // cancelaFactura()

  }, // methods:
}
</script>

<style>
/* width */
::-webkit-scrollbar {
  width: 8px;
}

/* Track */
::-webkit-scrollbar-track {
  /*box-shadow: inset 0 0 5px grey; */
  border-radius: 10px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #A4A4A4;
  border-radius: 10px;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #777777;
}

/* Esconder el "spinner" del Input type="number" */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    /* display: none; <- Crashes Chrome on hover */
    -webkit-appearance: none;
    margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
}

input[type=number] {
    -moz-appearance:textfield; /* Firefox */
}

tbody, tr {
  cursor: pointer;
}
 </style>
