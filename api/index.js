//const conf = JSON.parse(fs.readFileSync(__dirname + "/config.json"))
const config = require(`${__dirname}/../config.json`)

import Express from 'express';
import {DBFFile} from 'dbffile';
import axios from 'axios';
import fs from 'fs';
import cors from 'cors'
import nodeMailer from 'nodemailer'
import ExcelJS from 'exceljs'
import ADODB from '@el3um4s/node-adodb'
import Utils from '../assets/utils'
import pdfParse from 'pdf-parse'
import xml2js from 'xml2js'
import util from 'util'
import traspasosRouter from './routes/traspasos'
import sucursalesRouter from './routes/sucursales'
import motivosRouter from './routes/motivos'
import facturacionRouter, { guardarFacturaEnDb } from './routes/facturacion'
import { queryOne as queryOneFactura } from './db_facturacion.js'
import { xml2pdfHandler, generatePdfFromXml } from './utils/xml2pdf'

const app = Express();
const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${config.dbfLocation}/novartis.mdb;`);
const utils = new Utils()
const parseString = util.promisify(new xml2js.Parser().parseString);

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

// Validación de la carpeta para archivos log
try {
  if (!fs.existsSync("./logs")) {
    fs.mkdirSync("./logs", '0777')
  }
} catch (error) {
  console.log(error);
}

// Validación de la carpeta para archivos de cancelaciones
try {
  if (!fs.existsSync("./cancelaciones")) {
    fs.mkdirSync("./cancelaciones", '0777')
  }
} catch (error) {
  console.log(error);
}

// Almacenamiento de archivos JSON
try {
  if (!fs.existsSync("c:/cfdi")) {
    fs.mkdirSync("c:/cfdi", '0777')
  }
} catch (error) {
  console.log(error);
}

// Archivos JSON de facturas globales
try {
  if (!fs.existsSync("./cfdiFiles")) {
    fs.mkdirSync("./cfdiFiles", '0777')
  }
} catch (error) {
  console.log(error);
}

// Archivos JSON de facturas globales
try {
  if (!fs.existsSync("c:/servidora1/temp")) {
    fs.mkdirSync("c:/servidora1/temp", '0777')
  }
} catch (error) {
  console.log(error);
}

const correosSucursales = [
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
  let archivo = "c:\\servidora1\\temp\\rango.txt";

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
const ctrlError = (err, method = "", route = "") => {
  let cadena = ''
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

console.log('obj', obj)

  const params = obj.params
  const url = `${config.backEndUrl}/gusher/ws.prg?mod=${params.mod}&opt=${params.opt}`
  if (obj.data.fecha == undefined) {
    obj.data.fecha = new Date().toLocaleDateString('es-MX', {year: 'numeric', month: '2-digit', day: '2-digit'})
  }
  let data = obj.data
  if (data.tipo == undefined || !data.tipo) {
    data.tipo = ""
  }
  console.log('-------------------------------------------------')
  console.log('afectaFactura() url', url)
  console.log('afectaFactura() data', data)
  axios({
    method: 'post',
    url,
    data
  }).then(resp => {
    console.log("afectaFactura() resp.data", resp.data)
  }).catch(error => {
    console.log("afectaFactura() error", error)
  }).finally(() => {
    console.log("previo al fin de afectaFactura()")
    console.log('url', url)
    console.log('data', data)
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
  port: 465, //process.env.MAIL_PORT * 1, //465, //587,    // 110
  secure: true,
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
    data = await connection.query(qry) //`SELECT * FROM Notas WHERE fecha = #${fecha}#`)
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


// Cancelar Notas de Crédito
const CancelaNotaDeCredito = async (serie, folio) => {
  let data = []
  let qry
  try {
    // Query
    qry = `
      UPDATE Notas
      SET Estatus = 0
      WHERE Serie = '${serie}' AND FolioNota = ${folio}
    `
    data = await connection.query(qry)
  } catch (error) {
    console.log(error);
  }
  return data
} // NotasDeCredito(fecha)


// Notas de Crédito (Factura Global)
const NotaDeCreditoDetalle = async (idNota) => {
  let data = []
  let qry
  try {
    // Query
    qry = `
      SELECT
        Parte AS NoIdentificacion,
        '' AS Descripcion,
        Cantidad,
        Precio AS ValorUnitario,
        PorDes,
        ImpDes AS Descuento,
        Importe,
        PorIVA AS porIva,
        ImpIVA AS impIva,
        tipoIVA,
        cveSat AS ClaveProdServ
      FROM NotasDetalle
      WHERE IDNota = ${idNota}
    `
    data = await connection.query(qry)

    // Voy al BackEnd de mod-harbour para traerme los nombres de los articulos
    try {
      const url = `${config.backEndUrl}/gusher/ws.prg?mod=items-from-array`
      const respItems = await axios({
        method: 'post',
        url,
        data
      })
      if (respItems.data && Array.isArray(respItems.data)) {
        data = respItems.data
      }
    } catch (error) {
      console.log(error)
    }
  } catch (error) {
    console.log(error)
  }
  return data
} // NotaDeCreditoDetalle(idNota)

