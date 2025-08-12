/*
 * script.js
 *
 * Este archivo contiene la lógica principal de la aplicación web. Se encarga de
 * cargar los datos desde un archivo Excel o desde localStorage, poblar los
 * filtros dinámicos y renderizar la tabla con los registros filtrados. Además,
 * define funciones de utilidad como el formateo de fechas y la aplicación de
 * filtros según el estado de los selectores.
 */

// ---- Datos por defecto ----
// Convertimos el archivo OBD.xlsx en un conjunto de objetos para poder
// incrustarlo directamente en el código. Esta variable contiene todos los
// registros tal y como están en el Excel. Si el administrador carga un
// nuevo archivo mediante la interfaz de administración, los datos se
// almacenarán en localStorage y sustituirán a este valor predeterminado.
const defaultData = JSON.parse(`[{"Centro": 1545, "Nombre 1": "Jinotega (Agencia)", "Fe.contabilización": "2025-03-27", "Lote": "JA5P1A0413", "Referencia": 8490055473, "Cantidad": -730.2, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1545, "Nombre 1": "Jinotega (Agencia)", "Fe.contabilización": "2025-03-24", "Lote": "JA5P1A0412", "Referencia": 8490055462, "Cantidad": -581.36, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1678, "Nombre 1": "Montecristo", "Fe.contabilización": "2025-03-09", "Lote": "MN5P1A0070", "Referencia": 8490055413, "Cantidad": -5484.46, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1545, "Nombre 1": "Jinotega (Agencia)", "Fe.contabilización": "2025-03-09", "Lote": "JA5P1A0392", "Referencia": 8490055411, "Cantidad": -235.28, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1678, "Nombre 1": "Montecristo", "Fe.contabilización": "2025-03-08", "Lote": "MN5P1A0069", "Referencia": 8490055408, "Cantidad": -6011.06, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1676, "Nombre 1": "Las Cuchillas", "Fe.contabilización": "2025-02-27", "Lote": "CH5P1A0254", "Referencia": 8490055367, "Cantidad": -139.54, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1545, "Nombre 1": "Jinotega (Agencia)", "Fe.contabilización": "2025-02-27", "Lote": "JA5P1A0378", "Referencia": 8490055369, "Cantidad": -2238.84, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1553, "Nombre 1": "Matagalpa", "Fe.contabilización": "2025-02-27", "Lote": "HO5P1B0352", "Referencia": 8490055378, "Cantidad": -208.86, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1553, "Nombre 1": "Matagalpa", "Fe.contabilización": "2025-02-27", "Lote": "HO5P1B0351", "Referencia": 8490055377, "Cantidad": -74.02, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1553, "Nombre 1": "Matagalpa", "Fe.contabilización": "2025-02-27", "Lote": "HO5P1B0347", "Referencia": 8490055373, "Cantidad": -736.04, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1553, "Nombre 1": "Matagalpa", "Fe.contabilización": "2025-02-27", "Lote": "HO5P1B0346", "Referencia": 8490055372, "Cantidad": -1889.94, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1553, "Nombre 1": "Matagalpa", "Fe.contabilización": "2025-02-27", "Lote": "HO5P1B0345", "Referencia": 8490055371, "Cantidad": -2612.28, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1545, "Nombre 1": "Jinotega (Agencia)", "Fe.contabilización": "2025-02-26", "Lote": "JA5P1A0372", "Referencia": 8490055356, "Cantidad": -764.4, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1545, "Nombre 1": "Jinotega (Agencia)", "Fe.contabilización": "2025-02-26", "Lote": "JA5P1A0375", "Referencia": 8490055359, "Cantidad": -3271.13, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1626, "Nombre 1": "EL VENTARRON", "Fe.contabilización": "2025-02-26", "Lote": "EV5P1A0167", "Referencia": 8490055365, "Cantidad": -3956.97, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1626, "Nombre 1": "EL VENTARRON", "Fe.contabilización": "2025-02-26", "Lote": "EV5P1A0166", "Referencia": 8490055364, "Cantidad": -65.77, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1626, "Nombre 1": "EL VENTARRON", "Fe.contabilización": "2025-02-26", "Lote": "EV5P1A0165", "Referencia": 8490055363, "Cantidad": -465.99, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1626, "Nombre 1": "EL VENTARRON", "Fe.contabilización": "2025-02-26", "Lote": "EV5P1A0164", "Referencia": 8490055362, "Cantidad": -341.3, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1678, "Nombre 1": "Montecristo", "Fe.contabilización": "2025-02-26", "Lote": "MN5P1A0067", "Referencia": 8490055353, "Cantidad": -265.68, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1678, "Nombre 1": "Montecristo", "Fe.contabilización": "2025-02-26", "Lote": "MN5P1A0066", "Referencia": 8490055352, "Cantidad": -5429.57, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1560, "Nombre 1": "Yasica Sur", "Fe.contabilización": "2025-01-27", "Lote": "YS5P1A0267", "Referencia": 8490054197, "Cantidad": -1447.44, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1560, "Nombre 1": "Yasica Sur", "Fe.contabilización": "2025-01-27", "Lote": "YS5P1A0269", "Referencia": 8490054199, "Cantidad": -322.28, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1567, "Nombre 1": "Mancotal", "Fe.contabilización": "2025-01-27", "Lote": "MA5P1A0150", "Referencia": 8490054125, "Cantidad": -1439.76, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1623, "Nombre 1": "PEÑAS BLANCAS", "Fe.contabilización": "2025-01-27", "Lote": "PS5P1A0177", "Referencia": 8490054133, "Cantidad": -1911.52, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1650, "Nombre 1": "El Recreo", "Fe.contabilización": "2025-01-27", "Lote": "ER5P1A0105", "Referencia": 8490054193, "Cantidad": -2095.86, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1650, "Nombre 1": "El Recreo", "Fe.contabilización": "2025-01-27", "Lote": "ER5P1A0104", "Referencia": 8490054190, "Cantidad": -353.6, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1650, "Nombre 1": "El Recreo", "Fe.contabilización": "2025-01-27", "Lote": "ER5P1A0103", "Referencia": 8490054185, "Cantidad": -581.38, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1650, "Nombre 1": "El Recreo", "Fe.contabilización": "2025-01-27", "Lote": "ER5P1A0102", "Referencia": 8490054181, "Cantidad": -1151.72, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1650, "Nombre 1": "El Recreo", "Fe.contabilización": "2025-01-27", "Lote": "ER5P1A0101", "Referencia": 8490054179, "Cantidad": -675.7, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1653, "Nombre 1": "Guapotal", "Fe.contabilización": "2025-01-27", "Lote": "GA5P1A0163", "Referencia": 8490054226, "Cantidad": -2169.78, "Texto breve de material": "Pergamino Certificado - Tolling"}, {"Centro": 1532, "Nombre 1": "Abisinia", "Fe.contabilización": "2025-01-26", "Lote": "AB5P1D0317", "Referencia": 8490054004, "Cantidad": -2290.36, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1534, "Nombre 1": "Asturias", "Fe.contabilización": "2025-01-26", "Lote": "AT5P1A0046", "Referencia": 8490053976, "Cantidad": -5242.2, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1534, "Nombre 1": "Asturias", "Fe.contabilización": "2025-01-26", "Lote": "AT5P1A0045", "Referencia": 8490053966, "Cantidad": -284.65, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1542, "Nombre 1": "El Limon", "Fe.contabilización": "2025-01-26", "Lote": "EL5P1B0177", "Referencia": 8490054040, "Cantidad": -5233.38, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1542, "Nombre 1": "El Limon", "Fe.contabilización": "2025-01-26", "Lote": "EL5P1B0176", "Referencia": 8490054037, "Cantidad": -844.04, "Texto breve de material": "Pergamino Certificado  UA"}, {"Centro": 1542, "Nombre 1": "El Limon", "Fe.contabilización": "2025-01-26", "Lote": "EL5P1B0175", "Referencia": 8490054033, "Cantidad": -3771.16, "Texto breve de material": "Pergamino Certificado  UA"}]`);

