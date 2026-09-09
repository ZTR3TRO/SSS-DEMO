import { useEffect, useState } from 'react'

function leerHash() {
  return window.location.hash.replace(/^#\/?/, '') || 'admin/inicio'
}

/** Devuelve la ruta actual (sin '#/') y una función para navegar. */
export function useHashRoute() {
  const [ruta, setRuta] = useState(leerHash)

  useEffect(() => {
    const onHashChange = () => setRuta(leerHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navegar = (nuevaRuta) => {
    window.location.hash = `/${nuevaRuta}`
  }

  const [seccion, sub] = ruta.split('/')
  return { ruta, seccion: seccion || 'admin', sub: sub || 'inicio', navegar }
}
