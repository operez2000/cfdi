import Express from 'express'
import Utils from '../../assets/utils.js'
import { query, queryOne, execute, transaction } from '../db_facturacion.js'
import { sendOk, sendBadRequest, sendNotFound, sendError } from '../utils/response.js'
import { parseCfdiXml } from '../utils/xml2pdf.js'

const router = Express.Router()
const utils = new Utils()

/**
 * Convierte fecha ISO o string a formato YYYY-MM-DD HH:mm:ss para MySQL
 */
function toMysqlDateTime(fechaStr) {
  if (!fechaStr) return utils.nowDateTime()
  const clean = String(fechaStr).replace('T', ' ')
  // Si ya viene como YYYY-MM-DD HH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(clean)) {
    return clean.substring(0, 19)
  }
  // Si viene como DD/MM/YYYY HH:mm:ss
  if (/^\d{2}\/\d{2}\/\d{4}/.test(clean)) {
    const [datePart, timePart] = clean.split(' ')
    const [d, m, y] = datePart.split('/')
    return `${y}-${m}-${d} ${timePart || '00:00:00'}`
  }
  return utils.nowDateTime()
}

/**
 * Función reutilizable para insertar o actualizar una factura en la BD facturacion
 */
async function guardarFacturaEnDb({
  xml,
  observaciones = '',
  ticketCaja = null,
  ticketFolio = null,
  noCliente = '',
  cuentaPago = '',
  tipoFacturaCustom = '',
  uuidRelacionadoCustom = '',
  usuarioCancela = null,
  motivoCancelacion = null
}) {
  if (!xml) throw new Error('El XML es requerido para guardar en la BD')

  const parsed = await parseCfdiXml(xml)

  // Extraer serie y folio
  const serie = parsed.serie || ''
  const folio = parsed.folio || ''
  const rfcReceptor = parsed.receptor?.rfc || ''
  const razonSocial = parsed.receptor?.nombre || ''
  const noCli = noCliente || parsed.receptor?.numeroCliente || ''
  const uuid = parsed.timbre?.uuid || ''
  
  // UUID Relacionado
  let uuidRel = uuidRelacionadoCustom || ''
  if (!uuidRel && parsed.cfdiRelacionados?.uuids && parsed.cfdiRelacionados.uuids.length > 0) {
    uuidRel = parsed.cfdiRelacionados.uuids[0]
  }

  // Determinar tipo de factura
  let tipoFactura = tipoFacturaCustom
  if (!tipoFactura) {
    if (parsed.tipoDeComprobante?.startsWith('E') || parsed.tipoDeComprobante === 'E - Egreso') {
      tipoFactura = 'Nota de Crédito'
    } else if (rfcReceptor === 'XAXX010101000' || razonSocial.toUpperCase().includes('PUBLICO EN GENERAL') || razonSocial.toUpperCase().includes('PÚBLICO EN GENERAL')) {
      tipoFactura = 'Global'
    } else {
      tipoFactura = 'Normal'
    }
  }

  // Importes
  const importeTasa0 = Number(parsed.ventas0) || 0
  const importeExento = Number(parsed.ventasExento) || 0
  const importeGravable = (Number(parsed.ventas8) || 0) + (Number(parsed.ventas16) || 0)
  const importeIva = Number(parsed.totalImpuestosTrasladados) || 0
  const total = Number(parsed.total) || 0

  // Forma y método de pago (códigos cortos SAT)
  const formaPago = (parsed.formaPago || '').substring(0, 2)
  const metodoPago = (parsed.metodoPago || '').substring(0, 3)
  const usoCfdi = (parsed.receptor?.usoCfdi || '').substring(0, 3)

  // Fecha facturación
  const fechaFacturacion = toMysqlDateTime(parsed.fechaEmision || parsed.timbre?.fechaTimbrado)

  // Observaciones
  const obs = observaciones || parsed.observaciones || ''

  // Verificar si ya existe por UUID o por Serie/Folio
  let existing = null
  if (uuid) {
    existing = await queryOne('SELECT id FROM factura WHERE uuid = ?', [uuid])
  }
  if (!existing && serie && folio) {
    existing = await queryOne('SELECT id FROM factura WHERE serie = ? AND folio = ?', [serie, folio])
  }

  if (existing) {
    await execute(
      `UPDATE factura SET
        serie = ?, folio = ?, observaciones = ?, ticket_caja = ?, ticket_folio = ?, rfc_receptor = ?, no_cliente = ?,
        razon_social = ?, fecha_facturacion = ?, importe_tasa_cero = ?, importe_exento = ?,
        importe_gravable = ?, importe_iva = ?, total = ?, forma_pago = ?, metodo_pago = ?,
        uso_cfdi = ?, cuenta_pago = ?, tipo_factura = ?, uuid = ?, uuid_relacionado = ?,
        xml = ?
      WHERE id = ?`,
      [
        serie, folio, obs, ticketCaja, ticketFolio, rfcReceptor, noCli,
        razonSocial, fechaFacturacion, importeTasa0, importeExento,
        importeGravable, importeIva, total, formaPago, metodoPago,
        usoCfdi, cuentaPago, tipoFactura, uuid, uuidRel,
        xml, existing.id
      ]
    )
    return { id: existing.id, serie, folio, uuid, updated: true }
  } else {
    const result = await execute(
      `INSERT INTO factura (
        serie, folio, observaciones, ticket_caja, ticket_folio, rfc_receptor, no_cliente,
        razon_social, fecha_facturacion, importe_tasa_cero, importe_exento,
        importe_gravable, importe_iva, total, forma_pago, metodo_pago,
        uso_cfdi, cuenta_pago, tipo_factura, estatus, uuid, uuid_relacionado,
        xml
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activa', ?, ?, ?)`,
      [
        serie, folio, obs, ticketCaja, ticketFolio, rfcReceptor, noCli,
        razonSocial, fechaFacturacion, importeTasa0, importeExento,
        importeGravable, importeIva, total, formaPago, metodoPago,
        usoCfdi, cuentaPago, tipoFactura, uuid, uuidRel,
        xml
      ]
    )
    return { id: result.insertId, serie, folio, uuid, created: true }
  }
}

