import { Router } from 'express'
import { db } from '../db.js'
import {
  estaConectado,
  enviarTexto,
  formatearTelefono,
  getEstado,
  iniciarWhatsApp,
  normalizarTelefono,
  qrComoImagen,
  desvincularWhatsApp,
} from '../whatsapp.js'

const router = Router()

router.get('/estado', async (_req, res) => {
  const estado = getEstado()
  const imagen = await qrComoImagen()
  res.json({
    ok: true,
    estado: estado.estado,
    qr: imagen,
    telefono: estado.telefono,
    nombre: estado.nombre,
    conectado: estaConectado(),
    ultimaConexion: estado.ultimaConexion,
  })
})

router.post('/vincular', async (_req, res) => {
  await desvincularWhatsApp()
  res.json({ ok: true, mensaje: 'Sesión reiniciada. Escanea el nuevo código QR.' })
})

router.post('/prueba', async (req, res) => {
  const telefono = normalizarTelefono(req.body?.telefono)
  if (!telefono) {
    return res.status(400).json({ ok: false, errores: ['Teléfono inválido. Usa un número mexicano (ej. 667 100 2001).'] })
  }
  if (!estaConectado()) {
    return res.status(409).json({ ok: false, errores: ['WhatsApp no está vinculado. Escanea el QR en el módulo de WhatsApp.'] })
  }
  try {
    const texto = '¡Hola! 👋 Esto es una prueba desde el panel de SSSALÓN. Recibirás aquí las confirmaciones de tus citas.'
    await enviarTexto(telefono, texto)
    db.prepare(
      `INSERT INTO whatsapp_mensajes (direccion, tipo, telefono, mensaje, estado)
       VALUES ('enviado', 'texto', ?, ?, 'respondida')`
    ).run(telefono, texto)
    res.json({ ok: true, telefono: formatearTelefono(telefono) })
  } catch (e) {
    res.status(500).json({ ok: false, errores: [e.message] })
  }
})

router.post('/enviar-confirmacion', async (req, res) => {
  const citaId = Number(req.body?.cita_id)
  if (!citaId) {
    return res.status(400).json({ ok: false, errores: ['Falta el id de la cita.'] })
  }

  const cita = db
    .prepare(
      `SELECT c.*, cl.telefono AS ficha_telefono,
              COALESCE(NULLIF(c.telefono, ''), cl.telefono, '') AS telefono_envio,
              s.nombre AS servicio_nombre
       FROM citas c
       LEFT JOIN clientes cl ON cl.id = c.cliente_id
       LEFT JOIN servicios s ON s.id = c.servicio_id
       WHERE c.id = ?`
    )
    .get(citaId)

  if (!cita) {
    return res.status(404).json({ ok: false, errores: ['No se encontró la cita.'] })
  }
  if (cita.estado !== 'pendiente') {
    return res.status(400).json({ ok: false, errores: ['Solo se confirman por WhatsApp las citas en estado "pendiente".'] })
  }

  const telefono = normalizarTelefono(cita.telefono_envio)
  if (!telefono) {
    return res.status(400).json({
      ok: false,
      errores: ['La cita no tiene un teléfono válido. Agrega o edita el teléfono de la cita.'],
    })
  }

  if (!estaConectado()) {
    return res.status(409).json({ ok: false, errores: ['WhatsApp no está vinculado. Escanea el QR en el módulo de WhatsApp.'] })
  }

  // Evita reenvíos accidentales: si ya hay una confirmación reciente esperando respuesta
  // para esta misma cita, no se manda otra (mandar varios mensajes seguidos al mismo
  // chat es una causa típica de que WhatsApp tarde en entregar o se quede "esperando").
  const COOLDOWN_MS = 2 * 60 * 1000 // 2 minutos
  const confirmacionPendiente = db
    .prepare(
      `SELECT * FROM whatsapp_mensajes WHERE tipo = 'confirmacion' AND estado = 'pendiente' AND cita_id = ? ORDER BY id DESC LIMIT 1`,
    )
    .get(citaId)
  if (confirmacionPendiente) {
    const enviadaHaceMs = Date.now() - new Date(confirmacionPendiente.creado_en.replace(' ', 'T') + 'Z').getTime()
    if (enviadaHaceMs < COOLDOWN_MS) {
      const segundosRestantes = Math.ceil((COOLDOWN_MS - enviadaHaceMs) / 1000)
      return res.status(409).json({
        ok: false,
        errores: [`Ya se envió una confirmación a este cliente hace poco. Espera ${segundosRestantes}s antes de reenviar.`],
      })
    }
  }

  const servicio = cita.servicio_nombre ?? cita.servicio
  const texto =
    `Hola ${cita.cliente}! 👋 Soy el equipo de SSSALÓN.\n\n` +
    `Tenemos una cita apartada para ti:\n` +
    `• ${servicio}\n` +
    `• ${cita.fecha} a las ${cita.hora}\n\n` +
    `¿Confirmas? Responde SI o NO por este chat.`

  try {
    // Una sola confirmación pendiente por teléfono: las anteriores se invalidan.
    db.prepare(
      "UPDATE whatsapp_mensajes SET estado = 'respondida' WHERE tipo = 'confirmacion' AND estado = 'pendiente' AND cita_id != ?"
    ).run(citaId)
    await enviarTexto(telefono, texto)
    db.prepare(
      `INSERT INTO whatsapp_mensajes (direccion, tipo, cita_id, telefono, mensaje, estado)
       VALUES ('enviado', 'confirmacion', ?, ?, ?, 'pendiente')`
    ).run(citaId, telefono, texto)
    res.json({ ok: true, telefono: formatearTelefono(telefono), mensaje: 'Mensaje de confirmación enviado.' })
  } catch (e) {
    res.status(500).json({ ok: false, errores: [e.message] })
  }
})

router.get('/mensajes', (req, res) => {
  const citaId = req.query.cita_id ? Number(req.query.cita_id) : null
  let filas
  if (citaId) {
    filas = db
      .prepare('SELECT * FROM whatsapp_mensajes WHERE cita_id = ? ORDER BY id DESC LIMIT 20')
      .all(citaId)
  } else {
    filas = db.prepare('SELECT * FROM whatsapp_mensajes ORDER BY id DESC LIMIT 30').all()
  }
  res.json({ ok: true, mensajes: filas })
})

export default router