export default function PaginaProximamente({ modulo, paso }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-surface px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Paso {paso}</p>
      <h3 className="mt-2 font-display text-xl font-bold text-ink">{modulo}</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        Este módulo se construye en el siguiente paso del plan. El shell, los modales y las notificaciones ya
        están listos para que lo recibamos.
      </p>
    </div>
  )
}
