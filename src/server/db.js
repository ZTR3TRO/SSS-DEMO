import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../../data')
fs.mkdirSync(dataDir, { recursive: true })

export const db = new Database(path.join(dataDir, 'salon.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

/** Agrega una columna si no existe todavía (SQLite no soporta ADD COLUMN IF NOT EXISTS). */
function agregarColumnaSiFalta(tabla, columna, definicion) {
  const columnas = db.prepare(`PRAGMA table_info(${tabla})`).all()
  const existe = columnas.some((c) => c.name === columna)
  if (!existe) {
    db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`)
  }
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      duracion_min INTEGER NOT NULL DEFAULT 30
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      stock_min INTEGER NOT NULL DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS citas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente TEXT NOT NULL,
      servicio TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente'
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      creada_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ventas_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL REFERENCES ventas(id),
      nombre TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      precio REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS empleados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      puesto TEXT NOT NULL,
      telefono TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      notas TEXT,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Migraciones incrementales: columnas agregadas después de la v1 del esquema.
  agregarColumnaSiFalta('productos', 'categoria', "TEXT NOT NULL DEFAULT 'General'")
  agregarColumnaSiFalta('servicios', 'categoria', "TEXT NOT NULL DEFAULT 'General'")
  agregarColumnaSiFalta('citas', 'servicio_id', 'INTEGER REFERENCES servicios(id)')
  agregarColumnaSiFalta('citas', 'notas', 'TEXT')
  // Fase 5 — vínculo opcional cita → ficha de cliente (Opción A: nullable, conserva el texto libre como respaldo).
  agregarColumnaSiFalta('citas', 'cliente_id', 'INTEGER REFERENCES clientes(id)')
}