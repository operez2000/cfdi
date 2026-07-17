import { writeFileSync, existsSync, unlinkSync } from 'fs';
const jsonFile = require( './docs/B67992.json');

if (existsSync('./docs/B67992.csv')) {
  unlinkSync('./docs/B67992.csv');
}

jsonFile.conceptos.forEach((element: any) => {
  const importe = Number(element.Importe) + Number(element.Impuestos.Traslados[0].Importe);
  const NoIdentificacion = element.NoIdentificacion.replace(/\-/, '   ') + ',' + importe + '\r\n';
  console.log(NoIdentificacion);
  writeFileSync('./docs/B67992.csv', NoIdentificacion, {flag: 'a'});
});

