import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// GET /api/pos/catalogo?categoria=Cabello
router.get('/catalogo', (req, res) => {
  const { categoria } = req.query

  const servicios = db
    .prepare('SELECT id, nombre, precio, categoria, duracion_min FROM servicios ORDER BY categoria, nombre')
    .all()
    .map((s) => ({ ...s, tipo: 'servicio' }))

  const productos = db
    .prepare('SELECT id, nombre, precio, categoria, stock FROM productos ORDER BY categoria, nombre')
    .all()
    .map((p) => ({ ...p, tipo: 'producto' }))

  let catalogo = [...servicios, ...productos]
  const categorias = [...new Set(catalogo.map((c) => c.categoria))].sort()

  if (categoria && categoria !== 'todas') {
    catalogo = catalogo.filter((c) => c.categoria === categoria)
  }

  res.json({ catalogo, categorias })
})

// POST /api/pos/venta  { items: [{ tipo, id, nombre, precio, cantidad }] }
router.post('/venta', (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : []

  if (items.length === 0) {
    return res.status(400).json({ ok: false, errores: ['El carrito está vacío.'] })
  }

  for (const item of items) {
    if (!['producto', 'servicio'].includes(item.tipo)) {
      return res.status(400).json({ ok: false, errores: ['Cada ítem debe indicar tipo: producto o servicio.'] })
    }
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      return res.status(400).json({ ok: false, errores: [`Cantidad inválida para "${item.nombre}".`] })
    }
  }

  // Verificar stock disponible para productos antes de tocar nada.
  for (const item of items) {
    if (item.tipo === 'producto') {
      const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(item.id)
      if (!producto) {
        return res.status(404).json({ ok: false, errores: [`El producto "${item.nombre}" ya no existe.`] })
      }
      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          ok: false,
          errores: [`Stock insuficiente de "${producto.nombre}" (disponible: ${producto.stock}).`],
        })
      }
    }
  }

  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  const registrarVenta = db.transaction(() => {
    const venta = db.prepare('INSERT INTO ventas (total) VALUES (?)').run(total)
    const insertItem = db.prepare(
      'INSERT INTO ventas_items (venta_id, nombre, cantidad, precio) VALUES (?, ?, ?, ?)',
    )
    const descontarStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?')

    for (const item of items) {
      insertItem.run(venta.lastInsertRowid, item.nombre, item.cantidad, item.precio)
      if (item.tipo === 'producto') {
        descontarStock.run(item.cantidad, item.id)
      }
    }
    return venta.lastInsertRowid
  })

  try {
    const ventaId = registrarVenta()
    const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(ventaId)
    const ventaItems = db.prepare('SELECT * FROM ventas_items WHERE venta_id = ?').all(ventaId)
    res.status(201).json({ ok: true, venta: { ...venta, items: ventaItems } })
  } catch (e) {
    res.status(500).json({ ok: false, errores: ['No se pudo registrar la venta. Intenta de nuevo.'] })
  }
})

export default router
