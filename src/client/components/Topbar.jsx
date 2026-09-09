export default function Topbar({ titulo, descripcion, api, accion }) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-paper px-8 py-5">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{titulo}</h2>
        {descripcion && <p className="mt-0.5 text-sm text-zinc-500">{descripcion}</p>}
      </div>
      <div className="flex items-center gap-3">
        {accion}
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            api?.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
          }`}
        >
          {api?.ok ? 'API conectada' : 'Sin conexión'}
        </span>
      </div>
    </header>
  )
}
