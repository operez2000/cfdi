//const conf = JSON.parse(fs.readFileSync(__dirname + "/config.json"))
const config = require(`${__dirname}/../config.json`)

import Express from 'express';
const app = Express();
import {DBFFile} from 'dbffile';
import axios from 'axios';
import fs from 'fs';
import cors from 'cors'
import nodeMailer from 'nodemailer'
import ExcelJS from 'exceljs'
import ADODB from '@el3um4s/node-adodb'
const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${config.dbfLocation}/novartis.mdb;`);
import Utils from '../assets/utils'
const utils = new Utils()


/*
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
*/
app.use(Express.json({limit: '50mb', extended: true}));
app.use(Express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors())

// Validación de la carpeta para archivos de Excel
try {
  if (!fs.existsSync("./xl")) {
    fs.mkdirSync("./xl", '0777')
  }
} catch (error) {
  console.log(error);
}
const fileNameGlobal = "./xl/global.xlsx"

const correos = [
  {
    sucursal: 'Monarca',
    correos: {
      captura: 'anaf.ruiz@gusher.com.mx',
      tesoreria: 'monarcaadmin@gusher.com.mx',
      farmacia: 'suc.monarca@gusher.com.mx'
    }
  },
  {
    sucursal: 'Otay',
    correos: {
      captura: 'silvia.ochoa@gusher.com.mx',
      tesoreria: 'otayadmin@gusher.com.mx',
      farmacia: 'suc.otay@gusher.com.mx'
    }
  },
  {
    sucursal: 'Palmas',
    correos: {
      captura: 'alejandraochoa@gusher.com.mx',
      tesoreria: 'palmasadmin@gusher.com.mx',
      farmacia: 'suc.palmas@gusher.com.mx'
    }
  },
  {
    sucursal: 'Rio',
    correos: {
      captura: 'silviaordaz@gusher.com.mx',
      tesoreria: 'suc.rio@gusher.com.mx',
      farmacia: 'suc.rio@gusher.com.mx'
    }
  },
  {
    sucursal: 'Rosarito',
    correos: {
      captura: 'nallelypalomares@gusher.com.mx',
      tesoreria: 'rosaritoadmin@gusher.com.mx',
      farmacia: 'suc.rosarito@gusher.com.mx'
    }
  },
]

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
  if (err.stack) {
    cadena += (" | " + err.stack.replace(/\s+/gm, ' '))
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
  console.log('-------------------------------------------------', '\r\n')
  console.log('afectaFactura() url', '\r\n', url, '\r\n')
  console.log('afectaFactura() data', '\r\n', data, '\r\n')
  if (data.tipo == undefined || !data.tipo) {
    data.tipo = ''
  }
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


const syncDelay = (milliseconds) => {
  var start = new Date().getTime();
  var end=0;
  while( (end-start) < milliseconds){
      end = new Date().getTime();
  }
}


const mailConfig = {
  //service: 'gmail',
  host: config.mail.host, // 'smtpout.secureserver.net', //'smtp.gmail.com',
  port: process.env.MAIL_PORT * 1, //465, //587,    // 110
  //secure: false,
  auth: {
      user: config.mail.user, //'suc.rio@gusher.com.mx', // 'gusher.sistemas@gmail.com'
      pass: config.mail.pass, // 'gsistemas123!', 'hfenilwexwvkgsxp'
  },
  tls: {
    rejectUnauthorized: false,
  },
}

/**
 * jsonOpciones {}
 * @param serie_folio
 * @param subject
 * @param emailTo
 * @param cc
 * @param body
 * @param pdfBase64
 * @param xml
 */
const sendEmail = async (jsonOpciones) => {

  let transporter = null
  let mailOptions = null
  let info
  let fecha = new Date().toLocaleString('fr-FR').replace(/\//g, '-')
  let buf = Buffer.from(jsonOpciones.pdfBase64, 'base64')
  let ok = false

  const tmpFolder = './cfdiFiles'

  if (!fs.existsSync(tmpFolder)) {
    fs.mkdirSync(tmpFolder)
  }

  fs.writeFileSync(`${tmpFolder}/${jsonOpciones.serie_folio}.pdf`, buf)
  fs.writeFileSync(`${tmpFolder}/${jsonOpciones.serie_folio}.xml`, jsonOpciones.xml)

  /*
  jsonOpciones = {
    serie_folio: serie_folio,
    subject: `CFDI - Gusher Farmacia`,
    emailTo: emailTo,
    cc: cc,
    body: body
  }
  */

  jsonOpciones.subject = `CFDI ${jsonOpciones.serie_folio}`
  jsonOpciones.body = `
    <div style="font-family: Verdana;">
      Estimado/a Cliente: <br>
      <p style="text-align: justify; text-justify: inter-word;">
        <strong>Farmacia Gusher</strong> le hace llegar por este medio su Factura Electrónica #${jsonOpciones.serie_folio}.
      </p>
      <p>Gracias por su preferencia.</p>
      <p></p>
      <hr>
      <p></p>
      <div style="font-family: Verdana; font-size: 12px;">
        <strong>Farmacia Gusher, SA de CV</strong><br>
        Ave. Paseo de los Héroes 9550<br>
        Tijuana, BC<br>
        <strong>Teléfonos</strong> 664-684-0235 y 664-684-0229
        <hr>
      </div>
    </div>
    `

  console.log("Iniciando envío", fecha, "email" , jsonOpciones.emailTo, "subject", jsonOpciones.subject)

  //syncDelay(1200)

  let enviado = false
  try {
    mailOptions = {
      from: `Farmacia Gusher ${mailConfig.auth.user}`, // sender address
      to: jsonOpciones.emailTo, // list of receivers
      cc: jsonOpciones.cc,
      bcc: '',
      reply: 'noreply@gusher.com.mx',
      subject: jsonOpciones.subject,   // `${txtClasificacion} // Encuesta ${surveyDetail.responseId} // ${fechaHora}`, // Subject line
      html: jsonOpciones.body, // plain text body
      attachments: [
        {
          filename: `${jsonOpciones.serie_folio}.pdf`,
          path: `${tmpFolder}/${jsonOpciones.serie_folio}.pdf`,
          cid: 'pdf' //my mistake was putting "cid:logo@cid" here!
        },
        {
          filename: `${jsonOpciones.serie_folio}.xml`,
          path: `${tmpFolder}/${jsonOpciones.serie_folio}.xml`,
          cid: 'xml' //my mistake was putting "cid:logo@cid" here!
        }
      ]
    }
    //process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
    transporter = nodeMailer.createTransport(mailConfig)
    info = await transporter.sendMail(mailOptions)    //, (error, info) => {

    // Todo bien, afecto a la BD
    console.log("Aceptado:", info.accepted, info.accepted.length);

    if (info.accepted.length > 0) {
      console.log("accepted", info.accepted)
      ok = true
      enviado = true
    } else {
      console.log("Not accepted")
    }

    // Agrego los envíos rechazados al log
    if (info.rejected.length > 0) {
      console.log("Rechazados", info.rejected)
    }
    //syncDelay(1300)

  } catch (err) {
    console.log("Error al enviar correo sendEmail() (catch)\r\n", err)
    fs.writeFileSync("error-envio.log", `${fecha}\r\n ${err.message}\r\n`, {flag: 'a'})

  } finally {
    console.log("finally en sendEmail()", fecha)
    console.log('---------------------------------------------------------------')
    //syncDelay(1200)
    try {
      // Verifico si existe para borrarlo
      if (fs.existsSync(`${tmpFolder}/${jsonOpciones.serie_folio}.pdf`)) {
        fs.unlinkSync(`${tmpFolder}/${jsonOpciones.serie_folio}.pdf`)
      }
      if (fs.existsSync(`${tmpFolder}/${jsonOpciones.serie_folio}.xml`)) {
        fs.unlinkSync(`${tmpFolder}/${jsonOpciones.serie_folio}.xml`)
      }
    } catch (error) {
      console.log("error", error)
    }

    return enviado

  }

} // sendEmail()


