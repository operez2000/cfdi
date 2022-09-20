import Express from 'express';
import {DBFFile} from 'dbffile';
import axios from 'axios';
import fs from 'fs';
import cors from 'cors'

//const conf = JSON.parse(fs.readFileSync(__dirname + "/config.json"))
const config = require(`${__dirname}/../config.json`)

const app = Express();
/*
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
*/
app.use(Express.json({limit: '50mb', extended: true}));
app.use(Express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors())

/** Sección de Funciones **********************************************************************************************/

// Funcion para control de mensajes en consola (middleware)
const mdi = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  console.log('-------------------------------------------------------');
  console.log(new Date().toLocaleString('es-MX', {timeZone: "America/Tijuana"}));
  console.log('req.query', req.query);
  console.log('req.body', req.body);
  console.log('req.params', req.params);
  next();
};


// Funcion para crear el archivo de importación (Lotes.exe)
const creaArchivo = (obj) => {
  console.log('Procesando archivo');
  let str = JSON.stringify(obj);
  let archivo = "c:\\temp\\rango.txt";

  let fd;
  try {

    // Verifico si existe para borrarlo
    if (fs.existsSync(archivo)) {
      fs.unlinkSync(archivo)
    }

    fd = fs.openSync(archivo, 'a');
    obj.forEach(element => {
      var linea = element.letra + "|" +
                  element.registro + "|" +
                  element.lote + "|" +
                  element.caducidad + "|" +
                  element.codigo +
                  "@" +
                  "\r\n";
//      fs.appendFileSync(archivo, linea);
      fs.appendFileSync(fd, linea, 'utf8', 'a+');
    });

  } catch (error) {
    console.log('Error', error)
  } finally {
    if (fd != undefined) {
      fs.closeSync(fd);
    }
  }

} // creaArchivo()


// Control de errores (mensajes)
const ctrlError = (err, method, route) => {
  let cadena = `Error en /api${route} | Método ${method} \r\n`
  if (err.code) {
    cadena += err.code + "\r\n"
  }
  if (err.message) {
    cadena += err.message
  }
  return cadena
}


// (CParam02.dbf)
const getCParam = async () => {
  let records = []
  let json = {}

  try {
    let items = []
    let dbf = await DBFFile.open(`${config.dbfLocation}/Cparam02.dbf`);
    console.log(`Registros: ${dbf.recordCount}`)
    let records = await dbf.readRecords(dbf.recordCount);
    items = records.map( ({MSUCU}) => ({MSUCU}) )
    json.result = 200
    json.msg = "Ok"
    json.data = {
      MSUCU: records[0].MSUCU,
      CODPOS: records[0].CODPOS
    }
  } catch (error) {
    json.result = 403
    json.msg = "Error"
    json.data = error
  } finally {
    return json
  }
} // getCParam()


// (Client02.dbf)
const getClientes = async (req, res) => {
  let records = []
  let json = {}

  try {
    let items = []
    let dbf = await DBFFile.open(`${config.dbfLocation}/Client02.dbf`);
    console.log(`Registros: ${dbf.recordCount}`)
    let records = await dbf.readRecords(dbf.recordCount);
    items = records //records.map( ({MSUCU}) => ({MSUCU}) )
    json.result = 200
    json.msg = "Ok"
    json.records = records.length
    json.data = items
  } catch (error) {
    json.result = 403
    json.msg = "Error"
    json.records = 0
    json.data = error
  } finally {
    res.json(json)
    return json
  }
} // getClientes()

