export default function StatCard({ etiqueta, valor, nota, icono }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{etiqueta}</p>
        {icono && (
          <div className="text-ink-faint group-hover:text-ink transition-colors">
            {icono}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="font-display text-2xl font-bold tracking-tight text-ink">{valor}</p>
      </div>

      {nota && <p className="mt-1 text-xs text-ink-muted">{nota}</p>}
    </div>
  )
}