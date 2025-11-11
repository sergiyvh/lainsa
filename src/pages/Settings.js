// src/pages/Settings.js
// Налаштування: вибір мови + Резервна копія (експорт/імпорт .json)
// Працює в Electron і в браузері (через file-saver).

import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Typography, Button, Stack,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, Alert
} from '@mui/material';
import { useI18n, t } from '../i18n/i18n';
import { getData, saveData } from '../services/storageService';
import { saveAs } from 'file-saver';

const DEFAULT_KEYS = [
  'lainsa_records',
  'maintenance',
  'machines',
  'clients',
  'users',
  'current_shift',
  'app_prefs'
];

function isElectron() {
  try {
    return !!(window && window.process && window.process.versions && window.process.versions.electron) || !!window.electronAPI;
  } catch { return false; }
}

export default function Settings() {
  const { lang, setLang } = useI18n();
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);
  const envElectron = isElectron();

  // Попередній перегляд даних (скільки запишемо у бекап)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = [];
        for (const key of DEFAULT_KEYS) {
          try {
            const val = await getData(key);
            if (val != null) {
              const count = Array.isArray(val)
                ? val.length
                : (val && typeof val === 'object' ? Object.keys(val).length : 1);
              rows.push({ key, count });
            }
          } catch {}
        }
        if (alive) setPreview(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleBackup = async () => {
    const payload = {
      meta: {
        exportedAt: new Date().toISOString(),
        app: 'LainsaApp',
        lang,
        env: envElectron ? 'electron' : 'web'
      },
      data: {}
    };

    for (const key of DEFAULT_KEYS) {
      try {
        const val = await getData(key);
        if (val != null) payload.data[key] = val;
      } catch {}
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `lainsa-backup-${ts}.json`;

    try {
      // Використовуємо file-saver (працює і в Electron, і у браузері)
      saveAs(blob, filename);
    } catch (err) {
      console.error(err);
      alert(t('backup_error_save') || 'No se pudo guardar el archivo');
    }
  };

  const onPickRestore = () => fileRef.current?.click();

  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // щоб можна було вибрати той самий файл знову
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json || typeof json !== 'object' || !json.data) throw new Error('bad file');

      const entries = Object.entries(json.data);
      for (const [key, val] of entries) {
        await saveData(key, val);
      }
      alert(t('import_success') || 'Importación correcta');
    } catch (err) {
      console.error(err);
      alert(t('import_error') || 'No se pudo importar el archivo');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t('nav_settings') || 'Ajustes'}</Typography>

      {/* Мова інтерфейсу */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>{t('settings_lang_title') || 'Idioma de la interfaz'}</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t('lang_label') || 'Idioma'}</InputLabel>
          <Select label={t('lang_label') || 'Idioma'} value={lang} onChange={(e) => setLang(e.target.value)}>
            <MenuItem value="es">{t('lang_es') || 'Español'}</MenuItem>
            <MenuItem value="uk">{t('lang_uk') || 'Ucraniano'}</MenuItem>
            <MenuItem value="ca">{t('lang_ca') || 'Catalán'}</MenuItem>
            <MenuItem value="en">{t('lang_en') || 'Inglés'}</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('settings_lang_note') || 'Se aplica inmediatamente.'}
        </Typography>
      </Paper>

      {/* Бекап / Відновлення */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>{t('backup_title') || 'Copia de seguridad'}</Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={handleBackup}>{t('backup_create') || 'Exportar'}</Button>
          <Button variant="outlined" onClick={onPickRestore}>{t('backup_restore') || 'Importar'}</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleRestore}
          />
        </Stack>

        <Alert severity={envElectron ? 'success' : 'info'} sx={{ mb: 2 }}>
          {(t('environment') || 'Entorno') + ': ' + (envElectron ? (t('environment_electron') || 'Electron') : (t('environment_web') || 'Web'))}
        </Alert>

        <Typography variant="subtitle1" gutterBottom>{t('data_preview') || 'Datos a exportar'}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('key') || 'Clave'}</TableCell>
              <TableCell align="right">{t('items') || 'Elementos'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {preview.map(row => (
              <TableRow key={row.key}>
                <TableCell>{row.key}</TableCell>
                <TableCell align="right">{row.count}</TableCell>
              </TableRow>
            ))}
            {!loading && preview.length === 0 && (
              <TableRow>
                <TableCell colSpan={2}>{t('no_tasks') || 'Sin datos'}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t('backup_note') || 'El archivo .json contiene tus datos; guárdalo en un lugar seguro.'}
        </Typography>
      </Paper>
    </Box>
  );
}