// Afectación a FacCli02.dbf
const afectaFactura = (obj) => {
  let params = obj.params
  let data = obj.data
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=${params.mod}&opt=${params.opt}`
  console.log('-------------------------------------------------')
  console.log('afectaFactura()', url)
  axios({
    method: 'post',
    url: url,
    data: data
  }).then(resp => {
    console.log("afectaFactura() resp.data", resp.data)
  }).catch(error => {
    console.log("afectaFactura() error", error)
  }).finally(() => {
    console.log("fin de afectaFactura()")
  })
} // afectaFactura()


/** Sección de Rutas *******************************************************************/

app.use('/rango', mdi, (req, res) => {
  let objResp, strResp;
  res.setHeader('Access-Control-Allow-Origin', '*');
  console.log('Rango de lotes...')
  let url = 'http://code-ware.com/proyectos/gusher/server/lotes.php?opcion=rango&etiq1=' + req.query.etiq1 + '&etiq2=' + req.query.etiq2;
  axios({
    method: 'get',
    url: url,
    data: {}
  }).then( response => {
    console.log('Respuesta', response.data.result, response.data.msg);
    creaArchivo(response.data.data);  // Creación del archivo texto para ser leído posteriormente por Lotes.exe
    objResp = response.data;
  }).catch( response => {
    console.log('Error', response);
    objResp = response;
  }).finally( () => {
    console.log('Finaizando rango de lotes...');
    // Enviar socket
    objResp = {
      result: objResp.result,
      msg: objResp.msg
    };
    strResp = JSON.stringify( objResp );
    console.log('********************************************');
    res.end(strResp);
  });
});


// Prueba
app.get('/test', mdi, (req, res) => {
  /*
  res.json({
    result: 200,
    msg: "Ok"
  });
  */
  //dbfRead(req, res)
  dbfClientes(req, res)
})

// Items (Almace02.dbf)
async function dbfItems(req, res) {
  console.log('------------------  inicio catálogo -----------------------')
  let items = []
  let dbf = await DBFFile.open(`${config.dbfLocation}/almace02.dbf`);
  console.log(`Registros: ${dbf.recordCount}`)
  let records = await dbf.readRecords(dbf.recordCount);
/*
  for (let record of records) {
    items.push({
      mpart: record.MPART,
      mdesc: record.MDESC,
      mbarcode: record.MBARCODE,
      mlabod: record.MLABOD,
      cantidad: 0
    })
    //console.log(record)
  }
*/
  items = records.map( ({MPART, MDESC, MBARCODE}) => ({MPART, MDESC, MBARCODE}) )
  console.log('------------------  fin catálogo -----------------------')
  res.json(items)
}

// Items
app.use("/items", mdi, (req, res) => {
//  dbfItems(req, res)
  res.json({
    MPART: '',
    MDESC: '',
    MBARCODE: '',
    MLABOD: '',
    CANTIDAD: 0
  })
})

async function dbfLotes(req, res) {
  console.log('------------------  Inicio Lotes  -----------------------')
  let items = []
  let dbf = await DBFFile.open(`${config.dbfLocation}/lotes.dbf`);
  console.log(`Registros: ${dbf.recordCount}`)
  let records = await dbf.readRecords(dbf.recordCount);
  /*
  for (let record of records) {
    items.push({
      mpart: record.MPART,
      mdesc: record.MDESC,
      mbarcode: record.MBARCODE,
      mlabod: record.MLABOD,
      cantidad: 0
    })
    //console.log(record)
  }
  */
 items = records.map( ({BARRA, CODIGO, BARCODE, LOTE, FCADUC, EXISTENCIA}) => ({BARRA, CODIGO, BARCODE, LOTE, FCADUC, EXISTENCIA}) )
 //  console.log('items:', items)
 //items = items.map(v => ({...v, cantidad: 0}))
 console.log('------------------  fin Lotes -----------------------')
 res.json(items)
}

// Lotes
app.use("/lotes", mdi, (req, res) => {
  //dbfLotes(req, res)
  res.json({
    BARRA: '',
    CODIGO: '',
    BARCODE: '',
    LOTE: '',
    FCADUC: '',
    EXISTENCIA: 0
  })
})


app.use("/catalogo", mdi, (req, res) => {
  /**
   * @param mod (modulo)
   * @param opt (opcion interna)'
   * @param codigo (en éste caso es el código interno Almace02->mPart)
   * @param cantidad (sumar cantidad a Almace02->mExiste)
   */

  let json = {}
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=catalogo&opt=${req.query.opt}&id=${req.query.codigo}&cantidad=${req.query.cantidad}`

  axios({
    method: 'get',
    url: url
  })
  .then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
  })
  .finally(() => {
    console.log("Finally")
    res.json(json)
  })

}) // /catalogo


// Lote
app.use("/lote", mdi, (req, res) => {

  let json = {}

  axios({
    method: 'get',
    url: `${config.backEndUrl}/gusher/ws.prg?opt=${req.query.opt}&mod=lote&id=${req.query.codigo}&cantidad=${req.query.cantidad}`
  })
  .then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  })
  .catch(error => {
    console.log("Error", err)
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
  })
  .finally(() => {
    console.log("Finally")
    res.json(json)
  })

}) // /lote


// Usuario
app.post("/usuario/:id", mdi, (req, res) => {

  let json = {}

  axios({
    method: 'get',
    url: `${config.backEndUrl}/gusher/ws.prg`,
    params: {
      mod: 'usuario',
      id: req.params.id,
      clave: req.body.clave,
      opt: req.body.opt
    }
  }).then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  }).catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
  }).finally(() => {
    res.json(json)
  }) // axios({})

})  // /usuario/:id


