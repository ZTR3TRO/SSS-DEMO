import { db } from './db.js'

export function seed() {
  const servicios = db.prepare('SELECT COUNT(*) AS n FROM servicios').get().n
  if (servicios === 0) {
    const insert = db.prepare('INSERT INTO servicios (nombre, precio, duracion_min) VALUES (?, ?, ?)')
    const datos = [
      ['Corte de cabello', 350, 45],
      ['Manicure', 250, 30],
      ['Pedicure', 300, 40],
      ['Tinte de raíz', 550, 90],
    ]
    db.transaction(() => datos.forEach((s) => insert.run(...s)))()
  }

  const productos = db.prepare('SELECT COUNT(*) AS n FROM productos').get().n
  if (productos === 0) {
    const insert = db.prepare('INSERT INTO productos (nombre, precio, stock, stock_min) VALUES (?, ?, ?, ?)')
    const datos = [
      ['Shampoo reparador', 180, 24, 5],
      ['Acondicionador hidratante', 200, 18, 5],
      ['Base fortalecedora de uñas', 120, 9, 5],
      ['Spray texturizante', 260, 3, 5],
    ]
    db.transaction(() => datos.forEach((p) => insert.run(...p)))()
  }
}