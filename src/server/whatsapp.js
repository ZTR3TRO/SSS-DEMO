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
  listo: false, // true unos segundos después de 'open', cuando la sesión ya sincronizó
}

const ESPERA_CALENTAMIENTO_MS = 3000

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
  return !!socket && estado.estado === 'conectado' && estado.listo
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
  if (jid.endsWith('@g.us')) return null // chat grupal, no aplica a confirmaciones
  const base = jid.split('@')[0]?.replace(/\D/g, '') ?? ''
  return base || null
}

function telefonoCoincide(guardado, jidNumeros) {
  if (!jidNumeros) return false
  if (!guardado || guardado === 'undefined' || guardado === 'null') return false
  const guardadoDigitos = String(guardado).replace(/\D/g, '')
  if (!guardadoDigitos) return false
  return jidNumeros.endsWith(guardadoDigitos.slice(-10))
}

/**
 * Resuelve el JID real de WhatsApp para un teléfono E.164 mexicano.
 * Los números MX antiguos requieren un "1" extra después del "52"
 * (521XXXXXXXXXX) para entregarse; los más nuevos no lo usan (52XXXXXXXXXX).
 * Probamos ambos candidatos con socket.onWhatsApp() y usamos el que sí existe,
 * en vez de asumir uno y enviar "a ciegas" (Baileys no avisa si el JID no existe).
 */
async function resolverJid(telefonoE164) {
  const digitos = telefonoE164.replace('+', '')
  const candidatos = [digitos]
  if (digitos.startsWith('52') && !digitos.startsWith('521')) {
    candidatos.push(`521${digitos.slice(2)}`)
  }

  try {
    const resultados = await socket.onWhatsApp(...candidatos)
    const encontrado = resultados?.find((r) => r.exists)
    if (encontrado) return encontrado.jid
  } catch (e) {
    console.warn('[whatsapp] onWhatsApp falló, se usará el JID por defecto:', e.message)
  }

  // Si no pudimos verificar (o ninguno "existe" según WhatsApp), intentamos con el formato base.
  return `${digitos}@s.whatsapp.net`
}

export async function enviarTexto(telefonoE164, texto) {
  if (!estaConectado()) {
    throw new Error('WhatsApp no está vinculado todavía.')
  }
  const jid = await resolverJid(telefonoE164)
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

function esJidPn(jid) {
  return !!jid && (jid.endsWith('@s.whatsapp.net') || jid.endsWith('.whatsapp.net'))
}

function esJidLid(jid) {
  return !!jid && jid.endsWith('@lid')
}

/** Traduce un LID (…@lid) al JID de teléfono real usando el mapping que Baileys mantiene. */
async function resolverLidANumero(lidJid) {
  try {
    const pn = await socket?.signalRepository?.lidMapping?.getPNForLID?.(lidJid)
    if (pn && esJidPn(pn)) return pn
  } catch (e) {
    console.warn('[whatsapp] Fallo al resolver LID→número:', e.message)
  }
  return null
}

async function manejarMensajeEntrante(mensaje) {
  const key = mensaje.key
  if (!key || key.fromMe) return

  // WhatsApp migró los chats 1:1 a direccionamiento por LID: el remitente puede llegar
  // como "…@lid" en vez del número real. Baileys expone el JID "alterno" (el opuesto)
  // en `key.remoteJidAlt`/`key.participantAlt` — preferimos el que sea el número real.
  const remitenteJid = key.participant || key.remoteJid
  const altJid = key.participantAlt || key.remoteJidAlt
  if (remitenteJid?.endsWith('@g.us')) return // chat grupal, no aplica a confirmaciones

  let jidParaNumero = null
  if (esJidPn(altJid)) jidParaNumero = altJid
  else if (esJidPn(remitenteJid)) jidParaNumero = remitenteJid
  else if (esJidLid(remitenteJid)) jidParaNumero = await resolverLidANumero(remitenteJid)

  const jidNumeros = normalizarJid(jidParaNumero)
  if (!jidNumeros) {
    console.warn('[whatsapp] No se pudo identificar el número del remitente:', {
      remoteJid: key.remoteJid,
      remoteJidAlt: key.remoteJidAlt,
      participant: key.participant,
      participantAlt: key.participantAlt,
    })
    return
  }

  const texto =
    mensaje.message?.conversation ??
    mensaje.message?.extendedTextMessage?.text ??
    mensaje.message?.imageMessage?.caption ??
    null
  if (!texto || !texto.trim()) return

  const candidatas = citasPendientes.all().filter((c) => telefonoCoincide(c.telefono_envio, jidNumeros))
  if (candidatas.length === 0) {
    console.log(`[whatsapp] Mensaje de ${jidNumeros} no coincide con ninguna confirmación pendiente. Se ignora.`)
    return
  }
  const pendiente = candidatas[0]

  if (!estaConectado()) {
    console.warn(
      `[whatsapp] Mensaje entrante de ${jidNumeros} para la cita #${pendiente.id} se ignoró: el socket no está listo (estado: ${estado.estado}, listo: ${estado.listo}).`
    )
    return
  }

  console.log(`[whatsapp] Procesando respuesta de ${jidNumeros} para la cita #${pendiente.id}: "${texto.trim()}"`)
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
      // IMPORTANTE: sin este callback, Baileys deshabilita TODA sincronización
      // (no solo el historial completo) cuando syncFullHistory es false, lo cual
      // impide que reciba el mapeo LID↔teléfono. Sin ese mapeo, las cuentas
      // mexicanas (que WhatsApp ya migró a direccionamiento por LID) no pueden
      // resolver ni descifrar mensajes entrantes de forma confiable después del
      // primer intercambio — causa raíz confirmada de "responde el primero, nunca
      // los siguientes". No necesitamos historial de chats, pero sí este sync base.
      shouldSyncHistoryMessage: () => true,
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
        estado.listo = false
        estado.telefono = socket.user?.id?.split(':')[0] ?? null
        estado.nombre = socket.authState?.creds?.me?.name ?? null
        estado.ultimaConexion = new Date().toISOString()
        console.log('[whatsapp] Conectado:', estado.telefono, '— calentando sesión…')

        // Pequeño margen antes de permitir envíos: justo tras 'open' la sesión de cifrado
        // todavía está sincronizando, y mandar de inmediato es una causa común de mensajes
        // lentos o atorados en "esperando este mensaje".
        const socketAlAbrir = socket
        setTimeout(() => {
          if (socket !== socketAlAbrir) return // hubo una reconexión en medio, ignorar
          estado.listo = true
          socket?.sendPresenceUpdate('available').catch(() => {})
          console.log('[whatsapp] Sesión lista para enviar.')
        }, ESPERA_CALENTAMIENTO_MS)
      }

      if (connection === 'close') {
        const codigo = lastDisconnect?.error?.output?.statusCode
        const cerrado = codigo === DisconnectReason.loggedOut
        console.warn('[whatsapp] Conexión cerrada. Código:', codigo, '— cerrando sesión definitivamente:', cerrado)
        socket = null
        estado.listo = false
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