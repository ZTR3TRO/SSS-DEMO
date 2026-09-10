import { useEffect, useState } from 'react'
import Button from '../components/Button'
import { Modal, useModal } from '../lib/modal'
import { useToast } from '../lib/toast'

const EMPLEADO_VACIO = { nombre: '', puesto: '', telefono: '' }
const CLIENTE_VACIO = { nombre: '', telefono: '', notas: '' }

async function pedir(url, opciones) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.errores?.[0] ?? 'Ocurrió un error inesperado.')
  return data
}

function Campo({ etiqueta, children }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{etiqueta}</label>
      {children}
    </div>
  )
}

const claseInput =
  'mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-ink focus:outline-none'

// ---------------------------------------------------------------------------
// Pestaña: Empleados
// ---------------------------------------------------------------------------

function PestañaEmpleados() {
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
      setEmpleados(data.empleados)
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
        toast.exito(`"${payload.nombre}" se agregó al directorio.`)
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
      toast.exito(empleado.activo ? `"${empleado.nombre}" se marcó como inactivo.` : `"${empleado.nombre}" se reactivó.`)
      cargar()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          <input
            type="checkbox"
            checked={incluirInactivos}
            onChange={(e) => setIncluirInactivos(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Mostrar inactivos
        </label>
        <Button variante="dorada" onClick={abrirCrear}>
          + Nuevo empleado
        </Button>
      </div>

      {cargando ? (
        <p className="py-12 text-center text-sm text-zinc-400">Cargando empleados…</p>
      ) : empleados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-paper py-16 text-center">
          <p className="text-sm text-zinc-500">Todavía no hay empleados registrados.</p>
          <Button variante="secundaria" className="mt-4" onClick={abrirCrear}>
            Agregar el primero
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {empleados.map((e) => (
            <div key={e.id} className="rounded-xl border border-zinc-200 bg-paper p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">{e.puesto}</p>
                  <h4 className="mt-1 truncate font-display text-base font-bold text-ink">{e.nombre}</h4>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    e.activo ? 'bg-success-soft text-success' : 'bg-zinc-200 text-zinc-500'
                  }`}
                >
                  {e.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <p className="mt-3 text-sm text-zinc-500">{e.telefono || 'Sin teléfono registrado'}</p>

              <div className="mt-4 flex items-center justify-end gap-3 text-xs font-semibold">
                <button onClick={() => abrirEditar(e)} className="text-zinc-500 hover:text-ink">
                  Editar
                </button>
                <button
                  onClick={() => alternarActivo(e)}
                  className={e.activo ? 'text-danger hover:text-danger/70' : 'text-success hover:text-success/70'}
                >
                  {e.activo ? 'Desactivar' : 'Reactivar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar empleado' : 'Nuevo empleado'}>
        <form onSubmit={guardar}>
          <div className="space-y-4">
            <Campo etiqueta="Nombre">
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className={claseInput}
                placeholder="Ej. Karla Beltrán"
              />
            </Campo>
            <Campo etiqueta="Puesto">
              <input
                value={form.puesto}
                onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                className={claseInput}
                placeholder="Ej. Estilista, Manicurista, Recepción"
              />
            </Campo>
            <Campo etiqueta="Teléfono">
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className={claseInput}
                placeholder="Ej. 667 100 2001"
              />
            </Campo>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variante="fantasma" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variante="dorada" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar empleado'}
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

function PestañaClientes() {
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
      setClientes(data.clientes)
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
        toast.exito(`"${payload.nombre}" se actualizó correctamente.`)
      } else {
        await pedir('/api/usuarios/clientes', { method: 'POST', body: JSON.stringify(payload) })
        toast.exito(`"${payload.nombre}" se agregó al directorio de clientes.`)
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
      mensaje: `¿Seguro que quieres eliminar a "${cliente.nombre}" del directorio? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    })
    if (!ok) return
    try {
      await pedir(`/api/usuarios/clientes/${cliente.id}`, { method: 'DELETE' })
      toast.exito(`"${cliente.nombre}" se eliminó del directorio.`)
      cargar()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variante="dorada" onClick={abrirCrear}>
          + Nuevo cliente
        </Button>
      </div>

      {cargando ? (
        <p className="py-12 text-center text-sm text-zinc-400">Cargando clientes…</p>
      ) : clientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-paper py-16 text-center">
          <p className="text-sm text-zinc-500">Todavía no hay clientes frecuentes registrados.</p>
          <Button variante="secundaria" className="mt-4" onClick={abrirCrear}>
            Agregar el primero
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-paper">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-white text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Teléfono</th>
                <th className="px-5 py-3">Visitas</th>
                <th className="px-5 py-3">Notas</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-semibold text-ink">{c.nombre}</td>
                  <td className="px-5 py-3 text-zinc-500">{c.telefono || '—'}</td>
                  <td className="px-5 py-3 text-zinc-500">
                    {c.visitas || 0} completadas
                    {c.total_citas > 0 && c.total_citas !== c.visitas ? ` · ${c.total_citas} en total` : ''}
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 text-zinc-500">{c.notas || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3 text-xs font-semibold">
                      <button onClick={() => abrirEditar(c)} className="text-zinc-500 hover:text-ink">
                        Editar
                      </button>
                      <button onClick={() => eliminar(c)} className="text-danger hover:text-danger/70">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={guardar}>
          <div className="space-y-4">
            <Campo etiqueta="Nombre">
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
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
            <Campo etiqueta="Notas">
              <textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                className={`${claseInput} min-h-20 resize-none`}
                placeholder="Alergias, preferencias, etc."
              />
            </Campo>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variante="fantasma" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variante="dorada" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar cliente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página con pestañas Empleados / Clientes
// ---------------------------------------------------------------------------

const PESTAÑAS = [
  { key: 'empleados', label: 'Empleados' },
  { key: 'clientes', label: 'Clientes frecuentes' },
]

export default function PaginaUsuarios() {
  const [pestaña, setPestaña] = useState('empleados')

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2">
        {PESTAÑAS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPestaña(p.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              pestaña === p.key
                ? 'bg-ink text-white'
                : 'bg-white text-zinc-500 border border-zinc-200 hover:border-ink hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </nav>

      {pestaña === 'empleados' ? <PestañaEmpleados /> : <PestañaClientes />}
    </div>
  )
}
