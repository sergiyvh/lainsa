// main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow;

// === ШЛЯХ ДО ДАНИХ У userData ===
function getDataFilePath(fileName) {
  return path.join(app.getPath('userData'), fileName);
}

// === СПИСОК ФАЙЛІВ У БЕКАПІ ===
// ДОДАЙ сюди всі ваші дані, які треба включити в резервну копію
const DATA_FILES_TO_BACKUP = [
  'users.json',
  'lainsa_records.json',
  'maintenance.json',      // (згодом для Варіанту 3)
  'quality_issues.json',   // (згодом для Варіанту 4)
  'audit_log.json'         // журнал подій — корисно мати навіть порожній
];

// === допоміжні: читання/запис набору файлів ===
function collectDataFiles() {
  const bundle = {};
  for (const fileName of DATA_FILES_TO_BACKUP) {
    const p = getDataFilePath(fileName);
    if (fs.existsSync(p)) {
      try { bundle[fileName] = JSON.parse(fs.readFileSync(p, 'utf8')); }
      catch (e) { console.warn('Skip (parse error):', fileName, e.message); }
    }
  }
  return bundle;
}

function writeDataFiles(bundle) {
  for (const [fileName, data] of Object.entries(bundle)) {
    const p = getDataFilePath(fileName);
    fs.writeFileSync(p, JSON.stringify(data ?? null, null, 2), 'utf8');
  }
}

// === ШИФРУВАННЯ (AES-256-GCM + scrypt) ===
function encrypt(jsonString, password) {
  const salt = crypto.randomBytes(16);
  const nonce = crypto.randomBytes(12);
  const key = crypto.scryptSync(password, salt, 32); // 256-біт
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const enc = Buffer.concat([cipher.update(jsonString, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { salt, nonce, tag, enc };
}

function decrypt(encBuf, salt, nonce, tag, password) {
  const key = crypto.scryptSync(password, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(encBuf), decipher.final()]);
  return dec.toString('utf8');
}

// === ВІКНО ===
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // якщо ти збираєш CRA, то це file:// build/index.html
  // інакше — http://localhost:3000 під час dev
  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL).catch(() => {
    const startUrl = path.join(__dirname, 'build', 'index.html');
    mainWindow.loadFile(startUrl);
  });
  } else {
    const startUrl = path.join(__dirname, 'build', 'index.html');
    mainWindow.loadFile(startUrl);
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// === IPC: базові читання/запис файлу даних ===
ipcMain.handle('read-data-file', async (_evt, fileName) => {
  try {
    const p = getDataFilePath(fileName);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('read-data-file error:', e);
    return null;
  }
});

ipcMain.handle('write-data-file', async (_evt, { fileName, data }) => {
  try {
    const p = getDataFilePath(fileName);
    fs.writeFileSync(p, JSON.stringify(data ?? null, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('write-data-file error:', e);
    return false;
  }
});

// === IPC: простий (НЕзашифрований) бекап/відновлення — якщо вже використовувався ===
ipcMain.handle('backup-data', async () => {
  const backupData = collectDataFiles();
  const defaultName = `lainsa_backup_${new Date().toISOString().slice(0,10)}.json`;
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Зберегти резервну копію (без шифрування)',
    defaultPath: defaultName,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled || !filePath) return { success: false, reason: 'canceled' };
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
  return { success: true, path: filePath };
});

ipcMain.handle('restore-data', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Відновити дані (без шифрування)',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths?.[0]) return { success: false, reason: 'canceled' };
  try {
    const data = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
    writeDataFiles(data);
    return { success: true };
  } catch (error) {
    console.error('Restore error:', error);
    return { success: false, error: error.message };
  }
});

// === IPC: збереження файлу-активу (фото інциденту) ===
ipcMain.handle('save-asset-file', async (_evt, { dataUrl, suggestedName }) => {
  try {
    const assetsDir = path.join(app.getPath('userData'), 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    // data:image/png;base64,....
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl || '');
    const mime = match ? match[1] : 'image/png';
    const ext = (mime.split('/')[1] || 'png').toLowerCase();

    const safeName = (suggestedName || `photo_${Date.now()}`).replace(/[^a-z0-9_\-]/gi, '_');
    const filePath = path.join(assetsDir, `${safeName}.${ext}`);

    const base64 = (dataUrl || '').split(',')[1];
    if (!base64) throw new Error('Bad dataUrl');
    const buf = Buffer.from(base64, 'base64');
    fs.writeFileSync(filePath, buf);

    return { success: true, path: filePath };
  } catch (e) {
    console.error('save-asset-file error:', e);
    return { success: false, error: e.message };
  }
});


// === IPC: ЗАШИФРОВАНИЙ backup/restore ===
// Формат файлу: [ "LAIBKPv1"(8b) | salt(16b) | nonce(12b) | tag(16b) | len(4b) | encPayload(len) ]
// payload = JSON.stringify({ header:{version,createdAt,appVersion}, files:{...} })
ipcMain.handle('backup-data-encrypted', async (_evt, { password }) => {
  if (!password || password.length < 4) {
    return { success: false, error: 'Пароль занадто короткий' };
  }
  const files = collectDataFiles();
  const payload = {
    header: { version: 1, createdAt: new Date().toISOString(), appVersion: app.getVersion?.() || 'dev' },
    files
  };
  const payloadStr = JSON.stringify(payload);
  const { salt, nonce, tag, enc } = encrypt(payloadStr, password);

  const defaultName = `lainsa_backup_${new Date().toISOString().slice(0,10)}.laibkp`;
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Зберегти зашифрований бекап',
    defaultPath: defaultName,
    filters: [{ name: 'LAINSA Backup', extensions: ['laibkp'] }]
  });
  if (canceled || !filePath) return { success: false, reason: 'canceled' };

  const magic = Buffer.from('LAIBKPv1');      // 8 байт
  const lenBuf = Buffer.alloc(4);             // довжина enc
  lenBuf.writeUInt32BE(enc.length, 0);
  const out = Buffer.concat([magic, salt, nonce, tag, lenBuf, enc]);
  fs.writeFileSync(filePath, out);
  return { success: true, path: filePath };
});

