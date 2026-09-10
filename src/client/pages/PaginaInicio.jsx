import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import Button from '../components/Button'
import { pedir } from '../lib/api'

const ESTILOS_ESTADO = {
  pendiente: 'bg-warning-soft text-warning border-warning/20',
  confirmada: 'bg-success-soft text-success border-success/20',
  completada: 'bg-surface-hover text-ink-muted border-border',
  cancelada: 'bg-danger-soft text-danger border-danger/20',
}

export default function PaginaInicio({ api, onNavegar }) {
  const [citasHoy, setCitasHoy] = useState([])
  const [stockCritico, setStockCritico] = useState([])
  const [cargando, setCargando] = useState(true)

  const conteo = api?.conteo ?? {}
  const hoyISO = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resCitas, resInv] = await Promise.all([
          pedir(`/api/citas?fecha=${hoyISO}`).catch(() => ({ citas: [] })),
          pedir('/api/inventario').catch(() => ({ productos: [] })),
        ])

        setCitasHoy(resCitas.citas?.slice(0, 4) ?? [])
        const criticos = (resInv.productos ?? []).filter((p) => p.stock <= p.stock_min)
        setStockCritico(criticos.slice(0, 4))
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, [hoyISO])

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          etiqueta="Servicios Activos"
          valor={conteo.servicios ?? '—'}
          nota="Catálogo disponible"
          icono={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
            </svg>
          }
        />
        <StatCard
          etiqueta="Inventario Total"
          valor={conteo.productos ?? '—'}
          nota="Referencias en almacén"
          icono={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          etiqueta="Citas Programadas"
          valor={conteo.citas ?? '—'}
          nota="Historial acumulado"
          icono={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          etiqueta="Ventas Registradas"
          valor={conteo.ventas ?? '—'}
          nota="Transacciones POS"
          icono={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-display text-sm font-bold tracking-tight text-ink">Agenda de Hoy</h3>
              <p className="text-xs text-ink-muted">Citas programadas para esta jornada</p>
            </div>
            <Button
              variante="secundaria"
              tamano="sm"
              onClick={() => onNavegar('admin/citas')}
            >
              Ver agenda completa
            </Button>
          </div>

          <div className="mt-4">
            {cargando ? (
              <p className="py-8 text-center text-xs text-ink-faint">Cargando compromisos…</p>
            ) : citasHoy.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-10 text-center">
                <p className="text-xs text-ink-muted">No hay citas registradas para hoy.</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {citasHoy.map((cita) => (
                  <div key={cita.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3.5">
                      <span className="w-12 font-display text-sm font-bold text-ink">
                        {cita.hora}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink leading-tight">{cita.cliente}</p>
                        <p className="text-xs text-ink-muted">{cita.servicio}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                        ESTILOS_ESTADO[cita.estado] ?? ESTILOS_ESTADO.pendiente
                      }`}
                    >
                      {cita.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-display text-sm font-bold tracking-tight text-ink">Atención en Almacén</h3>
              <p className="text-xs text-ink-muted">Productos en o por debajo del stock mínimo</p>
            </div>
            <Button
              variante="secundaria"
              tamano="sm"
              onClick={() => onNavegar('admin/inventario')}
            >
              Gestionar stock
            </Button>
          </div>

          <div className="mt-4">
            {cargando ? (
              <p className="py-8 text-center text-xs text-ink-faint">Evaluando existencias…</p>
            ) : stockCritico.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-10 text-center">
                <p className="text-xs text-ink-muted">Todos los productos cuentan con stock suficiente.</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {stockCritico.map((prod) => (
                  <div key={prod.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink leading-tight">{prod.nombre}</p>
                      <p className="text-xs text-ink-faint uppercase tracking-wider">{prod.categoria}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="font-display text-sm font-bold text-danger">
                          {prod.stock}
                        </span>
                        <span className="text-xs text-ink-faint"> / mín. {prod.stock_min}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}