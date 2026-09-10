import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys'
import { db } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sessionDir = path.resolve(__dirname, '../../data/baileys')

const estado = {
  estado: 'apagado', // apagado | qr | conectando | conectado | cerrando
  qr: null,
  telefono: null,
  nombre: null,
  ultimaConexion: null,
}

let socket = null
let reiniciando = false

/** Normaliza un teléfono mexicano a E.164 (+52…) si es válido. */
export function normalizarTelefono(telefono) {
  const texto = String(telefono ?? '').trim()
  if (!texto) return null

  const digitos = texto.replace(/\D/g, '')
  const variantes = [texto]
  // Marcado móvil mexicano antiguo: '1' después del prefijo internacional (+52 1 667…).
  if (digitos.startsWith('521')) variantes.push(`+52${digitos.slice(3)}`)
  // Marcado local con '1' inicial ('1 667…' / '1-667-…').
  if (/^1([\s-]|$)/.test(texto)) variantes.push(`+52${texto.replace(/^1[\s-]*/, '')}`)

  for (const variante of variantes) {
    const numero = parsePhoneNumberFromString(variante, 'MX')
    if (numero?.isValid()) return numero.format('E.164')
  }
  return null
}

/** Formato amigable para mostrar al usuario (ej. +52 667 100 2001). */
export function formatearTelefono(telefono) {
  const numero = parsePhoneNumberFromString(String(telefono ?? '').trim(), 'MX')
  if (!numero || !numero.isValid()) return telefono
  return numero.format('INTERNATIONAL')
}

export function getEstado() {
  return { ...estado }
}

export function estaConectado() {
  return !!socket && estado.estado === 'conectado'
}

/** Interpreta la respuesta de la cita: 'si' | 'no' | null. */
function interpretarRespuesta(texto) {
  const t = String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (/\b(si|sii|sip|yes|sisi|confirmo|confirmar|confirmada|claro|dale|va|cuenta con eso|perfecto|ok|adelante)\b/.test(t)) return 'si'
  if (/\b(no|nop|nope|nel|cancelar|cancela|cancelada|cancelado|no puedo|no voy|agendar despues|no gracias)\b/.test(t)) return 'no'
  return null
}

function normalizarJid(jid) {
  if (!jid) return null
  const base = jid.split('@')[0]?.replace(/\D/g, '') ?? ''
  return base.endsWith('@g.us') ? null : base
}

function telefonoCoincide(guardado, jidNumeros) {
  if (!jidNumeros) return false
  if (!guardado || guardado === 'undefined' || guardado === 'null') return false
  const guardadoDigitos = String(guardado).replace(/\D/g, '')
  if (!guardadoDigitos) return false
  return jidNumeros.endsWith(guardadoDigitos.slice(-10))
}

export async function enviarTexto(telefonoE164, texto) {
  if (!estaConectado()) {
    throw new Error('WhatsApp no está vinculado todavía.')
  }
  const jid = `${telefonoE164.replace('+', '')}@s.whatsapp.net`
  await socket.sendMessage(jid, { text: texto })
}

