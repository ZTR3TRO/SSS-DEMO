import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import { Modal } from '../lib/modal'
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

const formatoMXN = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

export default function PaginaPOS() {
  const [catalogo, setCatalogo] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState('todas')
  const [cargando, setCargando] = useState(true)
  const [carrito, setCarrito] = useState([]) // { key, tipo, id, nombre, precio, cantidad, stockDisponible }
  const [modalCobro, setModalCobro] = useState(false)
  const [cobrando, setCobrando] = useState(false)
  const [ultimaVenta, setUltimaVenta] = useState(null)

  const toast = useToast()

  const cargarCatalogo = async (categoria = categoriaActiva) => {
    setCargando(true)
    try {
      const qs = categoria !== 'todas' ? `?categoria=${encodeURIComponent(categoria)}` : ''
      const data = await pedir(`/api/pos/catalogo${qs}`)
      setCatalogo(data.catalogo)
      setCategorias(data.categorias)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarCatalogo(categoriaActiva)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaActiva])

  const pestañas = useMemo(() => ['todas', ...categorias], [categorias])

  const agregarAlCarrito = (item) => {
    const key = `${item.tipo}-${item.id}`
    if (item.tipo === 'producto' && item.stock <= 0) {
      toast.error(`"${item.nombre}" no tiene stock disponible.`)
      return
    }
    setCarrito((actual) => {
      const existente = actual.find((i) => i.key === key)
      if (existente) {
        if (item.tipo === 'producto' && existente.cantidad + 1 > item.stock) {
          toast.aviso(`Solo hay ${item.stock} unidades de "${item.nombre}".`)
          return actual
        }
        return actual.map((i) => (i.key === key ? { ...i, cantidad: i.cantidad + 1 } : i))
      }
      return [
        ...actual,
        {
          key,
          tipo: item.tipo,
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: 1,
          stockDisponible: item.tipo === 'producto' ? item.stock : null,
        },
      ]
    })
  }

  const cambiarCantidad = (key, delta) => {
    setCarrito((actual) =>
      actual
        .map((i) => {
          if (i.key !== key) return i
          const nuevaCantidad = i.cantidad + delta
          if (i.tipo === 'producto' && nuevaCantidad > i.stockDisponible) {
            toast.aviso(`Solo hay ${i.stockDisponible} unidades de "${i.nombre}".`)
            return i
          }
          return { ...i, cantidad: nuevaCantidad }
        })
        .filter((i) => i.cantidad > 0),
    )
  }

  const quitarDelCarrito = (key) => setCarrito((actual) => actual.filter((i) => i.key !== key))

  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  const cobrar = async () => {
    setCobrando(true)
    try {
      const items = carrito.map(({ tipo, id, nombre, precio, cantidad }) => ({ tipo, id, nombre, precio, cantidad }))
      const data = await pedir('/api/pos/venta', { method: 'POST', body: JSON.stringify({ items }) })
      setUltimaVenta(data.venta)
      setCarrito([])
      setModalCobro(false)
      toast.exito(`Venta #${data.venta.id} registrada por ${formatoMXN(data.venta.total)}.`, { titulo: 'Cobro exitoso' })
      cargarCatalogo()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCobrando(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Catálogo */}
      <div className="space-y-5">
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

        {cargando ? (
          <p className="py-12 text-center text-sm text-zinc-400">Cargando catálogo…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catalogo.map((item) => {
              const sinStock = item.tipo === 'producto' && item.stock <= 0
              return (
                <button
                  key={`${item.tipo}-${item.id}`}
                  onClick={() => agregarAlCarrito(item)}
                  disabled={sinStock}
                  className="group flex flex-col items-start rounded-xl border border-zinc-200 bg-paper p-4 text-left transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      item.tipo === 'servicio' ? 'bg-noche text-white' : 'bg-bone-dark text-ink'
                    }`}
                  >
                    {item.tipo === 'servicio' ? 'Servicio' : 'Producto'}
                  </span>
                  <p className="mt-2 font-display text-sm font-bold text-ink">{item.nombre}</p>
                  <p className="text-xs text-zinc-400">{item.categoria}</p>
                  <div className="mt-3 flex w-full items-center justify-between">
                    <span className="font-display text-lg font-bold text-ink">{formatoMXN(item.precio)}</span>
                    {item.tipo === 'producto' && (
                      <span className={`text-[11px] font-semibold ${sinStock ? 'text-danger' : 'text-zinc-400'}`}>
                        {sinStock ? 'Sin stock' : `${item.stock} disp.`}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Carrito */}
      <aside className="flex h-fit flex-col rounded-2xl border border-zinc-200 bg-paper p-5 lg:sticky lg:top-8">
        <h3 className="font-display text-lg font-bold text-ink">Cuenta actual</h3>

        {carrito.length === 0 ? (
          <p className="mt-6 text-center text-sm text-zinc-400">
            Toca un producto o servicio del catálogo para agregarlo aquí.
          </p>
        ) : (
          <ul className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto scrollbar-fina pr-1">
            {carrito.map((i) => (
              <li key={i.key} className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{i.nombre}</p>
                  <p className="text-xs text-zinc-400">{formatoMXN(i.precio)} c/u</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => cambiarCantidad(i.key, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 text-xs font-bold text-zinc-500 hover:border-ink hover:text-ink"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{i.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(i.key, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 text-xs font-bold text-zinc-500 hover:border-ink hover:text-ink"
                    >
                      +
                    </button>
                  </div>
                  <button onClick={() => quitarDelCarrito(i.key)} className="text-[11px] font-semibold text-danger hover:text-danger/70">
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
          <span className="text-sm font-semibold text-zinc-500">Total</span>
          <span className="font-display text-2xl font-bold text-ink">{formatoMXN(total)}</span>
        </div>

        <Button
          variante="dorada"
          className="mt-4 w-full"
          disabled={carrito.length === 0}
          onClick={() => setModalCobro(true)}
        >
          Cobrar
        </Button>

        {ultimaVenta && (
          <p className="mt-3 text-center text-xs text-zinc-400">
            Última venta: #{ultimaVenta.id} · {formatoMXN(ultimaVenta.total)}
          </p>
        )}
      </aside>

      <Modal abierto={modalCobro} onCerrar={() => setModalCobro(false)} titulo="Confirmar cobro">
        <ul className="max-h-48 space-y-2 overflow-y-auto scrollbar-fina">
          {carrito.map((i) => (
            <li key={i.key} className="flex justify-between text-sm">
              <span className="text-zinc-600">
                {i.cantidad}× {i.nombre}
              </span>
              <span className="font-medium text-ink">{formatoMXN(i.precio * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
          <span className="text-sm font-semibold text-zinc-500">Total a cobrar</span>
          <span className="font-display text-xl font-bold text-ink">{formatoMXN(total)}</span>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variante="fantasma" onClick={() => setModalCobro(false)}>
            Cancelar
          </Button>
          <Button variante="dorada" onClick={cobrar} disabled={cobrando}>
            {cobrando ? 'Procesando…' : 'Confirmar cobro'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