/**
 * jsonOpciones {}
 * @param from
 * @param to
 * @param cc
 * @param subject
 * @param body
 */
 const EnviarCorreo = async (jsonOpciones) => {

  let transporter = null
  let mailOptions = null
  let info
  let fecha = new Date().toLocaleString('fr-FR').replace(/\//g, '-')
  let ok = false
  let gmailCfg = mailConfig

  gmailCfg.host = 'smtp.gmail.com'
  gmailCfg.port = 587
  gmailCfg.auth.user = 'gusher.sistemas@gmail.com'
  gmailCfg.auth.pass = 'hfenilwexwvkgsxp'

  /*
  jsonOpciones = {
    serie_folio: serie_folio,
    subject: `CFDI - Gusher Farmacia`,
    emailTo: emailTo,
    cc: cc,
    body: body
  }
  */

  console.log("Iniciando envío", fecha, jsonOpciones)

  let enviado = false
  try {
    mailOptions = {
      from: `Farmacia Gusher ${gmailCfg.auth.user}`, // sender address
      to: jsonOpciones.to, // list of receivers
      cc: jsonOpciones.cc,
      bcc: 'Oscar Pérez operez2000@gmail.com',
      reply: '',
      subject: jsonOpciones.subject,   // `${txtClasificacion} // Encuesta ${surveyDetail.responseId} // ${fechaHora}`, // Subject line
      html: jsonOpciones.body, // plain text body
      attachments: []
    }
    //process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
    transporter = nodeMailer.createTransport(gmailCfg)
    info = await transporter.sendMail(mailOptions)    //, (error, info) => {

    // Todo bien, afecto a la BD
    console.log("Resultado:", info.accepted, info.rejected);

    if (info.accepted.length > 0) {
      ok = true
      enviado = true
    }

  } catch (err) {
    console.log("Error al enviar correo EnviarCorreo() (catch)\r\n", err)
    fs.writeFileSync("error-envio.log", `${fecha}\r\n ${err.message}\r\n`, {flag: 'a'})

  } finally {
    console.log("finally en EnviarCorreo()", fecha)
    console.log('---------------------------------------------------------------')

    return enviado

  }

} // EnviarCorreo()


// Notas de Crédito (Factura Global)
const NotasDeCredito = async (fecha) => {
  let data = []
  let qry
  try {
    // Query
    qry = `
      SELECT
        Format([Notas].[fechaVenta],'yyyymmdd') AS fecha, [Serie] & [FolioNota] AS seriefolio,
        Sum(IIf([tipoIva]=' A',[importe],0)) AS exento, Sum(IIf([tipoIva]='B',[importe],0)) AS tasaCero,
        Sum(IIf([tipoIva]='C', Round([importe]-[impIva], 2),0)) AS gravable, Sum(NotasDetalle.impIva) AS iva,
        Sum(NotasDetalle.importe) AS sumImporte, IIf([estatus]=False,'S','') AS cancelada,
        [Notas]![caja] & ' ' & [Notas]![FolioVenta] AS folioVenta,
        Format(Notas!FechaVenta, 'yyyy-mm-dd') AS fecha2
      FROM Notas INNER JOIN NotasDetalle ON Notas.ID = NotasDetalle.IDNota
      GROUP BY
        Format([Notas].[fechaVenta],'yyyymmdd'), [Serie] & [FolioNota],
        IIf([estatus]=False,'S',''), [Notas]![caja] & ' ' & [Notas]![FolioVenta],
        Notas.FechaVenta
      HAVING (Format(Notas!FechaVenta, 'yyyy-mm-dd')='${fecha}');
    `
    data = connection.query(qry) //`SELECT * FROM Notas WHERE fecha = #${fecha}#`)
      /*
      .then((data) => {
        console.log(JSON.stringify(data, null, 2));
      })
      .catch((error) => {
        console.error(error);
      });
      */
  } catch (error) {
    console.log(error);
  }
  return data
} // NotasDeCredito(fecha)
//NotasDeCredito('2019-04-30').then(resp => console.log(resp))


// Recuperar CFDI
const recuperarCfdi = async (params) => {
  /* Ejemplo...
    https://facturacion33.itimbre.com/service.php?q={"method":"recuperar","cuenta":"msi961203md0","user":"facturacion","password":"S0port3TI664","folio":"PRS178","getPdf":false}
  */
  let url = `https://facturacion33.itimbre.com/service.php?q=${params}`
  //let url = `https://facturacion33.itimbre.com/service.php`
  //let url = `https://facturacion33.itimbre.com/service.php?q={"method":"recuperar","cuenta":"msi961203md0","user":"facturacion","password":"S0port3TI664","folio":"${req.params.serieFolio}","getPdf":false}`
  let response = null
  console.log("url", url)
  try {
    response = await axios({
      method: 'post',
      url: url,
      data: {}
    })
    response = response.data
  } catch (error) {
    console.error('Error resp', error)
    response = error
  }
  return response
} // recuperarCfdi(params)

// Funcion para auto fijar el ancho de las columnas
const ExcelAutoFit = (ws) => {
  /*
  ws.columns.forEach(col => {
    const lengths = col.values.map( v => v.toString().length )
    const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'))
    col.width = maxLength
  })
  */
/*
  ws.columns.forEach(function(column){
    var dataMax = 0;
    column.eachCell({ includeEmpty: true }, function(cell){
      var columnLength = cell.value.length;
      if (columnLength > dataMax) {
        dataMax = columnLength;
       }
    })
    column.width = dataMax < 10 ? 10 : dataMax;
  })
*/
}

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

  res.download('global.xlsx')
  return

  res.json({
    result: 200,
    msg: "Ok"
  })

  sendEmail({
    serie_folio: "A12345",
    subject: `Envío de CFDI ${new Date().toLocaleString('en-CA')}`,
    emailTo: "farmacia1@gusher.com.mx",
    cc: "",
    body: "",
    pdfBase64: pdfBase64,
    xmlString: xmlString
  })

  //dbfRead(req, res)
  //dbfClientes(req, res)
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
app.get("/recuperarCFDI/:folio", mdi, async (req, res) => {
  let params = `{
    "method": "recuperar",
    "cuenta": "${config.pac.cuenta}",
    "user": "${config.pac.user}",
    "password": "${config.pac.password}",
    "folio": "${req.params.folio}",
    "getPdf": true
  }`.trim().replace(/^\s+|\s+$/gm,'')
  const response = await recuperarCfdi(params)
  res.json(response)
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
  let params = JSON.stringify(json).replace(/\s+/gm,' ')

  fs.writeFileSync(`c:/cfdi/${json.datos_factura.Serie}${json.datos_factura.Folio}.json`, params)

  /* Ejemplo...
    https://facturacion33.itimbre.com/service.php?q={"method":"recuperar","cuenta":"msi961203md0","user":"facturacion","password":"S0port3TI664","folio":"PRS178","getPdf":false}
  */
  let url = `https://facturacion33.itimbre.com/service.php?q=${params}`
  console.log(url)
  let response = {}

  // Agrego a req.body.tipo
  req.body.factura.tipo = " "

  axios({
    url: "http://code-ware.com/cfdi/cfdi.php",
    method: "post",
    data: req.body.data
  }).then(resp => {
    response = resp.data
  }).catch(error => {
    console.log("error", error)
    response.result = {
      retcode: -1,
      message: error.message + " | " + error.stack.replace(/\s+/gm, ' ')
    }
  }).finally(() => {
    res.json( response )
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

      sendEmail({
        serie_folio: `${json.datos_factura.Serie}${json.datos_factura.Folio}`,
        subject: 'Envío de Factura',
        emailTo: req.body.factura.email,
        cc: '',
        body: '',
        pdfBase64: response.result.pdfBase64,
        xml: response.result.data
      })

    }
  })

/*
  axios({
    method: 'post',
    url: url,
    //data: {}
  }).then( resp => {
    console.log(resp.data)
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

      sendEmail({
        serie_folio: `${json.datos_factura.Serie}${json.datos_factura.Folio}`,
        subject: 'Envío de Factura',
        emailTo: req.body.factura.email,
        cc: '',
        body: '',
        pdfBase64: response.result.pdfBase64,
        xml: response.result.data
      })

    }
  }) // axios()
*/

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

  console.log("url cancelación", '\r\n', url, '\r\n')

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
}) // /consulta-catalogo:descripcion