// Codigo -> lectura de código (interno, de barras o lote) para captura de inventario por lotes
app.use("/codigo", mdi, (req, res) => {
  let json = {}

  axios({
    method: 'get',
    url: `${config.backEndUrl}/gusher/ws.prg`,
    params: {
      mod: 'codigo',
      id: req.query.id
    }
  }).then(resp => {
    json = resp.data
  }).catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
  }).finally(() => {
    res.json(json)
  })

}) // /codigo

// Codigo -> lectura de código (interno, de barras o lote) para captura de inventario por lotes
app.use("/inicia-ceros", mdi, (req, res) => {
  let json = {}

  axios({
    method: 'get',
    url: `${config.backEndUrl}/gusher/ws.prg`,
    params: {
      mod: 'inicia-ceros',
      mPart: req.query.mPart
    }
  }).then(resp => {
    json = resp.data
  }).catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
  }).finally(() => {
    res.json(json)
  })

}) // /inicia-ceros


// Finalizar bloque de lotes
app.use("/final-lotes", mdi, (req, res) => {

  let json = {}

  req.query.mod = "final-lotes"

  axios({
    method: 'get',
    url: `${config.backEndUrl}/gusher/ws.prg`,
    params: req.query
  }).then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  }).catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
  }).finally(() => {
    res.json(json)
  }) // axios({})

})  // /final-lotes


// Etiqueta
app.use("/etiqueta/:id", mdi, (req, res) => {

  let json = {}
  let id = req.params.id.substr(0, 1).toUpperCase() + req.params.id.substr(1).padStart(6, '0')
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=etiqueta&id=${id}&mPart=${req.query.mPart}&cantidad=${req.query.cantidad}`

  axios({
    method: 'get',
    url: url
  })
  .then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
  })
  .finally(() => {
    res.json(json)
  })
}) // /etiqueta


// Faltantes (inventario por lotes)
app.use("/faltantes-lotes/:fecha", mdi, (req, res) => {

  let json = {}

  axios({
    method: 'get',
    url: `${config.backEndUrl}gusher/ws.prg`,
    params: {
      mod: 'rpt-faltantes',
      fecha: req.params.fecha
    }
  })
  .then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
  })
  .finally(() => {
    res.json(json)
  })
}) // /faltantes-lotes


// Recuperar CFDI
app.get("/recuperarCFDI/:folio", mdi, (req, res) => {

  let params = `{
    "method": "recuperar",
    "cuenta": "${config.pac.cuenta}",
    "user": "${config.pac.user}",
    "password": "${config.pac.password}",
    "folio": "${req.params.folio}",
    "getPdf": true
  }`.trim().replace(/^\s+|\s+$/gm,'')

  /* Ejemplo...
    https://facturacion33.itimbre.com/service.php?q={"method":"recuperar","cuenta":"msi961203md0","user":"facturacion","password":"S0port3TI664","folio":"PRS178","getPdf":false}
  */
  let url = `https://facturacion33.itimbre.com/service.php?q=${params}`
  //let url = `https://facturacion33.itimbre.com/service.php`
  //let url = `https://facturacion33.itimbre.com/service.php?q={"method":"recuperar","cuenta":"msi961203md0","user":"facturacion","password":"S0port3TI664","folio":"${req.params.serieFolio}","getPdf":false}`
  let response = {}

  console.log("url", url)

  axios({
    method: 'post',
    url: url,
    data: {}
/*
    data: {
      q: req.body.json
    },
*/
  }).then( resp => {
    response = resp.data
  }).catch( err => {
    console.error('Error resp', err)
    response = err
  }).finally( () => {
    res.json(response)
  })

})  // //recuperarCFDI/:folio


// Clientes - Client02
app.get("/clientes", mdi, (req, res) => {
  getClientes(req, res)
})


// Parametros - CParam02
app.get("/parametros", mdi, (req, res) => {
  let json = {}
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=parametros`
  console.log("url", url)

  axios({
    method: 'get',
    url: url
  })
  .then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
    json.url = url
  })
  .finally(() => {
    console.log("Finally")
    res.json(json)
  })
}) // /parametros


// Recibo - FacCli02.dbf
app.get("/recibo/:factura/:opt", mdi, (req, res) => {
  let json = {}
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=recibo&factura=${req.params.factura}&opt=${req.params.opt}`
  console.log("url", url)

  axios({
    method: 'get',
    url: url
  })
  .then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
    json.url = url
  })
  .finally(() => {
    res.json(json)
  })
}) // /recibo/:factura


