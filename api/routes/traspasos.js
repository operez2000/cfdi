import Express from 'express'
import nodemailer from 'nodemailer'
import config from '../../config.json'
import Utils from '../../assets/utils'
import { query, queryOne, execute, transaction, getHeaderById, getNextFolio } from '../db'
import { sendOk, sendBadRequest, sendNotFound, sendError } from '../utils/response'

const router = Express.Router()
const utils = new Utils()

const ESTADOS_VALIDOS = ['BORRADOR', 'GUARDADO', 'CANCELADO']

/** Timestamp MySQL en PST (America/Tijuana) */
function nowPst () {
  return utils.nowDateTime()
}

/** Normaliza fechas de negocio a YYYY-MM-DD en PST */
function fechaPst (value) {
  return utils.formatDateYMD(value)
}

const mailConfig = {
  host: config.mail.host,
  port: 465,
  secure: true,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass
  },
  tls: {
    rejectUnauthorized: false
  }
}

function parseEmails(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map(item => (item || '').toString().trim())
      .filter(Boolean)
  }

  const normalized = value
    .toString()
    .replace(/\s*-\s*/g, ',')
    .replace(/[;\/|]+/g, ',')
    .replace(/,+/g, ',')

  return normalized
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

async function sendTraspasoEmail({ to, cc, subject, body, pdfName, pdfBase64 }) {
  const transporter = nodemailer.createTransport(mailConfig)
  const normalizedPdfName = pdfName && pdfName.toLowerCase().endsWith('.pdf') ? pdfName : `${pdfName || 'documento'}.pdf`

  const info = await transporter.sendMail({
    from: `Farmacia Gusher ${mailConfig.auth.user}`,
    to: parseEmails(to),
    cc: parseEmails(cc),
    reply: 'noreply@gusher.com.mx',
    subject: subject || 'Envío de documento',
    html: body || 'Envío de documento',
    attachments: [
      {
        filename: normalizedPdfName,
        content: Buffer.from(pdfBase64, 'base64'),
        contentType: 'application/pdf'
      }
    ]
  })

  return info
}

function validateTraspasoBody(body) {
  if (!body.id_sucursal_origen) {
    return 'La sucursal origen es obligatoria'
  }
  if (!body.fecha) {
    return 'La fecha es obligatoria'
  }
  if (body.estado && !ESTADOS_VALIDOS.includes(body.estado)) {
    return 'Estado no válido'
  }
  if (!Array.isArray(body.destinos) || body.destinos.length === 0) {
    return 'Debe incluir al menos un destino'
  }
  if (!Array.isArray(body.detalle) || body.detalle.length === 0) {
    return 'Debe incluir al menos un artículo en el detalle'
  }
  for (const dest of body.destinos) {
    if (!dest.id_traspaso_destino) {
      return 'Cada destino debe incluir id_traspaso_destino'
    }
    if (dest.id_motivo_traspaso == null) {
      return 'Cada destino debe incluir id_motivo_traspaso'
    }
  }
  for (const item of body.detalle) {
    if (!item.clave) {
      return 'Cada artículo debe incluir clave'
    }
    if (!item.id_traspaso_destino) {
      return 'Cada artículo debe incluir id_traspaso_destino'
    }
    if (item.cantidad == null || item.cantidad <= 0) {
      return 'La cantidad debe ser un entero mayor a cero'
    }
  }
  return null
}

async function insertDestinos(idTraspaso, destinos, t) {
  const opts = t ? { transaction: t } : {}
  const ids = []
  for (const dest of destinos) {
    const result = await execute(`
      INSERT INTO traspaso_destino (id_traspaso, id_traspaso_destino, id_motivo_traspaso, caja)
      VALUES (?, ?, ?, ?)
    `, [idTraspaso, dest.id_traspaso_destino, dest.id_motivo_traspaso || null, dest.caja || null], opts)
    ids.push(result.insertId)
  }
  return ids
}

