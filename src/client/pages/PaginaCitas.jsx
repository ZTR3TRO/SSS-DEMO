import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import { Modal, useModal } from '../lib/modal'
import { useToast } from '../lib/toast'
import { pedir } from '../lib/api'

const hoyISO = () => new Date().toISOString().slice(0, 10)

const ESTILOS_ESTADO = {
  pendiente: 'bg-warning-soft text-warning border-warning/25',
  confirmada: 'bg-success-soft text-success border-success/25',
  completada: 'bg-canvas text-ink-muted border-border',
  cancelada: 'bg-danger-soft text-danger border-danger/25',
}

function ModalNuevaCita({ abierto, onCerrar, fechaInicial, servicios, onCreada }) {
  const [fecha, setFecha] = useState(fechaInicial)
  const [servicioId, setServicioId] = useState('')
  const [slots, setSlots] = useState([])
  const [horaElegida, setHoraElegida] = useState('')
  const [cliente, setCliente] = useState('')
  const [cargandoSlots, setCargandoSlots] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (abierto) {
      setFecha(fechaInicial)
      setServicioId(servicios[0]?.id ?? '')
      setHoraElegida('')
      setCliente('')
    }
  }, [abierto, fechaInicial, servicios])

  useEffect(() => {
    if (!abierto || !fecha || !servicioId) return
    setCargandoSlots(true)
    setHoraElegida('')
    pedir(`/api/citas/disponibilidad?fecha=${fecha}&servicio_id=${servicioId}`)
      .then((data) => setSlots(data.slots || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setCargandoSlots(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, fecha, servicioId])

  const { slotsManana, slotsTarde } = useMemo(() => {
    const manana = []
    const tarde = []
    slots.forEach((s) => {
      const horaNum = parseInt(s.hora.split(':')[0], 10)
      if (horaNum < 13) manana.push(s)
      else tarde.push(s)
    })
    return { slotsManana: manana, slotsTarde: tarde }
  }, [slots])

  const guardar = async (e) => {
    e.preventDefault()
    if (!horaElegida) {
      toast.error('Elige un horario disponible.')
      return
    }
    setGuardando(true)
    try {
      const data = await pedir('/api/citas', {
        method: 'POST',
        body: JSON.stringify({ cliente, servicio_id: Number(servicioId), fecha, hora: horaElegida }),
      })
      toast.exito(`Cita de "${cliente}" agendada a las ${horaElegida}.`)
      onCreada(data.cita)
      onCerrar()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Agendar nueva cita" ancho="max-w-lg">
      <form onSubmit={guardar} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Nombre del cliente</label>
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            required
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
            placeholder="Ej. Renata Cabrera"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Fecha</label>
            <input
              type="date"
              value={fecha}
              min={hoyISO()}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Servicio</label>
            <select
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.duracion_min} min)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Horarios del día</label>
          {cargandoSlots ? (
            <p className="py-6 text-center text-xs text-ink-faint">Consultando agenda disponible…</p>
          ) : (
            <div className="mt-2 space-y-3">
              {slotsManana.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Mañana</span>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                    {slotsManana.map((s) => (
                      <button
                        type="button"
                        key={s.hora}
                        disabled={!s.disponible}
                        onClick={() => setHoraElegida(s.hora)}
                        className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                          !s.disponible
                            ? 'cursor-not-allowed bg-canvas text-ink-faint/40'
                            : horaElegida === s.hora
                              ? 'bg-ink text-white shadow-2xs font-semibold'
                              : 'border border-border bg-surface text-ink hover:border-ink-faint'
                        }`}
                      >
                        {s.hora}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {slotsTarde.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Tarde</span>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                    {slotsTarde.map((s) => (
                      <button
                        type="button"
                        key={s.hora}
                        disabled={!s.disponible}
                        onClick={() => setHoraElegida(s.hora)}
                        className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                          !s.disponible
                            ? 'cursor-not-allowed bg-canvas text-ink-faint/40'
                            : horaElegida === s.hora
                              ? 'bg-ink text-white shadow-2xs font-semibold'
                              : 'border border-border bg-surface text-ink hover:border-ink-faint'
                        }`}
                      >
                        {s.hora}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-border pt-4">
          <Button type="button" variante="fantasma" tamano="sm" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variante="primaria" tamano="sm" disabled={guardando || !horaElegida}>
            {guardando ? 'Agendando…' : 'Confirmar reserva'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function PaginaCitas() {
  const [fecha, setFecha] = useState(hoyISO())
  const [citas, setCitas] = useState([])
  const [servicios, setServicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)

  const toast = useToast()
  const { confirmar } = useModal()

  const cargarCitas = async (f = fecha) => {
    setCargando(true)
    try {
      const data = await pedir(`/api/citas?fecha=${f}`)
      setCitas(data.citas || [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    pedir('/api/citas/servicios')
      .then((d) => setServicios(d.servicios || []))
      .catch((e) => toast.error(e.message))
  }, [])

  useEffect(() => {
    cargarCitas(fecha)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha])

  const cambiarDia = (offset) => {
    const d = new Date(`${fecha}T12:00:00`)
    d.setDate(d.getDate() + offset)
    setFecha(d.toISOString().slice(0, 10))
  }

  const cambiarEstado = async (cita, estado) => {
    if (estado === 'cancelada') {
      const ok = await confirmar({
        titulo: 'Cancelar cita programada',
        mensaje: `¿Deseas cancelar la cita de ${cita.cliente} fijada a las ${cita.hora}?`,
        textoConfirmar: 'Sí, cancelar cita',
        peligro: true,
      })
      if (!ok) return
    }
    try {
      await pedir(`/api/citas/${cita.id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })
      toast.exito(`Cita de "${cita.cliente}" actualizada a ${estado}.`)
      cargarCitas()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const fechaFormateada = useMemo(() => {
    if (!fecha) return ''
    const [y, m, d] = fecha.split('-')
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
    return dateObj.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [fecha])

  return (
    <div className="space-y-6">
      {/* Barra de navegación de agenda */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-border bg-surface p-1 shadow-2xs">
            <button
              onClick={() => cambiarDia(-1)}
              className="rounded p-1.5 text-ink-muted hover:bg-surface-hover hover:text-ink"
              title="Día anterior"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setFecha(hoyISO())}
              className="px-2.5 py-1 text-xs font-semibold text-ink hover:text-accent transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => cambiarDia(1)}
              className="rounded p-1.5 text-ink-muted hover:bg-surface-hover hover:text-ink"
              title="Día siguiente"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-ink focus:outline-none"
          />

          <span className="hidden text-xs capitalize text-ink-muted md:inline-block">
            {fechaFormateada}
          </span>
        </div>

        <Button variante="primaria" tamano="sm" onClick={() => setModalAbierto(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva cita
        </Button>
      </div>

      {/* Lista de citas en formato cronológico continuo */}
      {cargando ? (
        <div className="rounded-xl border border-border bg-surface py-20 text-center">
          <p className="text-xs text-ink-faint">Consultando citas…</p>
        </div>
      ) : citas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface py-20 text-center">
          <svg className="mx-auto h-8 w-8 text-ink-faint/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-xs text-ink-muted">Sin citas programadas para esta fecha.</p>
          <Button
            variante="secundaria"
            tamano="sm"
            className="mt-3"
            onClick={() => setModalAbierto(true)}
          >
            Agendar primer turno
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xs">
          <div className="divide-y divide-border-subtle">
            {citas.map((c) => (
              <div
                key={c.id}
                className="group flex flex-col gap-4 p-4.5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-surface-hover/50"
              >
                {/* Bloque Hora y Cliente */}
                <div className="flex items-center gap-5">
                  <div className="w-16 shrink-0 border-r border-border pr-3">
                    <p className="font-display text-base font-bold text-ink leading-none">{c.hora}</p>
                    <p className="text-[11px] text-ink-faint mt-1">{c.servicio_duracion ?? 30} min</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-semibold text-sm text-ink leading-tight">{c.cliente}</h4>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          ESTILOS_ESTADO[c.estado] ?? ESTILOS_ESTADO.pendiente
                        }`}
                      >
                        {c.estado}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">{c.servicio}</p>
                  </div>
                </div>

                {/* Acciones estructuradas con microbotones */}
                <div className="flex items-center justify-end gap-1.5 self-end sm:self-center">
                  {c.estado === 'pendiente' && (
                    <button
                      onClick={() => cambiarEstado(c, 'confirmada')}
                      className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-success hover:border-success/30 hover:bg-success-soft transition-colors"
                    >
                      Confirmar
                    </button>
                  )}
                  {c.estado === 'confirmada' && (
                    <button
                      onClick={() => cambiarEstado(c, 'completada')}
                      className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted hover:border-ink hover:text-ink transition-colors"
                    >
                      Completar
                    </button>
                  )}
                  {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                    <button
                      onClick={() => cambiarEstado(c, 'cancelada')}
                      className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-danger hover:border-danger/30 hover:bg-danger-soft transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nueva Cita */}
      <ModalNuevaCita
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        fechaInicial={fecha}
        servicios={servicios}
        onCreada={() => cargarCitas()}
      />
    </div>
  )
}