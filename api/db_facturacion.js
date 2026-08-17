import { Sequelize } from 'sequelize'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(readFileSync(join(__dirname, '../config.json'), 'utf8'))
const dbConfig = config.database.facturacion || {
  host: '127.0.0.1',
  dbname: 'facturacion',
  username: 'root',
  password: ''
}

const sequelize = new Sequelize(dbConfig.dbname, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: 'mysql',
  dialectOptions: {
    dateStrings: true,
    typeCast: true
  },
  logging: (sql) => console.log(`[SQL Facturación] ${sql}`),
  define: { freezeTableName: true }
})

let initialized = false

async function initDb() {
  if (initialized) return
  initialized = true

  // Asegurar que la base de datos exista antes de conectar con Sequelize
  try {
    const conn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password
    })
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.dbname}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    await conn.end()
  } catch (err) {
    console.warn('[DB Facturación] Aviso al verificar/crear base de datos:', err.message)
  }

  const schemaSql = readFileSync(join(__dirname, '../docs/schema_facturacion_mysql.sql'), 'utf8')

  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.toUpperCase().startsWith('USE') && !s.toUpperCase().startsWith('CREATE DATABASE'))

  for (const sql of statements) {
    if (sql) {
      try {
        await sequelize.query(sql)
      } catch (e) {
        console.error('[DB Facturación] Error ejecutando statement inicial:', e.message)
      }
    }
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

export default sequelize
