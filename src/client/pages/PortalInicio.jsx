import { useEffect, useState } from 'react'
import Button from '../components/Button'
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
  pendiente: 'bg-warning/20 text-warning',
  confirmada: 'bg-success/25 text-success',
  cancelada: 'bg-danger/20 text-danger',
  completada: 'bg-white/10 text-white/50',
}

const ESTADOS_ACTIVOS = ['pendiente', 'confirmada']

export default function PortalInicio({ onNavegar }) {
  const [clientes, setClientes] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [modo, setModo] = useState('elegir') // elegir | agendar | verCitas
  const [servicios, setServicios] = useState([])
  const toast = useToast()

  const cargarClientes = async () => {
    try {
      const data = await pedir('/api/usuarios/clientes')
      setClientes(data.clientes)
    } catch (e) {
      toast.error(e.message)
    }
  }

  useEffect(() => {
    cargarClientes()
    pedir('/api/citas/servicios')
      .then((d) => setServicios(d.servicios))
      .catch((e) => toast.error(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const elegirCliente = (c) => {
    sessionStorage.setItem('sssalon_cliente', c.id)
    setClienteSeleccionado(c)
    setModo('verCitas')
  }

  const salir = () => {
    sessionStorage.removeItem('sssalon_cliente')
    setClienteSeleccionado(null)
    setModo('elegir')
  }

  return (
    <div className="flex min-h-svh flex-col bg-noche text-white">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <img src="/icono.png" alt="" className="h-8 w-8" />
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em]">SSSALÓN</p>
            <p className="text-[10px] uppercase tracking-widest text-white/40">by Sophia Solís</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {clienteSeleccionado && (
            <span className="text-sm text-white/60">
              Hola, <span className="font-semibold text-white">{clienteSeleccionado.nombre}</span>
            </span>
          )}
          <button
            onClick={() => onNavegar('admin/inicio')}
            className="text-sm font-medium text-white/50 transition-colors hover:text-white"
          >
            Panel interno ↗
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-10">
        {modo === 'elegir' && !clienteSeleccionado && (
          <ElegirCliente clientes={clientes} onElegir={elegirCliente} onNuevoCliente={async (nombre) => {
            const data = await pedir('/api/usuarios/clientes', {
              method: 'POST',
              body: JSON.stringify({ nombre, telefono: null, notas: null }),
            })
            toast.exito(`"${data.cliente.nombre}" quedó registrado como cliente frecuente.`)
            await cargarClientes()
            elegirCliente(data.cliente)
          }} />
        )}

        {modo !== 'elegir' && clienteSeleccionado && (
          <div className="space-y-6">
            <nav className="flex flex-wrap gap-2">
              <button
                onClick={() => setModo('verCitas')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  modo === 'verCitas' ? 'bg-accent text-ink' : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                Mis citas
              </button>
              <button
                onClick={() => setModo('agendar')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  modo === 'agendar' ? 'bg-accent text-ink' : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                Nueva cita
              </button>
              <button
                onClick={salir}
                className="ml-auto rounded-full px-4 py-1.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              >
                Cambiar de cliente
              </button>
            </nav>

            {modo === 'verCitas' && (
              <MisCitas clienteId={clienteSeleccionado.id} onAgendar={() => setModo('agendar')} />
            )}
            {modo === 'agendar' && (
              <AgendarCita
                cliente={clienteSeleccionado}
                servicios={servicios}
                onHecho={() => setModo('verCitas')}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function ElegirCliente({ clientes, onElegir, onNuevoCliente }) {
  const [nuevoNombre, setNuevoNombre] = useState('')
  const toast = useToast()

  const crear = async (e) => {
    e.preventDefault()
    if (!nuevoNombre.trim()) {
      toast.error('Escribe tu nombre para continuar.')
      return
    }
    try {
      await onNuevoCliente(nuevoNombre.trim())
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Agenda tu próxima cita</h1>
        <p className="mt-2 text-sm text-white/60">
          Consulta la disponibilidad real y gestiona tus citas en SSSALÓN. Para esta demo, elige o crea tu
          perfil de cliente.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Tus visitas recientes</p>
        {clientes.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">Todavía no hay perfiles. Crea el tuyo abajo.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {clientes.map((c) => (
              <button
                key={c.id}
                onClick={() => onElegir(c)}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-accent hover:bg-white/10"
              >
                <span className="font-semibold">{c.nombre}</span>
                <span className="text-xs text-white/40">{c.visitas || 0} visitas</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={crear} className="space-y-3 border-t border-white/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">¿Eres nuevo?</p>
        <div className="flex gap-2">
          <input
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Escribe tu nombre"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
          />
          <Button type="submit" variante="dorada">
            Crear perfil
          </Button>
        </div>
      </form>
    </div>
  )
}

function MisCitas({ clienteId, onAgendar }) {
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const toast = useToast()

  const cargar = async () => {
    setCargando(true)
    try {
      const data = await pedir(`/api/citas/mis-citas?cliente_id=${clienteId}`)
      setCitas(data.citas)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

  const cancelar = async (cita) => {
    try {
      await pedir(`/api/citas/${cita.id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado: 'cancelada' }) })
      toast.exito(`Cita del ${fechaCorta(cita.fecha)} a las ${cita.hora} cancelada.`)
      cargar()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (cargando) {
    return <p className="py-12 text-center text-sm text-white/40">Cargando tus citas…</p>
  }

  if (citas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 py-16 text-center">
        <p className="text-sm text-white/50">Todavía no tienes citas agendadas.</p>
        <Button variante="dorada" className="mt-4" onClick={onAgendar}>
          Agendar mi primera cita
        </Button>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {citas.map((c) => (
        <li
          key={c.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-24 text-center">
              <p className="font-display text-lg font-bold">{fechaCorta(c.fecha)}</p>
              <p className="text-[11px] text-white/40">{c.hora}</p>
            </div>
            <div>
              <p className="font-semibold">{c.servicio}</p>
              <p className="text-sm text-white/50">${Number(c.servicio_precio ?? 0).toLocaleString('es-MX')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${ESTILOS_ESTADO[c.estado]}`}>
              {c.estado}
            </span>
            {ESTADOS_ACTIVOS.includes(c.estado) && (
              <button onClick={() => cancelar(c)} className="text-xs font-semibold text-white/60 hover:text-white">
                Cancelar
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function AgendarCita({ cliente, servicios, onHecho }) {
  const [fecha, setFecha] = useState(hoyISO())
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? '')
  const [cargando, setCargando] = useState(false)
  const [slots, setSlots] = useState([])
  const [horaElegida, setHoraElegida] = useState('')
  const [guardando, setGuardando] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!fecha || !servicioId) return
    setCargando(true)
    setHoraElegida('')
    pedir(`/api/citas/disponibilidad?fecha=${fecha}&servicio_id=${servicioId}`)
      .then((d) => setSlots(d.slots))
      .catch((e) => toast.error(e.message))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, servicioId])

  const agendar = async (e) => {
    e.preventDefault()
    if (!horaElegida) {
      toast.error('Elige un horario disponible.')
      return
    }
    setGuardando(true)
    try {
      await pedir('/api/citas', {
        method: 'POST',
        body: JSON.stringify({ cliente_id: cliente.id, servicio_id: Number(servicioId), fecha, hora: horaElegida }),
      })
      toast.exito(`Cita agendada para el ${fechaCorta(fecha)} a las ${horaElegida}.`)
      onHecho()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={agendar} className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="font-display text-xl font-bold">Nueva cita</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-white/40">Fecha</label>
          <input
            type="date"
            value={fecha}
            min={hoyISO()}
            onChange={(e) => setFecha(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-accent focus:outline-none [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-white/40">Servicio</label>
          <select
            value={servicioId}
            onChange={(e) => setServicioId(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-accent focus:outline-none"
          >
            {servicios.map((s) => (
              <option key={s.id} value={s.id} className="text-ink">
                {s.nombre} · {s.duracion_min} min · ${s.precio}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-white/40">Horario disponible</label>
        {cargando ? (
          <p className="mt-2 text-sm text-white/40">Calculando disponibilidad…</p>
        ) : (
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((s) => (
              <button
                type="button"
                key={s.hora}
                disabled={!s.disponible}
                onClick={() => setHoraElegida(s.hora)}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                  !s.disponible
                    ? 'cursor-not-allowed bg-white/5 text-white/20 line-through'
                    : horaElegida === s.hora
                      ? 'bg-accent text-ink'
                      : 'border border-white/15 text-white/70 hover:border-accent hover:text-white'
                }`}
              >
                {s.hora}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variante="fantasma" className="!text-white/60" onClick={onHecho}>
          Cancelar
        </Button>
        <Button type="submit" variante="dorada" disabled={guardando || !horaElegida}>
          {guardando ? 'Agendando…' : 'Agendar cita'}
        </Button>
      </div>
    </form>
  )
}

function fechaCorta(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}