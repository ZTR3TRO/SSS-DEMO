export default function Topbar({ titulo, descripcion, accion }) {
  return (
    <header className="flex h-18 shrink-0 items-center justify-between border-b border-border bg-surface px-8">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-ink">{titulo}</h2>
        {descripcion && <p className="text-xs text-ink-muted mt-0.5">{descripcion}</p>}
      </div>

      {accion && <div className="flex items-center gap-3">{accion}</div>}
    </header>
  )
}