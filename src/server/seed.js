import { db } from './db.js'

export function seed() {
  const servicios = db.prepare('SELECT COUNT(*) AS n FROM servicios').get().n
  if (servicios === 0) {
    const insert = db.prepare(
      'INSERT INTO servicios (nombre, precio, duracion_min, categoria) VALUES (?, ?, ?, ?)',
    )
    const datos = [
      ['Corte de cabello', 350, 45, 'Cabello'],
      ['Manicure', 250, 30, 'Uñas'],
      ['Pedicure', 300, 40, 'Uñas'],
      ['Tinte de raíz', 550, 90, 'Cabello'],
    ]
    db.transaction(() => datos.forEach((s) => insert.run(...s)))()
  }

  const productos = db.prepare('SELECT COUNT(*) AS n FROM productos').get().n
  if (productos === 0) {
    const insert = db.prepare(
      'INSERT INTO productos (nombre, precio, stock, stock_min, categoria) VALUES (?, ?, ?, ?, ?)',
    )
    const datos = [
      ['Shampoo reparador', 180, 24, 5, 'Cabello'],
      ['Acondicionador hidratante', 200, 18, 5, 'Cabello'],
      ['Mascarilla nutritiva', 260, 6, 5, 'Cabello'],
      ['Base fortalecedora de uñas', 120, 9, 5, 'Uñas'],
      ['Esmalte semipermanente', 150, 4, 5, 'Uñas'],
      ['Crema hidratante facial', 220, 12, 5, 'Piel'],
      ['Protector solar facial', 240, 3, 5, 'Piel'],
      ['Tijera profesional', 850, 2, 2, 'Herramientas'],
      ['Spray texturizante', 260, 3, 5, 'Cabello'],
    ]
    db.transaction(() => datos.forEach((p) => insert.run(...p)))()
  }

  const empleados = db.prepare('SELECT COUNT(*) AS n FROM empleados').get().n
  if (empleados === 0) {
    const insert = db.prepare(
      'INSERT INTO empleados (nombre, puesto, telefono, activo) VALUES (?, ?, ?, ?)',
    )
    const datos = [
      ['Sofía Solís', 'Estilista', '667 100 2001', 1],
      ['Karla Beltrán', 'Manicurista', '667 100 2002', 1],
      ['Luis Armenta', 'Recepción', '667 100 2003', 1],
    ]
    db.transaction(() => datos.forEach((e) => insert.run(...e)))()
  }

  const clientes = db.prepare('SELECT COUNT(*) AS n FROM clientes').get().n
  if (clientes === 0) {
    const insert = db.prepare('INSERT INTO clientes (nombre, telefono, notas) VALUES (?, ?, ?)')
    const datos = [
      ['Renata Cabrera', '667 200 3001', null],
      ['Mariana Ibarra', '667 200 3002', 'Prefiere esmalte semipermanente.'],
      ['Diego Salcido', '667 200 3003', null],
    ]
    db.transaction(() => datos.forEach((c) => insert.run(...c)))()
  }

  const citas = db.prepare('SELECT COUNT(*) AS n FROM citas').get().n
  if (citas === 0) {
    const servicios = db.prepare('SELECT id, nombre FROM servicios').all()
    const porNombre = (nombre) => servicios.find((s) => s.nombre === nombre)?.id ?? null
    const clientesSeed = db.prepare('SELECT id, nombre FROM clientes').all()
    const clientePorNombre = (nombre) => clientesSeed.find((c) => c.nombre === nombre)?.id ?? null
    const hoy = new Date().toISOString().slice(0, 10)

    const insert = db.prepare(
      'INSERT INTO citas (cliente, cliente_id, servicio, servicio_id, fecha, hora, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    const datos = [
      [
        'Renata Cabrera',
        clientePorNombre('Renata Cabrera'),
        'Corte de cabello',
        porNombre('Corte de cabello'),
        hoy,
        '10:00',
        'confirmada',
      ],
      [
        'Mariana Ibarra',
        clientePorNombre('Mariana Ibarra'),
        'Manicure',
        porNombre('Manicure'),
        hoy,
        '11:30',
        'pendiente',
      ],
      [
        'Diego Salcido',
        clientePorNombre('Diego Salcido'),
        'Tinte de raíz',
        porNombre('Tinte de raíz'),
        hoy,
        '13:00',
        'pendiente',
      ],
    ]
    db.transaction(() => datos.forEach((c) => insert.run(...c)))()
  }
}
