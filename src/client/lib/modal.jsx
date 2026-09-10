import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Button from '../components/Button'

const ModalContext = createContext(null)

export function Modal({ abierto, onCerrar, titulo, children, ancho = 'max-w-md' }) {
  useEffect(() => {
    if (!abierto) return
    const onKey = (e) => e.key === 'Escape' && onCerrar?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="animate-fade-in fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onCerrar} />
      <div
        role="dialog"
        aria-modal="true"
        className={`animate-modal-in relative w-full ${ancho} rounded-xl border border-border bg-surface p-6 shadow-2xl shadow-ink/15`}
      >
        {titulo && (
          <div className="mb-5 flex items-center justify-between border-b border-border pb-3.5">
            <h3 className="font-display text-base font-bold text-ink">{titulo}</h3>
            <button
              onClick={onCerrar}
              className="rounded-md p-1 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
              aria-label="Cerrar modal"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function ModalProvider({ children }) {
  const [dialogo, setDialogo] = useState(null)

  const confirmar = useCallback(({ titulo, mensaje, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', peligro = false }) => {
    return new Promise((resolve) => {
      setDialogo({ titulo, mensaje, textoConfirmar, textoCancelar, peligro, resolve })
    })
  }, [])

  const resolverCon = (valor) => {
    dialogo?.resolve(valor)
    setDialogo(null)
  }

  return (
    <ModalContext.Provider value={{ confirmar }}>
      {children}
      <Modal abierto={!!dialogo} onCerrar={() => resolverCon(false)} titulo={dialogo?.titulo}>
        <p className="text-sm text-ink-muted leading-relaxed">{dialogo?.mensaje}</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button variante="fantasma" tamano="sm" onClick={() => resolverCon(false)}>
            {dialogo?.textoCancelar}
          </Button>
          <Button
            variante={dialogo?.peligro ? 'peligro' : 'primaria'}
            tamano="sm"
            onClick={() => resolverCon(true)}
          >
            {dialogo?.textoConfirmar}
          </Button>
        </div>
      </Modal>
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal debe usarse dentro de <ModalProvider>')
  return ctx
}