// Almacén de datos global. Inicialmente vacío, se cargará al iniciar la página.
let dataset = [];

/**
 * Carga el conjunto de datos. Primero intenta leer desde localStorage, lo que
 * permite que un administrador actualice el archivo sin tener que reimplantar
 * la aplicación. Si no hay datos almacenados, se carga el archivo por defecto
 * (OBD.xlsx) mediante fetch y la librería SheetJS (xlsx).
 */
function loadDataset() {
  const stored = localStorage.getItem('dataset');
  if (stored) {
    try {
      dataset = JSON.parse(stored);
      initPage();
      return;
    } catch (err) {
      console.error('Error al parsear los datos de localStorage:', err);
      // Si hay un problema con los datos almacenados, se eliminan y se carga el por defecto
      localStorage.removeItem('dataset');
    }
  }
  // Si no hay datos en localStorage, utilizar los datos predeterminados
  dataset = defaultData.slice();
  initPage();
}

/**
 * Inicializa la página una vez que el conjunto de datos está disponible. Si la
 * página contiene la tabla de datos se poblarán los filtros y se mostrará
 * inmediatamente la tabla con todos los registros.
 */
function initPage() {
  // Solo inicializar si existe la tabla en la página actual (por ejemplo,
  // index.html). Admin.html no contiene una tabla para mostrar.
  if (document.getElementById('data-table')) {
    populateFilters();
    renderTable(dataset);
    // Configurar eventos de cambio en los filtros
    const nombreSelect = document.getElementById('filter-nombre');
    const fechaInput = document.getElementById('filter-fecha');
    const materialSelect = document.getElementById('filter-material');
    const clearBtn = document.getElementById('clear-filters');
    if (nombreSelect) nombreSelect.addEventListener('change', applyFilters);
    if (fechaInput) fechaInput.addEventListener('change', applyFilters);
    if (materialSelect) materialSelect.addEventListener('change', applyFilters);
    // Nuevos filtros: lote y cantidad
    const loteInput = document.getElementById('filter-lote');
    const cantidadInput = document.getElementById('filter-cantidad');
    if (loteInput) loteInput.addEventListener('input', function () {
      // Transformar a mayúsculas mientras escribe
      this.value = this.value.toUpperCase();
      applyFilters();
    });
    if (cantidadInput) cantidadInput.addEventListener('input', applyFilters);
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (nombreSelect) nombreSelect.value = '';
        if (fechaInput) fechaInput.value = '';
        if (materialSelect) materialSelect.value = '';
        if (loteInput) loteInput.value = '';
        if (cantidadInput) cantidadInput.value = '';
        renderTable(dataset);
      });
    }
  }
}

