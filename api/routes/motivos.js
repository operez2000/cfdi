import Express from 'express'
import { query, queryOne, execute } from '../db'
import { sendOk, sendBadRequest, sendNotFound, sendError } from '../utils/response'

const router = Express.Router()

router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      SELECT id, descripcion, activo
      FROM motivo_traspaso
      WHERE borrado = 0
      ORDER BY descripcion
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
      SELECT id, descripcion, activo
      FROM motivo_traspaso
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
    if (!body.descripcion) {
      return sendBadRequest(res, 'La descripción es obligatoria')
    }

    const activo = body.activo === 0 || body.activo === false ? 0 : 1

    const result = await execute(`
      INSERT INTO motivo_traspaso (descripcion, activo)
      VALUES (?, ?)
    `, [body.descripcion, activo])

    const row = await queryOne(`
      SELECT id, descripcion, activo
      FROM motivo_traspaso WHERE id = ?
    `, [result.insertId])

    sendOk(res, row)
  } catch (err) {
    sendError(res, err)
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await queryOne('SELECT id FROM motivo_traspaso WHERE id = ? AND borrado = 0', [id])
    if (!existing) {
      return sendNotFound(res)
    }

    const body = req.body || {}
    if (!body.descripcion) {
      return sendBadRequest(res, 'La descripción es obligatoria')
    }

    const activo = body.activo === 0 || body.activo === false ? 0 : 1

    await execute(`
      UPDATE motivo_traspaso SET
        descripcion = ?,
        activo = ?,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [body.descripcion, activo, id])

    const row = await queryOne(`
      SELECT id, descripcion, activo
      FROM motivo_traspaso WHERE id = ?
    `, [id])

    sendOk(res, row)
  } catch (err) {
    sendError(res, err)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await queryOne('SELECT id FROM motivo_traspaso WHERE id = ? AND borrado = 0', [id])
    if (!existing) {
      return sendNotFound(res)
    }

    await execute(`
      UPDATE motivo_traspaso SET borrado = 1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id])

    sendOk(res, { id })
  } catch (err) {
    sendError(res, err)
  }
})

export default router
