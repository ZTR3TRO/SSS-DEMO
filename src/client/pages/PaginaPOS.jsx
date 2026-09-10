import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import { Modal } from '../lib/modal'
import { useToast } from '../lib/toast'
import { pedir } from '../lib/api'

const formatoMXN = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

export default function PaginaPOS() {
  const [catalogo, setCatalogo] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [carrito, setCarrito] = useState([])
  const [modalCobro, setModalCobro] = useState(false)
  const [cobrando, setCobrando] = useState(false)
  const [ultimaVenta, setUltimaVenta] = useState(null)

  const toast = useToast()

  const cargarCatalogo = async (catElegida) => {
    setCargando(true)
    try {
      const qs = catElegida ? `?categoria=${encodeURIComponent(catElegida)}` : ''
      const data = await pedir(`/api/pos/catalogo${qs}`)
      setCatalogo(data.catalogo)
      setCategorias(data.categorias)

      if (!catElegida && data.categorias.length > 0) {
        setCategoriaActiva(data.categorias[0])
      }
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

  const cambiarCategoria = (cat) => {
    setBusqueda('')
    setCategoriaActiva(cat)
  }

  const catalogoFiltrado = useMemo(() => {
    if (!busqueda.trim()) return catalogo
    const q = busqueda.toLowerCase()
    return catalogo.filter((i) => i.nombre.toLowerCase().includes(q))
  }, [catalogo, busqueda])

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
  const totalArticulos = carrito.reduce((acc, i) => acc + i.cantidad, 0)

  const cobrar = async () => {
    setCobrando(true)
    try {
      const items = carrito.map(({ tipo, id, nombre, precio, cantidad }) => ({ tipo, id, nombre, precio, cantidad }))
      const data = await pedir('/api/pos/venta', { method: 'POST', body: JSON.stringify({ items }) })
      setUltimaVenta(data.venta)
      setCarrito([])
      setModalCobro(false)
      toast.exito(`Venta #${data.venta.id} registrada por ${formatoMXN(data.venta.total)}.`, { titulo: 'Cobro completado' })
      cargarCatalogo(categoriaActiva)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCobrando(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-130px)] gap-6">
      {/* Columna Izquierda: Catálogo compacto con scroll propio */}
      <div className="flex min-w-0 flex-1 flex-col space-y-4">
        {/* Barra superior de filtros y buscador */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-fina pb-1">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => cambiarCategoria(cat)}
                className={`shrink-0 rounded-md px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  categoriaActiva === cat
                    ? 'bg-ink text-white shadow-2xs'
                    : 'bg-surface text-ink-muted border border-border hover:border-ink-faint hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-48 shrink-0">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
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
              placeholder="Buscar en sección…"
              className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-2.5 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        {/* Rejilla de Cards compactas */}
        <div className="scrollbar-fina flex-1 overflow-y-auto pr-1">
          {cargando ? (
            <div className="rounded-xl border border-border bg-surface py-20 text-center">
              <p className="text-xs text-ink-faint">Cargando catálogo…</p>
            </div>
          ) : catalogoFiltrado.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface py-20 text-center">
              <p className="text-xs text-ink-muted">No hay ítems en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {catalogoFiltrado.map((item) => {
                const sinStock = item.tipo === 'producto' && item.stock <= 0
                return (
                  <button
                    key={`${item.tipo}-${item.id}`}
                    onClick={() => agregarAlCarrito(item)}
                    disabled={sinStock}
                    className="group relative flex flex-col justify-between rounded-lg border border-border bg-surface p-3.5 text-left transition-all duration-150 hover:border-ink hover:shadow-2xs active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                            item.tipo === 'servicio'
                              ? 'bg-ink text-white'
                              : 'bg-canvas text-ink-muted border border-border'
                          }`}
                        >
                          {item.tipo}
                        </span>
                        {item.tipo === 'producto' && (
                          <span className={`text-[10px] ${sinStock ? 'font-semibold text-danger' : 'text-ink-faint'}`}>
                            {sinStock ? 'Agotado' : `${item.stock} disp.`}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 text-xs font-semibold text-ink leading-snug line-clamp-2">
                        {item.nombre}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2">
                      <span className="font-display text-sm font-bold text-ink">
                        {formatoMXN(item.precio)}
                      </span>
                      <span className="text-[11px] font-medium text-ink-faint group-hover:text-ink transition-colors">
                        + Añadir
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Panel de Ticket continuo y fijo */}
      <aside className="flex w-80 shrink-0 flex-col rounded-xl border border-border bg-surface shadow-2xs">
        {/* Cabecera Ticket */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-ink">
              Cuenta en mostrador
            </h3>
            <span className="rounded-full bg-canvas border border-border px-2 py-0.5 text-[10px] font-medium text-ink-muted">
              {totalArticulos} {totalArticulos === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>
        </div>

        {/* Lista de compras con scroll propio */}
        <div className="scrollbar-fina flex-1 overflow-y-auto p-4">
          {carrito.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <svg className="h-8 w-8 text-ink-faint/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="mt-2 text-xs text-ink-faint">Selecciona servicios o productos para sumar al cobro.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {carrito.map((i) => (
                <div key={i.key} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{i.nombre}</p>
                      <p className="text-[11px] text-ink-faint">{formatoMXN(i.precio)} c/u</p>
                    </div>
                    <span className="font-display text-xs font-bold text-ink">
                      {formatoMXN(i.precio * i.cantidad)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => cambiarCantidad(i.key, -1)}
                        className="flex h-5 w-5 items-center justify-center rounded border border-border bg-surface text-xs text-ink-muted hover:border-ink hover:text-ink"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-semibold text-ink">
                        {i.cantidad}
                      </span>
                      <button
                        onClick={() => cambiarCantidad(i.key, 1)}
                        className="flex h-5 w-5 items-center justify-center rounded border border-border bg-surface text-xs text-ink-muted hover:border-ink hover:text-ink"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => quitarDelCarrito(i.key)}
                      className="text-[11px] text-danger hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen Total y Cobro al ras del pie */}
        <div className="border-t border-border bg-canvas/40 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Total</span>
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              {formatoMXN(total)}
            </span>
          </div>

          <Button
            variante="primaria"
            className="mt-3 w-full"
            disabled={carrito.length === 0}
            onClick={() => setModalCobro(true)}
          >
            Registrar cobro
          </Button>

          {ultimaVenta && (
            <p className="mt-2 text-center text-[10px] text-ink-faint">
              Último cobro: #{ultimaVenta.id} · {formatoMXN(ultimaVenta.total)}
            </p>
          )}
        </div>
      </aside>

      {/* Modal Confirmación de Cobro */}
      <Modal abierto={modalCobro} onCerrar={() => setModalCobro(false)} titulo="Confirmación de cobro">
        <div className="space-y-3">
          <div className="scrollbar-fina max-h-48 divide-y divide-border-subtle overflow-y-auto pr-1">
            {carrito.map((i) => (
              <div key={i.key} className="flex justify-between py-2 text-xs">
                <span className="text-ink-muted">
                  {i.cantidad}× {i.nombre}
                </span>
                <span className="font-semibold text-ink">{formatoMXN(i.precio * i.cantidad)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Total a liquidar</span>
            <span className="font-display text-lg font-bold text-ink">{formatoMXN(total)}</span>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button variante="fantasma" tamano="sm" onClick={() => setModalCobro(false)}>
              Volver al mostrador
            </Button>
            <Button variante="primaria" tamano="sm" onClick={cobrar} disabled={cobrando}>
              {cobrando ? 'Procesando…' : 'Completar venta'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}