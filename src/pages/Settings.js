// src/pages/Settings.js
// Налаштування: вибір мови + Резервна копія (експорт/імпорт .json)
// Працює в Electron і в браузері (через file-saver).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Paper, Typography, Button, Divider, Stack,
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
      alert(t('backup_error_save'));
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
      alert(t('import_success'));
    } catch (err) {
      console.error(err);
      alert(t('import_error'));
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t('nav_settings')}</Typography>

      {/* Мова інтерфейсу */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>{t('settings_lang_title')}</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t('lang_label')}</InputLabel>
          <Select label={t('lang_label')} value={lang} onChange={(e) => setLang(e.target.value)}>
            <MenuItem value="es">{t('lang_es')}</MenuItem>
            <MenuItem value="uk">{t('lang_uk')}</MenuItem>
            <MenuItem value="ca">{t('lang_ca')}</MenuItem>
            <MenuItem value="en">{t('lang_en')}</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('settings_lang_note')}
        </Typography>
      </Paper>

      {/* Бекап / Відновлення */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>{t('backup_title')}</Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button variant="contained" onClick={handleBackup}>{t('backup_create')}</Button>
          <Button variant="outlined" onClick={onPickRestore}>{t('backup_restore')}</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleRestore}
          />
        </Stack>

        <Alert severity={envElectron ? 'success' : 'info'} sx={{ mb: 2 }}>
          {t('environment')}: {envElectron ? t('environment_electron') : t('environment_web')}
        </Alert>

        <Typography variant="subtitle1" gutterBottom>{t('data_preview')}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('key')}</TableCell>
              <TableCell align="right">{t('items')}</TableCell>
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
                <TableCell colSpan={2}>{t('no_tasks')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t('backup_note')}
        </Typography>
      </Paper>
    </Box>
  );
}
