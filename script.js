/*
 * script.js
 *
 * Versión lista para pegar.
 * Lee datos desde Google Sheets (API gviz) o, si falla, desde OBD.xlsx.
 * Filtros: Acopio (Nombre 1), Lote (texto en mayúsculas), Tipo de material y Fecha.
 * Corrige fechas de gviz tipo Date(YYYY,MM,DD) → ISO (YYYY-MM-DD) y muestra DD/MM/YYYY.
 */

// -------------------- Configuración --------------------
let dataset = [];

// ID del documento y GID de la pestaña (0 = primera hoja)
const GOOGLE_SHEET_ID  = '1rfE4dFe5cHtQMIc4mt-Lx-QmdVjMsKcR';
const GOOGLE_SHEET_GID = '0';

// -------------------- Carga de datos --------------------
async function loadDataset() {
  // 1) Intentar Google Sheets (gviz JSON)
  if (GOOGLE_SHEET_ID) {
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?gid=${GOOGLE_SHEET_GID}&tqx=out:json&t=${Date.now()}`;
      const res = await fetch(gvizUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      // Extraer JSON de google.visualization.Query.setResponse(...)
      const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const gvizData = JSON.parse(jsonStr);

      const cols = gvizData.table.cols.map(c => c.label || c.id || '');
      const rows = gvizData.table.rows || [];

      dataset = rows.map(r => {
        const obj = {};
        cols.forEach((label, i) => {
          const cell = r.c?.[i];
          // Preferir el valor formateado (f) si existe; si no, el crudo (v)
          let v = cell ? (cell.f ?? cell.v) : '';
          obj[label] = v ?? '';
        });
        return obj;
      });

      // Normalizar fecha a ISO (YYYY-MM-DD) para que el filtro funcione siempre
      dataset = dataset.map(row => ({
        ...row,
        ['Fe.contabilización']: toISODate(row['Fe.contabilización'])
      }));

      initPage();
      return;
    } catch (err) {
      console.warn('Fallo al cargar Google Sheets, uso Excel local:', err);
      // continuar al fallback
    }
  }

  // 2) Fallback: archivo Excel local (OBD.xlsx)
  try {
    const res = await fetch('OBD.xlsx');
    const ab  = await res.arrayBuffer();
    const wb  = XLSX.read(ab, { type: 'array' });
    const sh  = wb.SheetNames[0];
    dataset   = XLSX.utils.sheet_to_json(wb.Sheets[sh], { defval: '' });

    dataset = dataset.map(row => ({
      ...row,
      ['Fe.contabilización']: toISODate(row['Fe.contabilización'])
    }));

    initPage();
  } catch (err) {
    console.error('Error al cargar el Excel local:', err);
  }
}

// -------------------- Inicialización UI --------------------
function initPage() {
  if (document.getElementById('data-table')) {
    populateFilters();
    renderTable(dataset);

    // Filtros
    const nombreSelect  = document.getElementById('filter-nombre');
    const fechaInput    = document.getElementById('filter-fecha');
    const materialSelect= document.getElementById('filter-material');
    const loteInput     = document.getElementById('filter-lote');
    const clearBtn      = document.getElementById('clear-filters');

    if (nombreSelect)   nombreSelect.addEventListener('change', applyFilters);
    if (fechaInput)     fechaInput.addEventListener('change', applyFilters);
    if (materialSelect) materialSelect.addEventListener('change', applyFilters);
    if (loteInput) {
      loteInput.addEventListener('input', function () {
        this.value = this.value.toUpperCase();
        applyFilters();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (nombreSelect)   nombreSelect.value = '';
        if (fechaInput)     fechaInput.value = '';
        if (materialSelect) materialSelect.value = '';
        if (loteInput)      loteInput.value = '';
        renderTable(dataset);
      });
    }
  }
}

function populateFilters() {
  const nombreSelect   = document.getElementById('filter-nombre');
  const materialSelect = document.getElementById('filter-material');
  if (!nombreSelect || !materialSelect) return;

  const nombres = Array.from(
    new Set(dataset.map(r => r['Nombre 1']).filter(v => v != null && v !== ''))
  ).sort();

  const materiales = Array.from(
    new Set(dataset.map(r => r['Texto breve de material']).filter(v => v != null && v !== ''))
  ).sort();

  nombres.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    nombreSelect.appendChild(opt);
  });

  materiales.forEach(mat => {
    const opt = document.createElement('option');
    opt.value = mat;
    opt.textContent = mat;
    materialSelect.appendChild(opt);
  });
}

// -------------------- Renderizado --------------------
function renderTable(data) {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row['Centro'] ?? ''}</td>
      <td>${row['Nombre 1'] ?? ''}</td>
      <td>${formatDateDisplay(row['Fe.contabilización'])}</td>
      <td>${row['Lote'] ?? ''}</td>
      <td>${row['Referencia'] ?? ''}</td>
      <td>${row['Cantidad'] ?? ''}</td>
      <td>${row['Texto breve de material'] ?? ''}</td>
    `;
    tbody.appendChild(tr);
  });

  updateRowCount(data.length);
}