app.post("/enviar-cfdi/:serie_folio", mdi, async (req, res) => {
  let json = {}
  try {
    const send = await sendEmail({
      serie_folio: req.params.serie_folio,
      subject: 'Envío de Factura',
      emailTo: req.body.email,
      cc: '',
      body: '',
      pdfBase64: req.body.pdfBase64,
      xml: req.body.xml
    })
    json.response = ((send) ? 200 : 500)
    json.msg = ((send) ? "Factura enviada correctamente" : "No se ha podido enviar la factura, favor de revisar la cuenta o el servidor de correo")
  } catch (error) {
    json.response = 400
    json.msg = error.message
  } finally {
    res.json(json)
  }
}) // /enviar-cfdi


app.post("/recuperar_cfdi", mdi, async (req, res) => {
  let response = {}
  axios({
    url: "http://code-ware.com/cfdi/cfdi.php",
    method: "post",
    data: req.body
  }).then(resp => {
    response = resp.data
  }).catch(error => {
    console.log("error", error)
    response.result = {
      retcode: -1,
      message: error.message + " | " + error.stack.replace(/\s+/gm, ' ')
    }
  }).finally(() => {
    res.json( response )
  })
}) // /recuperar_cfdi


// Llamada para generar archivo de Excel en Factura Global
app.post("/global-excel", mdi, async (req, res) => {
  let json = {}
  let arrNotasDeCredito = []
  let temp = null
  let range
  let row = 4
  let rowIni
  try {
    console.log('fileName', fileNameGlobal);
    const wb = new ExcelJS.Workbook()
    // Hoja principal
    let ws = wb.addWorksheet('Factura_Global');
    ws.pageSetup.margins = {
      left: 0.5,
      right: 0.5,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2
    }
    ws.state = 'visible'
    // Titulos
    ws.getCell('A1').value = `Sucursal: ${req.body.parametros.mSucu}`
    ws.getCell('A2').value = `Reporte de Facturas correspondiente al: ${req.body.fecha}`
    // Encabezado
    ws.getCell('A3').value = `Factura #`
    ws.getCell('B3').value = `Exento`
    ws.getCell('C3').value = `Tasa 0%`
    ws.getCell('D3').value = `Gravable`
    ws.getCell('E3').value = `I.V.A.`
    ws.getCell('F3').value = `Importe`
    ws.getCell('G3').value = `Estatus`
    ws.getCell('H3').value = `F Pago`
    ws.getCell('I3').value = `Caja Folio`
    ws.getCell('J3').value = `Timbrada`
    // Centrado de encabezados
    ws.getRow(3).eachCell( cell => {
      ws.getCell(cell.address).alignment = {
        vertical: 'center',
        horizontal: 'center'
      }
    })
    // Ancho de columnas
    ws.columns[0].width = 10
    ws.columns[1].width = 7
    ws.columns[2].width = 11
    ws.columns[3].width = 11
    ws.columns[4].width = 10
    ws.columns[5].width = 12
    ws.columns[6].width = 10
    ws.columns[7].width = 7
    ws.columns[8].width = 9
    ws.columns[9].width = 9

    // Detalle de facturas
    for (const iterator of req.body.facturas) {
      ws.getCell(`A${row}`).value = iterator.factura
      ws.getCell(`B${row}`).value = iterator.exento ; ws.getCell(`B${row}`).numFmt = '#,##0.00'
      ws.getCell(`C${row}`).value = iterator.tasa0 ; ws.getCell(`C${row}`).numFmt = '#,##0.00'
      ws.getCell(`D${row}`).value = iterator.gravable ; ws.getCell(`D${row}`).numFmt = '#,##0.00'
      ws.getCell(`E${row}`).value = iterator.iva ; ws.getCell(`E${row}`).numFmt = '#,##0.00'
      ws.getCell(`F${row}`).value = iterator.importe ; ws.getCell(`F${row}`).numFmt = '#,##0.00'
      ws.getCell(`G${row}`).value = iterator.estatus
      ws.getCell(`H${row}`).value = iterator.formaDePago ; ws.getCell(`H${row}`).alignment = { vertical: 'center', horizontal: 'center' }
      ws.getCell(`I${row}`).value = iterator.folioVenta
      ws.getCell(`J${row}`).value = ((iterator.uuid == "") ? "No" : "Si") ; ws.getCell(`J${row}`).alignment = { vertical: 'center', horizontal: 'center' }
      // No está timbrada, agrego font color rojo
      if (iterator.uuid == "") {
        // Reviso si está timbrada
        const response = await recuperarCfdi(`{
            "method": "recuperar",
            "cuenta": "${config.pac.cuenta}",
            "user": "${config.pac.user}",
            "password": "${config.pac.password}",
            "folio": "${req.body.serie}${iterator.factura}",
            "getPdf": false
          }`.trim().replace(/^\s+|\s+$/gm,'')
        )
        if (response.result.result) {
          if (response.result.result.uuid) {
            iterator.uuid = response.result.result.uuid
          }
        }
        // Si no está timbrada, cambio el color
        if (iterator.uuid == "") {
          ws.getCell(`J${row}`).value = {
            richText: [
              {
                text: 'No',
                font: {
                  color: {
                    argb: '00FF0000',
                    theme: 1,
                  },
                },
              },
            ]
          }
        } // (iterator.uuid == "") -> color rojo
      } // (iterator.uuid == "") ->
      row++
    }

    // Si hubo facturas en el día agrego bordes
    if (row > 3) {
      for (let index = 3; index < row; index++) {
        ws.getRow(index).eachCell( cell => {
          ws.getCell(cell.address).border = {
            top: {style:'thin'},
            left: {style:'thin'},
            bottom: {style:'thin'},
            right: {style:'thin'}
          }
        })
      }
    }

    // Sumas facturas
    ws.getCell(`A${row}`).value = "Facturas"
    ws.getCell(`B${row}`).value = req.body.SumaFacturas.exento ; ws.getCell(`B${row}`).numFmt = '#,##0.00'
    ws.getCell(`C${row}`).value = req.body.SumaFacturas.tasa0 ; ws.getCell(`C${row}`).numFmt = '#,##0.00'
    ws.getCell(`D${row}`).value = req.body.SumaFacturas.gravable ; ws.getCell(`D${row}`).numFmt = '#,##0.00'
    ws.getCell(`E${row}`).value = req.body.SumaFacturas.iva ; ws.getCell(`E${row}`).numFmt = '#,##0.00'
    ws.getCell(`F${row}`).value = req.body.SumaFacturas.importe ; ws.getCell(`F${row}`).numFmt = '#,##0.00'
    row++
    // Sumas ventas
    ws.getCell(`A${row}`).value = "Ventas"
    ws.getCell(`B${row}`).value = req.body.SumaVentas.exento ; ws.getCell(`B${row}`).numFmt = '#,##0.00'
    ws.getCell(`C${row}`).value = req.body.SumaVentas.tasa0 ; ws.getCell(`C${row}`).numFmt = '#,##0.00'
    ws.getCell(`D${row}`).value = req.body.SumaVentas.gravable ; ws.getCell(`D${row}`).numFmt = '#,##0.00'
    ws.getCell(`E${row}`).value = req.body.SumaVentas.iva ; ws.getCell(`E${row}`).numFmt = '#,##0.00'
    ws.getCell(`F${row}`).value = req.body.SumaVentas.importe ; ws.getCell(`F${row}`).numFmt = '#,##0.00'
    row++
    // Diferencia entre facturas y ventas
    ws.getCell(`A${row}`).value = "Diferencia"
    ws.getCell(`B${row}`).value = req.body.SumaGlobales.exento ; ws.getCell(`B${row}`).numFmt = '#,##0.00'
    ws.getCell(`C${row}`).value = req.body.SumaGlobales.tasa0 ; ws.getCell(`C${row}`).numFmt = '#,##0.00'
    ws.getCell(`D${row}`).value = req.body.SumaGlobales.gravable ; ws.getCell(`D${row}`).numFmt = '#,##0.00'
    ws.getCell(`E${row}`).value = req.body.SumaGlobales.iva ; ws.getCell(`E${row}`).numFmt = '#,##0.00'
    ws.getCell(`F${row}`).value = req.body.SumaGlobales.importe ; ws.getCell(`F${row}`).numFmt = '#,##0.00'
    row += 2
    // Notas de Crédito
    arrNotasDeCredito = await NotasDeCredito(req.body.fecha2)
    ws.getCell(`A${row}`).value = "Notas de Crédito"
    // Si no hubo Notas de Credito, agrego un registro en blanco
    if (arrNotasDeCredito.length == 0) {
      arrNotasDeCredito.push({
        seriefolio: "",
        exento: 0,
        tasaCero: 0,
        gravable: 0,
        iva: 0,
        sumImporte: 0,
        cancelada: "",
        formaDePago: "",
        folioVenta: "",
        uuid: ""
      })
    }
    row++
    rowIni = row
    for (const iterator of arrNotasDeCredito) {
      ws.getCell(`A${row}`).value = iterator.seriefolio
      ws.getCell(`B${row}`).value = iterator.exento ; ws.getCell(`B${row}`).numFmt = '#,##0.00'
      ws.getCell(`C${row}`).value = iterator.tasaCero ; ws.getCell(`C${row}`).numFmt = '#,##0.00'
      ws.getCell(`D${row}`).value = iterator.gravable ; ws.getCell(`D${row}`).numFmt = '#,##0.00'
      ws.getCell(`E${row}`).value = iterator.iva ; ws.getCell(`E${row}`).numFmt = '#,##0.00'
      ws.getCell(`F${row}`).value = iterator.sumImporte ; ws.getCell(`F${row}`).numFmt = '#,##0.00'
      ws.getCell(`G${row}`).value = iterator.cancelada
      ws.getCell(`H${row}`).value = '' //iterator.formaDePago
      ws.getCell(`I${row}`).value = iterator.folioVenta
      ws.getCell(`J${row}`).value = '' //((iterator.uuid == "") ? "No" : "Si")
      row++
    }
    // Borders en sección de Notas de Crédito
    for (let index = rowIni; index < row; index++) {
      ws.getRow(index).eachCell( cell => {
        ws.getCell(cell.address).border = {
          top: {style:'thin'},
          left: {style:'thin'},
          bottom: {style:'thin'},
          right: {style:'thin'}
        }
      })
    }
    // Sumas Notas de crédito
    ws.getCell(`B${row}`).value = { formula: `SUM(B${rowIni}:B${row-1})` } ; ws.getCell(`B${row}`).numFmt = '#,##0.00'
    ws.getCell(`C${row}`).value = { formula: `SUM(C${rowIni}:C${row-1})` } ; ws.getCell(`C${row}`).numFmt = '#,##0.00'
    ws.getCell(`D${row}`).value = { formula: `SUM(D${rowIni}:D${row-1})` } ; ws.getCell(`D${row}`).numFmt = '#,##0.00'
    ws.getCell(`E${row}`).value = { formula: `SUM(E${rowIni}:E${row-1})` } ; ws.getCell(`E${row}`).numFmt = '#,##0.00'
    ws.getCell(`F${row}`).value = { formula: `SUM(F${rowIni}:F${row-1})` } ; ws.getCell(`F${row}`).numFmt = '#,##0.00'
    row++

    // Creación de hojas por formas de pago
    for (const iterator of utils.formasDePago) {
      const arrFormaDePago = iterator.split('-')
      arrFormaDePago[0] = arrFormaDePago[0].replace(/\s+/, '')
      arrFormaDePago[1] = arrFormaDePago[1].substring(1)
      // Arreglo de facturas por forma de pago
      const arrFacturas = req.body.facturas.filter(v => v.formaDePago == arrFormaDePago[0])
      if (arrFacturas.length > 0) {
        let ws2 = {}
        ws2[arrFormaDePago] = wb.addWorksheet(arrFormaDePago[1])
        ws2[arrFormaDePago].pageSetup.margins = {
          left: 0.5,
          right: 0.5,
          top: 0.5,
          bottom: 0.5,
          header: 0.2,
          footer: 0.2
        }
        // Llenado de información
        row = 1
        // Titulo
        ws2[arrFormaDePago].getCell(`A${row}`).value = `Facturas Forma de Pago ${arrFormaDePago[0]} - ${arrFormaDePago[1]} del ${req.body.fecha}`
        // Encabezados
        row++
        ws2[arrFormaDePago].getCell(`A${row}`).value = `Factura #`
        ws2[arrFormaDePago].getCell(`B${row}`).value = `Exento`
        ws2[arrFormaDePago].getCell(`C${row}`).value = `Tasa 0%`
        ws2[arrFormaDePago].getCell(`D${row}`).value = `Gravable`
        ws2[arrFormaDePago].getCell(`E${row}`).value = `I.V.A.`
        ws2[arrFormaDePago].getCell(`F${row}`).value = `Importe`
        ws2[arrFormaDePago].getCell(`G${row}`).value = `Caja Folio`
        // Centrado de encabezados
        ws2[arrFormaDePago].getRow(row).eachCell( cell => {
          ws2[arrFormaDePago].getCell(cell.address).alignment = {
            vertical: 'center',
            horizontal: 'center'
          }
        })
        // Ancho de columnas
        ws2[arrFormaDePago].columns[0].width = 10
        ws2[arrFormaDePago].columns[1].width = 7
        ws2[arrFormaDePago].columns[2].width = 11
        ws2[arrFormaDePago].columns[3].width = 11
        ws2[arrFormaDePago].columns[4].width = 10
        ws2[arrFormaDePago].columns[5].width = 12
        ws2[arrFormaDePago].columns[6].width = 10
        rowIni = row
        row++
        // Detalle
        for (const fac of arrFacturas) {
          ws2[arrFormaDePago].getCell(`A${row}`).value = fac.factura
          ws2[arrFormaDePago].getCell(`B${row}`).value = fac.exento ; ws2[arrFormaDePago].getCell(`B${row}`).numFmt = '#,##0.00'
          ws2[arrFormaDePago].getCell(`C${row}`).value = fac.tasa0 ; ws2[arrFormaDePago].getCell(`C${row}`).numFmt = '#,##0.00'
          ws2[arrFormaDePago].getCell(`D${row}`).value = fac.gravable ; ws2[arrFormaDePago].getCell(`D${row}`).numFmt = '#,##0.00'
          ws2[arrFormaDePago].getCell(`E${row}`).value = fac.iva ; ws2[arrFormaDePago].getCell(`E${row}`).numFmt = '#,##0.00'
          ws2[arrFormaDePago].getCell(`F${row}`).value = fac.importe ; ws2[arrFormaDePago].getCell(`F${row}`).numFmt = '#,##0.00'
          ws2[arrFormaDePago].getCell(`G${row}`).value = fac.folioVenta
          // Siguiente renglón
          row++
        }
        // Bordes
        for (let index = rowIni; index < row; index++) {
          ws2[arrFormaDePago].getRow(index).eachCell( cell => {
            ws2[arrFormaDePago].getCell(cell.address).border = {
              top: {style:'thin'},
              left: {style:'thin'},
              bottom: {style:'thin'},
              right: {style:'thin'}
            }
          })
        } // for (para bordes)
        ws2[arrFormaDePago].getCell(`A${row}`).value = 'Facturas'
        // Sumas
        if (row >= (rowIni +1)) {
          // Solo cuando haya al menos un renglón para sumar
          ws2[arrFormaDePago].getCell(`B${row}`).value = { formula: `SUM(B${rowIni+1}:B${row-1})` } ; ws2[arrFormaDePago].getCell(`B${row}`).numFmt = '#,##0.00'
          ws2[arrFormaDePago].getCell(`C${row}`).value = { formula: `SUM(C${rowIni+1}:C${row-1})` } ; ws2[arrFormaDePago].getCell(`C${row}`).numFmt = '#,##0.00'
          ws2[arrFormaDePago].getCell(`D${row}`).value = { formula: `SUM(D${rowIni+1}:D${row-1})` } ; ws2[arrFormaDePago].getCell(`D${row}`).numFmt = '#,##0.00'
          ws2[arrFormaDePago].getCell(`E${row}`).value = { formula: `SUM(E${rowIni+1}:E${row-1})` } ; ws2[arrFormaDePago].getCell(`E${row}`).numFmt = '#,##0.00'
          ws2[arrFormaDePago].getCell(`F${row}`).value = { formula: `SUM(F${rowIni+1}:F${row-1})` } ; ws2[arrFormaDePago].getCell(`F${row}`).numFmt = '#,##0.00'
        }
        row++
        // Sumas parciales de global por forma de pago
        ws2[arrFormaDePago].getCell(`A${row}`).value = 'Fact Global'
        const sumasGlobales = req.body.globales.filter(v => v.esGlobal && v.formaDePago == arrFormaDePago[0])
        ws2[arrFormaDePago].getCell(`B${row}`).value = sumasGlobales.reduce((acum, obj) => acum + obj.exento, 0) ; ws2[arrFormaDePago].getCell(`B${row}`).numFmt = '#,##0.00'
        ws2[arrFormaDePago].getCell(`C${row}`).value = sumasGlobales.reduce((acum, obj) => acum + obj.tasa0, 0) ; ws2[arrFormaDePago].getCell(`C${row}`).numFmt = '#,##0.00'
        ws2[arrFormaDePago].getCell(`D${row}`).value = sumasGlobales.reduce((acum, obj) => acum + obj.gravable, 0) ; ws2[arrFormaDePago].getCell(`D${row}`).numFmt = '#,##0.00'
        ws2[arrFormaDePago].getCell(`E${row}`).value = sumasGlobales.reduce((acum, obj) => acum + obj.iva, 0) ; ws2[arrFormaDePago].getCell(`E${row}`).numFmt = '#,##0.00'
        ws2[arrFormaDePago].getCell(`F${row}`).value = sumasGlobales.reduce((acum, obj) => acum + obj.importe, 0) ; ws2[arrFormaDePago].getCell(`F${row}`).numFmt = '#,##0.00'
      } // if (arrFacturas.length > 0)
    } // for (const iterator of utils.formasDePago) {

    // Llenado de hoja con folios de venta
    ws = null
    ws = wb.addWorksheet('Folios de Venta')
    // Margenes
    ws.pageSetup.margins = {
      left: 0.5,
      right: 0.5,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2
    }
    // Llenado de información
    row = 1
    ws.getCell(`A${row}`).value = `Relación de Folios de Venta (Factura Global)`
    // Encabezados
    row++
    ws.getCell(`A${row}`).value = `Factura #`
    ws.getCell(`B${row}`).value = `Exento`
    ws.getCell(`C${row}`).value = `Tasa 0%`
    ws.getCell(`D${row}`).value = `Gravable`
    ws.getCell(`E${row}`).value = `I.V.A.`
    ws.getCell(`F${row}`).value = `Importe`
    ws.getCell(`G${row}`).value = `Imp Original`
    ws.getCell(`H${row}`).value = `Diferencia`
    // Centrado de encabezados
    ws.getRow(row).eachCell( cell => {
      ws.getCell(cell.address).alignment = {
        vertical: 'center',
        horizontal: 'center'
      }
    })
    // Ancho de columnas
    ws.columns[0].width = 9
    ws.columns[1].width = 7
    ws.columns[2].width = 11
    ws.columns[3].width = 11
    ws.columns[4].width = 10
    ws.columns[5].width = 12
    ws.columns[6].width = 12
    ws.columns[7].width = 11
    rowIni = row
    row++
    // Detalle
    const arrGlobales = req.body.globales.filter(v => v.esGlobal && v.importe != 0)
    for (const fac of arrGlobales) {
      ws.getCell(`A${row}`).value = fac.folio
      ws.getCell(`B${row}`).value = fac.exento ; ws.getCell(`B${row}`).numFmt = '#,##0.00'
      ws.getCell(`C${row}`).value = fac.tasa0 ; ws.getCell(`C${row}`).numFmt = '#,##0.00'
      ws.getCell(`D${row}`).value = fac.gravable ; ws.getCell(`D${row}`).numFmt = '#,##0.00'
      ws.getCell(`E${row}`).value = fac.iva ; ws.getCell(`E${row}`).numFmt = '#,##0.00'
      ws.getCell(`F${row}`).value = fac.importe ; ws.getCell(`F${row}`).numFmt = '#,##0.00'
      ws.getCell(`G${row}`).value = fac.original ; ws.getCell(`G${row}`).numFmt = '#,##0.00'
      ws.getCell(`H${row}`).value = fac.importe - fac.original ; ws.getCell(`H${row}`).numFmt = '#,##0.00'
      // Siguiente renglón
      row++
    }
    // Bordes
    for (let index = rowIni; index < row; index++) {
      ws.getRow(index).eachCell( cell => {
        ws.getCell(cell.address).border = {
          top: {style:'thin'},
          left: {style:'thin'},
          bottom: {style:'thin'},
          right: {style:'thin'}
        }
      })
    } // for (para bordes)
    ws.getCell(`A${row}`).value = 'Sumas'
    // Sumas
    if (row >= (rowIni +1)) {
      // Solo cuando haya al menos un renglón para sumar
      ws.getCell(`B${row}`).value = { formula: `SUM(B${rowIni+1}:B${row-1})` } ; ws.getCell(`B${row}`).numFmt = '#,##0.00'
      ws.getCell(`C${row}`).value = { formula: `SUM(C${rowIni+1}:C${row-1})` } ; ws.getCell(`C${row}`).numFmt = '#,##0.00'
      ws.getCell(`D${row}`).value = { formula: `SUM(D${rowIni+1}:D${row-1})` } ; ws.getCell(`D${row}`).numFmt = '#,##0.00'
      ws.getCell(`E${row}`).value = { formula: `SUM(E${rowIni+1}:E${row-1})` } ; ws.getCell(`E${row}`).numFmt = '#,##0.00'
      ws.getCell(`F${row}`).value = { formula: `SUM(F${rowIni+1}:F${row-1})` } ; ws.getCell(`F${row}`).numFmt = '#,##0.00'
      ws.getCell(`G${row}`).value = { formula: `SUM(G${rowIni+1}:G${row-1})` } ; ws.getCell(`G${row}`).numFmt = '#,##0.00'
      ws.getCell(`H${row}`).value = { formula: `SUM(H${rowIni+1}:H${row-1})` } ; ws.getCell(`H${row}`).numFmt = '#,##0.00'
    }

    // Guardo el arhcivo
    wb.commit
    await wb.xlsx.writeFile(fileNameGlobal)
    json.response = 200
    json.msg = "Ok"
  } catch (error) {
    json.response = 400
    json.msg = error.message + " | " + error.stack
  } finally {
    res.json(json)
  }
}) // /global-excel


