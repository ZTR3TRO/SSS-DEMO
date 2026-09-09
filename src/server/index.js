import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, initDb } from './db.js'
import { seed } from './seed.js'
import inventarioRoutes from './routes/inventario.js'
import posRoutes from './routes/pos.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const dist = path.resolve(__dirname, '../../dist')

initDb()
seed()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  const conteo = {
    servicios: db.prepare('SELECT COUNT(*) AS n FROM servicios').get().n,
    productos: db.prepare('SELECT COUNT(*) AS n FROM productos').get().n,
    citas: db.prepare('SELECT COUNT(*) AS n FROM citas').get().n,
    ventas: db.prepare('SELECT COUNT(*) AS n FROM ventas').get().n,
  }
  res.json({ ok: true, servicio: 'SSSALÓN API', modulo: 'monolito', conteo })
})

// Rutas por módulo (se pueblan aqui según el paso que corresponda)
app.use('/api/pos', posRoutes)
app.use('/api/inventario', inventarioRoutes)
// app.use('/api/citas', citasRoutes)

if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(dist, 'index.html'))
    }
    next()
  })
}

app.listen(PORT, () => {
  console.log(`[api] SSSALÓN API escuchando en http://localhost:${PORT}`)
})