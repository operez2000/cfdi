const pdfMake = require("pdfmake/build/pdfmake");
const vfs = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = vfs.pdfMake.vfs;
const pdfParse = require("pdf-parse");
const fs = require("fs");
const testCounts = [1,5,10,15,20,25,26,27,28,29,30,31,32,33,34,35,36,37,40,45,50];
function makeItems(n){return Array.from({ length: n }, (_, i) => ({ clave: 'C'+i, codigo_barras:'B'+i, descripcion:'Desc '+i, etiqueta:'E'+i, lote:'L'+i, fecha_caducidad:'2026-12-31', cantidad:i+1 }));}
function makeDoc(items){
  const tableBody = [
    [{ text: 'SALIDA DE MERCANCÍA A SUCURSALES', colSpan: 7, border: [false, false, false, false], stack: [{ text: 'SALIDA DE MERCANCÍA A SUCURSALES', fontSize: 16, alignment: 'center' }] },{},{},{},{},{},{}],
    [{ text: '', colSpan: 7, border: [false, false, false, false], margin:[0,0,0,12], columns:[
      { width:'18%', stack:[{ text:'Logo' }] },
      { width:'33%', stack:[{ text:'Origen' }] },
      { width:'33%', stack:[{ text:'Destino' }] },
      { width:'16%', stack:[{ text:'Folio' }] }
    ] },{},{},{},{},{},{}],
    [{ text:'Clave' },{ text:'Barras' },{ text:'Descripción' },{ text:'Etiqueta' },{ text:'Lote' },{ text:'Caducidad' },{ text:'Cant.' }],
    ...items.map(it=>[it.clave,it.codigo_barras,it.descripcion,it.etiqueta,it.lote,it.fecha_caducidad,String(it.cantidad)])
  ];
  const content=[{table:{headerRows:3,widths:[31,71,'*',44,56,55,20],body:tableBody},layout:'lightHorizontalLines',margin:[0,0,0,16]},{text:'Motivo: -',style:'small',margin:[0,0,0,4]},{text:'Caja: -',style:'small',margin:[0,0,0,4]},{text:'Observaciones: -',style:'small',margin:[0,0,0,12]},{columns:[{text:'Surte'},{text:'Captura'},{text:'Autoriza'},{text:'Chofer'}],margin:[0,8,0,0]}];
  return {pageSize:'LETTER',pageMargins:[40,40,40,50],content};
}
async function run(){
  for(const n of testCounts){
    const doc = makeDoc(makeItems(n));
    const pdfDoc = pdfMake.createPdf(doc);
    const buffer = await new Promise((resolve,reject)=>pdfDoc.getBuffer(b=>resolve(b)));
    const data = await pdfParse(buffer);
    console.log(n, data.numpages);
  }
}
run().catch(e=>{console.error(e); process.exit(1);});
