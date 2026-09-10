const ICONOS = {
  inicio: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  inventario: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  pos: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  citas: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  usuarios: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  whatsapp: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 00-7.79 13.55L3 21l4.55-1.19A9 9 0 1012 3zm3.5 10.5c-.5.25-.9.4-1.25.4-.3 0-.7-.1-1.2-.4a6.9 6.9 0 01-1.35-1.1 5.6 5.6 0 01-1.3-4.3c.05-.7.55-1.3 1.25-1.45.2-.05.4 0 .55.15.1.15.4.9.5 1.1.05.15.1.35-.05.6l-.25.4c-.1.1-.15.2-.05.35.3.5.7 1 1.2 1.4.15.15.4.3.6.4.15.1.3.05.4-.05.15-.15.35-.4.55-.55.15-.15.3-.1.5-.05.15.05.95.45 1.1.55.2.1.25.2.25.3-.05.15-.2.35-.45.45z" />
    </svg>
  ),
}

const ITEMS = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'inventario', label: 'Inventario' },
  { key: 'pos', label: 'Punto de venta' },
  { key: 'citas', label: 'Citas' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'whatsapp', label: 'WhatsApp' },
]

export default function Sidebar({ activo, onNavegar }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-white border-r border-sidebar-border select-none">
      <div className="flex items-center gap-3.5 px-6 py-6 border-b border-sidebar-border">
        <img src="/icono.png" alt="Logo SSS" style={{ width: 32, height: 32 }} className="h-8 w-8 rounded object-contain" />
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-white">SSSALÓN</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">by Sophia Solís</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Panel interno
        </p>
        <ul className="space-y-1">
          {ITEMS.map((item) => {
            const esActivo = activo === item.key
            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavegar(`admin/${item.key}`)}
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                    esActivo
                      ? 'bg-sidebar-active text-white font-semibold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {esActivo && (
                    <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r bg-accent" />
                  )}
                  <span className={`${esActivo ? 'text-accent' : 'text-white/40 group-hover:text-white/70'} transition-colors`}>
                    {ICONOS[item.key]}
                  </span>
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => onNavegar('portal/inicio')}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <span>Vista de cliente</span>
          <svg className="h-3.5 w-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>
    </aside>
  )
}

export { ITEMS as SIDEBAR_ITEMS }