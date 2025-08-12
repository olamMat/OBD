/*
 * script.js
 *
 * Este archivo contiene la lógica principal de la aplicación web. Se encarga de
 * cargar los datos desde un archivo Excel o desde localStorage, poblar los
 * filtros dinámicos y renderizar la tabla con los registros filtrados. Además,
 * define funciones de utilidad como el formateo de fechas y la aplicación de
 * filtros según el estado de los selectores.
 */

// Almacén de datos global. Inicialmente vacío, se cargará al iniciar la página mediante la API.
let dataset = [];

/**
 * Carga el conjunto de datos. Primero intenta leer desde localStorage, lo que
 * permite que un administrador actualice el archivo sin tener que reimplantar
 * la aplicación. Si no hay datos almacenados, se carga el archivo por defecto
 * (OBD.xlsx) mediante fetch y la librería SheetJS (xlsx).
 */
function loadDataset() {
  // Solicitar datos al servidor
  fetch('/api/data')
    .then((res) => res.json())
    .then((data) => {
      dataset = data;
      initPage();
    })
    .catch((err) => {
      console.error('Error al cargar datos desde el servidor:', err);
    });
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