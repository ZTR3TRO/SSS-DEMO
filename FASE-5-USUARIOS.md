# Próxima fase: Gestión de Usuarios (Fase 5)

Este documento describe lo que falta por construir en la Fase 5 del plan, para retomarlo directamente en la siguiente sesión. No incluye código todavía — es la especificación a validar antes de implementar.

## Dónde estamos (Fases 1–4, ya en el repo)

| Fase | Módulo | Estado |
| --- | --- | --- |
| 1 | Base UI (shell, sidebar, modales, toasts) | ✅ Listo |
| 2 | Inventario (catálogo por categoría, CRUD, stock) | ✅ Listo |
| 3 | Punto de venta (catálogo combinado, carrito, cobro, descuento de stock) | ✅ Listo |
| 4 | Citas — panel interno (agenda por fecha, disponibilidad, estados) | ✅ Listo |
| **5** | **Usuarios (empleados + clientes frecuentes)** | **Pendiente — este documento** |
| 6 | Portal de clientes (consultar horarios, agendar/gestionar citas) | Pendiente |

## Objetivo de la Fase 5

> "Gestión de Usuarios: Registro y visualización de empleados y clientes frecuentes."

Dos entidades distintas conviven en un mismo módulo:

1. **Empleados** — quién trabaja en el salón (para más adelante asignar citas a un estilista específico, aunque esa asignación no es parte del alcance actual de Citas).
2. **Clientes frecuentes** — una ficha de cliente reconocible entre visitas, en vez de que cada cita solo tenga un `cliente` de texto libre como hoy.

## Esquema de base de datos propuesto

Nuevas tablas en `src/server/db.js` (con la misma convención de migración segura ya usada: `CREATE TABLE IF NOT EXISTS` + `agregarColumnaSiFalta`):

```sql
CREATE TABLE IF NOT EXISTS empleados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  puesto TEXT NOT NULL,          -- Estilista, Manicurista, Recepción, etc.
  telefono TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT,
  notas TEXT,                    -- alergias, preferencias, etc.
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Decisión pendiente:** ¿la tabla `citas.cliente` (texto libre, como está hoy) pasa a referenciar `clientes.id`, o se mantienen ambas cosas en paralelo (texto libre + ficha opcional)? Esto afecta directamente el Portal de la Fase 6, porque el cliente necesita "ser" un registro de `clientes` para poder ver sus propias citas.

- **Opción A (recomendada):** agregar `cliente_id INTEGER REFERENCES clientes(id)` (nullable) a `citas`, conservando `cliente` como snapshot de texto para no romper lo ya construido. Al crear una cita desde el panel, se podrá elegir un cliente existente o escribir uno nuevo (que se crea al vuelo, igual que hoy pasa con `servicio`/`servicio_id`).
- **Opción B:** clientes solo como catálogo informativo (para ver quiénes son frecuentes), sin vincularlo a `citas`. Más simple, pero el Portal de la Fase 6 tendría que resolver identidad de otra forma.

## Endpoints propuestos (`src/server/routes/usuarios.js`, montado en `/api/usuarios`)

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/usuarios/empleados` | GET | Listar empleados (incluye inactivos con `?incluir_inactivos=1`) |
| `/api/usuarios/empleados` | POST | Crear empleado |
| `/api/usuarios/empleados/:id` | PUT | Editar empleado |
| `/api/usuarios/empleados/:id` | PATCH | Activar/desactivar (`{ activo: true|false }`) — baja lógica, no DELETE físico |
| `/api/usuarios/clientes` | GET | Listar clientes (con conteo de citas asociadas, vía `LEFT JOIN` a `citas`) |
| `/api/usuarios/clientes` | POST | Crear cliente |
| `/api/usuarios/clientes/:id` | PUT | Editar cliente |
| `/api/usuarios/clientes/:id` | DELETE | Eliminar cliente (validar que no tenga citas activas, igual que ya se valida stock en Inventario) |

## Frontend propuesto (`src/client/pages/PaginaUsuarios.jsx`)

- Dos pestañas dentro de la misma página (patrón similar al navbar de categorías ya usado en Inventario/POS): **Empleados** y **Clientes frecuentes**.
- **Empleados:** tabla o tarjetas con nombre, puesto, teléfono, badge activo/inactivo. Modal crear/editar. Botón activar/desactivar (no eliminar, para no perder historial).
- **Clientes:** tabla con nombre, teléfono, número de visitas (citas completadas), notas. Modal crear/editar. Eliminar con `useModal().confirmar(...)` como en Inventario.
- Reutilizar `Button`, `Modal`, `useToast` — nada nuevo a nivel de sistema de diseño, ya está todo montado desde la Fase 1.

## Antes de empezar a construir, decidir:

1. ¿Opción A o B del vínculo `citas` ↔ `clientes` (ver arriba)? Esto determina si esta fase ya deja lista la base de la Fase 6, o si el Portal tendrá que resolverlo por su cuenta.
2. ¿Los "empleados" necesitan algo más que un directorio (por ejemplo, horario de trabajo, especialidad por servicio)? Por ahora el alcance asume que es solo directorio, sin lógica de turnos.
3. ¿Se elimina o solo se desactiva un empleado? (Propuesta: baja lógica con `activo`, para no perder historial si en el futuro se le asignan citas).

## Fase 6, en breve (para contexto, no es el foco de este documento)

El Portal de Clientes (sin login real, según ya se acordó) va a:
- Reutilizar `GET /api/citas/disponibilidad` y `POST /api/citas` que ya existen desde la Fase 4.
- Si se elige la Opción A de arriba, el Portal podrá mostrar "mis citas" filtrando por `cliente_id` en vez de por nombre de texto libre (más confiable).
- Necesitará una vista de "mis citas" con opción de cancelar (reutilizando `PATCH /api/citas/:id/estado`).
