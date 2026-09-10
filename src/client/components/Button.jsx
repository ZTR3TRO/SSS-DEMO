const VARIANTES = {
  primaria:
    'bg-ink text-white hover:bg-ink/90 active:scale-[0.98] shadow-xs',
  dorada:
    'bg-accent text-ink font-semibold hover:bg-accent-hover active:scale-[0.98] shadow-xs',
  secundaria:
    'border border-border bg-surface text-ink hover:bg-surface-hover hover:border-ink-faint active:scale-[0.98] shadow-2xs',
  fantasma:
    'text-ink-muted hover:bg-surface-hover hover:text-ink active:scale-[0.98]',
  peligro:
    'bg-danger text-white hover:bg-danger/90 active:scale-[0.98] shadow-xs',
}

const TAMANOS = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-xl',
}

export default function Button({
  variante = 'primaria',
  tamano = 'md',
  cargando = false,
  className = '',
  disabled,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
      {...props}
    >
      {cargando && (
        <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}