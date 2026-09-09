import { useState } from 'react'
import Button from '../components/Button'
import { useToast } from '../lib/toast'

export default function PortalInicio({ onNavegar }) {
  const [nombre, setNombre] = useState('')
  const toast = useToast()

  const entrar = (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      toast.error('Escribe tu nombre para continuar.')
      return
    }
    sessionStorage.setItem('sssalon_cliente', nombre.trim())
    toast.exito(`Hola, ${nombre.trim()}. Ya puedes ver horarios y tus citas.`)
  }

  return (
    <div className="flex min-h-svh flex-col bg-noche text-white">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <img src="/icono.png" alt="" className="h-8 w-8" />
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em]">SSSALÓN</p>
            <p className="text-[10px] uppercase tracking-widest text-white/40">by Sophia Solís</p>
          </div>
        </div>
        <button
          onClick={() => onNavegar('admin/inicio')}
          className="text-sm font-medium text-white/50 transition-colors hover:text-white"
        >
          Panel interno ↗
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <h1 className="font-display text-3xl font-bold">Agenda tu próxima cita</h1>
        <p className="mt-2 text-sm text-white/60">
          Consulta horarios disponibles y gestiona tus citas en SSSALÓN. Para esta demo, solo necesitamos tu
          nombre.
        </p>

        <form onSubmit={entrar} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-white/40">Tu nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Renata Cabrera"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
            />
          </div>
          <Button type="submit" variante="dorada" className="w-full">
            Continuar
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          Este módulo se completa en un paso posterior del plan (ver disponibilidad y agendar).
        </p>
      </main>
    </div>
  )
}