/**
 * POST /api/facturacion/
 * Inserta o actualiza una factura
 */
router.post('/', async (req, res) => {
  try {
    const { xml, observaciones, ticketCaja, ticketFolio, noCliente, cuentaPago, tipoFactura, uuidRelacionado } = req.body
    if (!xml) return sendBadRequest(res, 'Debe enviar xml en el cuerpo de la petición')
    const data = await guardarFacturaEnDb({ xml, observaciones, ticketCaja, ticketFolio, noCliente, cuentaPago, tipoFactura, uuidRelacionado })
    return sendOk(res, data, 'Factura guardada correctamente')
  } catch (error) {
    return sendError(res, error)
  }
})

/**
 * GET /api/facturacion/listado
 * Devuelve el listado de facturas para consultas
 */
router.get('/listado', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000)
    const rows = await query(`
      SELECT id, serie, folio, rfc_receptor, razon_social, fecha_facturacion, total, tipo_factura, observaciones, estatus, uuid
      FROM factura
      ORDER BY fecha_facturacion DESC, id DESC
      LIMIT ?
    `, [limit])
    return sendOk(res, rows)
  } catch (error) {
    return sendError(res, error)
  }
})

/**
 * GET /api/facturacion/recuperar/:serieFolio
 * o GET /api/facturacion/recuperar/:serie/:folio
 * Busca la factura en la BD local y devuelve sus datos + XML y observaciones
 */
router.get('/recuperar/:serieFolio', async (req, res) => {
  try {
    let { serieFolio } = req.params
    serieFolio = serieFolio.trim()

    let row = null

    // Intento 1: match directo serie+folio
    // Si empieza con NC o letra
    const match = serieFolio.match(/^([A-Za-z]+)(\d+)$/)
    if (match) {
      const serie = match[1]
      const folio = match[2]
      row = await queryOne(
        `SELECT * FROM factura WHERE (serie = ? AND (folio = ? OR CAST(folio AS UNSIGNED) = CAST(? AS UNSIGNED))) LIMIT 1`,
        [serie, folio, folio]
      )
    }

    // Intento 2: búsqueda por folio o serieFolio exacto
    if (!row) {
      row = await queryOne(
        `SELECT * FROM factura WHERE CONCAT(serie, folio) = ? OR folio = ? LIMIT 1`,
        [serieFolio, serieFolio]
      )
    }

    if (!row) {
      return sendNotFound(res, `No se encontró la factura con folio ${serieFolio} en la base de datos local`)
    }

    return sendOk(res, row)
  } catch (error) {
    return sendError(res, error)
  }
})

router.get('/recuperar/:serie/:folio', async (req, res) => {
  try {
    const { serie, folio } = req.params
    const row = await queryOne(
      `SELECT * FROM factura WHERE (serie = ? AND (folio = ? OR CAST(folio AS UNSIGNED) = CAST(? AS UNSIGNED))) LIMIT 1`,
      [serie, folio, folio]
    )
    if (!row) {
      return sendNotFound(res, `No se encontró la factura ${serie}${folio} en la base de datos local`)
    }
    return sendOk(res, row)
  } catch (error) {
    return sendError(res, error)
  }
})

/**
 * GET /api/facturacion/uuid/:uuid
 */
router.get('/uuid/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params
    const row = await queryOne('SELECT * FROM factura WHERE uuid = ? LIMIT 1', [uuid])
    if (!row) return sendNotFound(res, 'UUID no encontrado en la base de datos local')
    return sendOk(res, row)
  } catch (error) {
    return sendError(res, error)
  }
})

