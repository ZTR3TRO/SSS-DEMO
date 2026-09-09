import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

function validarProducto(body, { parcial = false } = {}) {
  const errores = []
  const datos = {}

  if (!parcial || body.nombre !== undefined) {
    if (typeof body.nombre !== 'string' || !body.nombre.trim()) errores.push('El nombre es obligatorio.')
    datos.nombre = String(body.nombre ?? '').trim()
  }
  if (!parcial || body.precio !== undefined) {
    const precio = Number(body.precio)
    if (!Number.isFinite(precio) || precio < 0) errores.push('El precio debe ser un número positivo.')
    datos.precio = precio
  }
  if (!parcial || body.stock !== undefined) {
    const stock = Number(body.stock)
    if (!Number.isInteger(stock) || stock < 0) errores.push('El stock debe ser un entero positivo.')
    datos.stock = stock
  }
  if (!parcial || body.stock_min !== undefined) {
    const stockMin = Number(body.stock_min ?? 5)
    if (!Number.isInteger(stockMin) || stockMin < 0) errores.push('El stock mínimo debe ser un entero positivo.')
    datos.stock_min = stockMin
  }
  if (!parcial || body.categoria !== undefined) {
    datos.categoria = String(body.categoria ?? 'General').trim() || 'General'
  }

  return { errores, datos }
}

// GET /api/inventario?categoria=Cabello
router.get('/', (req, res) => {
  const { categoria } = req.query
  const productos =
    categoria && categoria !== 'todas'
      ? db.prepare('SELECT * FROM productos WHERE categoria = ? ORDER BY nombre').all(categoria)
      : db.prepare('SELECT * FROM productos ORDER BY categoria, nombre').all()

  const categorias = db
    .prepare('SELECT DISTINCT categoria FROM productos ORDER BY categoria')
    .all()
    .map((c) => c.categoria)

  res.json({ productos, categorias })
})

// POST /api/inventario
router.post('/', (req, res) => {
  const { errores, datos } = validarProducto(req.body)
  if (errores.length) return res.status(400).json({ ok: false, errores })

  const info = db
    .prepare(
      'INSERT INTO productos (nombre, precio, stock, stock_min, categoria) VALUES (@nombre, @precio, @stock, @stock_min, @categoria)',
    )
    .run(datos)
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({ ok: true, producto })
})

// PUT /api/inventario/:id
router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id)
  if (!existente) return res.status(404).json({ ok: false, errores: ['Producto no encontrado.'] })

  const { errores, datos } = validarProducto(req.body)
  if (errores.length) return res.status(400).json({ ok: false, errores })

  db.prepare(
    'UPDATE productos SET nombre=@nombre, precio=@precio, stock=@stock, stock_min=@stock_min, categoria=@categoria WHERE id=@id',
  ).run({ ...datos, id: req.params.id })
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id)
  res.json({ ok: true, producto })
})

// PATCH /api/inventario/:id/stock  { delta: 1 | -1 }
router.patch('/:id/stock', (req, res) => {
  const existente = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id)
  if (!existente) return res.status(404).json({ ok: false, errores: ['Producto no encontrado.'] })

  const delta = Number(req.body.delta)
  if (!Number.isInteger(delta)) {
    return res.status(400).json({ ok: false, errores: ['delta debe ser un entero.'] })
  }

  const nuevoStock = existente.stock + delta
  if (nuevoStock < 0) {
    return res.status(400).json({ ok: false, errores: ['El stock no puede ser negativo.'] })
  }

  db.prepare('UPDATE productos SET stock = ? WHERE id = ?').run(nuevoStock, req.params.id)
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id)
  res.json({ ok: true, producto })
})

// DELETE /api/inventario/:id
router.delete('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id)
  if (!existente) return res.status(404).json({ ok: false, errores: ['Producto no encontrado.'] })

  db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