function guardarMensaje({ direccion, tipo = 'texto', citaId = null, telefono, mensaje, estadoMsg = 'respondida' }) {
  db.prepare(
    `INSERT INTO whatsapp_mensajes (direccion, tipo, cita_id, telefono, mensaje, estado)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(direccion, tipo, citaId, telefono, mensaje, estadoMsg)
}

async function responderConfirmacion(cita, texto) {
  const respuesta = interpretarRespuesta(texto)
  if (!respuesta) {
    await enviarTexto(cita.telefono_envio, 'No entendí tu respuesta. Envía "SI" para confirmar tu cita o "NO" para cancelarla.')
    return
  }

  const ahora = new Date().toLocaleString('es-MX', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  if (respuesta === 'si') {
    db.prepare("UPDATE citas SET estado = 'confirmada' WHERE id = ?").run(cita.id)
    await enviarTexto(
      cita.telefono_envio,
      `¡Perfecto, ${cita.cliente}! ✅ Tu cita de ${cita.servicio} queda confirmada para el ${cita.fecha} a las ${cita.hora}. ¡Te esperamos!`
    )
  } else {
    db.prepare("UPDATE citas SET estado = 'cancelada' WHERE id = ?").run(cita.id)
    await enviarTexto(
      cita.telefono_envio,
      `Entendido, ${cita.cliente}. 😊 Cancelamos tu cita de ${cita.servicio} del ${cita.fecha} a las ${cita.hora}.\n\nSi gustas, puedes reagendar cuando quieras desde nuestra plataforma o escribiéndonos directamente. (${ahora})`
    )
  }

  guardarMensaje({
    direccion: 'recibido',
    tipo: 'confirmacion',
    citaId: cita.id,
    telefono: cita.telefono_envio,
    mensaje: texto,
  })
  db.prepare(
    "UPDATE whatsapp_mensajes SET estado = 'respondida' WHERE id = ?"
  ).run(cita.mensaje_id)

  db.prepare(
    "DELETE FROM whatsapp_mensajes WHERE tipo = 'confirmacion' AND estado = 'pendiente' AND telefono = ? AND cita_id != ?"
  ).run(cita.telefono_envio, cita.id)
}

const citasPendientes = db.prepare(`
  SELECT c.*, wm.id AS mensaje_id, cl.telefono AS ficha_telefono,
         COALESCE(NULLIF(c.telefono, ''), cl.telefono) AS telefono_envio
  FROM whatsapp_mensajes wm
  JOIN citas c ON c.id = wm.cita_id
  LEFT JOIN clientes cl ON cl.id = c.cliente_id
  WHERE wm.tipo = 'confirmacion' AND wm.estado = 'pendiente'
  ORDER BY wm.id DESC
`)

async function manejarMensajeEntrante(mensaje) {
  const key = mensaje.key
  if (!key || key.fromMe) return

  const jidNumeros = normalizarJid(key.remoteJid)
  if (!jidNumeros) return

  const texto =
    mensaje.message?.conversation ??
    mensaje.message?.extendedTextMessage?.text ??
    mensaje.message?.imageMessage?.caption ??
    null
  if (!texto || !texto.trim()) return

  const candidatas = citasPendientes.all().filter((c) => telefonoCoincide(c.telefono_envio, jidNumeros))
  if (candidatas.length === 0) return
  const pendiente = candidatas[0]

  if (!estaConectado()) return
  await responderConfirmacion(pendiente, texto.trim())
}

async function reiniciarSocket() {
  if (reiniciando) return
  reiniciando = true
  try {
    if (socket) {
      socket.end(undefined)
      socket = null
    }
    estado.estado = 'conectando'
    estado.qr = null

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    socket = makeWASocket({
      auth: { creds: state.creds, keys: state.keys },
      printQRInTerminal: false,
      browser: Browsers.ubuntu('SSSALON'),
      syncFullHistory: false,
    })

    socket.ev.on('creds.update', saveCreds)

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update
      if (qr) {
        estado.estado = 'qr'
        estado.qr = qr
      }

      if (connection === 'open') {
        estado.estado = 'conectado'
        estado.qr = null
        estado.telefono = socket.user?.id?.split(':')[0] ?? null
        estado.nombre = socket.authState?.creds?.me?.name ?? null
        estado.ultimaConexion = new Date().toISOString()
        console.log('[whatsapp] Conectado:', estado.telefono)
      }

      if (connection === 'close') {
        const codigo = lastDisconnect?.error?.output?.statusCode
        const cerrado = codigo === DisconnectReason.loggedOut
        socket = null
        if (cerrado) {
          estado.qr = null
          estado.telefono = null
          estado.nombre = null
          fs.rmSync(sessionDir, { recursive: true, force: true })
          void reiniciarSocket()
        } else {
          setTimeout(() => void reiniciarSocket(), 2500)
        }
      }
    })

    socket.ev.on('messages.upsert', ({ messages }) => {
      for (const mensaje of messages) {
        void manejarMensajeEntrante(mensaje)
      }
    })
  } catch (e) {
    console.error('[whatsapp] Error al iniciar:', e.message)
    estado.estado = 'apagado'
  } finally {
    reiniciando = false
  }
}

export function iniciarWhatsApp() {
  void reiniciarSocket()
}

/** Borra la sesión y vuelve a mostrar el QR de vinculación. */
export async function desvincularWhatsApp() {
  fs.rmSync(sessionDir, { recursive: true, force: true })
  estado.estado = 'apagado'
  estado.qr = null
  estado.telefono = null
  estado.nombre = null
  await reiniciarSocket()
}

/** Convierte el QR actual (string de Baileys) a una imagen base64 para mostrar en el frontend. */
export async function qrComoImagen() {
  if (!estado.qr) return null
  return QRCode.toDataURL(estado.qr, { width: 260, margin: 1 })
}