import { useEffect, useState } from 'react'
import Button from '../components/Button'
import { Modal, useModal } from '../lib/modal'
import { useToast } from '../lib/toast'

async function pedir(url, opciones) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.errores?.[0] ?? 'Ocurrió un error inesperado.')
  return data
}

const hoyISO = () => new Date().toISOString().slice(0, 10)

const ESTILOS_ESTADO = {
  pendiente: 'bg-warning-soft text-warning',
  confirmada: 'bg-success-soft text-success',
  completada: 'bg-zinc-100 text-zinc-500',
  cancelada: 'bg-danger-soft text-danger',
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
      .then((data) => setSlots(data.slots))
      .catch((e) => toast.error(e.message))
      .finally(() => setCargandoSlots(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, fecha, servicioId])

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
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Nueva cita" ancho="max-w-lg">
      <form onSubmit={guardar} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Cliente</label>
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            required
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
            placeholder="Nombre del cliente"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Fecha</label>
            <input
              type="date"
              value={fecha}
              min={hoyISO()}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Servicio</label>
            <select
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · {s.duracion_min} min
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Horario disponible</label>
          {cargandoSlots ? (
            <p className="mt-2 text-sm text-zinc-400">Calculando disponibilidad…</p>
          ) : (
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.hora}
                  disabled={!s.disponible}
                  onClick={() => setHoraElegida(s.hora)}
                  className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                    !s.disponible
                      ? 'cursor-not-allowed bg-zinc-100 text-zinc-300 line-through'
                      : horaElegida === s.hora
                        ? 'bg-ink text-white'
                        : 'border border-zinc-300 text-zinc-600 hover:border-ink hover:text-ink'
                  }`}
                >
                  {s.hora}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variante="fantasma" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variante="dorada" disabled={guardando || !horaElegida}>
            {guardando ? 'Agendando…' : 'Agendar cita'}
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
      setCitas(data.citas)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    pedir('/api/citas/servicios').then((d) => setServicios(d.servicios)).catch((e) => toast.error(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    cargarCitas(fecha)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha])

  const cambiarEstado = async (cita, estado) => {
    if (estado === 'cancelada') {
      const ok = await confirmar({
        titulo: 'Cancelar cita',
        mensaje: `¿Cancelar la cita de "${cita.cliente}" a las ${cita.hora}?`,
        textoConfirmar: 'Cancelar cita',
        peligro: true,
      })
      if (!ok) return
    }
    try {
      await pedir(`/api/citas/${cita.id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })
      toast.exito(`Cita de "${cita.cliente}" actualizada a "${estado}".`)
      cargarCitas()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <Button variante="dorada" onClick={() => setModalAbierto(true)} disabled={servicios.length === 0}>
          + Nueva cita
        </Button>
      </div>

      {cargando ? (
        <p className="py-12 text-center text-sm text-zinc-400">Cargando agenda…</p>
      ) : citas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-paper py-16 text-center">
          <p className="text-sm text-zinc-500">No hay citas agendadas para este día.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {citas.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-paper p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 text-center">
                  <p className="font-display text-lg font-bold text-ink">{c.hora}</p>
                  <p className="text-[11px] text-zinc-400">{c.servicio_duracion ?? 30} min</p>
                </div>
                <div>
                  <p className="font-semibold text-ink">{c.cliente}</p>
                  <p className="text-sm text-zinc-500">{c.servicio}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${ESTILOS_ESTADO[c.estado]}`}>
                  {c.estado}
                </span>
                {c.estado === 'pendiente' && (
                  <button onClick={() => cambiarEstado(c, 'confirmada')} className="text-xs font-semibold text-success hover:text-success/70">
                    Confirmar
                  </button>
                )}
                {c.estado === 'confirmada' && (
                  <button onClick={() => cambiarEstado(c, 'completada')} className="text-xs font-semibold text-zinc-500 hover:text-ink">
                    Completar
                  </button>
                )}
                {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                  <button onClick={() => cambiarEstado(c, 'cancelada')} className="text-xs font-semibold text-danger hover:text-danger/70">
                    Cancelar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

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
