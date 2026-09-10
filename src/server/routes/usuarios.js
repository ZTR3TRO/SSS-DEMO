import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// ---------------------------------------------------------------------------
// Empleados — directorio simple (sin lógica de turnos/horarios en esta demo).
// ---------------------------------------------------------------------------

function validarEmpleado(body, { parcial = false } = {}) {
  const errores = []
  const datos = {}

  if (!parcial || body.nombre !== undefined) {
    if (typeof body.nombre !== 'string' || !body.nombre.trim()) errores.push('El nombre es obligatorio.')
    datos.nombre = String(body.nombre ?? '').trim()
  }
  if (!parcial || body.puesto !== undefined) {
    if (typeof body.puesto !== 'string' || !body.puesto.trim()) errores.push('El puesto es obligatorio.')
    datos.puesto = String(body.puesto ?? '').trim()
  }
  if (!parcial || body.telefono !== undefined) {
    datos.telefono = body.telefono ? String(body.telefono).trim() : null
  }

  return { errores, datos }
}

// GET /api/usuarios/empleados?incluir_inactivos=1
router.get('/empleados', (req, res) => {
  const incluirInactivos = req.query.incluir_inactivos === '1'
  const empleados = incluirInactivos
    ? db.prepare('SELECT * FROM empleados ORDER BY activo DESC, nombre').all()
    : db.prepare('SELECT * FROM empleados WHERE activo = 1 ORDER BY nombre').all()
  res.json({ empleados })
})

// POST /api/usuarios/empleados
router.post('/empleados', (req, res) => {
  const { errores, datos } = validarEmpleado(req.body)
  if (errores.length) return res.status(400).json({ ok: false, errores })

  const info = db
    .prepare('INSERT INTO empleados (nombre, puesto, telefono) VALUES (@nombre, @puesto, @telefono)')
    .run(datos)
  const empleado = db.prepare('SELECT * FROM empleados WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({ ok: true, empleado })
})

// PUT /api/usuarios/empleados/:id
router.put('/empleados/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM empleados WHERE id = ?').get(req.params.id)
  if (!existente) return res.status(404).json({ ok: false, errores: ['Empleado no encontrado.'] })

  const { errores, datos } = validarEmpleado(req.body)
  if (errores.length) return res.status(400).json({ ok: false, errores })

  db.prepare('UPDATE empleados SET nombre=@nombre, puesto=@puesto, telefono=@telefono WHERE id=@id').run({
    ...datos,
    id: req.params.id,
  })
  const empleado = db.prepare('SELECT * FROM empleados WHERE id = ?').get(req.params.id)
  res.json({ ok: true, empleado })
})

// PATCH /api/usuarios/empleados/:id  { activo: true|false } — baja lógica, nunca DELETE físico.
router.patch('/empleados/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM empleados WHERE id = ?').get(req.params.id)
  if (!existente) return res.status(404).json({ ok: false, errores: ['Empleado no encontrado.'] })

  if (typeof req.body.activo !== 'boolean') {
    return res.status(400).json({ ok: false, errores: ['activo debe ser true o false.'] })
  }

  db.prepare('UPDATE empleados SET activo = ? WHERE id = ?').run(req.body.activo ? 1 : 0, req.params.id)
  const empleado = db.prepare('SELECT * FROM empleados WHERE id = ?').get(req.params.id)
  res.json({ ok: true, empleado })
})

// ---------------------------------------------------------------------------
// Clientes frecuentes — ficha reconocible entre visitas, vinculable a citas.
// ---------------------------------------------------------------------------

function validarCliente(body, { parcial = false } = {}) {
  const errores = []
  const datos = {}

  if (!parcial || body.nombre !== undefined) {
    if (typeof body.nombre !== 'string' || !body.nombre.trim()) errores.push('El nombre es obligatorio.')
    datos.nombre = String(body.nombre ?? '').trim()
  }
  if (!parcial || body.telefono !== undefined) {
    datos.telefono = body.telefono ? String(body.telefono).trim() : null
  }
  if (!parcial || body.notas !== undefined) {
    datos.notas = body.notas ? String(body.notas).trim() : null
  }

  return { errores, datos }
}

// GET /api/usuarios/clientes — incluye número de citas asociadas (todas y completadas).
router.get('/clientes', (_req, res) => {
  const clientes = db
    .prepare(
      `SELECT cl.*,
              COUNT(c.id) AS total_citas,
              SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) AS visitas
       FROM clientes cl
       LEFT JOIN citas c ON c.cliente_id = cl.id
       GROUP BY cl.id
       ORDER BY cl.nombre`,
    )
    .all()
  res.json({ clientes })
})

// POST /api/usuarios/clientes
router.post('/clientes', (req, res) => {
  const { errores, datos } = validarCliente(req.body)
  if (errores.length) return res.status(400).json({ ok: false, errores })

  const info = db
    .prepare('INSERT INTO clientes (nombre, telefono, notas) VALUES (@nombre, @telefono, @notas)')
    .run(datos)
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({ ok: true, cliente })
})

// PUT /api/usuarios/clientes/:id
router.put('/clientes/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id)
  if (!existente) return res.status(404).json({ ok: false, errores: ['Cliente no encontrado.'] })

  const { errores, datos } = validarCliente(req.body)
  if (errores.length) return res.status(400).json({ ok: false, errores })

  db.prepare('UPDATE clientes SET nombre=@nombre, telefono=@telefono, notas=@notas WHERE id=@id').run({
    ...datos,
    id: req.params.id,
  })
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id)
  res.json({ ok: true, cliente })
})

// DELETE /api/usuarios/clientes/:id — bloqueado si tiene citas activas (mismo criterio que Inventario con stock).
router.delete('/clientes/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id)
  if (!existente) return res.status(404).json({ ok: false, errores: ['Cliente no encontrado.'] })

  const citasActivas = db
    .prepare(
      `SELECT COUNT(*) AS n FROM citas
       WHERE cliente_id = ? AND estado IN ('pendiente', 'confirmada')`,
    )
    .get(req.params.id).n

  if (citasActivas > 0) {
    return res.status(400).json({
      ok: false,
      errores: ['No se puede eliminar: el cliente tiene citas pendientes o confirmadas.'],
    })
  }

  db.prepare('DELETE FROM clientes WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