// Lectura del Cliente - Client02.dbf
app.get("/cliente/:opcion/:valor", mdi, (req, res) => {

  let json = {}
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=cliente&opt=${req.params.opcion}&val=${req.params.valor}`
  console.log("url", url)

  axios({
    method: 'get',
    url: url
  })
  .then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
    json.url = url
  })
  .finally(() => {
    res.json(json)
  })
}) // /cliente/:rfc ó :recno


// Clientes - Client02.dbf
app.get("/clientes/:nombre", mdi, (req, res) => {
  let json = {}
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=busca-clientes&nombre=${req.params.nombre}`
  console.log("url", url)

  axios({
    method: 'get',
    url: url
  })
  .then(resp => {
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
    json.url = url
  })
  .finally(() => {
    res.json(json)
  })
}) // /clientes/:nombre


// Grabar Cliente - Client02.dbf
app.post("/cliente", mdi, (req, res) => {

  let json = {}
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=cliente&opt=save`
  console.log("url", url)

  axios({
    method: 'post',
    url: url,
    data: req.body
  })
  .then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
    json.url = url
  })
  .finally(() => {
    res.json(json)
  })
}) // /cliente/  Grabar Cliente - Client02.dbf


// traer el siguiente folio para facturar (FacCli02.dbf)
app.get("/siguiente-factura", mdi, (req, res) => {
  let json = {}
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=siguiente-factura`
  console.log("url", url)
  axios({
    method: 'get',
    url: url
  })
  .then(resp => {
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
    json.url = url
  })
  .finally(() => {
    res.json(json)
  })
}) // /siguiente-folio


// Timbrar CFDI
app.post("/facturar", mdi, (req, res) => {
  let json = req.body.data  // La estructura que se crea y viene como body desde los módulos (facturacion, etc...)
  json.cuenta = config.pac.cuenta
  json.user = config.pac.user
  json.password = config.pac.password
  json.getPdf = true
  json.enviarFactura = true
  json.method = "nueva_factura"
  let params = JSON.stringify(json).trim().replace(/^\s+|\s+$/gm,'')

  fs.writeFileSync(`c:/cfdi/${json.datos_factura.Serie}${json.datos_factura.Folio}.json`, params)

  /* Ejemplo...
    https://facturacion33.itimbre.com/service.php?q={"method":"recuperar","cuenta":"msi961203md0","user":"facturacion","password":"S0port3TI664","folio":"PRS178","getPdf":false}
  */
  let url = `https://facturacion33.itimbre.com/service.php?q=${params}`
  let response = {}

  axios({
    method: 'post',
    url: url,
    //data: {}
  }).then( resp => {
    response = resp.data
  }).catch( err => {
    console.error('Error resp', err)
    response = err
  }).finally( () => {
    res.json(response)
    if (response.result.retcode == 1) { // Todo bien, se timbró la facura
      req.body.factura.uuid = response.result.UUID
      // Agrego la nueva factura a FacCli02.dbf
      afectaFactura({
        params: {
          mod: "factura",
          opt: "insert"
        },
        data: req.body.factura
      })
    }
  }) // axios()

})  // //facturar

// Cancelacion de factura (con y sin relación)
app.post("/cancelarFactura", mdi, (req, res) => {
  let json = {
    id_transaccion: 0,
    method: "cancelarCFDI",
    cuenta:  config.pac.cuenta,
    user: config.pac.user,
    password: config.pac.password,
    getPdf: true
  }

  json.cancelaciones = [
    req.body.dataPac  // uuid, motivo de cancelación y en caso de relacionar una sustitucion el FolioSusticiion (uuid)
  ]

  let params = JSON.stringify(json).trim().replace(/^\s+|\s+$/gm,'')
  let url = `https://facturacion33.itimbre.com/service.php?q=${params}`
  let response = {}

  console.log("url cancelación", url)

  axios({
    method: 'post',
    url: url,
    //data: {}
  }).then( resp => {
    response = resp.data
  }).catch( err => {
    console.error('Error resp', err)
    response = err
  }).finally( () => {
    res.json(response)
    if (response.result.retcode == 1) { // Todo bien, se timbró la facura
      // Agrego la nueva factura a FacCli02.dbf
      afectaFactura({
        params: {
          mod: "factura",
          opt: "cancel"
        },
        data: req.body.dataFact
      })
    }
  }) // axios()
}) // /cancelarFactura


// Consulta del catálogo
app.get("/consulta-catalogo/:descripcion", mdi, (req, res) => {
  let json = {}
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=consulta-catalogo&busqueda=contiene&descripcion=${req.params.descripcion}`

  axios({
    method: 'get',
    url: url
  })
  .then(resp => {
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error, req.route.stack[0].method, req.route.path)
    json.url = url
  })
  .finally(() => {
    res.json(json)
  })
}) // /consulta-catalogo:descripcion


// Final => exportación del módulo para el Server
module.exports =  {
  path: '/api/',
  handler: app
};
