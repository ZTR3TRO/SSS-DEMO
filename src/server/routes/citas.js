import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

const APERTURA_MIN = 9 * 60 // 09:00
const CIERRE_MIN = 19 * 60 // 19:00
const PASO_MIN = 30
const DURACION_DEFECTO = 30
const ESTADOS_VALIDOS = ['pendiente', 'confirmada', 'cancelada', 'completada']

const aMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}
const aHora = (minutos) => {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0')
  const m = String(minutos % 60).padStart(2, '0')
  return `${h}:${m}`
}

function citasDelDia(fecha) {
  return db
    .prepare(
      `SELECT c.*, s.duracion_min AS servicio_duracion
       FROM citas c
       LEFT JOIN servicios s ON s.id = c.servicio_id
       WHERE c.fecha = ? AND c.estado != 'cancelada'`,
    )
    .all(fecha)
}

// GET /api/citas/servicios — catálogo de servicios para el selector del formulario
router.get('/servicios', (_req, res) => {
  const servicios = db.prepare('SELECT id, nombre, precio, duracion_min, categoria FROM servicios ORDER BY nombre').all()
  res.json({ servicios })
})

// GET /api/citas/disponibilidad?fecha=YYYY-MM-DD&servicio_id=1&excluir_id=3
router.get('/disponibilidad', (req, res) => {
  const { fecha, servicio_id, excluir_id } = req.query
  if (!fecha) return res.status(400).json({ ok: false, errores: ['Falta la fecha.'] })

  const servicio = servicio_id
    ? db.prepare('SELECT * FROM servicios WHERE id = ?').get(servicio_id)
    : null
  const duracion = servicio?.duracion_min ?? DURACION_DEFECTO

  const ocupadas = citasDelDia(fecha)
    .filter((c) => String(c.id) !== String(excluir_id))
    .map((c) => {
      const inicio = aMinutos(c.hora)
      return { inicio, fin: inicio + (c.servicio_duracion ?? DURACION_DEFECTO) }
    })

  const slots = []
  for (let inicio = APERTURA_MIN; inicio + duracion <= CIERRE_MIN; inicio += PASO_MIN) {
    const fin = inicio + duracion
    const chocaConOtra = ocupadas.some((o) => inicio < o.fin && fin > o.inicio)
    slots.push({ hora: aHora(inicio), disponible: !chocaConOtra })
  }

  res.json({ slots, duracion })
})

// GET /api/citas?fecha=YYYY-MM-DD
router.get('/', (req, res) => {
  const { fecha } = req.query
  const citas = fecha
    ? db
        .prepare(
          `SELECT c.*, s.duracion_min AS servicio_duracion, s.precio AS servicio_precio
           FROM citas c LEFT JOIN servicios s ON s.id = c.servicio_id
           WHERE c.fecha = ? ORDER BY c.hora`,
        )
        .all(fecha)
    : db
        .prepare(
          `SELECT c.*, s.duracion_min AS servicio_duracion, s.precio AS servicio_precio
           FROM citas c LEFT JOIN servicios s ON s.id = c.servicio_id
           WHERE c.fecha >= date('now') ORDER BY c.fecha, c.hora LIMIT 50`,
        )
        .all()
  res.json({ citas })
})

// POST /api/citas
// Fase 5 (Opción A): admite cliente_id de una ficha ya registrada; si no se manda,
// la cita se sigue creando "rápida" solo con el texto libre en `cliente`, como hasta ahora.
router.post('/', (req, res) => {
  const { cliente, cliente_id, servicio_id, fecha, hora, notas } = req.body
  const errores = []

  const clienteFicha = cliente_id ? db.prepare('SELECT * FROM clientes WHERE id = ?').get(cliente_id) : null
  if (cliente_id && !clienteFicha) errores.push('El cliente seleccionado no existe.')

  // El texto libre es obligatorio salvo que venga de una ficha de cliente (se usa su nombre como snapshot).
  const nombreCliente = cliente?.trim() || clienteFicha?.nombre
  if (!nombreCliente) errores.push('El nombre del cliente es obligatorio.')
  if (!fecha) errores.push('La fecha es obligatoria.')
  if (!hora) errores.push('La hora es obligatoria.')

  const servicio = servicio_id ? db.prepare('SELECT * FROM servicios WHERE id = ?').get(servicio_id) : null
  if (servicio_id && !servicio) errores.push('El servicio seleccionado no existe.')
  if (errores.length) return res.status(400).json({ ok: false, errores })

  const duracion = servicio?.duracion_min ?? DURACION_DEFECTO
  const inicio = aMinutos(hora)
  const fin = inicio + duracion
  const choca = citasDelDia(fecha).some((c) => {
    const oInicio = aMinutos(c.hora)
    const oFin = oInicio + (c.servicio_duracion ?? DURACION_DEFECTO)
    return inicio < oFin && fin > oInicio
  })
  if (choca) {
    return res.status(409).json({ ok: false, errores: ['Ese horario ya no está disponible. Elige otro.'] })
  }

  const info = db
    .prepare(
      'INSERT INTO citas (cliente, cliente_id, servicio, servicio_id, fecha, hora, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      nombreCliente,
      clienteFicha?.id ?? null,
      servicio?.nombre ?? 'Servicio general',
      servicio?.id ?? null,
      fecha,
      hora,
      'pendiente',
      notas ?? null,
    )

  const cita = db.prepare('SELECT * FROM citas WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({ ok: true, cita })
})

// PATCH /api/citas/:id/estado  { estado }
router.patch('/:id/estado', (req, res) => {
  const cita = db.prepare('SELECT * FROM citas WHERE id = ?').get(req.params.id)
  if (!cita) return res.status(404).json({ ok: false, errores: ['Cita no encontrada.'] })

  const { estado } = req.body
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ ok: false, errores: [`Estado inválido. Usa uno de: ${ESTADOS_VALIDOS.join(', ')}.`] })
  }

  db.prepare('UPDATE citas SET estado = ? WHERE id = ?').run(estado, req.params.id)
  const actualizada = db.prepare('SELECT * FROM citas WHERE id = ?').get(req.params.id)
  res.json({ ok: true, cita: actualizada })
})

// DELETE /api/citas/:id
router.delete('/:id', (req, res) => {
  const cita = db.prepare('SELECT * FROM citas WHERE id = ?').get(req.params.id)
  if (!cita) return res.status(404).json({ ok: false, errores: ['Cita no encontrada.'] })

  db.prepare('DELETE FROM citas WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
