import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import { Modal, useModal } from '../lib/modal'
import { useToast } from '../lib/toast'
import { pedir } from '../lib/api'

const EMPLEADO_VACIO = { nombre: '', puesto: '', telefono: '' }
const CLIENTE_VACIO = { nombre: '', telefono: '', notas: '' }

const claseInput =
  'mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none'

function Campo({ etiqueta, children }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{etiqueta}</label>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pestaña: Empleados
// ---------------------------------------------------------------------------

function PestañaEmpleados({ busqueda }) {
  const [empleados, setEmpleados] = useState([])
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(EMPLEADO_VACIO)
  const [guardando, setGuardando] = useState(false)

  const toast = useToast()

  const cargar = async () => {
    setCargando(true)
    try {
      const qs = incluirInactivos ? '?incluir_inactivos=1' : ''
      const data = await pedir(`/api/usuarios/empleados${qs}`)
      setEmpleados(data.empleados || [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incluirInactivos])

  const abrirCrear = () => {
    setEditando(null)
    setForm(EMPLEADO_VACIO)
    setModalAbierto(true)
  }

  const abrirEditar = (empleado) => {
    setEditando(empleado)
    setForm({ nombre: empleado.nombre, puesto: empleado.puesto, telefono: empleado.telefono ?? '' })
    setModalAbierto(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const payload = { nombre: form.nombre, puesto: form.puesto, telefono: form.telefono || null }
      if (editando) {
        await pedir(`/api/usuarios/empleados/${editando.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast.exito(`"${payload.nombre}" se actualizó correctamente.`)
      } else {
        await pedir('/api/usuarios/empleados', { method: 'POST', body: JSON.stringify(payload) })
        toast.exito(`"${payload.nombre}" se integró al equipo.`)
      }
      setModalAbierto(false)
      cargar()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const alternarActivo = async (empleado) => {
    try {
      await pedir(`/api/usuarios/empleados/${empleado.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !empleado.activo }),
      })
      toast.exito(empleado.activo ? `"${empleado.nombre}" fue dado de baja.` : `"${empleado.nombre}" reactivado.`)
      cargar()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return empleados
    const q = busqueda.toLowerCase()
    return empleados.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.puesto.toLowerCase().includes(q) ||
        (e.telefono && e.telefono.includes(q))
    )
  }, [empleados, busqueda])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={incluirInactivos}
            onChange={(e) => setIncluirInactivos(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border text-ink focus:ring-accent"
          />
          Mostrar colaboradores inactivos
        </label>
        <Button variante="primaria" tamano="sm" onClick={abrirCrear}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo colaborador
        </Button>
      </div>

      {cargando ? (
        <div className="rounded-xl border border-border bg-surface py-20 text-center">
          <p className="text-xs text-ink-faint">Consultando colaboradores…</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface py-20 text-center">
          <p className="text-xs text-ink-muted">No se encontraron empleados registrados.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-6 py-3.5">Colaborador</th>
                <th className="px-6 py-3.5">Puesto / Rol</th>
                <th className="px-6 py-3.5">Contacto</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtrados.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-surface-hover/50">
                  <td className="px-6 py-4 font-semibold text-ink">{e.nombre}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-ink-muted">
                      {e.puesto}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-ink-muted font-mono">{e.telefono || '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        e.activo
                          ? 'bg-success-soft text-success border border-success/20'
                          : 'bg-canvas text-ink-faint border border-border'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${e.activo ? 'bg-success' : 'bg-ink-faint'}`} />
                      {e.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => abrirEditar(e)}
                        className="rounded p-1.5 text-ink-muted hover:bg-surface-hover hover:text-ink"
                        title="Editar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => alternarActivo(e)}
                        className={`rounded p-1.5 ${e.activo ? 'text-danger hover:bg-danger-soft' : 'text-success hover:bg-success-soft'}`}
                        title={e.activo ? 'Dar de baja' : 'Reactivar'}
                      >
                        {e.activo ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar colaborador' : 'Nuevo colaborador'}>
        <form onSubmit={guardar}>
          <div className="space-y-4">
            <Campo etiqueta="Nombre completo">
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                className={claseInput}
                placeholder="Ej. Karla Beltrán"
              />
            </Campo>
            <Campo etiqueta="Puesto / Función">
              <input
                value={form.puesto}
                onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                required
                className={claseInput}
                placeholder="Ej. Colorista, Manicurista, Estilista"
              />
            </Campo>
            <Campo etiqueta="Teléfono de contacto">
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className={claseInput}
                placeholder="Ej. 667 100 2001"
              />
            </Campo>
          </div>
          <div className="mt-6 flex justify-end gap-2.5 border-t border-border pt-4">
            <Button type="button" variante="fantasma" tamano="sm" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variante="primaria" tamano="sm" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pestaña: Clientes frecuentes
// ---------------------------------------------------------------------------

function PestañaClientes({ busqueda }) {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(CLIENTE_VACIO)
  const [guardando, setGuardando] = useState(false)

  const toast = useToast()
  const { confirmar } = useModal()

  const cargar = async () => {
    setCargando(true)
    try {
      const data = await pedir('/api/usuarios/clientes')
      setClientes(data.clientes || [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrirCrear = () => {
    setEditando(null)
    setForm(CLIENTE_VACIO)
    setModalAbierto(true)
  }

  const abrirEditar = (cliente) => {
    setEditando(cliente)
    setForm({ nombre: cliente.nombre, telefono: cliente.telefono ?? '', notas: cliente.notas ?? '' })
    setModalAbierto(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const payload = { nombre: form.nombre, telefono: form.telefono || null, notas: form.notas || null }
      if (editando) {
        await pedir(`/api/usuarios/clientes/${editando.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast.exito(`"${payload.nombre}" actualizado correctamente.`)
      } else {
        await pedir('/api/usuarios/clientes', { method: 'POST', body: JSON.stringify(payload) })
        toast.exito(`"${payload.nombre}" registrado en cartera de clientes.`)
      }
      setModalAbierto(false)
      cargar()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (cliente) => {
    const ok = await confirmar({
      titulo: 'Eliminar cliente',
      mensaje: `¿Deseas eliminar a "${cliente.nombre}" del directorio?`,
      textoConfirmar: 'Eliminar cliente',
      peligro: true,
    })
    if (!ok) return
    try {
      await pedir(`/api/usuarios/clientes/${cliente.id}`, { method: 'DELETE' })
      toast.exito(`"${cliente.nombre}" ha sido eliminado.`)
      cargar()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return clientes
    const q = busqueda.toLowerCase()
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.telefono && c.telefono.includes(q)) ||
        (c.notas && c.notas.toLowerCase().includes(q))
    )
  }, [clientes, busqueda])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variante="primaria" tamano="sm" onClick={abrirCrear}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo cliente
        </Button>
      </div>

      {cargando ? (
        <div className="rounded-xl border border-border bg-surface py-20 text-center">
          <p className="text-xs text-ink-faint">Consultando clientes…</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface py-20 text-center">
          <p className="text-xs text-ink-muted">No se encontraron clientes registrados.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-6 py-3.5">Cliente</th>
                <th className="px-6 py-3.5">Teléfono</th>
                <th className="px-6 py-3.5">Historial</th>
                <th className="px-6 py-3.5">Notas / Preferencias</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtrados.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-surface-hover/50">
                  <td className="px-6 py-4 font-semibold text-ink">{c.nombre}</td>
                  <td className="px-6 py-4 text-xs text-ink-muted font-mono">{c.telefono || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="font-display font-semibold text-ink">{c.visitas || 0}</span>
                    <span className="text-xs text-ink-faint"> visitas</span>
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-xs text-ink-muted">{c.notas || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => abrirEditar(c)}
                        className="rounded p-1.5 text-ink-muted hover:bg-surface-hover hover:text-ink"
                        title="Editar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => eliminar(c)}
                        className="rounded p-1.5 text-danger hover:bg-danger-soft"
                        title="Eliminar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar perfil de cliente' : 'Nuevo cliente'}>
        <form onSubmit={guardar}>
          <div className="space-y-4">
            <Campo etiqueta="Nombre completo">
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                className={claseInput}
                placeholder="Ej. Renata Cabrera"
              />
            </Campo>
            <Campo etiqueta="Teléfono">
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className={claseInput}
                placeholder="Ej. 667 200 3001"
              />
            </Campo>
            <Campo etiqueta="Notas / Preferencias">
              <textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                className={`${claseInput} min-h-20 resize-none`}
                placeholder="Alergias a productos, preferencias de estilo, etc."
              />
            </Campo>
          </div>
          <div className="mt-6 flex justify-end gap-2.5 border-t border-border pt-4">
            <Button type="button" variante="fantasma" tamano="sm" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variante="primaria" tamano="sm" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contenedor General
// ---------------------------------------------------------------------------

const PESTAÑAS = [
  { key: 'empleados', label: 'Equipo / Colaboradores' },
  { key: 'clientes', label: 'Clientes frecuentes' },
]

export default function PaginaUsuarios() {
  const [pestaña, setPestaña] = useState('empleados')
  const [busqueda, setBusqueda] = useState('')

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        {/* Switch de pestañas */}
        <div className="flex items-center rounded-lg border border-border bg-surface p-1 shadow-2xs">
          {PESTAÑAS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setPestaña(p.key)
                setBusqueda('')
              }}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                pestaña === p.key
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Buscador general */}
        <div className="relative w-full max-w-xs">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={`Buscar en ${pestaña === 'empleados' ? 'equipo' : 'clientes'}…`}
            className="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      {pestaña === 'empleados' ? (
        <PestañaEmpleados busqueda={busqueda} />
      ) : (
        <PestañaClientes busqueda={busqueda} />
      )}
    </div>
  )
}