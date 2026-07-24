const pdfMake = require("pdfmake/build/pdfmake");
const vfs = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = vfs.pdfMake.vfs;
const pdfParse = require("pdf-parse");
function makeItems(n){return Array.from({ length: n }, (_, i) => ({ clave: 'C'+i, codigo_barras:'B'+i, descripcion:'Desc '+i, etiqueta:'E'+i, lote:'L'+i, fecha_caducidad:'2026-12-31', cantidad:i+1 }));}
function buildDoc(items){
  const tableBody = [
    [{ text: 'SALIDA DE MERCANCÍA A SUCURSALES', colSpan: 7, border: [false, false, false, false], stack: [{ text: 'SALIDA DE MERCANCÍA A SUCURSALES', style:'sectionTitle', fontSize: 16, alignment: 'center' }] },{},{},{},{},{},{}],
    [{ text: '', colSpan: 7, border: [false, false, false, false], margin:[0,0,0,12], columns:[
      { width:'18%', stack:[{ text:'Logo' }] },
      { width:'33%', stack:[{ text:'Origen' }] },
      { width:'33%', stack:[{ text:'Destino' }] },
      { width:'16%', stack:[{ text:'Folio' }] }
    ] },{},{},{},{},{},{}],
    [{ text:'Clave' },{ text:'Barras' },{ text:'Descripción' },{ text:'Etiqueta' },{ text:'Lote' },{ text:'Caducidad' },{ text:'Cant.' }],
    ...items.map(it=>[it.clave,it.codigo_barras,it.descripcion,it.etiqueta,it.lote,it.fecha_caducidad,String(it.cantidad)])
  ];
  const content=[
    { table: { headerRows: 3, widths:[31,71,'*',44,56,55,20], body:tableBody }, layout:'lightHorizontalLines', margin:[0,0,0,16] },
    { text: `Motivo: -`, style:'small', margin:[0,0,0,4] },
    { text: `Caja: -`, style:'small', margin:[0,0,0,4] },
    { text: `Observaciones: -`, style:'small', margin:[0,0,0,12] },
    { columns:[{ text:`Surte:\n\n_______________________________\n` },{ text:`Captura:\n\n_______________________________\n` },{ text:`Autoriza:\n\n_______________________________\n` },{ text:`Chofer:\n\n_______________________________\n` }], margin:[0,8,0,0] }
  ];
  return { pageSize:'LETTER', pageMargins:[40,40,40,50], content };
}
async function run(){
  const tests = [1,5,10,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40];
  for(const n of tests){
    const docDefinition = buildDoc(makeItems(n));
    const pdfDoc = pdfMake.createPdf(docDefinition);
    const buffer = await new Promise((resolve) => pdfDoc.getBuffer(resolve));
    const data = await pdfParse(buffer);
    console.log(n, data.numpages);
  }
}
run().catch(e=>{ console.error(e); process.exit(1); });