/**
 * PUT /api/facturacion/cancelar/:uuid
 * Marca la factura como cancelada
 */
router.put('/cancelar/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params
    const { usuarioCancela = 'Sistema', motivoCancelacion = 'Cancelación', uuidRelacionado = null } = req.body
    const fechaCanc = utils.nowDateTime()

    const existing = await queryOne('SELECT id FROM factura WHERE uuid = ?', [uuid])
    if (!existing) {
      return sendNotFound(res, 'No se encontró la factura a cancelar')
    }

    let sql = `UPDATE factura SET estatus = 'Cancelada', usuario_cancela = ?, motivo_cancelacion = ?, fecha_cancelacion = ?`
    const params = [usuarioCancela, motivoCancelacion, fechaCanc]

    if (uuidRelacionado) {
      sql += `, uuid_relacionado = ?`
      params.push(uuidRelacionado)
    }

    sql += ` WHERE id = ?`
    params.push(existing.id)

    await execute(sql, params)
    return sendOk(res, { uuid, estatus: 'Cancelada', fecha_cancelacion: fechaCanc }, 'Factura cancelada en BD')
  } catch (error) {
    return sendError(res, error)
  }
})

/**
 * GET /api/facturacion/buscar-uuid-relacionado
 * Busca el UUID de la factura cliente o de la primera factura global del día de la venta
 */
router.get('/buscar-uuid-relacionado', async (req, res) => {
  try {
    const { caja = '', folio = '', fecha = '' } = req.query
    let fechaYmd = ''

    if (fecha) {
      const cleanFecha = String(fecha).trim()
      if (/^\d{4}-\d{2}-\d{2}/.test(cleanFecha)) {
        fechaYmd = cleanFecha.substring(0, 10)
      } else if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanFecha)) {
        const [d, m, y] = cleanFecha.split('/')
        fechaYmd = `${y}-${m}-${d}`
      }
    }

    let uuidEncontrado = ''
    let facturaInfo = null

    // 1. Intentar buscar por factura individual de la venta (Caja y Folio en observaciones o ticket)
    if (caja && folio) {
      const cajaPad = String(caja).trim().padStart(2, '0')
      const folioPad = String(folio).trim()
      const searchPat1 = `%${cajaPad}%${folioPad}%`
      const searchPat2 = `%${caja.trim()}-${folioPad}%`

      let sqlIndividual = `
        SELECT uuid, serie, folio, fecha_facturacion, tipo_factura, rfc_receptor
        FROM factura
        WHERE estatus != 'Cancelada'
          AND tipo_factura NOT IN ('Nota de Crédito', 'Cancelada')
          AND (
            (ticket_caja = ? AND ticket_folio = ?)
            OR (observaciones LIKE ? OR observaciones LIKE ?)
          )
      `
      const paramsInd = [cajaPad, folioPad, searchPat1, searchPat2]
      if (fechaYmd) {
        sqlIndividual += ` AND fecha_facturacion >= DATE_SUB(?, INTERVAL 1 YEAR)`
        paramsInd.push(fechaYmd)
      } else {
        sqlIndividual += ` AND fecha_facturacion >= DATE_SUB(NOW(), INTERVAL 1 YEAR)`
      }
      sqlIndividual += ` ORDER BY id DESC LIMIT 1`

      const rowInd = await queryOne(sqlIndividual, paramsInd)
      if (rowInd && rowInd.uuid) {
        uuidEncontrado = rowInd.uuid
        facturaInfo = rowInd
      }
    }

    // 2. Si no se encontró factura individual, buscar la primer Factura Global del día de la venta
    if (!uuidEncontrado && fechaYmd) {
      const sqlGlobal = `
        SELECT uuid, serie, folio, fecha_facturacion, tipo_factura, rfc_receptor
        FROM factura
        WHERE DATE(fecha_facturacion) = ?
          AND (tipo_factura = 'Global' OR rfc_receptor = 'XAXX010101000' OR razon_social LIKE '%PUBLICO EN GENERAL%' OR razon_social LIKE '%PÚBLICO EN GENERAL%')
          AND estatus != 'Cancelada'
        ORDER BY fecha_facturacion ASC, id ASC
        LIMIT 1
      `
      const rowGlobal = await queryOne(sqlGlobal, [fechaYmd])
      if (rowGlobal && rowGlobal.uuid) {
        uuidEncontrado = rowGlobal.uuid
        facturaInfo = rowGlobal
      }
    }

    return sendOk(res, {
      uuid: uuidEncontrado,
      factura: facturaInfo
    })
  } catch (error) {
    return sendError(res, error)
  }
})

export { guardarFacturaEnDb }
export default router

