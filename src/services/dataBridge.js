// src/services/dataBridge.js
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

const api = (typeof window !== 'undefined' && window.electronAPI) ? window.electronAPI : null;
const isCap = (() => { try { return Capacitor?.isNativePlatform?.(); } catch { return false; } })();

// ------- універсальні JSON helpers -------
async function readJson(fileName, fallback) {
  // Electron
  if (api) {
    const data = await api.readDataFile(fileName); // main.js -> 'read-data-file'
    return (data == null ? fallback : data);
  }
  // Capacitor (Android/iOS)
  if (isCap) {
    try {
      const res = await Filesystem.readFile({ path: `data/${fileName}`, directory: Directory.Data });
      return JSON.parse(res.data || 'null') ?? fallback;
    } catch {
      return fallback;
    }
  }
  // Веб-режим
  return fallback;
}

async function writeJson(fileName, data) {
  // Electron
  if (api) return api.writeDataFile({ fileName, data }); // main.js -> 'write-data-file'
  // Capacitor
  if (isCap) {
    await Filesystem.writeFile({
      path: `data/${fileName}`,
      directory: Directory.Data,
      data: JSON.stringify(data, null, 2)
    });
    return true;
  }
  return false;
}

// --------- Incidents ----------
const FILE = 'incidents.json';

export async function getIncidents() {
  const list = await readJson(FILE, []);
  return Array.isArray(list) ? list : [];
}

export async function saveIncidents(list) {
  return writeJson(FILE, list);
}

export function newId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

export async function savePhotoDataUrl(dataUrl, suggestedName) {
  // Electron: збереження у userData/assets через IPC
  if (api) return api.saveAssetFile({ dataUrl, suggestedName });

  // Capacitor: у внутрішнє сховище застосунку
  if (isCap) {
    const base64 = (dataUrl || '').split(',')[1];
    const filePath = `assets/${suggestedName}.jpg`;
    await Filesystem.writeFile({ path: filePath, directory: Directory.Data, data: base64 });
    return { success: true, path: filePath };
  }

  return { success: false, error: 'No backend available' };
}
