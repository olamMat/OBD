/*
 * script.js
 *
 * Versión lista para pegar.
 * Fuente principal: Google Sheets (API gviz). Fallback: OBD.xlsx local.
 * Filtros: Acopio (Nombre 1), Lote (texto en mayúsculas), Tipo de material y Fecha.
 * Mejora: botón 📋 junto a cada “Referencia” para copiarla al portapapeles.
 */

// -------------------- Configuración --------------------
let dataset = [];

// ID del documento y GID de la pestaña (0 = primera hoja)
const GOOGLE_SHEET_ID  = '1rfE4dFe5cHtQMIc4mt-Lx-QmdVjMsKcR';
const GOOGLE_SHEET_GID = '0';

// -------------------- Utilidades --------------------
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Normaliza múltiples formatos a ISO "YYYY-MM-DD".
function toISODate(val) {
  if (val == null || val === '') return '';

  // gviz Date(YYYY,MM,DD[,hh,mm,ss])
  if (typeof val === 'string' && /^Date\(/.test(val)) {
    const m = val.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/);
    if (m) {
      const [, y, mo, d, hh='0', mi='0', ss='0'] = m;
      const dt = new Date(Date.UTC(+y, +mo, +d, +hh, +mi, +ss)); // mes 0-based
      return dt.toISOString().slice(0, 10);
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

  // Objeto Date o parseable
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

// Alias si en algún sitio llamabas a formatDateISO
function formatDateISO(val) { return toISODate(val); }

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
          let v = cell ? (cell.f ?? cell.v) : '';
          obj[label] = v ?? '';
        });
        return obj;
      });

      // Normalizar fechas a ISO (YYYY-MM-DD)
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

    const nombreSelect   = document.getElementById('filter-nombre');
    const fechaInput     = document.getElementById('filter-fecha');
    const materialSelect = document.getElementById('filter-material');
    const loteInput      = document.getElementById('filter-lote');
    const clearBtn       = document.getElementById('clear-filters');

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

    // Delegación de evento para los botones "copiar referencia"
    const tbody = document.getElementById('table-body');
    if (tbody) {
      tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button.copy-ref');
        if (!btn) return;
        const refVal = btn.dataset.ref || '';
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(refVal);
          } else {
            const ta = document.createElement('textarea');
            ta.value = refVal;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            ta.remove();
          }
          const original = btn.textContent;
          btn.textContent = 'Copiado!';
          btn.disabled = true;
          setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1200);
        } catch (err) {
          alert('No se pudo copiar. Copia manual: ' + refVal);
        }
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
    const referencia = row['Referencia'] ?? '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row['Centro'] ?? ''}</td>
      <td>${row['Nombre 1'] ?? ''}</td>
      <td>${formatDateDisplay(row['Fe.contabilización'])}</td>
      <td>${row['Lote'] ?? ''}</td>
      <td>
        ${escapeHtml(referencia)}
        ${referencia ? ` <button class="copy-ref" data-ref="${escapeHtml(referencia)}" title="Copiar referencia">📋</button>` : ''}
      </td>
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

// -------------------- Arranque --------------------
document.addEventListener('DOMContentLoaded', loadDataset);