async function insertDetalle(idTraspaso, detalle, destinos, destinoIds, t) {
  const opts = t ? { transaction: t } : {}
  const lookup = {}
  for (let i = 0; i < destinos.length; i++) {
    lookup[destinos[i].id_traspaso_destino] = destinoIds[i]
  }

  for (const item of detalle) {
    await execute(`
      INSERT INTO traspaso_detail (
        id_traspaso, clave, codigo_barras, descripcion, etiqueta, lote,
        fecha_caducidad, cantidad, id_traspaso_destino
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      idTraspaso,
      item.clave,
      item.codigo_barras || null,
      item.descripcion || '',
      item.etiqueta || null,
      item.lote || null,
      item.fecha_caducidad ? fechaPst(item.fecha_caducidad) || null : null,
      Math.floor(Number(item.cantidad)),
      lookup[item.id_traspaso_destino]
    ], opts)
  }
}

async function buildEditPayload(header) {
  const destinos = await query(`
    SELECT id_traspaso_destino, id_motivo_traspaso, caja
    FROM traspaso_destino
    WHERE id_traspaso = ? AND borrado = 0
  `, [header.id])

  const detalle = await query(`
    SELECT d.clave, d.codigo_barras, d.descripcion, d.etiqueta, d.lote,
           d.fecha_caducidad, d.cantidad, td.id_traspaso_destino
    FROM traspaso_detail d
    JOIN traspaso_destino td ON td.id = d.id_traspaso_destino AND td.borrado = 0
    WHERE d.id_traspaso = ? AND d.borrado = 0
  `, [header.id])

  return {
    header: {
      ...header,
      fecha: fechaPst(header.fecha),
      fecha_actualizacion: header.fecha_actualizacion
        ? utils.nowDateTime(header.fecha_actualizacion)
        : header.fecha_actualizacion
    },
    destinos,
    detalle: detalle.map(row => ({
      ...row,
      fecha_caducidad: row.fecha_caducidad ? fechaPst(row.fecha_caducidad) : row.fecha_caducidad
    }))
  }
}

router.post('/email', async (req, res) => {
  try {
    const { to, cc, subject, body, pdfName, pdfBase64 } = req.body || {}

    if (!to || !pdfBase64 || !pdfName) {
      return sendBadRequest(res, 'Faltan datos para enviar el correo')
    }

    const info = await sendTraspasoEmail({ to, cc, subject, body, pdfName, pdfBase64 })
    sendOk(res, {
      accepted: info.accepted || [],
      rejected: info.rejected || []
    })
  } catch (err) {
    sendError(res, err)
  }
})

router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        h.id,
        h.prefijo,
        h.folio,
        h.fecha,
        h.estado,
        h.cancelado,
        s.abreviacion AS sucursal_origen_abreviacion,
        s.nombre AS sucursal_origen
      FROM traspaso_header h
      LEFT JOIN sucursal s ON s.id = h.id_sucursal_origen AND s.borrado = 0
      WHERE h.borrado = 0
      ORDER BY h.id DESC
    `)
    sendOk(res, rows.map(row => ({
      ...row,
      fecha: fechaPst(row.fecha)
    })))
  } catch (err) {
    sendError(res, err)
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const header = await getHeaderById(id)
    if (!header) {
      return sendNotFound(res)
    }
    sendOk(res, await buildEditPayload(header))
  } catch (err) {
    sendError(res, err)
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    const validationMsg = validateTraspasoBody(body)
    if (validationMsg) {
      return sendBadRequest(res, validationMsg)
    }

    const estado = body.estado || 'GUARDADO'
    const fecha = fechaPst(body.fecha)
    if (!fecha) {
      return sendBadRequest(res, 'La fecha es obligatoria')
    }
    const creado = nowPst()
    let createdId = null

    await transaction(async (t) => {
      const folio = await getNextFolio(t)
      const prefijo = 'TRA'

      const result = await execute(`
        INSERT INTO traspaso_header (
          prefijo, folio, fecha, persona_surte, persona_captura, persona_revisa,
          persona_autoriza, chofer, id_sucursal_origen, observaciones, estado,
          fecha_actualizacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        prefijo,
        folio,
        fecha,
        body.persona_surte || null,
        body.persona_captura || null,
        body.persona_revisa || null,
        body.persona_autoriza || null,
        body.chofer || null,
        body.id_sucursal_origen,
        body.observaciones || null,
        estado,
        creado
      ], { transaction: t })

      createdId = result.insertId
      const destinoIds = await insertDestinos(createdId, body.destinos, t)
      await insertDetalle(createdId, body.detalle, body.destinos, destinoIds, t)
    })

    const header = await getHeaderById(createdId)
    sendOk(res, await buildEditPayload(header))
  } catch (err) {
    sendError(res, err)
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await getHeaderById(id)
    if (!existing) {
      return sendNotFound(res)
    }

    const body = req.body || {}
    const validationMsg = validateTraspasoBody(body)
    if (validationMsg) {
      return sendBadRequest(res, validationMsg)
    }

    const fecha = fechaPst(body.fecha)
    if (!fecha) {
      return sendBadRequest(res, 'La fecha es obligatoria')
    }
    const actualizado = nowPst()

    await transaction(async (t) => {
      await execute(`
        UPDATE traspaso_header SET
          fecha = ?,
          persona_surte = ?,
          persona_captura = ?,
          persona_revisa = ?,
          persona_autoriza = ?,
          chofer = ?,
          id_sucursal_origen = ?,
          observaciones = ?,
          estado = ?,
          fecha_actualizacion = ?
        WHERE id = ? AND borrado = 0
      `, [
        fecha,
        body.persona_surte || null,
        body.persona_captura || null,
        body.persona_revisa || null,
        body.persona_autoriza || null,
        body.chofer || null,
        body.id_sucursal_origen,
        body.observaciones || null,
        body.estado || existing.estado,
        actualizado,
        id
      ], { transaction: t })

      await execute(`
        UPDATE traspaso_destino SET borrado = 1, fecha_actualizacion = ?
        WHERE id_traspaso = ? AND borrado = 0
      `, [actualizado, id], { transaction: t })

      await execute(`
        UPDATE traspaso_detail SET borrado = 1, fecha_actualizacion = ?
        WHERE id_traspaso = ? AND borrado = 0
      `, [actualizado, id], { transaction: t })

      const destinoIds = await insertDestinos(id, body.destinos, t)
      await insertDetalle(id, body.detalle, body.destinos, destinoIds, t)
    })

    const header = await getHeaderById(id)
    sendOk(res, await buildEditPayload(header))
  } catch (err) {
    sendError(res, err)
  }
})

router.patch('/:id/cancelar', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await getHeaderById(id)
    if (!existing) {
      return sendNotFound(res)
    }

    await execute(`
      UPDATE traspaso_header SET
        cancelado = 1,
        estado = 'CANCELADO',
        fecha_actualizacion = ?
      WHERE id = ? AND borrado = 0
    `, [nowPst(), id])

    const header = await getHeaderById(id)
    sendOk(res, await buildEditPayload(header))
  } catch (err) {
    sendError(res, err)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await getHeaderById(id)
    if (!existing) {
      return sendNotFound(res)
    }

    const ts = nowPst()
    await transaction(async (t) => {
      await execute(`
        UPDATE traspaso_header SET borrado = 1, fecha_actualizacion = ?
        WHERE id = ?
      `, [ts, id], { transaction: t })

      await execute(`
        UPDATE traspaso_destino SET borrado = 1, fecha_actualizacion = ?
        WHERE id_traspaso = ?
      `, [ts, id], { transaction: t })

      await execute(`
        UPDATE traspaso_detail SET borrado = 1, fecha_actualizacion = ?
        WHERE id_traspaso = ?
      `, [ts, id], { transaction: t })
    })

    sendOk(res, { id })
  } catch (err) {
    sendError(res, err)
  }
})

export default router