/**
 * Pobla las listas desplegables con los valores únicos encontrados en el
 * dataset. Deja siempre la primera opción en blanco para permitir que no se
 * aplique ese filtro.
 */
function populateFilters() {
  const nombreSelect = document.getElementById('filter-nombre');
  const materialSelect = document.getElementById('filter-material');
  if (!nombreSelect || !materialSelect) return;
  // Obtener valores únicos para cada campo
  const nombres = Array.from(
    new Set(
      dataset
        .map((row) => row['Nombre 1'])
        .filter((val) => val !== undefined && val !== null && val !== '')
    )
  ).sort();
  const materiales = Array.from(
    new Set(
      dataset
        .map((row) => row['Texto breve de material'])
        .filter((val) => val !== undefined && val !== null && val !== '')
    )
  ).sort();
  // Añadir opciones al selector de nombres
  nombres.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    nombreSelect.appendChild(option);
  });
  // Añadir opciones al selector de materiales
  materiales.forEach((mat) => {
    const option = document.createElement('option');
    option.value = mat;
    option.textContent = mat;
    materialSelect.appendChild(option);
  });
}

/**
 * Dibuja la tabla con los datos proporcionados. Cada llamada reemplaza el
 * contenido del cuerpo de la tabla (tbody) para ajustarse al nuevo filtro.
 *
 * @param {Array<Object>} data - El conjunto de registros a mostrar.
 */
