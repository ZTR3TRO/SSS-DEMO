export async function pedir(url, opciones = {}) {
  const { headers, ...resto } = opciones
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...resto,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const errorMensaje = data.errores?.[0] ?? 'Ocurrió un error inesperado al procesar la solicitud.'
    throw new Error(errorMensaje)
  }
  return data
}