# SSSALÓN by Sophia Solís — Sistema Boutique

Sistema de gestión para un salón de belleza. **Monolito**: un solo `package.json` que levanta API (Express) y frontend (React + Vite) con un único comando.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 (CSS-first `@theme`) |
| Backend | Node.js + Express 5 (mismo proceso, `src/server/`) |
| Base de datos | SQLite vía `better-sqlite3` (archivo `data/salon.db`) |
| WhatsApp | Baileys (`@whiskeysockets/baileys`) vía WhatsApp Web multi-dispositivo — sesión en `data/baileys/` |
| Paquete | pnpm (bindings nativos de `better-sqlite3` permitidos vía `onlyBuiltDependencies`) |
| Routing | Hash routing manual (`#/admin/…`, `#/portal/…`), sin react-router |

## Requisitos

- Node.js ≥ 18 (soporta `node --watch`)
- pnpm

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm run dev` | Levanta API (`:3001`, con `--watch`) y web Vite (`:5173`) en paralelo (concurrently) |
| `pnpm run build` | Compila el frontend a `dist/` |
| `pnpm start` | Sirve API + frontend compilado en un solo puerto (`:3001`) |
| `pnpm run preview` | Previsualiza el build en modo Vite |

## Estructura

```
SSS-DEMO/
├── package.json            un solo package: dev = API + web juntos
├── vite.config.js          plugin React + Tailwind; proxy /api → :3001
├── index.html
├── FASE-5-USUARIOS.md      especificación de la Fase 5 (ya implementada)
├── public/
│   ├── logo.png            logo de la marca (1254×1254)
│   └── icono.png           favicon / isotipo (1254×1254, se muestra a 32px)
└── src/
    ├── index.css           Tailwind v4 + tokens de marca en @theme
    ├── server/
    │   ├── index.js        Express, /api/health, monta routers, arranca WhatsApp, sirve dist/ en prod
    │   ├── db.js           conexión + esquema SQLite (initDb) + migraciones seguras
    │   ├── seed.js         datos iniciales si las tablas están vacías
    │   ├── whatsapp.js     cliente Baileys: QR, envío de mensajes, receptor de respuestas de cita
    │   └── routes/         pos · inventario · citas · usuarios · whatsapp
    └── client/
        ├── main.jsx
        ├── App.jsx         shell: PanelAdmin (Sidebar + Topbar) y Portal, por hash
        ├── components/     Button · Sidebar · Topbar · StatCard
        ├── lib/            toast · modal (confirmar) · hashRoute
        └── pages/          Inicio · Inventario · POS · Citas · Usuarios · WhatsApp · Próximamente · Portal
```

## Módulos

| Fase | Módulo | Ruta | Estado |
| --- | --- | --- | --- |
| 1 | Base UI (shell, sidebar, modales, toasts) | — | ✅ |
| 2 | Inventario — catálogo por categoría, CRUD, stock | `#/admin/inventario` | ✅ |
| 3 | Punto de venta — catálogo unificado, carrito, cobro y descuento transaccional | `#/admin/pos` | ✅ |
| 4 | Citas (panel) — agenda por fecha, disponibilidad por slots, estados | `#/admin/citas` | ✅ |
| 5 | Usuarios — empleados (baja lógica) y clientes frecuentes vinculados a citas | `#/admin/usuarios` | ✅ |
| 6 | Portal de clientes — selección de perfil, disponibilidad real, agendar y "mis citas" | `#/portal` | ✅ |
| 7 | WhatsApp — vincula el WhatsApp del negocio (QR), confirma citas y escucha respuestas SI/NO | `#/admin/whatsapp` | ✅ |

## API

Base URL (dev): `http://localhost:5173/api` (proxy a `:3001`). Respuestas de error: `{ ok: false, errores: [...] }`.

### Health

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/health` | GET | Estado de la API y conteo por entidad (incluye `empleados` activos y `clientes`) |

### Inventario — `/api/inventario`

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/inventario?categoria=X` | GET | Lista productos (filtro por categoría) + categorías disponibles |
| `/api/inventario` | POST | Crea producto (valida nombre, precio, stock, stock_min) |
| `/api/inventario/:id` | PUT | Edita producto |
| `/api/inventario/:id/stock` | PATCH | Ajusta stock con `{ delta: 1 | -1 }` (no permite negativo) |
| `/api/inventario/:id` | DELETE | Elimina producto |

