import { Sequelize } from 'sequelize'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(readFileSync(join(__dirname, '../config.json'), 'utf8'))
const dbConfig = config.database.local

const sequelize = new Sequelize(dbConfig.dbname, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: 'mysql',
  // Devolver DATE/DATETIME como string (YYYY-MM-DD[ HH:mm:ss]) para no
  // reinterpretar wall-clock PST según la zona del proceso Node.
  dialectOptions: {
    dateStrings: true,
    typeCast: true
  },
  logging: (sql, timing) => console.log(`[SQL] ${sql}`),
  define: { freezeTableName: true }
})

let initialized = false

async function initDb() {
  if (initialized) return
  initialized = true

  const schemaSql = readFileSync(join(__dirname, '../docs/schema_traspasos_mysql.sql'), 'utf8')

  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('DROP') && s !== 'START TRANSACTION' && s !== 'COMMIT')

  const tablesToSeed = {}

  for (const raw of statements) {
    const sql = raw.replace(/^CREATE TABLE\b/, 'CREATE TABLE IF NOT EXISTS')

    if (/^INSERT\s+INTO\s+`?(\w+)`?/i.test(sql)) {
      const tableName = sql.match(/^INSERT\s+INTO\s+`?(\w+)`?/i)[1]
      if (!tablesToSeed[tableName]) tablesToSeed[tableName] = []
      tablesToSeed[tableName].push(sql)
      continue
    }

    if (/^CREATE\s+(TABLE|INDEX|TRIGGER)/i.test(sql)) {
      if (/^CREATE\s+TRIGGER/i.test(sql)) {
        const name = sql.match(/CREATE\s+TRIGGER\s+`?(\w+)`?/i)?.[1]
        if (name) {
          try { await sequelize.query(`DROP TRIGGER IF EXISTS \`${name}\``) } catch (_) { }
        }
      }
      try { await sequelize.query(sql) } catch (_) { }
    }
  }

  for (const [table, inserts] of Object.entries(tablesToSeed)) {
    const [countRows] = await sequelize.query(`SELECT COUNT(*) AS \`count\` FROM \`${table}\``)
    if (countRows[0].count === 0) {
      for (const sql of inserts) {
        await sequelize.query(sql)
      }
    }
  }

  const [seqRow] = await sequelize.query("SELECT COUNT(*) AS `count` FROM `secuencia` WHERE `nombre` = 'traspaso_folio'")
  if (seqRow[0].count === 0) {
    await sequelize.query("INSERT INTO `secuencia`(`nombre`, `valor`) VALUES ('traspaso_folio', 0)")
  }
}

export async function query(sql, replacements = [], opts = {}) {
  await initDb()
  const [rows] = await sequelize.query(sql, { replacements, ...opts })
  return Array.isArray(rows) ? rows : []
}

export async function queryOne(sql, replacements = [], opts = {}) {
  await initDb()
  const [rows] = await sequelize.query(sql, { replacements, ...opts })
  return Array.isArray(rows) ? (rows[0] || null) : null
}

export async function execute(sql, replacements = [], opts = {}) {
  await initDb()
  const raw = await sequelize.query(sql, { replacements, type: Sequelize.QueryTypes.RAW, ...opts })
  const [insertId, affectedRows] = raw
  return { insertId, affectedRows }
}

export function transaction(callback) {
  return sequelize.transaction(async (t) => callback(t))
}

export function formatFolio(prefijo, folio) {
  return `${prefijo}-${String(folio).padStart(5, '0')}`
}

export async function getNextFolio(t) {
  await initDb()
  const opts = t ? { transaction: t } : {}
  const row = await queryOne("SELECT valor FROM secuencia WHERE nombre = 'traspaso_folio'", [], opts)
  if (!row) {
    await execute("INSERT INTO secuencia(nombre, valor) VALUES ('traspaso_folio', 1)", [], opts)
    return 1
  }
  const next = row.valor + 1
  await execute("UPDATE secuencia SET valor = ? WHERE nombre = 'traspaso_folio'", [next], opts)
  return next
}

export async function getHeaderById(id) {
  await initDb()
  return queryOne(`
    SELECT h.*,
           s.abreviacion AS sucursal_origen_abreviacion,
           s.nombre AS sucursal_origen_nombre,
           s.domicilio AS sucursal_origen_domicilio,
           s.colonia AS sucursal_origen_colonia,
           s.ciudad AS sucursal_origen_ciudad,
           s.codigo_postal AS sucursal_origen_codigo_postal,
           s.telefonos AS sucursal_origen_telefonos
    FROM traspaso_header h
    LEFT JOIN sucursal s ON s.id = h.id_sucursal_origen AND s.borrado = 0
    WHERE h.id = ? AND h.borrado = 0
  `, [id])
}

export default sequelize
