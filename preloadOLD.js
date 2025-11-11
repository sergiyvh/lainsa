// preload.js

const { contextBridge, ipcRenderer } = require('electron');

const { contextBridge, app } = require('electron');
contextBridge.exposeInMainWorld('api', {
  app: {
    getVersion: () => Promise.resolve(app.getVersion()),
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  // PDF/Save (якщо використовуєте)
  savePdf: (options) => ipcRenderer.invoke('save-pdf', options),

  // Робота з файлами даних
  readDataFile: (fileName) => ipcRenderer.invoke('read-data-file', fileName),
  writeDataFile: (options) => ipcRenderer.invoke('write-data-file', options),

  // Простий (НЕзашифрований) бекап/відновлення — якщо вже було в UI
  backupData: () => ipcRenderer.invoke('backup-data'),
  restoreData: () => ipcRenderer.invoke('restore-data'),

  // НОВЕ: ЗАШИФРОВАНИЙ backup/restore
  backupDataEncrypted: (password) => ipcRenderer.invoke('backup-data-encrypted', { password }),
  restoreDataEncrypted: (password) => ipcRenderer.invoke('restore-data-encrypted', { password }),
});
