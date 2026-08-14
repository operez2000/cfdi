import Express from 'express'
import Utils from '../../assets/utils'
import { query, queryOne, execute } from '../db'
import { sendOk, sendBadRequest, sendNotFound, sendError } from '../utils/response'

const router = Express.Router()
const utils = new Utils()

/** Timestamp MySQL en PST (America/Tijuana) */
function nowPst () {
  return utils.nowDateTime()
}

router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      SELECT id, abreviacion, nombre, domicilio, colonia, ciudad, codigo_postal, telefonos, email
      FROM sucursal
      WHERE borrado = 0
      ORDER BY nombre
    `)
    sendOk(res, rows)
  } catch (err) {
    sendError(res, err)
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const row = await queryOne(`
      SELECT id, abreviacion, nombre, domicilio, colonia, ciudad, codigo_postal, telefonos, email
      FROM sucursal
      WHERE id = ? AND borrado = 0
    `, [id])
    if (!row) {
      return sendNotFound(res)
    }
    sendOk(res, row)
  } catch (err) {
    sendError(res, err)
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.abreviacion || !body.nombre) {
      return sendBadRequest(res, 'Abreviación y nombre son obligatorios')
    }

    const result = await execute(`
      INSERT INTO sucursal (abreviacion, nombre, domicilio, colonia, ciudad, codigo_postal, telefonos, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      body.abreviacion,
      body.nombre,
      body.domicilio || null,
      body.colonia || null,
      body.ciudad || null,
      body.codigo_postal || null,
      body.telefonos || null,
      body.email || null
    ])

    const row = await queryOne(`
      SELECT id, abreviacion, nombre, domicilio, colonia, ciudad, codigo_postal, telefonos, email
      FROM sucursal WHERE id = ?
    `, [result.insertId])

    sendOk(res, row)
  } catch (err) {
    sendError(res, err)
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await queryOne('SELECT id FROM sucursal WHERE id = ? AND borrado = 0', [id])
    if (!existing) {
      return sendNotFound(res)
    }

    const body = req.body || {}
    if (!body.abreviacion || !body.nombre) {
      return sendBadRequest(res, 'Abreviación y nombre son obligatorios')
    }

    await execute(`
      UPDATE sucursal SET
        abreviacion = ?,
        nombre = ?,
        domicilio = ?,
        colonia = ?,
        ciudad = ?,
        codigo_postal = ?,
        telefonos = ?,
        email = ?,
        fecha_actualizacion = ?
      WHERE id = ?
    `, [
      body.abreviacion,
      body.nombre,
      body.domicilio || null,
      body.colonia || null,
      body.ciudad || null,
      body.codigo_postal || null,
      body.telefonos || null,
      body.email || null,
      nowPst(),
      id
    ])

    const row = await queryOne(`
      SELECT id, abreviacion, nombre, domicilio, colonia, ciudad, codigo_postal, telefonos, email
      FROM sucursal WHERE id = ?
    `, [id])

    sendOk(res, row)
  } catch (err) {
    sendError(res, err)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await queryOne('SELECT id FROM sucursal WHERE id = ? AND borrado = 0', [id])
    if (!existing) {
      return sendNotFound(res)
    }

    await execute(`
      UPDATE sucursal SET borrado = 1, fecha_actualizacion = ?
      WHERE id = ?
    `, [nowPst(), id])

    sendOk(res, { id })
  } catch (err) {
    sendError(res, err)
  }
})

export default router
