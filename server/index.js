const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const app = express()
const fs = require('fs');


// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'

async function start () {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()


// Ruta que recibe los datos de la lectura de inventario para grabar el archivo
app.get('/svr_lectura', function (req, res) {
  let datos = req.query;
  res.setHeader('Access-Control-Allow-Origin', '*');
  console.log('Lectura', datos)
  grabaArchivo(datos)
  res.end("Respuesta correcta")
})


function grabaArchivo(obj) {
  var archivo = "f:\\caja\\" + obj.usuario + ".txt";
  console.log('archivo', archivo)
  // Creo el archivo y grabo la información
  let fd;
  try {
    fd = fs.openSync(archivo, 'a');
    let linea = obj.codigo + "|" +
                obj.cantidad +
                "@" +
                "\r\n";
    fs.appendFileSync(fd, linea, 'utf8', 'a+');
  } catch (error) {
    console.log('Error', error)
  } finally {
    if (fd != undefined) {
      fs.closeSync(fd);
    }
  }

}
