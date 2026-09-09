import { createContext, useCallback, useContext, useEffect, useState } from 'react'

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
      <div className="absolute inset-0 bg-ink/50" onClick={onCerrar} />
      <div
        role="dialog"
        aria-modal="true"
        className={`animate-modal-in relative w-full ${ancho} rounded-2xl bg-white p-6 shadow-2xl shadow-black/20`}
      >
        {titulo && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink">{titulo}</h3>
            <button
              onClick={onCerrar}
              className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-ink"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

/**
 * Proveedor que expone `confirmar()` para diálogos de confirmación imperativos,
 * sin tener que declarar estado de modal en cada pantalla.
 */
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
        <p className="text-sm text-zinc-600">{dialogo?.mensaje}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => resolverCon(false)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-500 transition-colors hover:bg-zinc-100"
          >
            {dialogo?.textoCancelar}
          </button>
          <button
            onClick={() => resolverCon(true)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
              dialogo?.peligro ? 'bg-danger hover:bg-danger/90' : 'bg-ink hover:bg-ink/90'
            }`}
          >
            {dialogo?.textoConfirmar}
          </button>
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
