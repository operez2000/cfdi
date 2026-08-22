const ADODB = require('@el3um4s/node-adodb');
const config = require('../config.json');
const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${config.dbfLocation}/novartis.mdb;`);
connection.schema(4).then(schema => console.log(JSON.stringify(schema.filter(c => c.TABLE_NAME === 'Notas'), null, 2))).catch(e => console.error(e));
