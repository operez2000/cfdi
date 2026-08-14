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
    "D07 - Primas por seguros de gastos médicos",
    "S01 - Sin efectos fiscales"
  ]

  metodosDePago = [
    'PUE',
    'PPD'
  ]

  formatNumber = (num, dec = 2) => {
    num = (typeof num == "string") ? Number(num) : num
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec } ).format(num)
  }

  formatSat = (num, dec = 2) => {
    return num.trim().replace(/,/g, '')
  }

  /** Pacific Time (PST/PDT) — Baja California */
  TIMEZONE_PST = 'America/Tijuana'

  /**
   * Fecha de hoy en PST como YYYY-MM-DD.
   * Evita toISOString() que usa UTC y puede cambiar el día.
   */
  todayYMD = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-CA', { timeZone: this.TIMEZONE_PST })
  }

  /**
   * Fecha/hora en PST como YYYY-MM-DD HH:mm:ss (para MySQL / respuestas API).
   * Si ya viene como DATETIME local sin zona (escrito con nowDateTime), se conserva.
   */
  nowDateTime = (date = new Date()) => {
    if (date === undefined || date === null || date === '') {
      date = new Date()
    }
    if (typeof date === 'string') {
      const str = date.trim()
      const localMysql = str.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/)
      if (localMysql && !/Z|[+-]\d{2}:?\d{2}$/i.test(str)) {
        return `${localMysql[1]} ${localMysql[2]}`
      }
    }
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return ''
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.TIMEZONE_PST,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(d)
    const get = (type) => (parts.find(p => p.type === type) || {}).value || '00'
    let hour = get('hour')
    if (hour === '24') hour = '00'
    return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`
  }

  /**
   * Normaliza a YYYY-MM-DD.
   * - Solo fecha (YYYY-MM-DD / DD-MM-YYYY): no aplica zona (evita correr el día).
   * - Medianoche UTC (...T00:00:00.000Z): típico de columnas DATE en Sequelize → día calendario.
   * - Date / ISO con zona real: convierte a día civil en PST.
   */
  formatDateYMD = (isoDate) => {
    if (!isoDate) return ''
    if (isoDate instanceof Date) {
      if (isNaN(isoDate.getTime())) return ''
      // Medianoche UTC = fecha de negocio DATE, no instante a convertir
      if (
        isoDate.getUTCHours() === 0 &&
        isoDate.getUTCMinutes() === 0 &&
        isoDate.getUTCSeconds() === 0 &&
        isoDate.getUTCMilliseconds() === 0
      ) {
        const y = isoDate.getUTCFullYear()
        const m = String(isoDate.getUTCMonth() + 1).padStart(2, '0')
        const day = String(isoDate.getUTCDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      return this.todayYMD(isoDate)
    }

    const str = String(isoDate).trim()
    if (!str) return ''

    // Columnas DATE vía Sequelize: 2026-08-11T00:00:00.000Z → conservar el día
    const midnightUtc = str.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(\.\d+)?Z$/i)
    if (midnightUtc) return midnightUtc[1]

    // DATETIME MySQL local sin zona: YYYY-MM-DD HH:mm:ss → fecha tal cual
    const mysqlLocal = str.match(/^(\d{4}-\d{2}-\d{2})[ ]\d{2}:\d{2}:\d{2}/)
    if (mysqlLocal) return mysqlLocal[1]

    const hasTime = /[T\s]\d{1,2}:\d{2}/.test(str)
    const hasZone = /Z|[+-]\d{2}:?\d{2}$/i.test(str)
    if (hasTime && hasZone) {
      const d = new Date(str)
      if (!isNaN(d.getTime())) return this.todayYMD(d)
    }

    const datePart = str.includes('T') ? str.split('T')[0] : str.split(' ')[0]
    const parts = datePart.split(/[-/]/)
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      }
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    }
    return datePart
  }

  /**
   *
   * @param {*} fecha yyyy-mm-dd
   * @param {*} tipo
   * @returns dd/Mmm/yy o dd/Mmm/yyyy
   */
  oFecha = (fecha, tipo = "corta") => {
    const normalized = this.formatDateYMD(fecha)
    if (!normalized || normalized.length < 10) return normalized || ''
    const meses = [
      { mes: "01", cMes: "Enero" },
      { mes: "02", cMes: "Febrero" },
      { mes: "03", cMes: "Marzo" },
      { mes: "04", cMes: "Abril" },
      { mes: "05", cMes: "Mayo" },
      { mes: "06", cMes: "Junio" },
      { mes: "07", cMes: "Julio" },
      { mes: "08", cMes: "Agosto" },
      { mes: "09", cMes: "Septiembre" },
      { mes: "10", cMes: "Octubre" },
      { mes: "11", cMes: "Noviembre" },
      { mes: "12", cMes: "Diciembre" }
    ]
    const oMes = meses.find(v => v.mes == normalized.substring(5,7))
    if (!oMes) return normalized
    return normalized.substring(8, 10) + "/" + ((tipo == "corta") ? oMes.cMes.substring(0, 3) : oMes.cMes) + "/" + normalized.substring(0, 4)
  }

}