app.get("/global-excel-download", mdi, async (req, res) => {
  res.download(fileNameGlobal)
}) // /global-excel-download


// Timbrar factura global
app.post("/timbra-global", async (req, res) => {
  /*
  try {
    fs.writeFileSync(`./cfdiFiles/${req.body.serie}${req.body.folio}.json`, JSON.stringify(req.body))
  } catch (error) {
    console.log('Error al guardar el archivo JSON', error)
  }
  */

  console.log('Procesando factura global...')

  // Estructura para enviar a iTimbre
  let data = {
    method: "nueva_factura",
    id_transaccion: 0,
    cuenta: config.pac.cuenta,
    user: config.pac.user,
    password: config.pac.password,
    getPdf: true,
    enviarFactura: false,
    cliente: {
      id: -1,
			UsoCFDI: "S01",
			Nombre: "PUBLICO EN GENERAL",
			Rfc: "XAXX010101000",
			DomicilioFiscalReceptor: "22010",
			RegimenFiscalReceptor: "616"
		},
    datos_factura: req.body.estructura.datos_factura,
    conceptos: req.body.estructura.conceptos,
  }

  try {
    fs.writeFileSync(`./cfdiFiles/${req.body.serie}${req.body.folio}.json`, JSON.stringify(req.body))
  } catch (error) {
    console.log('Error al guardar el archivo JSON', error)
  }

  let params = JSON.stringify(json) //.replace(/\s+/gm,' ')
  let resp, response  // respuesta de iTimbre

  const backendData = {
    folio: req.body.estructura.datos_factura.Folio,
    numero: '000000',
    nombre: req.body.estructura.cliente.Nombre,
    rfc: req.body.estructura.cliente.Rfc,
    factura: req.body.estructura.datos_factura.Folio,
    importe: Number(req.body.estructura.datos_factura.Total),
    iva: Number(req.body.estructura.datos_factura.Total) - Number(req.body.estructura.datos_factura.SubTotal),
    tasa0: req.body.SumaGlobales.tasa0,
    gravable: req.body.SumaGlobales.gravable,
    tipo: 'G',
    metodoPago: req.body.estructura.datos_factura.MetodoPago,
    usoCfdi: req.body.estructura.cliente.UsoCFDI,
    tipoComp: req.body.estructura.datos_factura.TipoDeComprobante,
    uuid: resp.data.result.UUID,
    uuidRel: '',
    facRel: ''
  }

  // Ejemplo...
  //  https://facturacion33.itimbre.com/service.php?q={"method":"recuperar","cuenta":"msi961203md0","user":"facturacion","password":"S0port3TI664","folio":"PRS178","getPdf":false}
  //let url = `https://facturacion33.itimbre.com/service.php?q=${params}`
  const url = "http://code-ware.com/cfdi/cfdi.php"
  try {
    const resp = await axios({
      url,
      method: "post",
      data
    })
    response = resp.data
  } catch (error) {
    console.log("error", error)
    response.result = {
      retcode: -1,
      message: error.message + " | " + error.stack.replace(/\s+/gm, ' ')
    }
  } finally {
    res.json( response )
    if (response.result.retcode == 1) { // Todo bien, se timbró la facura
      req.body.factura.uuid = response.result.UUID
      // Agrego la nueva factura a FacCli02.dbf
      afectaFactura({
        params: {
          mod: "factura",
          opt: "insert"
        },
        data: backendData
      })
    }
  }
}) // /timbra-global