function renderTable(data) {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;
  // Limpiar el cuerpo de la tabla
  tbody.innerHTML = '';
  // Crear una fila para cada registro
  data.forEach((row) => {
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
  // Actualizar contador de filas
  updateRowCount(data.length);
}

/**
 * Convierte cualquier valor que represente una fecha en un objeto Date. Soporta
 * cadenas en formato dd/mm/aaaa, dd-mm-aaaa, aaaa-mm-dd y números de serie de Excel.
 * Si no se reconoce el formato, devuelve null.
 *
 * @param {any} value - El valor a convertir.
 * @returns {Date|null} - Objeto Date o null si no es convertible.
 */
function toDate(value) {
  if (!value) return null;
  // Ya es un objeto Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  // Si es un número (posible serial de Excel)
  if (typeof value === 'number') {
    // Excel cuenta los días desde 1899-12-31. Ajustamos a milisegundos.
    const utc = Math.round((value - 25569) * 86400 * 1000);
    const date = new Date(utc);
    return isNaN(date.getTime()) ? null : date;
  }
  // Si es una cadena
  if (typeof value === 'string') {
    // Probar formato dd/mm/aaaa o dd-mm-aaaa
    const parts = value.split(/[\/-]/);
    if (parts.length === 3) {
      let day, month, year;
      // Si la primera parte tiene 4 dígitos asumimos yyyy-mm-dd
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
    // Probar formato ISO estándar
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Convierte un valor de fecha a formato ISO (yyyy-mm-dd) para comparaciones.
 * Si el valor no se puede convertir, devuelve una cadena vacía.
 *
 * @param {any} dateVal - El valor de fecha.
 * @returns {string} - Cadena ISO o '' si no es convertible.
 */
function formatDateISO(dateVal) {
  const d = toDate(dateVal);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha para mostrarse al usuario en formato dd/mm/aaaa.
 * Si no se puede convertir, devuelve la cadena original o una cadena vacía.
 *
 * @param {any} dateVal - El valor de fecha.
 * @returns {string} - Cadena formateada para visualización.
 */
function formatDateDisplay(dateVal) {
  const d = toDate(dateVal);
  if (!d) return dateVal || '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Aplica los filtros seleccionados a la tabla. Filtra el dataset según el
 * nombre del acopio, la fecha seleccionada y el tipo de material. Luego
 * llama a renderTable para mostrar únicamente los registros filtrados.
 */
function applyFilters() {
  const nombre = document.getElementById('filter-nombre').value;
  const fecha = document.getElementById('filter-fecha').value;
  const material = document.getElementById('filter-material').value;
  const lote = document.getElementById('filter-lote').value.trim().toUpperCase();
  const cantidadStr = document.getElementById('filter-cantidad').value;
  let filtered = dataset;
  // Filtro por Acopio
  if (nombre) {
    filtered = filtered.filter((row) => row['Nombre 1'] === nombre);
  }
  // Filtro por Lote (busca coincidencia parcial en mayúsculas)
  if (lote) {
    filtered = filtered.filter((row) => {
      const loteVal = row['Lote'] ? String(row['Lote']).toUpperCase() : '';
      return loteVal.includes(lote);
    });
  }
  // Filtro por Tipo de material
  if (material) {
    filtered = filtered.filter((row) => row['Texto breve de material'] === material);
  }
  // Filtro por Fecha: comparar ISO (yyyy-mm-dd)
  if (fecha) {
    filtered = filtered.filter((row) => {
      const rowDate = formatDateISO(row['Fe.contabilización']);
      return rowDate === fecha;
    });
  }
  // Filtro por Cantidad absoluta
  if (cantidadStr) {
    const target = Math.abs(parseFloat(cantidadStr));
    if (!isNaN(target)) {
      filtered = filtered.filter((row) => {
        const val = parseFloat(row['Cantidad']);
        if (isNaN(val)) return false;
        return Math.abs(val) === target;
      });
    }
  }
  renderTable(filtered);
}

/**
 * Actualiza el texto del contador de filas debajo de la tabla.
 *
 * @param {number} count - Número de registros mostrados.
 */
function updateRowCount(count) {
  const countEl = document.getElementById('row-count');
  if (!countEl) return;
  const texto = count === 1 ? 'registro' : 'registros';
  countEl.textContent = `Mostrando ${count} ${texto}.`;
}

// Cargar el dataset una vez que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', loadDataset);