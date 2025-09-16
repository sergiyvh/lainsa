// src/core/data.js
export async function readJson(fileName, fallback = null) {
  const raw = await window.electronAPI.readDataFile(fileName);
  return raw ?? fallback;
}

export async function writeJson(fileName, data) {
  return await window.electronAPI.writeDataFile({ fileName, data });
}

const INCIDENTS_FILE = 'incidents.json';

export async function getIncidents() {
  const data = await readJson(INCIDENTS_FILE, { items: [] });
  if (!data.items) data.items = [];
  return data;
}

export async function addIncident(incident) {
  const db = await getIncidents();
  db.items.unshift(incident); // нові зверху
  await writeJson(INCIDENTS_FILE, db);
  return incident;
}
