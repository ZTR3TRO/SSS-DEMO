import { useEffect, useState } from 'react'
import { ToastProvider } from './lib/toast'
import { ModalProvider } from './lib/modal'
import { useHashRoute } from './lib/hashRoute'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import PaginaInicio from './pages/PaginaInicio'
import PaginaInventario from './pages/PaginaInventario'
import PaginaPOS from './pages/PaginaPOS'
import PaginaCitas from './pages/PaginaCitas'
import PaginaUsuarios from './pages/PaginaUsuarios'
import PaginaProximamente from './pages/PaginaProximamente'
import PortalInicio from './pages/PortalInicio'

const TITULOS_ADMIN = {
  inicio: { titulo: 'Inicio', descripcion: 'Resumen general del salón' },
  inventario: { titulo: 'Inventario', descripcion: 'Catálogo de productos y control de stock' },
  pos: { titulo: 'Punto de venta', descripcion: 'Cobro rápido por categorías' },
  citas: { titulo: 'Citas', descripcion: 'Agenda y disponibilidad' },
  usuarios: { titulo: 'Usuarios', descripcion: 'Empleados y clientes frecuentes' },
}

const SECCIONES_LISTAS = ['inicio', 'inventario', 'pos', 'citas', 'usuarios']

function PanelAdmin({ sub, api, navegar }) {
  const info = TITULOS_ADMIN[sub] ?? TITULOS_ADMIN.inicio

  return (
    <div className="flex min-h-svh bg-bone">
      <Sidebar activo={sub} onNavegar={navegar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo={info.titulo} descripcion={info.descripcion} api={api} />
        <main className="scrollbar-fina flex-1 overflow-y-auto px-8 py-8">
          {sub === 'inicio' && <PaginaInicio api={api} onNavegar={navegar} />}
          {sub === 'inventario' && <PaginaInventario />}
          {sub === 'pos' && <PaginaPOS />}
          {sub === 'citas' && <PaginaCitas />}
          {sub === 'usuarios' && <PaginaUsuarios />}
          {!SECCIONES_LISTAS.includes(sub) && <PaginaProximamente modulo={info.titulo} paso="6" />}
        </main>
      </div>
    </div>
  )
}

function App() {
  const [api, setApi] = useState(null)
  const { seccion, sub, navegar } = useHashRoute()

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setApi)
      .catch(() => setApi({ ok: false }))
  }, [])

  return (
    <ToastProvider>
      <ModalProvider>
        {seccion === 'portal' ? (
          <PortalInicio onNavegar={navegar} />
        ) : (
          <PanelAdmin sub={sub} api={api} navegar={navegar} />
        )}
      </ModalProvider>
    </ToastProvider>
  )
}

export default App