ipcMain.handle('restore-data-encrypted', async (_evt, { password }) => {
  if (!password || password.length < 4) {
    return { success: false, error: 'Введіть пароль' };
  }
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Відновити з зашифрованого бекапу',
    filters: [{ name: 'LAINSA Backup', extensions: ['laibkp'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths?.[0]) return { success: false, reason: 'canceled' };

  try {
    const buf = fs.readFileSync(filePaths[0]);
    const magic = buf.subarray(0, 8).toString('utf8');
    if (magic !== 'LAIBKPv1') return { success: false, error: 'Невірний формат файлу' };
    const salt = buf.subarray(8, 24);
    const nonce = buf.subarray(24, 36);
    const tag = buf.subarray(36, 52);
    const encLen = buf.readUInt32BE(52);
    const enc = buf.subarray(56, 56 + encLen);

    const jsonStr = decrypt(enc, salt, nonce, tag, password);
    const payload = JSON.parse(jsonStr);
    if (!payload?.files || typeof payload.files !== 'object') {
      return { success: false, error: 'Порожній або пошкоджений бекап' };
    }
    writeDataFiles(payload.files);
    return { success: true };
  } catch (e) {
    console.error('restore-data-encrypted error:', e);
    return { success: false, error: 'Невірний пароль або пошкоджений файл' };
  }
});

// === APP LIFECYCLE ===

// === IPC: print current window to PDF ===
ipcMain.handle('save-pdf', async (_evt, options = {}) => {
  try {
    const target = BrowserWindow.getFocusedWindow() || mainWindow;
    if (!target) throw new Error('No window');
    const pdfData = await target.webContents.printToPDF({
      marginsType: 1,
      printBackground: true,
      landscape: !!options.landscape,
      pageSize: options.pageSize || 'A4'
    });
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar PDF',
      defaultPath: options.defaultPath || 'report.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { success: false, reason: 'canceled' };
    require('fs').writeFileSync(filePath, pdfData);
    return { success: true, path: filePath };
  } catch (e) {
    console.error('save-pdf error:', e);
    return { success: false, error: e.message };
  }
});

app.whenReady().then(createWindow);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
ipcMain.handle('app:getVersion', async () => (app.getVersion && app.getVersion()) || 'dev');

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
