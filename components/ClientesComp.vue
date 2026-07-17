<template>

  <div>
    <v-form class="ma-2" ref="frmCliente" v-model="forms.cliente">
      <v-row>
        <v-col md="1">
          <v-tooltip bottom>
            <template v-slot:activator="{on, attrs}" >
              <v-btn
                color="primary"
                dark
                fab
                @click="onClick('DLG_SEARCH')"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
            </template>
            <span>Consulta de Clientes</span>
          </v-tooltip>
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
            autofocus
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
            id="razonSocial1"
            @blur="cliente.razonSocial1 = cliente.razonSocial1.trim()"
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
            @blur="cliente.razonSocial2 = cliente.razonSocial2.trim()"
          />
        </v-col>
      </v-row>
      <v-row class="my-0 py-0">
        <v-col md="12">
          <v-text-field
            class="txt-input"
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
    <v-dialog
      v-model="dlgBuscar"
      scrollable
      :overlay="false"
      max-width="620px"
      transition="dialog-transition"
    >
      <v-card
        class=""
        elevation="24"
        max-width=""
      >
        <v-system-bar
          class="mb-2 pa-4"
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
            label="Buscar..."
            background-color="oscuro"
            dense
            solo
            hide-details=""
            ref="search"
            id="buscar"
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
              class="row-select elevation-8"
              item-key="recNo"
              :loading="loaders.search"
              loading-text="Leyendo..."
              no-data-text="No se encontraron registros"
              dense
              @click:row="onClickRow"
            >
            </v-data-table>
          </v-card-text>
        </v-card-text>
      </v-card>
    </v-dialog>

    <snack-bar ref="snackBar" />

  </div>
</template>

<script>
import Utils from '../assets/utils'
import SnackBar from '../components/SnackBar.vue'
export default {
  components: {
    SnackBar
  },
  data () {
    return {
      forms: {
        cliente: false
      },
      loaders: {
        search: false,
        buscarCliente: false,
      },
      dlgBuscar: false,
      search: "",
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
        },
      },
      alert: {
        active: false,
        msg: "",
        type: ""
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
      regimenesFiscales: [],
      utils: new Utils(),
      warning: {
        active: false,
        msg: '',
        type: ''
      },

    } // return {}
  }, // data()
  mounted() {
    this.regimenesFiscales = this.utils.regimenesFiscales
  }, // mounted()
  methods: {
    onClick(origen, opcion = "rfc", valor = "") {
      if (origen == 'DLG_SEARCH') {
        this.dlgBuscar = true
        setTimeout(() => {
          document.getElementById("buscar").focus()
        }, 500)
        // origen == 'DLG_SEARCH'

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
            setTimeout(() => {
              document.getElementById('razonSocial1').focus()
            }, 500);
          } else {
            this.alert.msg = resp.data.msg
          }
        }).catch(error => {
          this.alert.msg = error
        }).finally(() => {
          this.alert.active = (this.alert.msg != "")
          this.loaders.buscarCliente = false
        }) //  BUSCAR_CLIENTE
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
        // origen = BUSCAR_CLIENTES
      } else if (origen == "ACTUALIZAR_CLIENTE") {
        this.warning.msg = ''
        const fecha = new Date().toLocaleDateString('en-CA')
        // 1-Jul-2022 obligatorio Régimen fiscal
        if (fecha >= '2022-11-01' && !this.cliente.regFiscal) {  // if (fecha >= '2022-07-01' && !this.cliente.regFiscal) {
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
            this.$emit('facturasClientesComp', this.cliente)  // emito la información a /facturas
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
          if (this.warning.active) {
            setTimeout(() => {
              this.warning.active = false
            }, 5000)
          }
        })
        // ACTUALIZAR_CLIENTE

      } else if (origen == 'ALTERNAR_RAZON_SOCIAL') {
        const razonSocial1 = this.cliente.razonSocial1
        const razonSocial2 = this.cliente.razonSocial2
        this.cliente.razonSocial1 = razonSocial2
        this.cliente.razonSocial2 = razonSocial1

      }
    }, // onClick()
    onClickRow(item) {
      this.dlgBuscar = false
      this.cliente.rfc = item.mRFC
      this.cliente.recNo = item.recNo
      this.onClick("BUSCAR_CLIENTE", "recno", item.recNo)
      this.dlgBuscar = false
      //this.$emit('tblCustomerSelect', item)
    }, // onClickRow()
    onChangeRegimenFiscal(item) {
      this.warning.msg = ''
      this.warning.active = false
    }, // onChangeRegimenFiscal()
  },
}
</script>
<style scoped>
.row-select >>> tbody tr :hover {
  cursor: pointer;
}
.v-text-field >>> input {
  font-size: 0.9rem;
}
</style>
