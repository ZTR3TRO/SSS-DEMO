const ITEMS = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'inventario', label: 'Inventario' },
  { key: 'pos', label: 'Punto de venta' },
  { key: 'citas', label: 'Citas' },
  { key: 'usuarios', label: 'Usuarios' },
]

export default function Sidebar({ activo, onNavegar }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-noche text-white">
      <div className="flex items-center gap-3 px-5 py-6">
        <img src="/icono.png" alt="" className="h-8 w-8" />
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em]">SSSALÓN</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">by Sophia Solís</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
          Panel interno
        </p>
        <ul className="space-y-1">
          {ITEMS.map((item) => {
            const esActivo = activo === item.key
            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavegar(`admin/${item.key}`)}
                  className={`relative flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    esActivo ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {esActivo && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
                  )}
                  <span className="pl-2">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => onNavegar('portal/inicio')}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          Vista de cliente
          <span aria-hidden className="text-white/40">
            ↗
          </span>
        </button>
      </div>
    </aside>
  )
}

export { ITEMS as SIDEBAR_ITEMS }
