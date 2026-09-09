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
}
