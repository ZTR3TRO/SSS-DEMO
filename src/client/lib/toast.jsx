import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

const ESTILOS = {
  exito: {
    borde: 'border-l-success',
    icono: '✓',
    iconoFondo: 'bg-success text-white',
  },
  error: {
    borde: 'border-l-danger',
    icono: '!',
    iconoFondo: 'bg-danger text-white',
  },
  aviso: {
    borde: 'border-l-warning',
    icono: '·',
    iconoFondo: 'bg-warning text-white',
  },
  info: {
    borde: 'border-l-noche',
    icono: 'i',
    iconoFondo: 'bg-noche text-white',
  },
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
        {toasts.map((t) => {
          const estilo = ESTILOS[t.tipo] ?? ESTILOS.info
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-lg border-l-4 bg-white px-4 py-3 shadow-lg shadow-black/10 ${estilo.borde}`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${estilo.iconoFondo}`}
              >
                {estilo.icono}
              </span>
              <div className="min-w-0 flex-1">
                {t.titulo && <p className="text-sm font-semibold text-ink">{t.titulo}</p>}
                <p className="text-sm text-zinc-600">{t.mensaje}</p>
              </div>
              <button
                onClick={() => cerrar(t.id)}
                className="shrink-0 text-zinc-400 transition-colors hover:text-ink"
                aria-label="Cerrar notificación"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
