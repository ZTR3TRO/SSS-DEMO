const VARIANTES = {
  primaria: 'bg-ink text-white hover:bg-ink/90',
  dorada: 'bg-accent text-ink hover:bg-accent/90',
  secundaria: 'border border-zinc-300 text-ink hover:border-ink',
  fantasma: 'text-zinc-500 hover:bg-zinc-100 hover:text-ink',
  peligro: 'bg-danger text-white hover:bg-danger/90',
}

export default function Button({ variante = 'primaria', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
