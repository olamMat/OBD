const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Configuración de Express
const app = express();
// Configure directories for persistent data. In Railway, the root filesystem is transient
// unless a volume is attached. To make it easy to mount a volume, we store the
// SQLite database and temporary upload files in a `data` directory relative to
// the project root. If a volume is attached at `/app/data` in Railway, the
// database will persist between deploys. Ensure the directories exist.

const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(dataDir, 'uploads');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

// Base de datos SQLite
// Store the SQLite database inside the data directory so it can be mounted on
// Railway for persistence. Without a volume, data will be lost on redeploy.
const dbFile = path.join(dataDir, 'database.db');
const db = new sqlite3.Database(dbFile);

// Conversión de fechas: esta función intenta convertir cualquier representación
// de fecha (número de serie de Excel, cadena dd/mm/aaaa, dd-mm-aaaa o ISO)
// en un objeto Date. Devuelve null si no es posible.
function toDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    // Convertir número de serie Excel a fecha (resta días desde 1899-12-31)
    const utc = Math.round((value - 25569) * 86400 * 1000);
    const date = new Date(utc);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    const parts = value.split(/[\/-]/);
    if (parts.length === 3) {
      let day, month, year;
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? null : date;
      }
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function parseDateToISO(value) {
  const d = toDate(value);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Crear la tabla en SQLite si no existe
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Centro INTEGER,
      Nombre_1 TEXT,
      Fe_contabilizacion TEXT,
      Lote TEXT,
      Referencia TEXT,
      Cantidad REAL,
      Texto_breve_de_material TEXT
    )`
  );
  // Comprobar si la tabla está vacía y cargar datos iniciales
  db.get('SELECT COUNT(*) AS count FROM records', (err, row) => {
    if (err) {
      console.error('Error al contar registros iniciales:', err);
      return;
    }
    if (row.count === 0) {
      console.log('Cargando datos iniciales desde OBD.xlsx...');
      try {
        const filePath = path.join(__dirname, 'website', 'OBD.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        const insertStmt = db.prepare(
          `INSERT INTO records (Centro, Nombre_1, Fe_contabilizacion, Lote, Referencia, Cantidad, Texto_breve_de_material)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        db.run('BEGIN TRANSACTION');
        for (const row of data) {
          insertStmt.run([
            row['Centro'],
            row['Nombre 1'],
            parseDateToISO(row['Fe.contabilización']),
            row['Lote'],
            String(row['Referencia']),
            row['Cantidad'],
            row['Texto breve de material'],
          ]);
        }
        insertStmt.finalize();
        db.run('COMMIT');
        console.log('Datos iniciales cargados en la base de datos.');
      } catch (e) {
        console.error('Error al cargar datos iniciales:', e);
      }
    }
  });
});

// Middleware para servir archivos estáticos desde la carpeta "website"
app.use(express.static(path.join(__dirname, 'website')));

// API: obtener todos los registros como JSON
app.get('/api/data', (req, res) => {
  db.all(
    `SELECT Centro,
            Nombre_1 AS "Nombre 1",
            Fe_contabilizacion AS "Fe.contabilización",
            Lote,
            Referencia,
            Cantidad,
            Texto_breve_de_material AS "Texto breve de material"
     FROM records`,
    (err, rows) => {
      if (err) {
        console.error('Error al obtener datos:', err);
        return res.status(500).json({ error: 'Error al obtener datos' });
      }
      res.json(rows);
    }
  );
});

// API: cargar un nuevo archivo Excel y reemplazar registros existentes
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo' });
  }
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    // Reemplazar registros en la base de datos
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run('DELETE FROM records');
      const stmt = db.prepare(
        `INSERT INTO records (Centro, Nombre_1, Fe_contabilizacion, Lote, Referencia, Cantidad, Texto_breve_de_material)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      for (const row of data) {
        stmt.run([
          row['Centro'],
          row['Nombre 1'],
          parseDateToISO(row['Fe.contabilización']),
          row['Lote'],
          String(row['Referencia']),
          row['Cantidad'],
          row['Texto breve de material'],
        ]);
      }
      stmt.finalize();
      db.run('COMMIT');
    });
    // Eliminar el archivo temporal subido
    fs.unlink(req.file.path, () => {});
    res.json({ count: data.length });
  } catch (e) {
    console.error('Error al procesar el archivo subido:', e);
    return res.status(500).json({ error: 'Error al procesar el archivo' });
  }
});

// Escuchar en el puerto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});