### Punto de venta — `/api/pos`

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/pos/catalogo?categoria=X` | GET | Catálogo combinado servicios + productos |
| `/api/pos/venta` | POST | Registra venta `{ items: [{ tipo, id, nombre, precio, cantidad }] }` en transacción (valida stock y lo descuenta) |

### Citas — `/api/citas`

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/citas/servicios` | GET | Catálogo de servicios para el selector |
| `/api/citas/disponibilidad?fecha&servicio_id&excluir_id` | GET | Slots libres (09:00–19:00, paso 30 min, respeta duración) |
| `/api/citas/mis-citas?cliente_id` | GET | Citas futuras de un cliente (Portal, Fase 6) |
| `/api/citas?fecha=YYYY-MM-DD` | GET | Agenda por fecha (o próximas 50 citas) |
| `/api/citas` | POST | Crea cita (`cliente_id` opcional; si falta, texto libre) — devuelve 409 si choca horario |
| `/api/citas/:id/estado` | PATCH | Cambia estado: `pendiente`, `confirmada`, `cancelada`, `completada` |
| `/api/citas/:id/telefono` | PATCH | Define el teléfono de WhatsApp de la cita (`{ telefono }`, vacío = usar la ficha del cliente) |
| `/api/citas/:id` | DELETE | Elimina cita |

### Usuarios — `/api/usuarios`

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/usuarios/empleados?incluir_inactivos=1` | GET | Directorio de empleados |
| `/api/usuarios/empleados` | POST | Crea empleado |
| `/api/usuarios/empleados/:id` | PUT | Edita empleado |
| `/api/usuarios/empleados/:id` | PATCH | Activa/desactiva (`{ activo: true|false }`) — baja lógica, sin DELETE |
| `/api/usuarios/clientes` | GET | Clientes con conteo de citas (`total_citas`, `visitas`) |
| `/api/usuarios/clientes` | POST | Crea cliente |
| `/api/usuarios/clientes/:id` | PUT | Edita cliente |
| `/api/usuarios/clientes/:id` | DELETE | Elimina cliente (bloqueado si tiene citas pendientes/confirmadas) |

### WhatsApp — `/api/whatsapp`

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/whatsapp/estado` | GET | Estado de la conexión + QR (base64) cuando hay que vincular |
| `/api/whatsapp/vincular` | POST | Borra la sesión y vuelve a mostrar QR (desvincular) |
| `/api/whatsapp/prueba` | POST | Envía un mensaje de prueba `{ telefono }` (409 si no está vinculado) |
| `/api/whatsapp/enviar-confirmacion` | POST | Envía la confirmación de una cita `{ cita_id }`; normaliza el teléfono (MX) antes de enviar |
| `/api/whatsapp/mensajes` | GET | Bitácora de mensajes (últimos 30) |

Respuesta automática del cliente: **SI** → cita `confirmada`; **NO** → cita `cancelada` + mensaje invitando a reagendar.

## Esquema de base de datos

Tablas creadas por `initDb()` en `src/server/db.js`. Las columnas agregadas tras la v1 del esquema se añaden con `agregarColumnaSiFalta()` (SQLite no soporta `ADD COLUMN IF NOT EXISTS`).

- **servicios**: `id`, `nombre`, `precio`, `duracion_min`, `categoria`
- **productos**: `id`, `nombre`, `precio`, `stock`, `stock_min`, `categoria`
- **citas**: `id`, `cliente` (snapshot), `cliente_id` (FK `clientes`, nullable), `servicio` (snapshot), `servicio_id` (FK `servicios`), `fecha`, `hora`, `estado`, `notas`, `telefono` (opcional, para WhatsApp)
- **ventas**: `id`, `total`, `creada_en`
- **ventas_items**: `id`, `venta_id` (FK), `nombre`, `cantidad`, `precio`
- **empleados**: `id`, `nombre`, `puesto`, `telefono`, `activo`, `creado_en`
- **clientes**: `id`, `nombre`, `telefono`, `notas`, `creado_en`
- **whatsapp_mensajes**: `id`, `direccion` (`enviado`/`recibido`), `tipo` (`confirmacion`/`texto`), `cita_id` (FK), `telefono`, `mensaje`, `estado` (`pendiente`/`respondida`), `creado_en`

`seed.js` siembra datos solo si las tablas están vacías: 4 servicios, 9 productos, 3 empleados, 3 clientes y 3 citas vinculadas a clientes.

## Convenciones y notas

- Commits en español, un commit por paso/módulo, push tras cada uno.
- `data/` (SQLite), `dist/` y `node_modules/` están en `.gitignore`.
- La base se regenera con `seed()` al arrancar si está vacía; para reiniciarla: borrar `data/salon.db`.
- CSS-first de Tailwind 4: todos los tokens de marca viven en `@theme` dentro de `src/index.css`.
- Los assets estáticos (logo, icono) viven en `public/`; `icono.png` mide 1254×1254 px y se muestra a 32px con `h-8 w-8`.
- La identidad del cliente en el Portal se guarda en `sessionStorage` como `sssalon_cliente` (id de la ficha).
- WhatsApp (Baileys) usa WhatsApp Web multi-dispositivo: la sesión persiste en `data/baileys/` y el QR se muestra en `#/admin/whatsapp`. El teléfono de envío se toma del campo de la cita o, si está vacío, de la ficha del cliente; los números mexicanos se normalizan automáticamente a `+52…`. Solo hay una confirmación pendiente por teléfono: al enviar una nueva, las anteriores se invalidan.