app.post('/send-email', mdi, async (req, res) => {
  const fechaHora = new Date().toLocaleString('fr-fr')
  /* req.body
    {
      referencia: 'SAL7133',
      codigo: '7133',
      descripcion: 'SYNTOCINON 5 UI AMP 5X1ML',
      etiqueta: 'L009898',
      fecha: '21/Feb/2023',
      tipo: 'Entrada',
      cantidad: '12',
      destino: 'Otay,Rio',
      usuario: 'ADMIN',
      sucursal: 'RIO
    }
  */
  const enviado = EnviarCorreo({
    from: '',
    to: 'Oscar P operez2000@gmail.com',
    cc: 'Oscar Pérez opereznet@hotmail.com',
    subject: `Notificación de traspaso // Sucursal ${req.body.sucursal} // ${fechaHora}`,
    body: `
      <h3>Detalle del Traspaso:</h3>
      <ul>
        <li>Referencia: <strong>${req.body.referencia}</strong></li>
        <li>Código: <strong>${req.body.codigo}</strong></li>
        <li>Descripción <strong>${req.body.descripcion}</strong></li>
        <li>Etiqueta: <strong>${req.body.etiqueta}</strong></li>
        <li>Fecha: <strong>${req.body.fecha}</strong></li>
        <li>Tipo: <strong>${req.body.tipo}</strong></li>
        <li>Cantidad: <strong>${req.body.cantidad}</strong></li>
        <li>Envía: <strong>${req.body.usuario}</strong></li>
        <li>Sucursal: <strong>${req.body.sucursal}</strong></li>
      </ul>
    `
  })
  res.send(((enviado) ? 'Correo enviado correctamente' : 'El correo no se ha podido enviar'))
}) // /send-email


// Final => exportación del módulo para el Server
module.exports =  {
  path: '/api/',
  handler: app
};
