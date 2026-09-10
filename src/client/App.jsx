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
  inicio: { titulo: 'Panel General', descripcion: 'Métricas clave y actividad del día' },
  inventario: { titulo: 'Inventario', descripcion: 'Catálogo de productos y control de existencias' },
  pos: { titulo: 'Punto de Venta', descripcion: 'Registro de cobros y ventas directas' },
  citas: { titulo: 'Agenda', descripcion: 'Control de citas y horarios disponibles' },
  usuarios: { titulo: 'Directorio', descripcion: 'Equipo de trabajo y cartera de clientes' },
}

const SECCIONES_LISTAS = ['inicio', 'inventario', 'pos', 'citas', 'usuarios']

function PanelAdmin({ sub, api, navegar }) {
  const info = TITULOS_ADMIN[sub] ?? TITULOS_ADMIN.inicio

  return (
    <div className="flex min-h-svh bg-canvas">
      <Sidebar activo={sub} onNavegar={navegar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo={info.titulo} descripcion={info.descripcion} />
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