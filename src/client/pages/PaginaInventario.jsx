import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import { Modal, useModal } from '../lib/modal'
import { useToast } from '../lib/toast'
import { pedir } from '../lib/api'

const VACIO = { nombre: '', categoria: '', precio: '', stock: '', stock_min: '5' }

function FormularioProducto({ valores, onCambiar, categorias }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Nombre del producto</label>
        <input
          value={valores.nombre}
          onChange={(e) => onCambiar({ ...valores, nombre: e.target.value })}
          required
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          placeholder="Ej. Shampoo hidratante profundo"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Categoría</label>
        <input
          value={valores.categoria}
          onChange={(e) => onCambiar({ ...valores, categoria: e.target.value })}
          list="categorias-existentes"
          required
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          placeholder="Ej. Cabello, Piel, Herramientas"
        />
        <datalist id="categorias-existentes">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Precio (MXN)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={valores.precio}
            onChange={(e) => onCambiar({ ...valores, precio: e.target.value })}
            required
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Stock actual</label>
          <input
            type="number"
            min="0"
            value={valores.stock}
            onChange={(e) => onCambiar({ ...valores, stock: e.target.value })}
            required
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Mínimo</label>
          <input
            type="number"
            min="0"
            value={valores.stock_min}
            onChange={(e) => onCambiar({ ...valores, stock_min: e.target.value })}
            required
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

export default function PaginaInventario() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)

  const toast = useToast()
  const { confirmar } = useModal()

  const cargar = async (categoria = categoriaActiva) => {
    setCargando(true)
    try {
      const qs = categoria !== 'todas' ? `?categoria=${encodeURIComponent(categoria)}` : ''
      const data = await pedir(`/api/inventario${qs}`)
      setProductos(data.productos)
      setCategorias(data.categorias)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar(categoriaActiva)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaActiva])

  const abrirCrear = () => {
    setEditando(null)
    setForm(VACIO)
    setModalAbierto(true)
  }

  const abrirEditar = (producto) => {
    setEditando(producto)
    setForm({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: String(producto.precio),
      stock: String(producto.stock),
      stock_min: String(producto.stock_min),
    })
    setModalAbierto(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const payload = {
        nombre: form.nombre,
        categoria: form.categoria || 'General',
        precio: Number(form.precio),
        stock: Number(form.stock),
        stock_min: Number(form.stock_min || 5),
      }
      if (editando) {
        await pedir(`/api/inventario/${editando.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast.exito(`"${payload.nombre}" actualizado correctamente.`)
      } else {
        await pedir('/api/inventario', { method: 'POST', body: JSON.stringify(payload) })
        toast.exito(`"${payload.nombre}" añadido al inventario.`)
      }
      setModalAbierto(false)
      cargar()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (producto) => {
    const ok = await confirmar({
      titulo: 'Eliminar producto',
      mensaje: `¿Deseas eliminar "${producto.nombre}" de forma permanente del catálogo?`,
      textoConfirmar: 'Eliminar producto',
      peligro: true,
    })
    if (!ok) return
    try {
      await pedir(`/api/inventario/${producto.id}`, { method: 'DELETE' })
      toast.exito(`"${producto.nombre}" ha sido eliminado.`)
      cargar()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return productos
    const b = busqueda.toLowerCase()
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(b) || p.categoria.toLowerCase().includes(b)
    )
  }, [productos, busqueda])

  const pestañas = useMemo(() => ['todas', ...categorias], [categorias])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-xs">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
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
              placeholder="Buscar producto…"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
            />
          </div>

          <div className="hidden items-center gap-1.5 lg:flex">
            {pestañas.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  categoriaActiva === cat
                    ? 'bg-ink text-white'
                    : 'bg-surface text-ink-muted border border-border hover:border-ink-faint hover:text-ink'
                }`}
              >
                {cat === 'todas' ? 'Todas' : cat}
              </button>
            ))}
          </div>
        </div>

        <Button variante="primaria" tamano="sm" onClick={abrirCrear}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo producto
        </Button>
      </div>

      {cargando ? (
        <div className="rounded-xl border border-border bg-surface py-16 text-center">
          <p className="text-xs text-ink-faint">Actualizando existencias…</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface py-16 text-center">
          <p className="text-xs text-ink-muted">No se encontraron productos registrados.</p>
          <Button variante="secundaria" tamano="sm" className="mt-3" onClick={abrirCrear}>
            Agregar primer producto
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-6 py-3.5">Producto</th>
                <th className="px-6 py-3.5">Categoría</th>
                <th className="px-6 py-3.5">Precio</th>
                <th className="px-6 py-3.5">Stock</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {productosFiltrados.map((p) => {
                const bajoStock = p.stock <= p.stock_min
                return (
                  <tr key={p.id} className="transition-colors hover:bg-surface-hover/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-ink leading-tight">{p.nombre}</p>
                      <p className="text-[11px] text-ink-faint mt-0.5">Mínimo sugerido: {p.stock_min} uds.</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-ink-muted">
                        {p.categoria}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-display font-bold text-ink">
                      ${p.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4 font-display font-semibold text-ink">
                      {p.stock} <span className="text-xs font-normal text-ink-faint">uds.</span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          bajoStock
                            ? 'bg-danger-soft text-danger border border-danger/20'
                            : 'bg-success-soft text-success border border-success/20'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${bajoStock ? 'bg-danger' : 'bg-success'}`} />
                        {bajoStock ? 'Bajo stock' : 'Disponible'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          onClick={() => abrirEditar(p)}
                          className="rounded p-1.5 text-ink-muted hover:bg-surface-hover hover:text-ink"
                          title="Editar"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => eliminar(p)}
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo={editando ? 'Editar detalles de producto' : 'Registrar nuevo producto'}
      >
        <form onSubmit={guardar}>
          <FormularioProducto valores={form} onCambiar={setForm} categorias={categorias} />
          <div className="mt-6 flex justify-end gap-2.5 border-t border-border pt-4">
            <Button type="button" variante="fantasma" tamano="sm" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variante="primaria" tamano="sm" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar producto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}