export function sendOk (res, data, msg = 'Ok') {
  res.json({ response: 200, msg, data })
}

export function sendBadRequest (res, msg) {
  res.json({ response: 400, msg, data: null })
}

export function sendNotFound (res, msg = 'Registro no encontrado') {
  res.json({ response: 404, msg, data: null })
}

export function sendError (res, err) {
  console.error('Error en API:', err)
  const msg = (err && err.stack) ? err.stack : String(err)
  res.json({ response: 500, msg, data: null })
}
