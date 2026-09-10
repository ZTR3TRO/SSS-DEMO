import { useCallback, useEffect, useState } from 'react'
import Button from '../components/Button'
import { useModal } from '../lib/modal'
import { useToast } from '../lib/toast'
import { pedir } from '../lib/api'

const ETIQUETAS_ESTADO = {
  apagado: { texto: 'No iniciado', clases: 'bg-canvas text-ink-muted border-border' },
  qr: { texto: 'Esperando escaneo', clases: 'bg-warning-soft text-warning border-warning/25' },
  conectando: { texto: 'Conectando…', clases: 'bg-warning-soft text-warning border-warning/25' },
  conectado: { texto: 'Conectado', clases: 'bg-success-soft text-success border-success/25' },
}

export default function PaginaWhatsApp() {
  const [estado, setEstado] = useState({ estado: 'apagado', qr: null, telefono: null, nombre: null, conectado: false })
  const [mensajes, setMensajes] = useState([])
  const [cargandoMensajes, setCargandoMensajes] = useState(false)
  const [telefonoPrueba, setTelefonoPrueba] = useState('')
  const [enviandoPrueba, setEnviandoPrueba] = useState(false)
  const toast = useToast()
  const { confirmar } = useModal()

  const cargarEstado = useCallback(async () => {
    try {
      const data = await pedir('/api/whatsapp/estado')
      setEstado(data)
    } catch (e) {
      toast.error(e.message)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarMensajes = useCallback(async () => {
    setCargandoMensajes(true)
    try {
      const data = await pedir('/api/whatsapp/mensajes')
      setMensajes(data.mensajes || [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCargandoMensajes(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    cargarEstado()
    cargarMensajes()
    const intervalo = setInterval(cargarEstado, 3000)
    return () => clearInterval(intervalo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enviarPrueba = async (e) => {
    e.preventDefault()
    if (!telefonoPrueba.trim()) {
      toast.error('Escribe un teléfono.')
      return
    }
    setEnviandoPrueba(true)
    try {
      const data = await pedir('/api/whatsapp/prueba', {
        method: 'POST',
        body: JSON.stringify({ telefono: telefonoPrueba }),
      })
      toast.exito(`Mensaje enviado a ${data.telefono}.`)
      setTelefonoPrueba('')
      cargarMensajes()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEnviandoPrueba(false)
    }
  }

  const desvincular = async () => {
    const ok = await confirmar({
      titulo: 'Desvincular WhatsApp',
      mensaje: 'Se cerrará la sesión actual y aparecerá un nuevo código QR para vincular de nuevo. ¿Continuar?',
      textoConfirmar: 'Sí, desvincular',
      peligro: true,
    })
    if (!ok) return
    try {
      await pedir('/api/whatsapp/vincular', { method: 'POST' })
      toast.exito('Sesión reiniciada. Escanea el nuevo código QR.')
      cargarEstado()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const infoPill = ETIQUETAS_ESTADO[estado.estado] ?? ETIQUETAS_ESTADO.apagado

  return (
    <div className="space-y-6">
      {/* Tarjeta de conexión */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xs">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${
                estado.conectado ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
              }`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 00-7.79 13.55L3 21l4.55-1.19A9 9 0 1012 3zm3.5 10.5c-.5.25-.9.4-1.25.4-.3 0-.7-.1-1.2-.4a6.9 6.9 0 01-1.35-1.1 5.6 5.6 0 01-1.3-4.3c.05-.7.55-1.3 1.25-1.45.2-.05.4 0 .55.15.1.15.4.9.5 1.1.05.15.1.35-.05.6l-.25.4c-.1.1-.15.2-.05.35.3.5.7 1 1.2 1.4.15.15.4.3.6.4.15.1.3.05.4-.05.15-.15.35-.4.55-.55.15-.15.3-.1.5-.05.15.05.95.45 1.1.55.2.1.25.2.25.3-.05.15-.2.35-.45.45z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-ink">Conexión a WhatsApp</h3>
              {estado.conectado && estado.telefono ? (
                <p className="text-xs text-ink-muted mt-0.5">
                  Vinculado como <span className="font-semibold text-ink">+{estado.telefono}</span>
                </p>
              ) : (
                <p className="text-xs text-ink-muted mt-0.5">
                  Vincula la cuenta de WhatsApp del negocio para confirmar citas automáticamente.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${infoPill.clases}`}
            >
              {infoPill.texto}
            </span>
            {estado.conectado && (
              <Button variante="peligro" tamano="sm" onClick={desvincular}>
                Desvincular
              </Button>
            )}
          </div>
        </div>

        {/* QR o estado de conexión */}
        <div className="border-t border-border bg-canvas/60 px-6 py-6">
          {estado.estado === 'qr' && estado.qr ? (
            <div className="flex flex-col items-start gap-5 sm:flex-row">
              <img
                src={estado.qr}
                alt="Código QR de vinculación de WhatsApp"
                className="rounded-xl border border-border bg-white p-2"
                style={{ width: 220, height: 220 }}
              />
              <div className="max-w-sm">
                <p className="font-semibold text-sm text-ink">Escanea con tu WhatsApp</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-ink-muted">
                  <li>Abre WhatsApp en el teléfono del negocio.</li>
                  <li>Ve a <span className="text-ink">Ajustes → Dispositivos vinculados</span>.</li>
                  <li>Toca <span className="text-ink">Vincular un dispositivo</span> y escanea este código.</li>
                </ol>
                <p className="mt-3 text-[11px] text-ink-faint">
                  El código se actualiza automáticamente hasta que la sesión quede vinculada.
                </p>
              </div>
            </div>
          ) : estado.estado === 'conectado' ? (
            <div>
              <p className="text-sm font-medium text-success">
                WhatsApp conectado y escuchando respuestas de los clientes.
              </p>
              <p className="mt-1 max-w-lg text-xs text-ink-muted">
                Desde <span className="font-semibold text-ink">Agenda</span> podrás enviar la confirmación de cada cita
                pendiente. Si el cliente responde <span className="font-semibold text-ink">SI</span> la cita queda
                confirmada; si responde <span className="font-semibold text-ink">NO</span> se cancela y le avisamos que
                puede reagendar.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-ink-muted">Preparando la sesión…</p>
            </div>
          )}
        </div>
      </div>

      {/* Mensaje de prueba */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs">
        <h3 className="font-semibold text-sm text-ink">Enviar mensaje de prueba</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          Verifica que los mensajes están llegando a un teléfono mexicano (ej. 667 100 2001).
        </p>
        <form onSubmit={enviarPrueba} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
          <input
            value={telefonoPrueba}
            onChange={(e) => setTelefonoPrueba(e.target.value)}
            placeholder="667 100 2001"
            className="w-full max-w-xs rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
          <Button type="submit" variante="primaria" tamano="sm" cargando={enviandoPrueba} disabled={!estado.conectado}>
            Enviar prueba
          </Button>
        </form>
        {!estado.conectado && (
          <p className="mt-2 text-[11px] text-warning">Vincula WhatsApp para poder enviar mensajes.</p>
        )}
      </div>

      {/* Bitácora de mensajes */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xs">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-semibold text-sm text-ink">Bitácora de mensajes</h3>
          <p className="mt-0.5 text-xs text-ink-muted">Confirmaciones enviadas y respuestas recibidas.</p>
        </div>
        {cargandoMensajes ? (
          <p className="px-6 py-10 text-center text-xs text-ink-faint">Consultando mensajes…</p>
        ) : mensajes.length === 0 ? (
          <p className="px-6 py-10 text-center text-xs text-ink-muted">Todavía no hay mensajes registrados.</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {mensajes.map((m) => (
              <div key={m.id} className="flex flex-col gap-2 px-6 py-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex shrink-0 items-center gap-2 sm:w-56 sm:shrink-0">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      m.direccion === 'enviado'
                        ? 'bg-success-soft text-success border-success/25'
                        : 'bg-warning-soft text-warning border-warning/25'
                    }`}
                  >
                    {m.direccion === 'enviado' ? 'Enviado' : 'Recibido'}
                  </span>
                  <span className="text-xs text-ink-muted">{m.telefono}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink leading-relaxed">{m.mensaje}</p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    {m.creado_en} {m.cita_id ? `· Cita #${m.cita_id}` : ''}{' '}
                    {m.tipo === 'confirmacion' ? `· Confirmación ${m.estado === 'pendiente' ? 'pendiente' : 'respondida'}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}