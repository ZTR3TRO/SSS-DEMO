export default function StatCard({ etiqueta, valor, nota }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-paper p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{etiqueta}</p>
      <p className="mt-2 font-display text-3xl font-bold text-ink">{valor}</p>
      {nota && <p className="mt-1 text-xs text-zinc-500">{nota}</p>}
    </div>
  )
}
