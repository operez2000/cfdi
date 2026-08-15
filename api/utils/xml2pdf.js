import path from 'path'
import fs from 'fs'
import xml2js from 'xml2js'
import PdfPrinter from 'pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts.js'

// Inicializar fuentes de pdfmake usando vfs embebido
const vfsObj = (vfsFonts && vfsFonts.pdfMake && vfsFonts.pdfMake.vfs)
  ? vfsFonts.pdfMake.vfs
  : (vfsFonts && vfsFonts.vfs ? vfsFonts.vfs : vfsFonts)

const fonts = {
  Roboto: {
    normal: Buffer.from(vfsObj['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(vfsObj['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(vfsObj['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(vfsObj['Roboto-MediumItalic.ttf'], 'base64')
  }
}

const printer = new PdfPrinter(fonts)

// Cargar Logo institucional en Base64
let logoBase64 = null
try {
  const logoPath = path.resolve(process.cwd(), 'public/logo.png')
  if (fs.existsSync(logoPath)) {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
  }
} catch (e) {
  console.warn('No se pudo cargar public/logo.png:', e.message)
}

// Catálogos auxiliares SAT
const CATALOGOS = {
  tipoComprobante: {
    I: 'I - Ingreso',
    E: 'E - Egreso',
    T: 'T - Traslado',
    N: 'N - Nómina',
    P: 'P - Pago'
  },
  metodoPago: {
    PUE: 'PUE - Pago en una sola exhibición',
    PPD: 'PPD - Pago en parcialidades o diferido'
  },
  formaPago: {
    '01': '01 - Efectivo',
    '02': '02 - Cheque nominativo',
    '03': '03 - Transferencia electrónica de fondos',
    '04': '04 - Tarjeta de crédito',
    '05': '05 - Monedero electrónico',
    '06': '06 - Dinero electrónico',
    '08': '08 - Vales de despensa',
    '12': '12 - Dación en pago',
    '13': '13 - Pago por subrogación',
    '14': '14 - Pago por consignación',
    '15': '15 - Condonación',
    '17': '17 - Compensación',
    '28': '28 - Tarjeta de débito',
    '29': '29 - Tarjeta de servicios',
    '30': '30 - Aplicación de anticipos',
    '31': '31 - Intermediario pagos',
    '99': '99 - Por definir'
  },
  usoCfdi: {
    G01: 'G01 - Adquisición de mercancías',
    G02: 'G02 - Devoluciones, descuentos o bonificaciones',
    G03: 'G03 - Gastos en general',
    I01: 'I01 - Construcciones',
    I02: 'I02 - Mobilario y equipo de oficina por inversiones',
    I03: 'I03 - Equipo de transporte',
    I04: 'I04 - Equipo de computo y accesorios',
    I08: 'I08 - Otra maquinaria y equipo',
    D01: 'D01 - Honorarios médicos, dentales y gastos hospitalarios',
    D02: 'D02 - Gastos médicos por incapacidad o discapacidad',
    D04: 'D04 - Donativos',
    D07: 'D07 - Primas por seguros de gastos médicos',
    D08: 'D08 - Gastos de transportación escolar obligatoria',
    D10: 'D10 - Pagos por servicios educativos (colegiaturas)',
    S01: 'S01 - Sin efectos fiscales',
    CP01: 'CP01 - Pagos',
    CN01: 'CN01 - Nómina'
  },
  regimenFiscal: {
    '601': '601 - General de Ley Personas Morales',
    '603': '603 - Personas Morales con Fines no Lucrativos',
    '605': '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios',
    '606': '606 - Arrendamiento',
    '607': '607 - Régimen de Enajenación o Adquisición de Bienes',
    '608': '608 - Demás ingresos',
    '610': '610 - Residentes en el Extranjero sin Establecimiento Permanente en México',
    '611': '611 - Ingresos por Dividendos (socios y accionistas)',
    '612': '612 - Personas Físicas con Actividades Empresariales y Profesionales',
    '614': '614 - Ingresos por intereses',
    '615': '615 - Régimen de los ingresos por obtención de premios',
    '616': '616 - Sin obligaciones fiscales',
    '620': '620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
    '621': '621 - Incorporación Fiscal',
    '622': '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
    '623': '623 - Opcional para Grupos de Sociedades',
    '624': '624 - Coordinados',
    '625': '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
    '626': '626 - Régimen Simplificado de Confianza'
  },
  tipoRelacion: {
    '01': '01 - Nota de crédito de los documentos relacionados',
    '02': '02 - Nota de débito de los documentos relacionados',
    '03': '03 - Devolución de mercancía sobre facturas o traslados previos',
    '04': '04 - Sustitución de los CFDI previos',
    '05': '05 - Traslados de mercancías facturados previamente',
    '06': '06 - Factura generada por los traslados previos',
    '07': '07 - CFDI por aplicación de anticipo'
  }
}

// Sucursales Gusher
const SUCURSALES = [
  {
    nombre: 'MATRIZ PLAZA RIO',
    direccion: 'Av. PASEO DE LOS HEROES 9550 27 B\nZONA URBANA RIO TIJUANA\nTIJUANA B.C C.P.22010\n(664) 684-0235 Y (664) 684-0229'
  },
  {
    nombre: 'OTAY',
    direccion: 'CALZADA TECNOLÓGICO 2100-63\nCOL. NUEVA TIJUANA\nTIJUANA B.C C.P.22435\n(664) 624-3291 Y (664) 624-3296'
  },
  {
    nombre: 'PALMAS',
    direccion: 'BLVD DIAZ ORDAZ 13251-A\nCOL. LA ESCONDIDA\nTIJUANA B.C C.P.22106\n(664) 608-9333 Y (664) 608-9331'
  },
  {
    nombre: 'ROSARITO',
    direccion: 'BLVD BENITO JUAREZ 339\nHACIENDA FLORESTA\nPLAYAS DE ROSARITO B.C. C.P.22703\n(661) 612-1722 Y (661) 612-1845'
  },
  {
    nombre: 'MONARCA',
    direccion: 'BLVD. MANUEL J. CLOUTHIER 18561-C16\nFRACC. EL LAGO\nTIJUANA B.C. C.P 22210\n(664) 903-4300 Y (664) 903-4100'
  }
]

// Formateador numérico
function formatMoney(amount, decimals = 2) {
  const num = Number(amount) || 0
  return '$ ' + num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatNumberRaw(amount, decimals = 2) {
  const num = Number(amount) || 0
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

// Formateador de fechas CFDI (ISO a DD/MM/YYYY HH:mm:ss)
function formatCfdiDate(str) {
  if (!str) return ''
  const clean = String(str).replace('T', ' ')
  const [datePart, timePart] = clean.split(' ')
  if (!datePart) return str
  const parts = datePart.split('-')
  if (parts.length === 3) {
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`
    return timePart ? `${formatted} ${timePart}` : formatted
  }
  return str
}

// Conversor de Número a Letras en Español para Importes Fiscales
function numeroALetras(monto, moneda = 'MXN') {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
  const decenas = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
  const decenasMultiplo = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

  function convertirGrupo(n) {
    let output = ''
    if (n === 100) return 'CIEN'
    if (n > 99) {
      output += centenas[Math.floor(n / 100)] + ' '
      n %= 100
    }
    if (n >= 10 && n <= 19) {
      output += decenas[n - 10] + ' '
      return output.trim()
    }
    if (n >= 20 && n <= 29) {
      if (n === 20) output += 'VEINTE '
      else output += 'VEINTI' + unidades[n % 10] + ' '
      return output.trim()
    }
    if (n > 29) {
      output += decenasMultiplo[Math.floor(n / 10)] + ' '
      n %= 10
      if (n > 0) output += 'Y '
    }
    if (n > 0 && n < 10) {
      output += unidades[n] + ' '
    }
    return output.trim()
  }

  function convertirEntero(num) {
    if (num === 0) return 'CERO'
    let millones = Math.floor(num / 1000000)
    let miles = Math.floor((num % 1000000) / 1000)
    let resto = num % 1000
    let res = ''

    if (millones > 0) {
      res += (millones === 1 ? 'UN MILLON ' : convertirGrupo(millones) + ' MILLONES ')
    }
    if (miles > 0) {
      res += (miles === 1 ? 'MIL ' : convertirGrupo(miles) + ' MIL ')
    }
    if (resto > 0) {
      res += convertirGrupo(resto) + ' '
    }
    return res.trim()
  }

  const numVal = Math.abs(Number(monto) || 0)
  const entero = Math.floor(numVal)
  const centavos = Math.round((numVal - entero) * 100)
  const strCentavos = String(centavos).padStart(2, '0') + '/100'

  const letras = convertirEntero(entero)
  const sufijoMoneda = (moneda === 'USD') ? 'USD' : 'MXN'
  const nombreMoneda = (moneda === 'USD') ? (entero === 1 ? 'DOLAR' : 'DOLARES') : (entero === 1 ? 'PESO' : 'PESOS')

  return `(${letras} ${nombreMoneda} ${strCentavos} ${sufijoMoneda})`
}

/**
 * Parsea el XML de CFDI y extrae todos los datos estructurados.
 */
export async function parseCfdiXml(xmlString) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    ignoreAttrs: false,
    mergeAttrs: true
  })

  const raw = await parser.parseStringPromise(xmlString)

  // Obtener Comprobante (con o sin namespace)
  const comp = raw['cfdi:Comprobante'] || raw.Comprobante || {}

  // Emisor
  const emisor = comp['cfdi:Emisor'] || comp.Emisor || {}

  // Receptor
  const receptor = comp['cfdi:Receptor'] || comp.Receptor || {}

  // Conceptos
  const conceptosWrapper = comp['cfdi:Conceptos'] || comp.Conceptos || {}
  let conceptosList = []
  if (conceptosWrapper['cfdi:Concepto']) {
    conceptosList = Array.isArray(conceptosWrapper['cfdi:Concepto'])
      ? conceptosWrapper['cfdi:Concepto']
      : [conceptosWrapper['cfdi:Concepto']]
  } else if (conceptosWrapper.Concepto) {
    conceptosList = Array.isArray(conceptosWrapper.Concepto)
      ? conceptosWrapper.Concepto
      : [conceptosWrapper.Concepto]
  }

  // Timbre Fiscal Digital
  const complemento = comp['cfdi:Complemento'] || comp.Complemento || {}
  const tfd = complemento['tfd:TimbreFiscalDigital'] || complemento.TimbreFiscalDigital || {}

  // CFDI Relacionados
  const cfdiRelacionadosWrapper = comp['cfdi:CfdiRelacionados'] || comp.CfdiRelacionados || {}
  let cfdiRelacionadosList = []
  let tipoRelacionRaw = cfdiRelacionadosWrapper.TipoRelacion || ''
  if (cfdiRelacionadosWrapper['cfdi:CfdiRelacionado']) {
    const list = Array.isArray(cfdiRelacionadosWrapper['cfdi:CfdiRelacionado'])
      ? cfdiRelacionadosWrapper['cfdi:CfdiRelacionado']
      : [cfdiRelacionadosWrapper['cfdi:CfdiRelacionado']]
    cfdiRelacionadosList = list.map(item => item.UUID || item)
  } else if (cfdiRelacionadosWrapper.CfdiRelacionado) {
    const list = Array.isArray(cfdiRelacionadosWrapper.CfdiRelacionado)
      ? cfdiRelacionadosWrapper.CfdiRelacionado
      : [cfdiRelacionadosWrapper.CfdiRelacionado]
    cfdiRelacionadosList = list.map(item => item.UUID || item)
  }

  // Impuestos globales
  const impuestosWrapper = comp['cfdi:Impuestos'] || comp.Impuestos || {}
  const trasladosGlobalWrapper = impuestosWrapper['cfdi:Traslados'] || impuestosWrapper.Traslados || {}
  let trasladosGlobal = []
  if (trasladosGlobalWrapper['cfdi:Traslado']) {
    trasladosGlobal = Array.isArray(trasladosGlobalWrapper['cfdi:Traslado'])
      ? trasladosGlobalWrapper['cfdi:Traslado']
      : [trasladosGlobalWrapper['cfdi:Traslado']]
  } else if (trasladosGlobalWrapper.Traslado) {
    trasladosGlobal = Array.isArray(trasladosGlobalWrapper.Traslado)
      ? trasladosGlobalWrapper.Traslado
      : [trasladosGlobalWrapper.Traslado]
  }

  // Mapear Conceptos con sus impuestos
  const items = conceptosList.map(c => {
    const cantidad = Number(c.Cantidad) || 1
    const valorUnitario = Number(c.ValorUnitario) || 0
    const importe = Number(c.Importe) || 0
    const descuento = Number(c.Descuento) || 0
    const subTotalBase = importe - descuento

    // Impuestos del concepto
    let impuestoTexto = ''
    let impuestoTasa = 0
    let impuestoImporte = 0
    const cImpuestos = c['cfdi:Impuestos'] || c.Impuestos || {}
    const cTraslados = cImpuestos['cfdi:Traslados'] || cImpuestos.Traslados || {}
    let listTras = []
    if (cTraslados['cfdi:Traslado']) {
      listTras = Array.isArray(cTraslados['cfdi:Traslado']) ? cTraslados['cfdi:Traslado'] : [cTraslados['cfdi:Traslado']]
    } else if (cTraslados.Traslado) {
      listTras = Array.isArray(cTraslados.Traslado) ? cTraslados.Traslado : [cTraslados.Traslado]
    }

    if (listTras.length > 0) {
      const t = listTras[0]
      const impNom = (t.Impuesto === '002' || !t.Impuesto) ? '002-IVA' : t.Impuesto
      impuestoTasa = Number(t.TasaOCuota) || 0
      impuestoImporte = Number(t.Importe) || 0
      impuestoTexto = `${impNom}\n${(impuestoTasa * 100).toFixed(2)}%\n${formatNumberRaw(impuestoImporte, 2)}`
    } else {
      impuestoTexto = '002-IVA\n0.00%\n0.00'
    }

    const totalItem = subTotalBase + impuestoImporte

    return {
      cantidad: formatNumberRaw(cantidad, 0),
      codigo: c.NoIdentificacion || '',
      claveUnidad: c.ClaveUnidad || '',
      unidad: c.Unidad || '',
      claveProdServ: c.ClaveProdServ || '',
      concepto: c.Descripcion || '',
      precioUnitario: formatNumberRaw(valorUnitario, 2),
      importe: formatNumberRaw(importe, 2),
      descuento: descuento > 0 ? formatNumberRaw(descuento, 2) : '',
      descuentoNum: descuento,
      subTotalBase: formatNumberRaw(subTotalBase, 2),
      subTotalBaseNum: subTotalBase,
      impuesto: impuestoTexto,
      impuestoTasa,
      impuestoImporte,
      total: formatNumberRaw(totalItem, 2)
    }
  })

  // Agrupación de bases por tasa para desglose
  let ventasExento = 0
  let ventas0 = 0
  let ventas8 = 0
  let ventas16 = 0

  items.forEach(it => {
    if (it.impuestoTasa === 0.08) {
      ventas8 += it.subTotalBaseNum
    } else if (it.impuestoTasa === 0.16) {
      ventas16 += it.subTotalBaseNum
    } else if (it.impuestoTasa === 0) {
      ventas0 += it.subTotalBaseNum
    }
  })

  // Si hay traslados globales explícitos
  trasladosGlobal.forEach(tg => {
    const tasa = Number(tg.TasaOCuota) || 0
    const base = Number(tg.Base) || 0
    if (tasa === 0.08 && base > 0) ventas8 = base
    if (tasa === 0.16 && base > 0) ventas16 = base
    if (tasa === 0 && base > 0) ventas0 = base
  })

  const subTotal = Number(comp.SubTotal) || 0
  const descuentoTotal = Number(comp.Descuento) || 0
  const totalImpuestosTrasladados = Number(comp.TotalImpuestosTrasladados || impuestosWrapper.TotalImpuestosTrasladados) ||
    items.reduce((acc, it) => acc + it.impuestoImporte, 0)
  const total = Number(comp.Total) || 0

  const moneda = comp.Moneda || 'MXN'
  const monedaTexto = moneda === 'MXN' ? 'MXN - Peso Mexicano' : (moneda === 'USD' ? 'USD - Dólar Americano' : moneda)

  // Tipo Comprobante
  const tipoCompCode = comp.TipoDeComprobante || 'I'
  const tipoCompTexto = CATALOGOS.tipoComprobante[tipoCompCode] || tipoCompCode

  // Título Comprobante
  const serie = comp.Serie || ''
  const folio = comp.Folio || ''
  let tituloComprobante = `CFDI # ${serie}${folio}`
  if (tipoCompCode === 'E') {
    tituloComprobante = `NOTA DE CREDITO # ${serie}${folio}`
  } else if (receptor.Rfc === 'XAXX010101000' || comp['cfdi:InformacionGlobal'] || comp.InformacionGlobal) {
    tituloComprobante = `FACTURA # ${serie}${folio}`
  }

  // Cadena Original del SAT
  const uuid = tfd.UUID || ''
  const fechaTimbrado = tfd.FechaTimbrado || ''
  const rfcProvCertif = tfd.RfcProvCertif || 'PPD101129EA3'
  const selloCFD = tfd.SelloCFD || comp.Sello || ''
  const noCertificadoSAT = tfd.NoCertificadoSAT || ''
  const selloSAT = tfd.SelloSAT || ''
  const cadenaOriginal = `||1.1|${uuid}|${fechaTimbrado}|${rfcProvCertif}|${selloCFD}|${noCertificadoSAT}||`

  // Código QR SAT URL
  const rfcEmisor = emisor.Rfc || 'FGU811107SV0'
  const rfcReceptor = receptor.Rfc || ''
  const totalStr = total.toFixed(6)
  const sello8 = selloCFD.length >= 8 ? selloCFD.substring(selloCFD.length - 8) : selloCFD
  const qrUrl = `verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${uuid}&re=${rfcEmisor}&rr=${rfcReceptor}&tt=${totalStr}&fe=${sello8}`
  // https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=F325CEF4-D97C-42D5-BB64-F6DBC54B3234&re=FGU811107SV0&rr=XAXX010101000&tt=387.18&fe=OerVqA==


  // Observaciones en XML (Addenda, Comprobante o InformacionGlobal)
  let autoObservaciones = comp.Observaciones || comp.comentarios || comp['cfdi:Observaciones'] || ''
  const addenda = comp['cfdi:Addenda'] || comp.Addenda || {}
  if (!autoObservaciones && addenda) {
    if (typeof addenda === 'string') {
      autoObservaciones = addenda.trim()
    } else if (typeof addenda === 'object') {
      autoObservaciones = addenda.Observaciones || addenda.observaciones || addenda.comentarios || addenda.texto || addenda['#text'] || ''
    }
  }
  if (!autoObservaciones && (comp['cfdi:InformacionGlobal'] || comp.InformacionGlobal || receptor.Rfc === 'XAXX010101000')) {
    if (comp.Fecha) {
      const mesesNom = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const fParts = String(comp.Fecha).split('T')[0].split('-')
      if (fParts.length === 3) {
        const d = fParts[2]
        const m = mesesNom[parseInt(fParts[1], 10) - 1] || fParts[1]
        const y = fParts[0]
        autoObservaciones = `Factura Global del ${d}/${m}/${y}`
      }
    }
  }

  return {
    version: comp.Version || '4.0',
    serie,
    folio,
    tituloComprobante,
    tipoDeComprobante: tipoCompTexto,
    fechaEmision: formatCfdiDate(comp.Fecha),
    noCertificado: comp.NoCertificado || '',
    lugarExpedicion: comp.LugarExpedicion ? `${comp.LugarExpedicion} - BCN` : '22010 - BCN',
    condicionesDePago: comp.CondicionesDePago || 'Contado',
    metodoPago: CATALOGOS.metodoPago[comp.MetodoPago] || comp.MetodoPago || 'PUE - Pago en una sola exhibición',
    formaPago: CATALOGOS.formaPago[comp.FormaPago] || comp.FormaPago || '',
    moneda: monedaTexto,
    tipoCambio: comp.TipoCambio || '1.0000',
    observaciones: autoObservaciones,
    emisor: {
      rfc: rfcEmisor,
      nombre: emisor.Nombre || 'FARMACIA GUSHER',
      regimenFiscal: CATALOGOS.regimenFiscal[emisor.RegimenFiscal] || emisor.RegimenFiscal || '601 - General de Ley Personas Morales',
      sucursal: 'SUCURSAL: RIO',
      direccion: 'Av Paseo de los Heroes 9550 27 B, Zona Urbana Rio Tijuana\nTijuana, Baja California México C.P. 22010\nTeléfono: 664 684 02 35 Y 664 684 02 29'
    },
    receptor: {
      numeroCliente: receptor.NumRegIdTrib || receptor.id || receptor.NumeroCliente || '0',
      nombre: receptor.Nombre || '',
      rfc: rfcReceptor,
      regimenFiscal: CATALOGOS.regimenFiscal[receptor.RegimenFiscalReceptor] || receptor.RegimenFiscalReceptor || '',
      usoCfdi: CATALOGOS.usoCfdi[receptor.UsoCFDI] || receptor.UsoCFDI || '',
      domicilioFiscal: receptor.DomicilioFiscalReceptor || ''
    },
    cfdiRelacionados: {
      tipoRelacion: CATALOGOS.tipoRelacion[tipoRelacionRaw] || tipoRelacionRaw || '',
      uuids: cfdiRelacionadosList
    },
    items,
    ventasExento,
    ventas0,
    ventas8,
    ventas16,
    subTotal,
    descuentoTotal,
    totalImpuestosTrasladados,
    total,
    totalLetra: numeroALetras(total, moneda),
    timbre: {
      uuid,
      fechaTimbrado: formatCfdiDate(fechaTimbrado),
      rfcProvCertif,
      selloCFD,
      noCertificadoSAT,
      selloSAT,
      cadenaOriginal
    },
    qrUrl
  }
}

/**
 * Construye la definición del documento pdfmake para el CFDI.
 */
function buildDocDefinition(cfdi, observacionesCustom = '') {
  const tieneDescuento = cfdi.items.some(i => i.descuentoNum > 0) || cfdi.descuentoTotal > 0

  // Columnas de la tabla de conceptos
  let tableHeaders = []
  let tableWidths = []

  if (tieneDescuento) {
    tableHeaders = [
      { text: 'Cantidad', style: 'th' },
      { text: 'Codigo', style: 'th' },
      { text: 'Clave\nUnidad', style: 'th' },
      { text: 'Clave\nProducto\nServicio', style: 'th' },
      { text: 'Concepto', style: 'th' },
      { text: 'Precio\nUnitario', style: 'th' },
      { text: 'Importe', style: 'th' },
      { text: 'Descuento', style: 'th' },
      { text: 'SubTotal\nBase', style: 'th' },
      { text: 'Impuesto', style: 'th' },
      { text: 'Total', style: 'th' }
    ]
    tableWidths = [32, 35, 30, 42, '*', 38, 38, 38, 38, 42, 42]
  } else {
    tableHeaders = [
      { text: 'Cantidad', style: 'th' },
      { text: 'Codigo', style: 'th' },
      { text: 'Clave\nUnidad', style: 'th' },
      { text: 'Clave\nProducto\nServicio', style: 'th' },
      { text: 'Concepto', style: 'th' },
      { text: 'Precio\nUnitario', style: 'th' },
      { text: 'SubTotal\nBase', style: 'th' },
      { text: 'Impuesto', style: 'th' },
      { text: 'Total', style: 'th' }
    ]
    tableWidths = [35, 40, 32, 46, '*', 45, 45, 48, 48]
  }

  const tableBody = [tableHeaders]

  cfdi.items.forEach(it => {
    if (tieneDescuento) {
      tableBody.push([
        { text: it.cantidad, style: 'tdCenter' },
        { text: it.codigo, style: 'tdCenter' },
        { text: `${it.claveUnidad}\n${it.unidad}`.trim(), style: 'tdCenter' },
        { text: it.claveProdServ, style: 'tdCenter' },
        { text: it.concepto, style: 'tdLeft' },
        { text: it.precioUnitario, style: 'tdRight' },
        { text: it.importe, style: 'tdRight' },
        { text: it.descuento || '0.00', style: 'tdRight' },
        { text: it.subTotalBase, style: 'tdRight' },
        { text: it.impuesto, style: 'tdCenter' },
        { text: it.total, style: 'tdRight' }
      ])
    } else {
      tableBody.push([
        { text: it.cantidad, style: 'tdCenter' },
        { text: it.codigo, style: 'tdCenter' },
        { text: `${it.claveUnidad}\n${it.unidad}`.trim(), style: 'tdCenter' },
        { text: it.claveProdServ, style: 'tdCenter' },
        { text: it.concepto, style: 'tdLeft' },
        { text: it.precioUnitario, style: 'tdRight' },
        { text: it.subTotalBase, style: 'tdRight' },
        { text: it.impuesto, style: 'tdCenter' },
        { text: it.total, style: 'tdRight' }
      ])
    }
  })

  // Bloque de Sucursales
  const branchColumns = SUCURSALES.map(s => ({
    width: '*',
    stack: [
      { text: s.nombre, fontSize: 6, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
      { text: s.direccion, fontSize: 5, alignment: 'center', color: '#333333' }
    ]
  }))

  // Bloque Receptor
  const receptorLeft = [
    {
      text: [
        { text: 'RECEPTOR\n', bold: true, fontSize: 8 },
        { text: 'Número de cliente: ', fontSize: 7.5 },
        { text: `${cfdi.receptor.numeroCliente}\n`, fontSize: 7.5 },
        { text: 'Nombre: ', fontSize: 7.5 },
        { text: `${cfdi.receptor.nombre}\n`, bold: true, fontSize: 7.5 },
        { text: 'R.F.C.: ', fontSize: 7.5 },
        { text: `${cfdi.receptor.rfc}\n`, fontSize: 7.5 },
        ...(cfdi.receptor.regimenFiscal ? [{ text: 'Régimen: ', fontSize: 7.5 }, { text: `${cfdi.receptor.regimenFiscal}\n`, fontSize: 7.5 }] : [])
      ]
    }
  ]

  const receptorRight = [
    {
      alignment: 'right',
      text: [
        { text: 'Uso CFDI: ', fontSize: 7.5 },
        { text: `${cfdi.receptor.usoCfdi}\n`, fontSize: 7.5 },
        { text: 'Moneda: ', fontSize: 7.5 },
        { text: `${cfdi.moneda}\n`, fontSize: 7.5 },
        { text: 'Tipo de Cambio: ', fontSize: 7.5 },
        { text: `${cfdi.tipoCambio}\n`, fontSize: 7.5 },
        ...(cfdi.receptor.domicilioFiscal ? [{ text: 'Dirección: ', fontSize: 7.5 }, { text: `${cfdi.receptor.domicilioFiscal}\n`, fontSize: 7.5 }] : [])
      ]
    }
  ]

  // Observaciones a mostrar
  const observacionesTexto = observacionesCustom || cfdi.observaciones || ''

  // Desglose de impuestos trasladados texto
  const desglosesImp = []
  if (cfdi.ventas8 > 0) {
    desglosesImp.push(`IVA con crédito aplicado del 50% Tasa = 0.080000 Tipo Factor = Tasa Importe = ${formatNumberRaw(cfdi.totalImpuestosTrasladados, 2)}`)
  }
  if (cfdi.ventas0 > 0 || desglosesImp.length === 0) {
    desglosesImp.push(`Impuesto = 002-IVA Tasa = 0.000000 Tipo Factor = Tasa Importe = 0.00`)
  }

  // CFDI Relacionados bloque si existe
  const relacionadosStack = []
  if (cfdi.cfdiRelacionados.tipoRelacion) {
    relacionadosStack.push({ text: 'Tipo de Relacion:', bold: true, fontSize: 7.5, margin: [0, 2, 0, 0] })
    relacionadosStack.push({ text: cfdi.cfdiRelacionados.tipoRelacion, fontSize: 7.5 })
    if (cfdi.cfdiRelacionados.uuids.length > 0) {
      relacionadosStack.push({ text: 'UUID Relacionado(s):', bold: true, fontSize: 7.5, margin: [0, 2, 0, 0] })
      cfdi.cfdiRelacionados.uuids.forEach(u => {
        relacionadosStack.push({ text: u, fontSize: 7 })
      })
    }
  }

  return {
    pageSize: 'LETTER',
    pageOrientation: 'portrait',
    pageMargins: [25, 40, 25, 42],

    // Pie de página con numeración y leyenda SAT
    footer: function (currentPage, pageCount) {
      return {
        margin: [25, 2, 25, 0],
        columns: [
          { text: '*Este Documento es una Representación Impresa de un CFDI', fontSize: 6.5, color: '#0070c0', alignment: 'left' },
          { text: `Página ${currentPage} de ${pageCount}`, fontSize: 6.5, color: '#0070c0', alignment: 'right' }
        ]
      }
    },

    content: [
      // 1. Encabezado del reporte (Logo + Emisor + Datos Comprobante)
      {
        columns: [
          // Logo
          {
            width: 115,
            stack: [
              logoBase64
                ? { image: logoBase64, width: 105, margin: [0, 0, 0, 0] }
                : { text: 'GUSHER\nFARMACIAS', bold: true, fontSize: 12, color: '#b30000' }
            ]
          },
          // Emisor Central
          {
            width: '*',
            alignment: 'center',
            stack: [
              { text: cfdi.emisor.nombre, bold: true, fontSize: 9.5 },
              { text: `RFC: ${cfdi.emisor.rfc}`, bold: true, fontSize: 9, margin: [0, 1, 0, 0] },
              { text: cfdi.emisor.regimenFiscal, fontSize: 7.5, margin: [0, 1, 0, 0] },
              { text: cfdi.emisor.sucursal, fontSize: 7.5, margin: [0, 1, 0, 0] },
              { text: cfdi.emisor.direccion, fontSize: 6.5, margin: [0, 2, 0, 0] }
            ]
          },
          // Folio y Datos Fiscales Derecha
          {
            width: 175,
            alignment: 'right',
            stack: [
              { text: cfdi.tituloComprobante, bold: true, fontSize: 9.5, margin: [0, 0, 0, 2] },
              { text: `*Tipo de comprobante: ${cfdi.tipoDeComprobante}`, fontSize: 7.5 },
              { text: 'Fecha y hora de emisión:', fontSize: 7.5, color: '#0070c0', margin: [0, 3, 0, 0] },
              { text: cfdi.fechaEmision, fontSize: 7.5 },
              { text: 'No. de Serie del Certificado:', fontSize: 7.5, color: '#0070c0', margin: [0, 3, 0, 0] },
              { text: cfdi.noCertificado, fontSize: 7.5 },
              { text: `Versión ${cfdi.version}`, fontSize: 7, margin: [0, 3, 0, 0] }
            ]
          }
        ],
        margin: [0, 0, 0, 6]
      },

      // 2. Franja de Sucursales con línea divisoria
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 562, y2: 0, lineWidth: 0.8, lineColor: '#000000' }],
        margin: [0, 3, 0, 4]
      },
      {
        columns: branchColumns,
        margin: [0, 0, 0, 4]
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 562, y2: 0, lineWidth: 0.8, lineColor: '#000000' }],
        margin: [0, 4, 0, 6]
      },

      // 3. Bloque Receptor
      {
        columns: [
          { width: '*', stack: receptorLeft },
          { width: '*', stack: receptorRight }
        ],
        margin: [0, 0, 0, 6]
      },

      // 4. Tabla de Conceptos (Con encabezados que se repiten automáticamente en páginas siguientes)
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: tableWidths,
          body: tableBody
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.8 : 0.4,
          vLineWidth: () => 0.8,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000',
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 5]
      },

      // 5. Sección Inferior: Desglose Impuestos (Izq) + Totales (Der)
      {
        columns: [
          // Izquierda: Desglose de Impuestos + Importe con Letra
          {
            width: '*',
            stack: [
              { text: 'Desglose de Impuestos Trasladados:', fontSize: 7, bold: true, margin: [0, 0, 0, 1] },
              { text: 'Impuesto = 002', fontSize: 6.5 },
              ...desglosesImp.map(d => ({ text: d, fontSize: 6.5 })),
              { text: 'IMPORTE CON LETRA:', fontSize: 7.5, bold: true, margin: [0, 6, 0, 1] },
              { text: cfdi.totalLetra, fontSize: 7.5, bold: true }
            ]
          },
          // Derecha: Tabla de Totales
          {
            width: 190,
            table: {
              widths: [100, '*'],
              body: [
                [
                  { text: 'Ventas tasa Exento', bold: true, fontSize: 7.5, alignment: 'left' },
                  { text: formatMoney(cfdi.ventasExento), fontSize: 7.5, alignment: 'right' }
                ],
                [
                  { text: 'Ventas tasa 0%', bold: true, fontSize: 7.5, alignment: 'left' },
                  { text: formatMoney(cfdi.ventas0), fontSize: 7.5, alignment: 'right' }
                ],
                [
                  { text: 'Ventas tasa 8%', bold: true, fontSize: 7.5, alignment: 'left' },
                  { text: formatMoney(cfdi.ventas8), fontSize: 7.5, alignment: 'right' }
                ],
                ...(cfdi.ventas16 > 0 ? [[
                  { text: 'Ventas tasa 16%', bold: true, fontSize: 7.5, alignment: 'left' },
                  { text: formatMoney(cfdi.ventas16), fontSize: 7.5, alignment: 'right' }
                ]] : []),
                [
                  { text: 'SubTotal', bold: true, fontSize: 8, alignment: 'right' },
                  { text: formatMoney(cfdi.subTotal), fontSize: 8, alignment: 'right', bold: true }
                ],
                ...(cfdi.descuentoTotal > 0 ? [[
                  { text: 'Descuento', bold: true, fontSize: 7.5, alignment: 'right' },
                  { text: formatMoney(cfdi.descuentoTotal), fontSize: 7.5, alignment: 'right' }
                ]] : []),
                [
                  { text: 'IVA Trasladado', bold: true, fontSize: 8, alignment: 'right' },
                  { text: formatMoney(cfdi.totalImpuestosTrasladados), fontSize: 8, alignment: 'right', bold: true }
                ],
                [
                  { text: 'TOTAL', bold: true, fontSize: 8.5, alignment: 'right' },
                  { text: formatMoney(cfdi.total), fontSize: 8.5, alignment: 'right', bold: true }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0.8,
              vLineWidth: () => 0.8,
              hLineColor: () => '#000000',
              vLineColor: () => '#000000',
              paddingLeft: () => 4,
              paddingRight: () => 4,
              paddingTop: () => 2,
              paddingBottom: () => 2
            }
          }
        ],
        margin: [0, 2, 0, 4]
      },

      // 6. QR Code y Datos de Certificación
      {
        columns: [
          // QR Code SAT
          {
            width: 122,
            stack: [
              { qr: cfdi.qrUrl, fit: 118, margin: [0, 0, 0, 0] }
            ]
          },
          // Datos Fiscales Centrales
          {
            width: '*',
            stack: [
              { text: 'Folio Fiscal:', fontSize: 7.5, bold: true, color: '#0070c0' },
              { text: cfdi.timbre.uuid, fontSize: 7.5 },
              { text: 'Fecha y hora de certificación:', fontSize: 7.5, bold: true, color: '#0070c0', margin: [0, 2, 0, 0] },
              { text: cfdi.timbre.fechaTimbrado, fontSize: 7.5 },
              { text: 'Lugar de expedición:', fontSize: 7.5, bold: true, color: '#0070c0', margin: [0, 2, 0, 0] },
              { text: cfdi.lugarExpedicion, fontSize: 7.5 },
              ...relacionadosStack
            ]
          },
          // Método y Forma de Pago Derecha
          {
            width: 190,
            alignment: 'right',
            stack: [
              { text: `*Método de pago: ${cfdi.metodoPago}`, fontSize: 7.5 },
              { text: `*Forma de Pago: ${cfdi.formaPago}`, fontSize: 7.5, margin: [0, 2, 0, 0] },
              { text: cfdi.condicionesDePago, fontSize: 7.5, margin: [0, 2, 0, 0] }
            ]
          }
        ],
        margin: [0, 4, 0, 4]
      },

      // 7. Observaciones (Debajo de los totales / bloque fiscal)
      {
        text: `Observaciones = ${observacionesTexto}`,
        fontSize: 7.5,
        alignment: 'center',
        margin: [0, 3, 0, 3]
      },

      // 8. Sellos Digitales y Cadena Original
      {
        stack: [
          { text: 'Sello Digital del CFDI:', fontSize: 6.5, bold: true, color: '#0070c0' },
          { text: cfdi.timbre.selloCFD, fontSize: 5.5, margin: [0, 0, 0, 2] },
          { text: 'Sello del SAT:', fontSize: 6.5, bold: true, color: '#0070c0' },
          { text: cfdi.timbre.selloSAT, fontSize: 5.5, margin: [0, 0, 0, 2] },
          { text: 'Cadena Original del complemento de certificación digital del SAT:', fontSize: 6.5, bold: true, color: '#0070c0' },
          { text: cfdi.timbre.cadenaOriginal, fontSize: 5.5, margin: [0, 0, 0, 2] },
          ...(cfdi.timbre.noCertificadoSAT ? [
            { text: 'No. de Serie del Certificado del SAT:', fontSize: 6.5, bold: true, color: '#0070c0' },
            { text: cfdi.timbre.noCertificadoSAT, fontSize: 5.5 }
          ] : [])
        ],
        margin: [0, 2, 0, 0]
      }
    ],

    // Estilos generales
    styles: {
      th: {
        fontSize: 6.5,
        bold: true,
        alignment: 'center',
        color: '#000000'
      },
      tdCenter: {
        fontSize: 6.5,
        alignment: 'center'
      },
      tdLeft: {
        fontSize: 6.5,
        alignment: 'left'
      },
      tdRight: {
        fontSize: 6.5,
        alignment: 'right'
      }
    },
    defaultStyle: {
      font: 'Roboto',
      color: '#000000'
    }
  }
}

/**
 * Guarda una copia física del PDF y XML en @/cfdiFiles/{receptor.rfc}/{serie}{folio}.[pdf|xml]
 * Si no existe la carpeta, la crea con el nombre del RFC del receptor.
 * @param {Object} cfdi - Datos estructurados del CFDI parseado
 * @param {string} xml - Cadena XML original
 * @param {Buffer} pdfBuffer - Buffer binario del PDF generado
 * @returns {Object|null} Información de las rutas guardadas
 */
export function saveCfdiFiles(cfdi, xml, pdfBuffer) {
  try {
    const rfcFolder = (cfdi && cfdi.receptor && cfdi.receptor.rfc ? String(cfdi.receptor.rfc).trim() : 'GENERICO') || 'GENERICO'
    const targetDir = path.resolve(process.cwd(), 'cfdiFiles', rfcFolder)

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    const baseFileName = `${cfdi.serie || ''}${cfdi.folio || ''}`.trim() || (cfdi.timbre && cfdi.timbre.uuid ? cfdi.timbre.uuid : 'comprobante')
    const pdfPath = path.join(targetDir, `${baseFileName}.pdf`)
    const xmlPath = path.join(targetDir, `${baseFileName}.xml`)

    if (pdfBuffer) {
      fs.writeFileSync(pdfPath, pdfBuffer)
    }
    if (xml) {
      fs.writeFileSync(xmlPath, xml, 'utf8')
    }

    return {
      rfcFolder,
      baseFileName,
      targetDir,
      pdfPath,
      xmlPath
    }
  } catch (error) {
    console.error('Error al guardar copia física de PDF/XML en cfdiFiles:', error)
    return null
  }
}

/**
 * Genera el PDF en Base64 a partir de una cadena XML y observaciones opcionales.
 * Guarda además una copia física del PDF y XML en @/cfdiFiles/{receptor.rfc}/
 * @param {Object} params
 * @param {string} params.xml - Cadena XML de CFDI 4.0 o 3.3
 * @param {string} [params.observaciones] - Observaciones a incluir
 * @returns {Promise<string>} Base64 del PDF generado
 */
export async function generatePdfFromXml({ xml, observaciones = '' }) {
  if (!xml || typeof xml !== 'string') {
    throw new Error('El parámetro xml es requerido y debe ser una cadena válida.')
  }

  const cfdi = await parseCfdiXml(xml)
  const docDefinition = buildDocDefinition(cfdi, observaciones)

  const pdfDoc = printer.createPdfKitDocument(docDefinition)

  const pdfBuffer = await new Promise((resolve, reject) => {
    const chunks = []
    pdfDoc.on('data', chunk => chunks.push(chunk))
    pdfDoc.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    pdfDoc.on('error', err => reject(err))
    pdfDoc.end()
  })

  // Guardar copia física del PDF y XML en @/cfdiFiles/{receptor.rfc}
  saveCfdiFiles(cfdi, xml, pdfBuffer)

  return pdfBuffer.toString('base64')
}

/**
 * Handler de Express para el endpoint POST /xml2pdf
 */
export async function xml2pdfHandler(req, res) {
  try {
    const xml = req.body && req.body.xml
    const observaciones = req.body && (req.body.observaciones || req.body.comentarios || '')

    if (!xml) {
      return res.status(400).json({
        response: 400,
        msg: 'Debe proporcionar la cadena xml en req.body.xml',
        data: null
      })
    }

    const pdfBase64 = await generatePdfFromXml({ xml, observaciones })

    return res.json({
      response: 200,
      msg: 'Ok',
      pdfBase64
    })
  } catch (error) {
    console.error('Error en xml2pdfHandler:', error)
    return res.status(500).json({
      response: 500,
      msg: error.message || 'Error al generar el PDF del XML',
      data: null
    })
  }
}

export default {
  generatePdfFromXml,
  xml2pdfHandler,
  parseCfdiXml,
  saveCfdiFiles
}