// -------------------- Filtros --------------------
function applyFilters() {
  const nombre   = document.getElementById('filter-nombre')?.value || '';
  const fechaISO = document.getElementById('filter-fecha')?.value || ''; // input date -> ISO
  const material = document.getElementById('filter-material')?.value || '';
  const loteQ    = (document.getElementById('filter-lote')?.value || '').trim().toUpperCase();

  let filtered = dataset;

  if (nombre) {
    filtered = filtered.filter(r => (r['Nombre 1'] || '') === nombre);
  }

  if (loteQ) {
    filtered = filtered.filter(r => String(r['Lote'] || '').toUpperCase().includes(loteQ));
  }

  if (material) {
    filtered = filtered.filter(r => (r['Texto breve de material'] || '') === material);
  }

  if (fechaISO) {
    filtered = filtered.filter(r => toISODate(r['Fe.contabilización']) === fechaISO);
  }

  renderTable(filtered);
}

function updateRowCount(count) {
  const el = document.getElementById('row-count');
  if (!el) return;
  el.textContent = `Mostrando ${count} ${count === 1 ? 'registro' : 'registros'}.`;
}

// -------------------- Fechas: utilidades robustas --------------------
/**
 * Normaliza múltiples formatos a ISO "YYYY-MM-DD".
 * Soporta:
 *  - gviz:  "Date(YYYY,MM,DD[,hh,mm,ss])"  (¡mes 0-based!)
 *  - texto: "DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD"
 *  - número: serial de Excel
 *  - Date y otros parseables por Date()
 */
function toISODate(val) {
  if (val == null || val === '') return '';

  // gviz Date(YYYY,MM,DD[,hh,mm,ss])
  if (typeof val === 'string' && /^Date\(/.test(val)) {
    const m = val.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/);
    if (m) {
      const [, y, mo, d, hh='0', mi='0', ss='0'] = m;
      // Crear fecha en UTC para evitar desbordes por zona horaria
      const dt = new Date(Date.UTC(+y, +mo, +d, +hh, +mi, +ss));
      return dt.toISOString().slice(0, 10); // YYYY-MM-DD
    }
  }

  // "DD/MM/YYYY" o "DD-MM-YYYY"
  if (typeof val === 'string') {
    let m = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const d2 = String(dd).padStart(2, '0');
      const m2 = String(mm).padStart(2, '0');
      return `${yyyy}-${m2}-${d2}`;
    }
    // Ya ISO "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  }

  // Serial de Excel
  if (typeof val === 'number') {
    // Excel epoch 1899-12-30
    const ms = Math.round((val - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10);
  }

  // Objeto Date o cadenas parseables
  const dt = new Date(val);
  if (!isNaN(dt)) return dt.toISOString().slice(0, 10);

  return '';
}

// Visualización "DD/MM/YYYY"
function formatDateDisplay(val) {
  const iso = toISODate(val);
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// (Si en algún sitio llamabas a formatDateISO, mantenlo como alias de toISODate)
function formatDateISO(val) {
  return toISODate(val);
}

// -------------------- Arranque --------------------
document.addEventListener('DOMContentLoaded', loadDataset);
