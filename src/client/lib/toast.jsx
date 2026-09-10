import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

const ICONOS = {
  exito: (
    <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  aviso: (
    <svg className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const contador = useRef(0)

  const cerrar = useCallback((id) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id))
  }, [])

  const mostrar = useCallback(
    (mensaje, opciones = {}) => {
      const id = ++contador.current
      const tipo = opciones.tipo ?? 'info'
      const duracion = opciones.duracion ?? 3800
      setToasts((actuales) => [...actuales, { id, mensaje, tipo, titulo: opciones.titulo }])
      if (duracion > 0) {
        setTimeout(() => cerrar(id), duracion)
      }
      return id
    },
    [cerrar],
  )

  const toast = {
    show: mostrar,
    exito: (mensaje, opciones) => mostrar(mensaje, { ...opciones, tipo: 'exito' }),
    error: (mensaje, opciones) => mostrar(mensaje, { ...opciones, tipo: 'error' }),
    aviso: (mensaje, opciones) => mostrar(mensaje, { ...opciones, tipo: 'aviso' }),
    info: (mensaje, opciones) => mostrar(mensaje, { ...opciones, tipo: 'info' }),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-toast-in pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg shadow-ink/10"
          >
            <span className="mt-0.5 shrink-0">{ICONOS[t.tipo] ?? ICONOS.info}</span>
            <div className="min-w-0 flex-1">
              {t.titulo && <p className="text-xs font-semibold text-ink">{t.titulo}</p>}
              <p className="text-xs text-ink-muted mt-0.5">{t.mensaje}</p>
            </div>
            <button
              onClick={() => cerrar(t.id)}
              className="shrink-0 text-ink-faint transition-colors hover:text-ink"
              aria-label="Cerrar notificación"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}