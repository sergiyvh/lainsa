// incidentsService.js
// Зберігання інцидентів: window.api.kv (якщо є) або localStorage.
// Ключ: 'lainsa.incidents'

const KEY = 'lainsa.incidents';

function kv() {
  try { return window?.api?.kv || null; } catch { return null; }
}

function readAll() {
  const k = kv();
  if (k) return k.get(KEY) || [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  const k = kv();
  if (k) return k.set(KEY, list);
  localStorage.setItem(KEY, JSON.stringify(list));
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

export function listIncidents() {
  return readAll();
}

export function getIncident(id) {
  return readAll().find(x => x.id === id) || null;
}

export function addIncident(incident) {
  const item = {
    id: incident.id || uuid(),
    date: incident.date || new Date().toISOString(),
    responsible: incident.responsible || '',
    client: incident.client || '',
    type: incident.type || '',
    description: incident.description || '',
    photos: Array.isArray(incident.photos) ? incident.photos : []
  };
  const all = readAll();
  all.unshift(item);
  writeAll(all);
  return item;
}

export function updateIncident(id, patch) {
  const all = readAll();
  const idx = all.findIndex(x => x.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, id };
  writeAll(all);
  return all[idx];
}

export function removeIncident(id) {
  const all = readAll();
  const next = all.filter(x => x.id !== id);
  writeAll(next);
}

export function findIncidentsBetween(start, end) {
  const s = start ? new Date(start).getTime() : -Infinity;
  const e = end ? new Date(end).getTime() : Infinity;
  return readAll().filter(x => {
    const t = x.date ? new Date(x.date).getTime() : NaN;
    return !Number.isNaN(t) && t >= s && t <= e;
  });
}
