import StatCard from '../components/StatCard'
import Button from '../components/Button'
import { useToast } from '../lib/toast'

export default function PaginaInicio({ api, onNavegar }) {
  const toast = useToast()
  const conteo = api?.conteo ?? {}

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard etiqueta="Servicios" valor={conteo.servicios ?? '—'} />
        <StatCard etiqueta="Productos" valor={conteo.productos ?? '—'} />
        <StatCard etiqueta="Citas" valor={conteo.citas ?? '—'} />
        <StatCard etiqueta="Ventas" valor={conteo.ventas ?? '—'} />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-paper p-6">
        <h3 className="font-display text-lg font-bold text-ink">Accesos rápidos</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Este panel se construye paso a paso. Hoy están listos el shell, los modales y las notificaciones.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variante="dorada" onClick={() => onNavegar('admin/inventario')}>
            Ir a Inventario
          </Button>
          <Button variante="secundaria" onClick={() => onNavegar('admin/pos')}>
            Ir a Punto de venta
          </Button>
          <Button
            variante="fantasma"
            onClick={() =>
              toast.exito('Las notificaciones y modales ya están listos para los siguientes módulos.', {
                titulo: 'Base UI',
              })
            }
          >
            Probar una notificación
          </Button>
        </div>
      </div>
    </div>
  )
}
