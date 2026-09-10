import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../lib/toast'
import { pedir } from '../lib/api'

const hoyISO = () => new Date().toISOString().slice(0, 10)

const ESTILOS_ESTADO = {
  pendiente: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  confirmada: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelada: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  completada: 'bg-white/5 text-zinc-400 border-white/10',
}

const ESTADOS_ACTIVOS = ['pendiente', 'confirmada']

function fechaCorta(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
  return dateObj.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function PortalInicio({ onNavegar }) {
  const [cliente, setCliente] = useState(null)
  const [paso, setPaso] = useState('hero') // 'hero' | 'auth' | 'misCitas' | 'agendar'
  const [servicios, setServicios] = useState([])
  const toast = useToast()

  useEffect(() => {
    pedir('/api/citas/servicios')
      .then((d) => setServicios(d.servicios || []))
      .catch((e) => toast.error(e.message))

    const guardado = sessionStorage.getItem('sssalon_cliente_sesion')
    if (guardado) {
      try {
        const parsed = JSON.parse(guardado)
        setCliente(parsed)
      } catch {
        sessionStorage.removeItem('sssalon_cliente_sesion')
      }
    }
  }, [])

  const iniciarSesionCliente = (datosCliente, irDirectoAAgendar = false) => {
    sessionStorage.setItem('sssalon_cliente_sesion', JSON.stringify(datosCliente))
    setCliente(datosCliente)
    setPaso(irDirectoAAgendar ? 'agendar' : 'misCitas')
  }

  const cerrarSesion = () => {
    sessionStorage.removeItem('sssalon_cliente_sesion')
    setCliente(null)
    setPaso('hero')
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-[#0d0c0f] text-zinc-100 selection:bg-accent selection:text-black">
      {/* Resplandor cálido de ambientación */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-accent/10 blur-[150px]" />
        <div className="absolute -bottom-40 right-10 h-[360px] w-[360px] rounded-full bg-accent/5 blur-[130px]" />
      </div>

      {/* Header Concierge */}
      <header className="relative z-10 flex h-20 items-center justify-between border-b border-white/5 bg-[#100f14]/80 px-6 backdrop-blur-md sm:px-12">
        <button
          onClick={() => setPaso(cliente ? 'misCitas' : 'hero')}
          className="flex items-center gap-3.5 text-left transition-opacity hover:opacity-85"
        >
          <img src="/icono.png" alt="Logo" className="h-9 w-9 rounded-lg object-contain shadow-md" />
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-white">SSSALÓN</p>
            <p className="text-[10px] uppercase tracking-widest text-accent">by Sophia Solís</p>
          </div>
        </button>

        <div className="flex items-center gap-4">
          {cliente && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{cliente.nombre}</span>
            </div>
          )}

          <button
            onClick={() => onNavegar('admin/inicio')}
            className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-accent/40 hover:bg-white/10 hover:text-white"
          >
            <span>Panel Interno</span>
            <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </header>

      {/* Contenedor Central */}
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
        {/* 1. HERO INICIAL */}
        {paso === 'hero' && !cliente && (
          <div className="animate-fade-in text-center space-y-6">
            <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent">
              Reserva en línea
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl leading-tight">
              Diseñamos tu mejor versión
            </h1>
            <p className="mx-auto max-w-md text-sm text-zinc-400 leading-relaxed">
              Reserva tu tratamiento con Sophia Solís y su equipo de especialistas con disponibilidad en tiempo real.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setPaso('auth')}
                className="w-full sm:w-auto rounded-xl bg-accent px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-accent-hover active:scale-[0.98] shadow-lg shadow-accent/20"
              >
                Agendar Cita
              </button>
              <button
                onClick={() => setPaso('auth')}
                className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
              >
                Consultar mis citas
              </button>
            </div>
          </div>
        )}

        {/* 2. IDENTIFICACIÓN / REGISTRO POR TELÉFONO */}
        {paso === 'auth' && !cliente && (
          <ModuloIdentificacion
            onIdentificado={(cli) => iniciarSesionCliente(cli, true)}
            onVolver={() => setPaso('hero')}
          />
        )}

        {/* 3. PANEL DE CLIENTE IDENTIFICADO */}
        {cliente && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  onClick={() => setPaso('misCitas')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                    paso === 'misCitas'
                      ? 'bg-accent text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Mis Citas
                </button>
                <button
                  onClick={() => setPaso('agendar')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                    paso === 'agendar'
                      ? 'bg-accent text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  + Nueva Cita
                </button>
              </div>

              <button
                onClick={cerrarSesion}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>

            {paso === 'misCitas' && (
              <MisCitas cliente={cliente} onIrAgendar={() => setPaso('agendar')} />
            )}

            {paso === 'agendar' && (
              <AgendarCita
                cliente={cliente}
                servicios={servicios}
                onCompletada={() => setPaso('misCitas')}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function ModuloIdentificacion({ onIdentificado, onVolver }) {
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [esNuevo, setEsNuevo] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const toast = useToast()

  const manejarEnvio = async (e) => {
    e.preventDefault()
    const telLimpio = telefono.trim()
    if (!telLimpio) {
      toast.error('Ingresa tu número de teléfono.')
      return
    }

    setProcesando(true)
    try {
      if (!esNuevo) {
        // 1. Busca si el teléfono ya está registrado
        const res = await pedir('/api/usuarios/clientes')
        const existente = (res.clientes || []).find((c) => c.telefono && c.telefono.replace(/\s+/g, '') === telLimpio.replace(/\s+/g, ''))

        if (existente) {
          toast.exito(`¡Qué gusto verte de nuevo, ${existente.nombre}!`)
          onIdentificado(existente)
          return
        }

        // Si no existe, habilitamos el campo para pedir su nombre
        setEsNuevo(true)
        toast.aviso('Es tu primera vez con nosotros. Ingresa tu nombre para completar tu perfil.')
      } else {
        // 2. Registra el nuevo cliente
        if (!nombre.trim()) {
          toast.error('Por favor escribe tu nombre completo.')
          return
        }

        const data = await pedir('/api/usuarios/clientes', {
          method: 'POST',
          body: JSON.stringify({ nombre: nombre.trim(), telefono: telLimpio, notas: null }),
        })

        toast.exito(`Bienvenida(o), ${data.cliente.nombre}. Tu cuenta ha sido creada.`)
        onIdentificado(data.cliente)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="animate-fade-in rounded-2xl border border-white/10 bg-[#151419]/90 p-8 shadow-2xl backdrop-blur-xl">
      <button
        onClick={onVolver}
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Regresar
      </button>

      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-white">
          {esNuevo ? 'Completa tu registro' : 'Identifícate con tu teléfono'}
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          {esNuevo
            ? 'No encontramos citas anteriores con este número. Indícanos tu nombre para agendar.'
            : 'Ingresa tu número celular para consultar tus citas o agendar una nueva.'}
        </p>
      </div>

      <form onSubmit={manejarEnvio} className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            Número de Teléfono
          </label>
          <input
            type="tel"
            required
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej. 667 100 2002"
            disabled={esNuevo}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        {esNuevo && (
          <div className="animate-fade-in">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Carolina Medina"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-accent focus:outline-none"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={procesando}
          className="w-full mt-2 rounded-xl bg-accent py-3.5 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-accent/20"
        >
          {procesando
            ? 'Comprobando…'
            : esNuevo
              ? 'Crear perfil y continuar'
              : 'Continuar'}
        </button>
      </form>
    </div>
  )
}

function MisCitas({ cliente, onIrAgendar }) {
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const toast = useToast()

  const cargar = async () => {
    setCargando(true)
    try {
      const data = await pedir(`/api/citas/mis-citas?cliente_id=${cliente.id}`)
      setCitas(data.citas || [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.id])

  const cancelar = async (cita) => {
    try {
      await pedir(`/api/citas/${cita.id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado: 'cancelada' }) })
      toast.exito(`Tu cita del ${fechaCorta(cita.fecha)} a las ${cita.hora} fue cancelada.`)
      cargar()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (cargando) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#16151a]/60 py-16 text-center">
        <p className="text-xs text-zinc-400">Consultando tu agenda…</p>
      </div>
    )
  }

  if (citas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#16151a]/60 py-16 text-center">
        <svg className="mx-auto h-10 w-10 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-3 font-display text-base font-semibold text-white">No tienes citas agendadas</p>
        <p className="mt-1 text-xs text-zinc-400">Selecciona el tratamiento que deseas y reserva tu espacio.</p>
        <button
          onClick={onIrAgendar}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-black transition-all hover:bg-accent-hover active:scale-[0.98]"
        >
          Agendar mi cita ahora
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {citas.map((c) => (
        <div
          key={c.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#151419]/90 p-5 shadow-xl backdrop-blur-xl transition-all hover:border-accent/30"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-14 flex-col items-center justify-center rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="font-display text-xs font-bold text-accent">{c.hora}</span>
              <span className="text-[10px] text-zinc-400">{c.servicio_duracion ?? 30}m</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-white">{c.servicio}</h4>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                    ESTILOS_ESTADO[c.estado] ?? ESTILOS_ESTADO.pendiente
                  }`}
                >
                  {c.estado}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 capitalize">{fechaCorta(c.fecha)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
            <span className="font-display text-sm font-bold text-white">
              ${Number(c.servicio_precio ?? 0).toLocaleString('es-MX')}
            </span>

            {ESTADOS_ACTIVOS.includes(c.estado) && (
              <button
                onClick={() => cancelar(c)}
                className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AgendarCita({ cliente, servicios, onCompletada }) {
  const [fecha, setFecha] = useState(hoyISO())
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? '')
  const [slots, setSlots] = useState([])
  const [horaElegida, setHoraElegida] = useState('')
  const [cargandoSlots, setCargandoSlots] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!fecha || !servicioId) return
    setCargandoSlots(true)
    setHoraElegida('')
    pedir(`/api/citas/disponibilidad?fecha=${fecha}&servicio_id=${servicioId}`)
      .then((d) => setSlots(d.slots || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setCargandoSlots(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, servicioId])

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

  const servicioSeleccionado = useMemo(() => {
    return servicios.find((s) => String(s.id) === String(servicioId))
  }, [servicios, servicioId])

  const agendar = async (e) => {
    e.preventDefault()
    if (!horaElegida) {
      toast.error('Selecciona un horario disponible.')
      return
    }
    setGuardando(true)
    try {
      await pedir('/api/citas', {
        method: 'POST',
        body: JSON.stringify({
          cliente_id: cliente.id,
          servicio_id: Number(servicioId),
          fecha,
          hora: horaElegida,
        }),
      })
      toast.exito(`¡Cita reservada para el ${fechaCorta(fecha)} a las ${horaElegida}!`)
      onCompletada()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={agendar} className="rounded-2xl border border-white/10 bg-[#151419]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-white">Configura tu cita</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Selecciona el tratamiento deseado y tu horario ideal.</p>
      </div>

      {/* 1. Selección de Tratamiento */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Tratamiento
        </label>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {servicios.map((s) => {
            const elegido = String(s.id) === String(servicioId)
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => setServicioId(s.id)}
                className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                  elegido
                    ? 'border-accent bg-accent/10 shadow-md ring-1 ring-accent'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div>
                  <p className={`text-xs font-semibold ${elegido ? 'text-accent' : 'text-white'}`}>
                    {s.nombre}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{s.duracion_min} minutos de sesión</p>
                </div>
                <p className="mt-3 font-display text-xs font-bold text-white">
                  ${Number(s.precio).toLocaleString('es-MX')}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Selección de Fecha */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Fecha
        </label>
        <input
          type="date"
          value={fecha}
          min={hoyISO()}
          onChange={(e) => setFecha(e.target.value)}
          className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-accent focus:outline-none [color-scheme:dark]"
        />
      </div>

      {/* 3. Selección de Horarios */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Horarios disponibles
        </label>

        {cargandoSlots ? (
          <p className="py-6 text-center text-xs text-zinc-400">Consultando agenda disponible…</p>
        ) : (
          <div className="mt-2.5 space-y-3">
            {slotsManana.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Mañana</span>
                <div className="mt-1.5 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {slotsManana.map((s) => (
                    <button
                      type="button"
                      key={s.hora}
                      disabled={!s.disponible}
                      onClick={() => setHoraElegida(s.hora)}
                      className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                        !s.disponible
                          ? 'cursor-not-allowed bg-white/[0.02] text-zinc-700 line-through'
                          : horaElegida === s.hora
                            ? 'bg-accent text-black shadow-md ring-2 ring-accent/60'
                            : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-accent/40 hover:text-white'
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
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Tarde</span>
                <div className="mt-1.5 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {slotsTarde.map((s) => (
                    <button
                      type="button"
                      key={s.hora}
                      disabled={!s.disponible}
                      onClick={() => setHoraElegida(s.hora)}
                      className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                        !s.disponible
                          ? 'cursor-not-allowed bg-white/[0.02] text-zinc-700 line-through'
                          : horaElegida === s.hora
                            ? 'bg-accent text-black shadow-md ring-2 ring-accent/60'
                            : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-accent/40 hover:text-white'
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

      {/* Pie y Confirmación */}
      <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {horaElegida && servicioSeleccionado && (
            <p className="text-xs text-zinc-300">
              Turno: <strong className="text-accent">{horaElegida} hrs</strong> · {servicioSeleccionado.nombre} (${servicioSeleccionado.precio})
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCompletada}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={guardando || !horaElegida}
            className="rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-black transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] shadow-lg shadow-accent/20"
          >
            {guardando ? 'Confirmando…' : 'Reservar cita'}
          </button>
        </div>
      </div>
    </form>
  )
}