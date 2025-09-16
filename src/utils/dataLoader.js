// Універсальне завантаження записів із різних джерел.
// Повертає масив записів або [].

function looksLikeRecord(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const keys = Object.keys(obj);
  // мінімальний евристичний набір полів
  const hints = ['date', 'shift', 'client', 'program', 'programCode', 'machine', 'machineId', 'producedKg', 'cycles'];
  return hints.some(k => keys.includes(k));
}

function firstArrayOfRecordsInObject(o) {
  if (!o || typeof o !== 'object') return null;
  // 1) якщо сам об'єкт — масив записів
  if (Array.isArray(o) && o.some(looksLikeRecord)) return o;

  // 2) якщо є поле records
  if (Array.isArray(o.records) && o.records.some(looksLikeRecord)) return o.records;

  // 3) глибокий пошук по власних полях
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (Array.isArray(v) && v.some(looksLikeRecord)) return v;
    if (v && typeof v === 'object') {
      const found = firstArrayOfRecordsInObject(v);
      if (found) return found;
    }
  }
  return null;
}

async function tryReadJsonFile(path) {
  try {
    if (window.files?.readJSON) return await window.files.readJSON(path);
    if (window.electronAPI?.readJSON) return await window.electronAPI.readJSON(path);
  } catch {}
  return null;
}

async function tryStorageServiceKeys(keys) {
  // Підтримка твоїх preload‑бриджів, якщо є
  try {
    // варіанти імен
    const api = window.api || window.electronAPI || {};
    const store = api.storage || api.db || api.files || {};
    const getData = store.getData || store.get || store.read || null;
    if (!getData) return null;

    for (const k of keys) {
      try {
        const d = await getData(k);
        if (Array.isArray(d) && d.length) return d;
        const arr = firstArrayOfRecordsInObject(d);
        if (arr) return arr;
      } catch {}
    }
  } catch {}
  return null;
}

function tryLocalStorageKeys(keys) {
  try {
    if (typeof localStorage === 'undefined') return null;
  } catch { return null; }

  // 1) точкові ключі
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length && data.some(looksLikeRecord)) return data;
      const arr = firstArrayOfRecordsInObject(data);
      if (arr) return arr;
    } catch {}
  }

  // 2) глибокий перебір усіх ключів — як «останній шанс»
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length && data.some(looksLikeRecord)) return data;
        const arr = firstArrayOfRecordsInObject(data);
        if (arr) return arr;
      } catch {}
    }
  } catch {}
  return null;
}

export async function loadAllRawRecords() {
  // 1) Офіційні методи, якщо є
  try {
    if (window.api?.records?.getAll) {
      const d = await window.api.records.getAll();
      if (Array.isArray(d)) return d;
      const arr = firstArrayOfRecordsInObject(d);
      if (arr) return arr;
    }
  } catch {}

  try {
    if (window.electronAPI?.getAllRecords) {
      const d = await window.electronAPI.getAllRecords();
      if (Array.isArray(d)) return d;
      const arr = firstArrayOfRecordsInObject(d);
      if (arr) return arr;
    }
  } catch {}

  // 2) Сховище/БД через preload
  const storageCandidates = [
    'records',
    'production_records',
    'prod_records',
    'db_records',
    'app_records',
    'data',
    'backup',
  ];
  const svc = await tryStorageServiceKeys(storageCandidates);
  if (svc) return svc;

  // 3) Файли
  const files = [
    'records.json',
    'data.json',
    'backup.json',
    'db.json',
    'app_data.json',
  ];
  for (const f of files) {
    const d = await tryReadJsonFile(f);
    const arr = firstArrayOfRecordsInObject(d);
    if (arr) return arr;
  }

  // 4) localStorage
  const lsCandidates = [
    'records',
    'db',
    'backup',
    'app_data',
    'lainsa_db',
    'production',
  ];
  const ls = tryLocalStorageKeys(lsCandidates);
  if (ls) return ls;

  // Нічого не знайшли
  return [];
}
