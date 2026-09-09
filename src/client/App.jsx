import { useEffect, useState } from 'react'

const MODULOS = [
  { key: 'pos', titulo: 'Punto de venta', descripcion: 'Carrito, cobro y descuento de stock' },
  { key: 'inventario', titulo: 'Inventario', descripcion: 'Catálogo de productos y stock' },
  { key: 'citas', titulo: 'Citas', descripcion: 'Agenda de citas y confirmaciones' },
]

function App() {
  const [api, setApi] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setApi)
      .catch(() => setApi({ ok: false }))
  }, [])

  return (
    <div className="flex min-h-svh flex-col bg-paper text-ink">
      <header className="border-b border-zinc-200 bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="font-display text-lg font-bold uppercase tracking-[0.25em]">
              SSSALÓN
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-zinc-500">
              by Sophia Solís
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
              api?.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {api?.ok ? `API ok · ${api.conteo.servicios} servicios · ${api.conteo.productos} productos` : 'API sin conexión'}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h2 className="font-display text-3xl font-bold tracking-tight">Sistema Boutique</h2>
        <p className="mt-1 text-sm text-zinc-500">Esqueleto monolito — Vite + Express + SQLite</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {MODULOS.map((m) => (
            <div
              key={m.key}
              className="rounded-2xl border border-zinc-200 bg-paper p-6 shadow-sm transition-all hover:border-accent hover:shadow-md"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                {m.key}
              </p>
              <h3 className="mt-2 font-display text-lg font-bold">{m.titulo}</h3>
              <p className="mt-1 text-sm text-zinc-500">{m.descripcion}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App