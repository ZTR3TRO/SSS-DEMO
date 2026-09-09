# SSSALÓN by Sophia Solís — Sistema Boutique

Sistema de gestión para un salón de belleza. **Monolito**: un solo `package.json` que levanta API (Express) y frontend (React + Vite) con un único comando.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 (CSS-first `@theme`) |
| Backend | Node.js + Express 5 (mismo proceso, `src/server/`) |
| Base de datos | SQLite vía `better-sqlite3` (archivo `data/salon.db`) |
| Paquete | pnpm (bindings nativos de `better-sqlite3` permitidos vía `onlyBuiltDependencies`) |

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

## Estructura del monorepo (monolito)

```
SSS-DEMO/
├── package.json            un solo package: dev = API + web juntos
├── vite.config.js          proxy /api → http://localhost:3001
├── index.html
├── public/
│   ├── logo.png            logo de la marca
│   └── icono.png           favicon / isotipo
└── src/
    ├── index.css           Tailwind v4 + paleta de marca
    ├── server/
    │   ├── index.js        Express, /api/health, sirve dist/ en producción
    │   ├── db.js           conexión + esquema SQLite (initDb)
    │   └── seed.js         datos iniciales si las tablas están vacías
    └── client/
        ├── main.jsx
        └── App.jsx         shell con los 3 módulos y estado de la API
```

## Módulos

1. **Punto de venta** (`pos`) — carrito, cobro y descuento de stock.
2. **Inventario** (`inventario`) — catálogo de productos y control de stock.
3. **Citas** (`citas`) — agenda de citas y confirmaciones vía WhatsApp mock.

## API

Base URL (dev): `http://localhost:5173/api` (proxy a `:3001`).

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/health` | GET | Estado de la API y conteo por entidad |

> Los routers por módulo (`/api/pos`, `/api/inventario`, `/api/citas`) se montan según avance cada paso.

### Esquema de base de datos

Tablas creadas por `initDb()` en `src/server/db.js`:

- **servicios**: `id`, `nombre`, `precio`, `duracion_min`
- **productos**: `id`, `nombre`, `precio`, `stock`, `stock_min`
- **citas**: `id`, `cliente`, `servicio`, `fecha`, `hora`, `estado`
- **ventas**: `id`, `total`, `creada_en`
- **ventas_items**: `id`, `venta_id` (FK), `nombre`, `cantidad`, `precio`

`seed.js` siembra 4 servicios y 4 productos solo si las tablas están vacías.

## Convenciones y notas

- Commits en español, un commit por paso/módulo, push tras cada uno.
- `data/` (SQLite), `dist/` y `node_modules/` están en `.gitignore`.
- La base se regenera con `seed()` al arrancar si está vacía; para reiniciarla: borrar `data/salon.db`.
- CSS-first de Tailwind 4: todos los tokens de marca viven en `@theme` dentro de `src/index.css`.
- Los assets estáticos (logo, icono) viven en `public/`.