const guardarNotaEnAccess = async ({
  serie,
  folioNota,
  caja,
  folioVenta,
  fecha,
  subTotal,
  importeIva,
  totalNota,
  clienteId,
  tc,
  tipoVenta,
  userId,
  cajeroId,
  vendedorId,
  fechaVenta,
  uuid,
  uuidOrigen,
  observaciones,
  formaDePago,
  usoCfdi,
  items
}) => {
  let qryInsertNota = ''
  try {
    let dVenta = new Date()
    if (fechaVenta) {
      // Como ya llega en formato YYYY-MM-DD, parseamos directo (agregamos T00:00:00 para evitar desface de zona horaria)
      const pVenta = new Date(String(fechaVenta).includes('-') && String(fechaVenta).length === 10 ? fechaVenta + 'T00:00:00' : fechaVenta)
      if (!isNaN(pVenta.getTime())) dVenta = pVenta
    }
    
    // Formato MM/DD/YYYY sin hora para Access
    const fVentaStr = `${(dVenta.getMonth() + 1).toString().padStart(2, '0')}/${dVenta.getDate().toString().padStart(2, '0')}/${dVenta.getFullYear()}`
    
    const obsLimpia = String(observaciones || '').replace(/'/g, "''").substring(0, 250)

    // Convertir a número con limpieza en caso de que traiga espacios
    const numFolioVenta = Number(String(folioVenta).replace(/[^0-9.]/g, '')) || 0
    const numFolioNota = Number(folioNota) || 0

    qryInsertNota = `
      INSERT INTO Notas (
        Serie, FolioNota, Caja, FolioVenta, Fecha, SubTotal, ImporteIVA, TotalNota,
        ClienteID, TC, TipoVenta, Estatus, UserID, CajeroID, VendedorID, FechaVenta,
        UUID, UUIDOrigen, observaciones, formaDePago, UsoCFDI
      ) VALUES (
        '${serie}', ${numFolioNota}, '${caja || ''}', ${numFolioVenta},
        Date(), ${Number(subTotal) || 0}, ${Number(importeIva) || 0}, ${Number(totalNota) || 0},
        '${clienteId || ''}', ${Number(tc) || 1}, '${tipoVenta || 'CO'}', '1',
        '${userId || 'ADMIN'}', '${cajeroId || ''}', '${vendedorId || ''}', '${fVentaStr}',
        '${uuid || ''}', '${uuidOrigen || ''}', '${obsLimpia}',
        '${formaDePago || '01'}', '${usoCfdi || 'G02'}'
      )
    `
    await connection.execute(qryInsertNota)

    // Obtener ID generado
    const rowId = await connection.query(`SELECT TOP 1 ID FROM Notas WHERE Serie = '${serie}' AND FolioNota = ${numFolioNota} ORDER BY ID DESC`)
    const idNota = (rowId && rowId.length > 0) ? rowId[0].ID : null

    if (idNota && Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const parte = String(it.parte || it.NoIdentificacion || it.noIdentificacion || '').replace(/'/g, "''")
        const desc = String(it.descripcion || it.Descripcion || '').replace(/'/g, "''").substring(0, 200)
        const cant = Number(it.cantidad || it.Cantidad) || 0
        const precio = Number(it.precio || it.ValorUnitario || it.precioBruto) || 0
        const porDes = Number(it.porDes || it.DescuentoPorc) || 0
        const impDes = Number(it.impDes || it.Descuento) || 0
        const importe = Number(it.importe || it.totalNeto || it.Importe) || 0
        const porIva = Number(it.porIva || it.porIVA || it.tasaIva) || 0
        const impIva = Number(it.impIva || it.impIVA) || 0
        const cveSat = String(it.cveSat || it.ClaveProdServ || '').replace(/'/g, "''")
        const tipoIva = String(it.tipoIva || (porIva > 0 ? 'C' : 'B')).replace(/'/g, "''")

        const qryDetalle = `
          INSERT INTO NotasDetalle (
            IDNota, Parte, descripcion, Cantidad, Precio, PorDes, ImpDes, Importe,
            PorIVA, ImpIVA, comision, cveSat, tipoIva
          ) VALUES (
            ${idNota}, '${parte}', '${desc}', ${cant}, ${precio}, ${porDes}, ${impDes}, ${importe},
            ${porIva}, ${impIva}, 0, '${cveSat}', '${tipoIva}'
          )
        `
        await connection.execute(qryDetalle).catch(eDet => console.error("Error insertando en NotasDetalle:", eDet.message))
      }
    }
    console.log(`[Access MDB] Nota de Crédito ${serie}${folioNota} guardada con ID ${idNota}`)
  } catch (errMdb) {
    console.error("[Access MDB] Error guardando Nota de Crédito en MDB:");
    console.error(errMdb.process ? errMdb.process.message : (errMdb.message || errMdb));
    if (errMdb.process && errMdb.process.message) {
      console.error("[Access MDB] SQL Fallido:", qryInsertNota || 'Desconocido');
    } else {
      console.error("[Access MDB] SQL Fallido:", qryInsertNota || 'Desconocido');
    }
  }
}



const getJsonFromXml = async (xml) => {
  // Create a parser instance
  // const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });  

  // Parse XML to JSON
  try {
    const result = await parseString(xml)
    return result;    
  } catch (error) {
    console.error('Error parsing XML:', err)
    return null;
  }

} // getJsonFromXml()


const AfectarFacturasDbf = async (uuid, xml, pdfBase64) => {

  let numero = '';
  let rfc = '';
  let data = null

  try {
    const json = await getJsonFromXml(xml)
    console.log('***********************   data   ******************')
    let fecha = json['cfdi:Comprobante'].$.Fecha
    fecha = fecha.substring(8, 10) + "/" + 
            fecha.substring(5, 7) + "/" + 
            fecha.substring(0, 4)
    let baseImpuestos = {
      iva: 0,
      tasaCero: 0,
      gravable: 0      
    }            
    const nodoImpuestos = json['cfdi:Comprobante']['cfdi:Impuestos'][0]['cfdi:Traslados'][0]['cfdi:Traslado']
    rfc = json['cfdi:Comprobante']['cfdi:Receptor'][0].$.Rfc

    for (const element of nodoImpuestos) {
      if (element.$.TasaOCuota == '0.080000' || element.$.TasaOCuota == '0.08') {
        // Base gravable e IVA
        baseImpuestos.iva = parseFloat(element.$.Importe)
        baseImpuestos.gravable = parseFloat(element.$.Base)
      } else {
        baseImpuestos.tasaCero = parseFloat(element.$.Base)
      }
    }

    // Decode Base64 to Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')
    const infoPdf = await pdfParse(pdfBuffer)
    let index = (infoPdf.text.indexOf('Caja-Folio'))
    const cajaFolio = (index > -1) ? (infoPdf.text.substring(index +12, index +12 +8)).trim() : ''
    const splitCajaFolio = cajaFolio.split('-')
    let folio = ''
    let tipo = ''
    if (rfc == 'XAXX010101000') {
      // Global
      folio = json['cfdi:Comprobante'].$.Folio
      tipo = 'G'
      numero = '000000'
    } else {
      const splittedData = {
        caja: splitCajaFolio[0], 
        folio: splitCajaFolio[1].padStart(8, ' ')
      }
      folio = `${splittedData.caja}${splittedData.folio}`
      index = infoPdf.text.indexOf('mero de cliente:')
      if (index > -1) {
        numero = infoPdf.text.substring(index +20, index +20 +6 )
      }
    }

    // body (data)
    data = {
      folio,
      numero: '',
      nombre: json['cfdi:Comprobante']['cfdi:Receptor'][0].$.Nombre,
      rfc,
      factura: json['cfdi:Comprobante'].$.Folio,
      fecha,
      importe: parseFloat(json['cfdi:Comprobante'].$.Total),      
      iva: baseImpuestos.iva,
      tasa0: baseImpuestos.tasaCero,
      gravable: baseImpuestos.gravable,
      tipo,
      metodoPago: json['cfdi:Comprobante'].$.FormaPago,
      usoCfdi: json['cfdi:Comprobante']['cfdi:Receptor'][0].$.UsoCFDI,
      tipoComp: json['cfdi:Comprobante'].$.TipoDeComprobante,
      uuid: json['cfdi:Comprobante']['cfdi:Complemento'][0]['tfd:TimbreFiscalDigital'][0].$.UUID,
      uuidRel: '',
      facRel: ''
    }

    if (json['cfdi:Comprobante'].$.TipoDeComprobante == 'I') {
      const url = `${config.backEndUrl}/gusher/ws.prg?mod=factura&opt=insert`
      // Envío POST a ws.prg para insertar registro en FacCli02.dbf
      const resp = await axios({
        url,
        method: 'POST',
        data
      })
      console.log('respuesta de ws.prg', resp.data)
    }
    
  } catch (error) {
    console.error(error)
    
  } finally {
    return data
  }
} // AfectarFacturasDbf()


// Recuperar CFDI
const recuperarCfdi = async (params, folio = '') => {
  //let url = `https://facturacion33.itimbre.com/service.php`
  //let url = `https://facturacion33.itimbre.com/service.php?q={"method":"recuperar","cuenta":"msi961203md0","user":"facturacion","password":"S0port3TI664","folio":"${req.params.serieFolio}","getPdf":false}`
  /* Ejemplo...
    https://facturacion33.itimbre.com/service.php?q={"method":"recuperar","cuenta":"msi961203md0","user":"facturacion","password":"S0port3TI664","folio":"PRS178","getPdf":false}
  */

  // Cuando es Ingreso extraigo Caja y Folio para insertar en FacCli02.dbf
  const tipoDeComprobante = (folio.substring(0, 2) == 'NC') ? "E" : "I";  

  const url = `${config.pac.url}?q=${params}`
  let response = null
  console.log("url", url)
  try {
    response = await axios({
      method: 'post',
      url,
      data: {}
    })
    response = response.data
    if (response && tipoDeComprobante == 'I') {
      if (response.result) {
        if (response.result.result){
          if (response.result.result.pdfBase64) {
            await AfectarFacturasDbf(response.result.result.uuid, response.result.result.xml, response.result.result.pdfBase64)
          }
        }
      }
    }
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

const afectaDbfLotes = (data) => {
  data = data.map(v => ({...v, etiqueta: 'L' + v.registro}))
  console.log('data en afectaDbfLotes()', data)
  const url = `${config.backEndUrl}/gusher/ws.prg?mod=guarda-lotes`
  axios({
    method: 'post',
    url,
    data
  }).then(resp => {
    console.log('resp.data en afectaDbfLotes()', resp.data)
  }).catch(error => {
    console.log('error en afectaDbfLotes()', error)
  })
} // afectaDbfLotes(data)

/** Sección de Rutas *******************************************************************/

app.use('/rango', mdi, (req, res) => {
  let objResp, strResp;
  res.setHeader('Access-Control-Allow-Origin', '*');
  console.log('Rango de lotes...')
  // let url = 'http://74.208.101.117/proyectos/gusher/server/lotes.php?opcion=rango&etiq1=' + req.query.etiq1 + '&etiq2=' + req.query.etiq2;
  let url = 'https://gusher.code-ware.com/lotes.php?opcion=rango&etiq1=' + req.query.etiq1 + '&etiq2=' + req.query.etiq2;
  axios({
    method: 'get',
    url,
    data: {}
  }).then( response => {
    console.log('Respuesta', response.data.result, response.data.msg);
    afectaDbfLotes(response.data.data);  // Afectación a la base de datos
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
  let url = `${config.backEndUrl}/gusher/ws.prg?mod=catalogo&opt=${req.query.opt}&id=${req.query.codigo}&cantidad=${req.query.cantidad}&usuario=${req.query.usuario}&referencia=${req.query.referencia}`
  console.log(url);

  axios({
    method: 'get',
    url
  })
  .then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  })
  .catch(error => {
    json.response = 404
    json.msg = ctrlError(error)
  })
  .finally(() => {
    console.log("Finally en /catalogo")
    res.json(json)
  })

}) // /catalogo


// Lote
app.use("/lote", mdi, (req, res) => {

  let json = {}
  const url = `${config.backEndUrl}/gusher/ws.prg?opt=${req.query.opt}&mod=lote&id=${req.query.codigo}&cantidad=${req.query.cantidad}&usuario=${req.query.usuario}&referencia=${req.query.referencia}`
  console.log('/lote url', url)

  axios({
    method: 'get',
    url
  })
  .then(resp => {
    console.log("resp", resp.data)
    json = resp.data
  })
  .catch(error => {
    console.log("Error", err)
    json.response = 404
    json.msg = ctrlError(error)
  })
  .finally(() => {
    console.log("Finally en /lote")
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
    json.msg = ctrlError(error)
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
    json.msg = ctrlError(error)
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
    json.msg = ctrlError(error)
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
    json.msg = ctrlError(error)
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
    json.msg = ctrlError(error)
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
    url: `${config.backEndUrl}/gusher/ws.prg`,
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
    json.msg = ctrlError(error)
  })
  .finally(() => {
    res.json(json)
  })
}) // /faltantes-lotes


// Recuperar CFDI
app.get("/recuperarCFDI/:folio", mdi, async (req, res) => {
  const folioParam = (req.params.folio || '').trim()

  // 1. Intentar buscar primero en la base de datos local `facturacion`
  try {
    let row = null
    const match = folioParam.match(/^([A-Za-z]+)(\d+)$/)
    if (match) {
      const s = match[1]
      const f = match[2]
      row = await queryOneFactura(
        `SELECT * FROM factura WHERE (serie = ? AND (folio = ? OR CAST(folio AS UNSIGNED) = CAST(? AS UNSIGNED))) LIMIT 1`,
        [s, f, f]
      )
    }
    if (!row) {
      row = await queryOneFactura(
        `SELECT * FROM factura WHERE CONCAT(serie, folio) = ? OR folio = ? LIMIT 1`,
        [folioParam, folioParam]
      )
    }

    if (row && row.xml) {
      let pdfBase64 = ''
      try {
        pdfBase64 = await generatePdfFromXml({ xml: row.xml, observaciones: row.observaciones || '' })
      } catch (errPdf) {
        console.error('Error al generar PDF en /recuperarCFDI desde BD:', errPdf)
      }

      return res.json({
        id_transaccion: 0,
        result: {
          retcode: 1,
          UUID: row.uuid,
          data: row.xml,
          pdfBase64,
          result: {
            retcode: 1,
            uuid: row.uuid,
            xml: row.xml,
            pdfBase64,
            observaciones: row.observaciones || ''
          }
        }
      })
    }
  } catch (errDb) {
    console.error('Error consultando factura en BD local en /recuperarCFDI:', errDb)
  }

  // 2. Fallback: Si no está en BD local, llamar a la API de iTimbre
  let params = `{
    "method": "recuperar",
    "cuenta": "${config.pac.cuenta}",
    "user": "${config.pac.user}",
    "password": "${config.pac.password}",
    "folio": "${req.params.folio}",
    "getPdf": false
  }`.trim().replace(/^\s+|\s+$/gm,'')

  const response = await recuperarCfdi(params, req.params.folio)

  // Si iTimbre regresa exitosamente el XML, generar PDF propio y guardar en BD local
  if (response && response.result) {
    let xmlRecuperado = ''
    if (response.result.result && response.result.result.xml) {
      xmlRecuperado = response.result.result.xml
    } else if (response.result.data) {
      xmlRecuperado = response.result.data
    }

    if (xmlRecuperado) {
      try {
        const pdfBase64Propio = await generatePdfFromXml({ xml: xmlRecuperado })
        if (response.result.result) {
          response.result.result.pdfBase64 = pdfBase64Propio
        }
        response.result.pdfBase64 = pdfBase64Propio

        await guardarFacturaEnDb({ xml: xmlRecuperado })
      } catch (errGen) {
        console.error('Error al procesar PDF/guardar en BD tras recuperar de iTimbre:', errGen)
      }
    }
  }

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
    json.msg = ctrlError(error)
    json.url = url
  })
  .finally(() => {
    console.log("Finally wn /parametros")
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
    json.msg = ctrlError(error)
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
    json.msg = ctrlError(error)
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
    json.msg = ctrlError(error)
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
    json.msg = ctrlError(error)
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
    json.msg = ctrlError(error)
    json.url = url
  })
  .finally(() => {
    res.json(json)
  })
}) // /siguiente-folio


// Timbrar CFDI
app.post("/facturar", mdi, async (req, res) => {
  let json = req.body.data  // La estructura que se crea y viene como body desde los módulos (facturacion, etc...)
  json.cuenta = config.pac.cuenta
  json.user = config.pac.user
  json.password = config.pac.password
  json.getPdf = true
  json.enviarFactura = true
  json.method = "nueva_factura"
  let params = JSON.stringify(json).replace(/\s+/gm,' ')

  try {
    fs.writeFileSync(`c:/cfdi/${json.datos_factura.Serie}${json.datos_factura.Folio}.json`, params)
  } catch (errLog) {
    console.log("Aviso al guardar json local:", errLog.message)
  }

  let response = {}

  // Agrego a req.body.tipo
  if (req.body.factura) {
    req.body.factura.tipo = " "
  }

  // --- Validación de CFDI duplicado ---
  const esNotaCreditoAntes = (json.datos_factura && (json.datos_factura.TipoDeComprobante === 'E' || json.datos_factura.tipoDeComprobante === 'E')) ||
                             (json.datos_factura && String(json.datos_factura.Serie).toUpperCase().startsWith('NC')) ||
                             (req.body.factura && String(req.body.factura.tipo).toUpperCase() === 'NC')
  
  if (esNotaCreditoAntes && req.body.factura) {
    const ticketCaja = String(req.body.factura.caja || '').trim()
    const ticketFolio = String(req.body.factura.folioVenta || '').trim()
    if (ticketCaja && ticketFolio) {
      try {
        const duplicada = await queryOneFactura(
          `SELECT uuid, serie, folio 
           FROM factura 
           WHERE ticket_caja = ? AND ticket_folio = ? 
             AND tipo_factura = 'Nota de Crédito' 
             AND estatus != 'Cancelada' 
             AND YEAR(fecha_registro) = YEAR(NOW())
           LIMIT 1`,
          [ticketCaja, ticketFolio]
        )
        if (duplicada) {
          return res.json({
            result: {
              error: 1,
              message: `Ya existe una Nota de Crédito (${duplicada.serie}${duplicada.folio}) para la Caja ${ticketCaja} y Folio ${ticketFolio} en el año en curso.`
            }
          })
        }
      } catch (errDb) {
        console.log("Error al validar duplicado de NC:", errDb)
      }
    }
  }
  // ------------------------------------

  try {
    const resp = await axios({
      url: "https://gusher.code-ware.com/cfdi.php",  // "http://74.208.101.117/cfdi/cfdi.php",
      method: "post",
      data: req.body.data
    })
    response = resp.data

    if (response && response.result && (response.result.retcode == 1 || response.result.retcode == 0)) {
      const xmlTimbrado = response.result.data || ''
      const observaciones = (req.body.data && req.body.data.datos_factura && req.body.data.datos_factura.comentarios) ||
                            (req.body.datos_factura && req.body.datos_factura.comentarios) ||
                            (req.body.data && (req.body.data.comentarios || req.body.data.Observaciones)) ||
                            (req.body.factura && (req.body.factura.observaciones || req.body.factura.comentarios)) || ''
      const noCliente = (req.body.data && req.body.data.cliente && req.body.data.cliente.id) ||
                        (req.body.cliente && req.body.cliente.id) ||
                        (req.body.factura && req.body.factura.numero) || ''
      
      // 1. Generar PDF propio con xml2pdf.js
      if (xmlTimbrado) {
        try {
          const pdfBase64Propio = await generatePdfFromXml({ xml: xmlTimbrado, observaciones, noCliente })
          response.result.pdfBase64 = pdfBase64Propio
          if (response.result.result) {
            response.result.result.pdfBase64 = pdfBase64Propio
          }
        } catch (pdfErr) {
          console.error("Error al generar PDF propio con xml2pdf:", pdfErr)
        }

        // 2. Guardar en BD facturacion
        const esNotaCredito = (json.datos_factura && (json.datos_factura.TipoDeComprobante === 'E' || json.datos_factura.tipoDeComprobante === 'E')) ||
                              (json.datos_factura && String(json.datos_factura.Serie).toUpperCase().startsWith('NC')) ||
                              (req.body.factura && String(req.body.factura.tipo).toUpperCase() === 'NC')

        const uuidRelacionadoEnviado = (() => {
          if (req.body.factura?.uuidRel && String(req.body.factura.uuidRel).trim() !== '') {
            return String(req.body.factura.uuidRel).trim()
          }
          const rel = req.body.data?.datos_factura?.CfdiRelacionados
          if (!rel) return ''
          const relList = Array.isArray(rel) ? rel : [rel]
          for (const item of relList) {
            const cfdiRel = item?.CfdiRelacionado
            if (!cfdiRel) continue
            if (Array.isArray(cfdiRel)) {
              for (const sub of cfdiRel) {
                const u = sub?.UUID || (typeof sub === 'string' ? sub : '')
                if (u) return String(u).trim()
              }
            } else {
              const u = cfdiRel.UUID || (typeof cfdiRel === 'string' ? cfdiRel : '')
              if (u) return String(u).trim()
            }
          }
          return ''
        })()

        try {
          await guardarFacturaEnDb({
            xml: xmlTimbrado,
            observaciones,
            ticketCaja: req.body.factura?.caja || req.body.data?.Caja || req.body.data?.caja || '',
            ticketFolio: req.body.factura?.folioVenta || req.body.data?.FolioVenta || req.body.data?.folioVenta || '',
            noCliente,
            cuentaPago: req.body.factura?.numCtaPago || req.body.data?.numCtaPago || '',
            tipoFacturaCustom: esNotaCredito ? 'Nota de Crédito' : '',
            uuidRelacionadoCustom: uuidRelacionadoEnviado,
            fechaFacturacionCustom: req.body.factura?.fecha_facturacion || null
          })
        } catch (dbErr) {
          console.error("Error al guardar factura en BD facturacion:", dbErr)
        }

        // 3. Si es Nota de Crédito, guardar en Access MDB (novartis.mdb) en Notas y NotasDetalle
        if (esNotaCredito) {
          try {
            await guardarNotaEnAccess({
              serie: json.datos_factura?.Serie || req.body.factura?.serie || 'NC',
              folioNota: json.datos_factura?.Folio || req.body.factura?.folioNota || req.body.factura?.factura || 0,
              caja: req.body.factura?.caja || '',
              folioVenta: req.body.factura?.folioVenta || 0,
              fecha: req.body.factura?.fecha || new Date(),
              subTotal: json.datos_factura?.SubTotal || req.body.factura?.subTotal || 0,
              importeIva: json.datos_factura?.Impuestos?.TotalImpuestosTrasladados || req.body.factura?.iva || 0,
              totalNota: json.datos_factura?.Total || req.body.factura?.total || 0,
              clienteId: noCliente || req.body.factura?.numero || '',
              tc: json.datos_factura?.TipoCambio || 1,
              tipoVenta: req.body.factura?.tipoVenta || 'CO',
              userId: req.body.factura?.userId || 'ADMIN',
              cajeroId: req.body.factura?.cajeroId || '',
              vendedorId: req.body.factura?.vendedorId || '',
              fechaVenta: req.body.factura?.fechaVenta || new Date(),
              uuid: response.result.UUID || '',
              uuidOrigen: uuidRelacionadoEnviado,
              observaciones,
              formaDePago: json.datos_factura?.FormaPago || req.body.factura?.formaPago || '01',
              usoCfdi: json.cliente?.UsoCFDI || req.body.factura?.usoCfdi || 'G02',
              items: req.body.factura?.items || req.body.data?.conceptos || []
            })
          } catch (accessErr) {
            console.error("Error al guardar Nota de Crédito en Access MDB:", accessErr)
          }
        }
      }

      req.body.factura.uuid = response.result.UUID
      if (req.body.factura.tipo == undefined) {
        req.body.factura.tipo = ' '
      }

      // Si NO es Nota de Crédito, enviamos afectación a ws.prg
      const esNotaCreditoCheck = (json.datos_factura && (json.datos_factura.TipoDeComprobante === 'E' || json.datos_factura.tipoDeComprobante === 'E')) ||
                                 (json.datos_factura && String(json.datos_factura.Serie).toUpperCase().startsWith('NC')) ||
                                 (req.body.factura && String(req.body.factura.tipo).toUpperCase() === 'NC')
      if (!esNotaCreditoCheck) {
        afectaFactura({
          params: {
            mod: "factura",
            opt: "insert"
          },
          data: req.body.factura
        })
      }

      sendEmail({
        serie_folio: `${json.datos_factura.Serie}${json.datos_factura.Folio}`,
        subject: esNotaCreditoCheck ? 'Envío de Nota de Crédito' : 'Envío de Factura',
        emailTo: req.body.factura.email,
        cc: '',
        body: '',
        pdfBase64: response.result.pdfBase64,
        xml: response.result.data
      })
    }
  } catch (error) {
    console.log("error en /facturar:", error)
    response.result = {
      retcode: -1,
      message: error.message + " | " + (error.stack ? error.stack.replace(/\s+/gm, ' ') : '')
    }
  } finally {
    res.json( response )
  }
})  // //facturar


// Cancelacion de factura (con y sin relación)
app.post("/cancelarFactura", mdi, (req, res) => {
  let json = {
    id_transaccion: "0",
    cuenta:  config.pac.cuenta,
    user: config.pac.user,
    password: config.pac.password,
    getPdf: true,
    RFC: config.emisor.rfc,
    method: "cancelarCFDI",
    cancelaciones: [
      req.body.dataPac
    ]
  }

  // json.cancelaciones = [
  //   req.body.dataPac  // uuid, motivo de cancelación y en caso de relacionar una sustitucion el FolioSusticiion (uuid)
  // ]

  let params = JSON.stringify(json).trim().replace(/^\s+|\s+$/gm,'')
  let url = `${config.pac.url}?q=${params}`
  let response = {}

  try {
    fs.writeFileSync(`./cancelaciones/${req.body.serie}${req.body.folio}.json`, url + '\r\n')
  } catch (error) {
    console.log('Error al guardar log', error)
  }

  console.log("url cancelación", '\r\n', url, '\r\n')

  axios({
    method: 'post',
    url: url,
    //data: {}
  }).then( resp => {
    response = resp.data
  }).catch( err => {
    console.error('Error resp', err)
    response.error = ctrlError(err)
  }).finally( () => {
    res.json(response)

    try {
      fs.writeFileSync(`./cancelaciones/${req.body.serie}${req.body.folio}.json`, JSON.stringify(response), {flag: 'a'})
    } catch (error) {
      console.log('Error al guardar log', error)
    }

    let retcode
    if (response.result.retcode) {
      retcode = response.result.retcode
    } else {
      retcode = -1
    }
    if (retcode == 1) { // Todo bien, se canceló la factura
      if (req.body.serie && req.body.serie.indexOf('NC') >= 0) {
        // Nota de Crédito
        CancelaNotaDeCredito(req.body.serie, req.body.folio)
      } 

      // Actualizar estatus en BD facturacion
      try {
        const uuidCancelado = req.body.dataPac?.uuid || req.body.uuid || ''
        const motivoCanc = req.body.dataPac?.motivo || req.body.motivo || 'Cancelación'
        const uuidRel = req.body.dataPac?.FolioSustitucion || req.body.uuidRel || null
        const usuarioCanc = req.body.usuario || req.body.user || 'Sistema'

        if (uuidCancelado) {
          let sqlCanc = `UPDATE factura SET estatus = 'Cancelada', usuario_cancela = ?, motivo_cancelacion = ?, fecha_cancelacion = ?`
          const paramsCanc = [usuarioCanc, motivoCanc, utils.nowDateTime()]
          if (uuidRel) {
            sqlCanc += `, uuid_relacionado = ?`
            paramsCanc.push(uuidRel)
          }
          sqlCanc += ` WHERE uuid = ?`
          paramsCanc.push(uuidCancelado)

          import('./db_facturacion.js').then(({ execute }) => {
            execute(sqlCanc, paramsCanc).catch(e => console.error("Error al actualizar cancelación en BD:", e))
          })
        }
      } catch (errDbCanc) {
        console.error("Error al registrar cancelación en BD facturacion:", errDbCanc)
      }
    }

    // Cancelo factura en FacCli02.dbf
    afectaFactura({
      params: {
        mod: "factura",
        opt: "cancel"
      },
      data: req.body.dataFact
    })

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
    json.msg = ctrlError(error)
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
    url: "https://gusher.code-ware.com/cfdi.php", // "http://74.208.101.117/cfdi/cfdi.php",
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
  let parciales = {
    efectivo: [],
    cheque: [],
    transferencia: [],
    credito: [],
    debito: [],
    otros: []
  }

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
      const sumasGlobales = req.body.globales.filter(v => v.esGlobal && v.formaDePago == arrFormaDePago[0])
      if (sumasGlobales.reduce((acum, obj) => acum + obj.importe, 0) != 0 || arrFacturas.reduce((acum, obj) => acum + obj.importe, 0) != 0) {
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
        if (arrFacturas.length > 0) { //(row >= (rowIni +1)) {
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
        //const sumasGlobales = req.body.globales.filter(v => v.esGlobal && v.formaDePago == arrFormaDePago[0])
        ws2[arrFormaDePago].getCell(`B${row}`).value = sumasGlobales.reduce((acum, obj) => acum + obj.exento, 0) ; ws2[arrFormaDePago].getCell(`B${row}`).numFmt = '#,##0.00'
        ws2[arrFormaDePago].getCell(`C${row}`).value = sumasGlobales.reduce((acum, obj) => acum + obj.tasa0, 0) ; ws2[arrFormaDePago].getCell(`C${row}`).numFmt = '#,##0.00'
        ws2[arrFormaDePago].getCell(`D${row}`).value = sumasGlobales.reduce((acum, obj) => acum + obj.gravable, 0) ; ws2[arrFormaDePago].getCell(`D${row}`).numFmt = '#,##0.00'
        ws2[arrFormaDePago].getCell(`E${row}`).value = sumasGlobales.reduce((acum, obj) => acum + obj.iva, 0) ; ws2[arrFormaDePago].getCell(`E${row}`).numFmt = '#,##0.00'
        ws2[arrFormaDePago].getCell(`F${row}`).value = sumasGlobales.reduce((acum, obj) => acum + obj.importe, 0) ; ws2[arrFormaDePago].getCell(`F${row}`).numFmt = '#,##0.00'

      }

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
    ws.getCell(`I${row}`).value = `F Pago`
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
    ws.columns[8].width = 7
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
      ws.getCell(`I${row}`).value = fac.formaDePago ; ws.getCell(`I${row}`).numFmt = '00'
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
			Nombre: "PÚBLICO EN GENERAL",
			Rfc: "XAXX010101000",
			DomicilioFiscalReceptor: "22010",
			RegimenFiscalReceptor: "616"
		},
    datos_factura: req.body.estructura.datos_factura,
    conceptos: req.body.estructura.conceptos,
  }

  try {
    fs.writeFileSync(`./cfdiFiles/${req.body.serie}${req.body.folio}.json`, JSON.stringify(data))
  } catch (error) {
    console.log('Error al guardar el archivo JSON', error)
  }

  let resp  // respuesta de iTimbre
  let response = {}
  const params = JSON.stringify(data) //.replace(/\s+/gm,' ')
  const url = "https://gusher.code-ware.com/cfdi.php"; // "http://74.208.101.117/cfdi/cfdi.php"; // `${config.pac.url}?q=${params}`
  console.log('url', url)

  try {
    // Ejemplo...
    //  https://facturacion33.itimbre.com/service.php?q={"method":"recuperar","cuenta":"msi961203md0","user":"facturacion","password":"S0port3TI664","folio":"PRS178","getPdf":false}
    resp = await axios({
      url, 
      method: "post",
      data
    })
    response = resp.data
    console.log('response', response)
  } catch (error) {
    console.log('Error en la respuesta del Servidor:', error)
    let errorDescrip = error.message
    if (error.stack) {
      errorDescrip = errorDescrip + ' / ' + error.stack.replace(/\s+/gm, ' ')
    }
    response.result = {
      retcode: -1,
      message: errorDescrip
    }
    fs.writeFileSync('global.err', errorDescrip)
    console.error('response', response)
  } finally {
    if (response.result && (response.result.retcode == 1 || response.result.retcode == 0)) { // Todo bien, se timbró la factura
      const xmlTimbrado = response.result.data || ''
      const observaciones = (req.body.estructura && req.body.estructura.datos_factura && req.body.estructura.datos_factura.comentarios) ||
                            (req.body.datos_factura && req.body.datos_factura.comentarios) ||
                            `Factura Global del ${req.body.fecha || ''}`
      if (xmlTimbrado) {
        try {
          const pdfBase64Propio = await generatePdfFromXml({ xml: xmlTimbrado, observaciones })
          response.result.pdfBase64 = pdfBase64Propio
          if (response.result.result) {
            response.result.result.pdfBase64 = pdfBase64Propio
          }
        } catch (pdfErr) {
          console.error("Error al generar PDF de factura global:", pdfErr)
        }

        try {
          await guardarFacturaEnDb({
            xml: xmlTimbrado,
            observaciones,
            noCliente: '000000',
            tipoFacturaCustom: 'Global',
            fechaFacturacionCustom: req.body.fecha2 || null
          })
        } catch (dbErr) {
          console.error("Error al guardar factura global en BD facturacion:", dbErr)
        }
      }

      let iva = Number(req.body.estructura.datos_factura.Total) - Number(req.body.estructura.datos_factura.SubTotal)
      iva = Number(iva.toFixed(2))
      let importe = Number(req.body.estructura.datos_factura.Total)
      importe = Number(importe.toFixed(2))
      data = {
        folio: req.body.estructura.datos_factura.Folio,
        numero: '000000',
        nombre: req.body.estructura.cliente.Nombre,
        rfc: req.body.estructura.cliente.Rfc,
        factura: req.body.estructura.datos_factura.Folio,
        fecha: req.body.fecha,
        importe,
        iva,
        tasa0: Number(req.body.SumaGlobales.tasa0.toFixed(2)),
        gravable: Number(req.body.SumaGlobales.gravable.toFixed(2)),
        tipo: 'G',
        metodoPago: req.body.estructura.datos_factura.MetodoPago,
        usoCfdi: req.body.estructura.cliente.UsoCFDI,
        tipoComp: req.body.estructura.datos_factura.TipoDeComprobante,
        uuid: response.result.UUID,
        uuidRel: '',
        facRel: ''
      }
      // Agrego la nueva factura a FacCli02.dbf
      afectaFactura({
        params: {
          mod: "factura",
          opt: "insert"
        },
        data
      });
    }
    res.json( response )
  } // finally

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
  let correos = ''
  let sucursales = req.body.destino.split(',')
  let cuentas = sucursales.map(v =>
    correosSucursales.filter(v2 => v == v2.sucursal)
  )
  for (const iterator of cuentas) {
    correos += iterator[0].correos.captura + ', ' + iterator[0].correos.tesoreria + ', '
  }
  correos = correos.slice(0, -2)

correos = 'opereznet@hotmail.com, operez2000@gmail.com'
  const enviado = EnviarCorreo({
    from: '',
    to: correos,
    cc: '',
    subject: `Notificación de traspaso // ${req.body.sucursal} // ${fechaHora}`,
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


// Siguiente folio de Nota de Crédito
app.get('/siguiente-folio-nota/:serie', mdi, async (req, res) => {
  let json = {}
  try {
    const serie = req.params.serie || 'NCC'
    const mysql = require('mysql2/promise')
    const dbConfig = config.database.facturacion || { host: '127.0.0.1', dbname: 'facturacion', username: 'root', password: '' }
    const dbConn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.dbname
    })
    
    // Consulta MySQL en vez de Access (MDB)
    const qry = `
      SELECT (CAST(folio AS UNSIGNED) + 1) AS FolioNota
      FROM factura 
      WHERE (tipo_factura = 'Nota de Crédito' OR tipo_factura = 'Nota de Credito') 
        AND serie = ? 
      ORDER BY CAST(folio AS UNSIGNED) DESC 
      LIMIT 1
    `
    const [rows] = await dbConn.query(qry, [serie])
    dbConn.end()

    json.response = 200
    json.message = 'Ok'
    json.data = (rows && rows.length > 0 && rows[0].FolioNota) ? rows[0].FolioNota : 1
  } catch (error) {
    console.error("Error en /siguiente-folio-nota:", error)
    let msgError = error.message ? error.message : ''
    if (error.stack !== undefined) {
      msgError += ' ' + error.stack.replace(/\s+/gm, ' ')
    }
    json.response = 400
    json.message = msgError
    json.data = ''
  } finally {
    res.json(json)
  }
}) // siguiente-folio-nota


// Lectura de datos de la Nota de Crédito
app.get('/lee-nota-credito/:serie/:folio', mdi, async (req, res) => {
  let json = {}
  let qry
  let result
  try {
    // Query
    qry = `
      SELECT n.ID, Format(n.Fecha, 'yyyy-mm-dd') AS Fecha, n.CajeroID, n.VendedorID, n.Caja, n.FolioVenta, Format(n.FechaVenta, 'yyyy-mm-dd') AS FechaVenta,
        n.SubTotal, n.ImporteIVA, n.TotalNota, n.ClienteID, n.TipoVenta, n.Estatus, n.UUID, n.UUIDOrigen, n.observaciones, n.formaDePago, n.UsoCFDI
      FROM Notas n
      WHERE ( (n.Serie = '${req.params.serie}') AND (n.FolioNota = ${req.params.folio}) )
    `
    result = await connection.query(qry)
    json.response = (result.length > 0) ? 200 : 401
    json.message = (result.length > 0) ? 'Ok' : 'No se ha encontrado la Nota de Crédito'
    if (result.length > 0) {
      json.data = result[0]
      json.data.FechaFormat = utils.oFecha(json.data.Fecha)
      json.data.FechaVentaFormat = utils.oFecha(json.data.FechaVenta)
      if (!json.data.observaciones) {
        json.data.observaciones = (`Caja: ${json.data.Caja} | Folio Venta: ${json.data.FolioVenta} | Fecha Venta: ${json.data.FechaVentaFormat} |
          Cajero: ${json.data.CajeroID} | Vendedor: ${json.data.VendedorID}`).replace(/\s+/gm, ' ')
      }
      json.data.comentarios = json.data.observaciones
      json.data.items = await NotaDeCreditoDetalle(json.data.ID)
    } else {
      json.data = {}
    }
  } catch (error) {
    console.log(error)
    let msgError = (error.message) ? error.message : ''
    if (error.stack !== undefined) {
      msgError += error.stack.replace(/\s+/gm, ' ')
    }
    json.response = 400
    json.message = msgError
    json.data = ''
  } finally {
    res.json(json)
  }
}) // /lee-nota-credito/:serie/:folio



app.use('/traspasos', traspasosRouter)
app.use('/sucursales', sucursalesRouter)
app.use('/motivos', motivosRouter)
app.use('/facturacion', facturacionRouter)
app.post('/xml2pdf', xml2pdfHandler)


// Final => exportación del módulo para el Server
module.exports =  {
  path: '/api/',
  handler: app
};
