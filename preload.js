// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  // PDF/Save (якщо використовуєш)
  savePdf: (options) => ipcRenderer.invoke('save-pdf', options),

  // Робота з файлами даних
  readDataFile: (fileName) => ipcRenderer.invoke('read-data-file', fileName),
  writeDataFile: (options) => ipcRenderer.invoke('write-data-file', options),

  // Бекапи
  backupData: () => ipcRenderer.invoke('backup-data'),
  restoreData: () => ipcRenderer.invoke('restore-data'),

  // Зашифрований backup/restore
  backupDataEncrypted: (password) => ipcRenderer.invoke('backup-data-encrypted', { password }),
  restoreDataEncrypted: (password) => ipcRenderer.invoke('restore-data-encrypted', { password }),

  // НОВЕ: збереження файлу-активу (фото інциденту) в userData/assets
  saveAssetFile: ({ dataUrl, suggestedName }) =>
    ipcRenderer.invoke('save-asset-file', { dataUrl, suggestedName }),
});
