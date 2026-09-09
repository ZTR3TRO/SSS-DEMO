import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import { Modal, useModal } from '../lib/modal'
import { useToast } from '../lib/toast'

const VACIO = { nombre: '', categoria: '', precio: '', stock: '', stock_min: '5' }

async function pedir(url, opciones) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.errores?.[0] ?? 'Ocurrió un error inesperado.')
  return data
}

function FormularioProducto({ valores, onCambiar, categorias }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Nombre</label>
        <input
          value={valores.nombre}
          onChange={(e) => onCambiar({ ...valores, nombre: e.target.value })}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
          placeholder="Ej. Shampoo reparador"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Categoría</label>
        <input
          value={valores.categoria}
          onChange={(e) => onCambiar({ ...valores, categoria: e.target.value })}
          list="categorias-existentes"
          className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
          placeholder="Ej. Cabello"
        />
        <datalist id="categorias-existentes">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Precio</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={valores.precio}
            onChange={(e) => onCambiar({ ...valores, precio: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Stock</label>
          <input
            type="number"
            min="0"
            value={valores.stock}
            onChange={(e) => onCambiar({ ...valores, stock: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Stock mín.</label>
          <input
            type="number"
            min="0"
            value={valores.stock_min}
            onChange={(e) => onCambiar({ ...valores, stock_min: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
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
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null) // null = crear, objeto = editar
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
        toast.exito(`"${payload.nombre}" se actualizó correctamente.`)
      } else {
        await pedir('/api/inventario', { method: 'POST', body: JSON.stringify(payload) })
        toast.exito(`"${payload.nombre}" se agregó al inventario.`)
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
      mensaje: `¿Seguro que quieres eliminar "${producto.nombre}" del inventario? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    })
    if (!ok) return
    try {
      await pedir(`/api/inventario/${producto.id}`, { method: 'DELETE' })
      toast.exito(`"${producto.nombre}" se eliminó del inventario.`)
      cargar()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const ajustarStock = async (producto, delta) => {
    try {
      await pedir(`/api/inventario/${producto.id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ delta }),
      })
      cargar()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const pestañas = useMemo(() => ['todas', ...categorias], [categorias])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-2">
          {pestañas.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                categoriaActiva === cat
                  ? 'bg-ink text-white'
                  : 'bg-white text-zinc-500 border border-zinc-200 hover:border-ink hover:text-ink'
              }`}
            >
              {cat === 'todas' ? 'Todas' : cat}
            </button>
          ))}
        </nav>
        <Button variante="dorada" onClick={abrirCrear}>
          + Nuevo producto
        </Button>
      </div>

      {cargando ? (
        <p className="py-12 text-center text-sm text-zinc-400">Cargando inventario…</p>
      ) : productos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-paper py-16 text-center">
          <p className="text-sm text-zinc-500">No hay productos en esta categoría todavía.</p>
          <Button variante="secundaria" className="mt-4" onClick={abrirCrear}>
            Agregar el primero
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((p) => {
            const bajoStock = p.stock <= p.stock_min
            return (
              <div key={p.id} className="rounded-xl border border-zinc-200 bg-paper p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">{p.categoria}</p>
                    <h4 className="mt-1 truncate font-display text-base font-bold text-ink">{p.nombre}</h4>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      bajoStock ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'
                    }`}
                  >
                    {bajoStock ? 'Stock bajo' : 'Stock ok'}
                  </span>
                </div>

                <p className="mt-3 font-display text-2xl font-bold text-ink">
                  ${p.precio.toLocaleString('es-MX')}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => ajustarStock(p, -1)}
                      disabled={p.stock === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-sm font-bold text-zinc-500 transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-ink">{p.stock}</span>
                    <button
                      onClick={() => ajustarStock(p, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-sm font-bold text-zinc-500 transition-colors hover:border-ink hover:text-ink"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <button onClick={() => abrirEditar(p)} className="text-zinc-500 hover:text-ink">
                      Editar
                    </button>
                    <button onClick={() => eliminar(p)} className="text-danger hover:text-danger/70">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo={editando ? 'Editar producto' : 'Nuevo producto'}
      >
        <form onSubmit={guardar}>
          <FormularioProducto valores={form} onCambiar={setForm} categorias={categorias} />
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variante="fantasma" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variante="dorada" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar producto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
