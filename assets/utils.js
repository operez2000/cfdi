export default class Utils {
  motivosCancelacion = [
    "01 - Comprobante emitido con errores con relación",
    "02 - Comprobante emitido con errores sin relación", 
    "03 - No se llevó a cabo la operación",
    "04 - Operación nominativa relacionada en la factura global"
  ]

  regimenesFiscales = [
    '601 - General de Ley Personas Morales',
    '603 - Personas Morales con Fines no Lucrativos',
    '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios - ',
    '606 - Arrendamiento',
    '607 - Régimen de Enajenación o Adquisición de Bienes',
    '608 - Demás ingresos',
    '610 - Residentes en el Extranjero sin Establecimiento Permanente en México',
    '611 - Ingresos por Dividendos (socios y accionistas)',
    '612 - Personas Físicas con Actividades Empresariales y Profesionales',
    '614 - Ingresos por intereses',
    '615 - Régimen de los ingresos por obtención de premios',
    '616 - Sin obligaciones fiscales',
    '620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
    '621 - Incorporación Fiscal',
    '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
    '623 - Opcional para Grupos de Sociedades',
    '624 - Coordinados',
    '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
    '626 - Régimen Simplificado de Confianza'
  ]

  formasDePago = [
    '01 - Efectivo',
    '02 - Cheque nominativo',
    '03 - Transferencia electrónica de fondos',
    '04 - Tarjeta de crédito',
    '28 - Tarjeta de débito',
    '99 - Por definir'
  ]

  usosCfdi = [
    "G01 - Adquisicion de Mercancias",
    "G03 - Gastos en General",
    "D01 - Honorarios médicos, dentales y gastos hospitalarios",
    "D02 - Gastos médicos por incapacidad o discapacidad",
    "D07 - Primas por seguros de gastos médicos"
  ]

  metodosDePago = [
    'PUE',
    'PPD'
  ]

  formatNumber = (num, dec = 2) => {
    num = (typeof num == "string") ? Number(num) : num
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec } ).format(num)
  }

}