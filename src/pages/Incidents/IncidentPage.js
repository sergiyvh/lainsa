// IncidentPage.js
// Сторінка: список інцидентів + форма створення/редагування.
// Фіксує: передає user у форму, оновлює список після збереження, підключає камеру, чистий UI.

import React from 'react';
import { Box, Stack, Typography, Divider, List, ListItem, ListItemText, Paper } from '@mui/material';
import IncidentForm from '../features/incidents/IncidentForm';
import { listIncidents } from '../features/incidents/incidentsService';
import { useI18n } from '../i18n/i18n';

export default function IncidentPage({ currentUser }) {
  const { t } = useI18n();
  const user = currentUser || getUserFallback();

  const [items, setItems] = React.useState([]);

  const reload = React.useCallback(() => {
    const all = listIncidents();
    setItems(all);
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const handleSaved = () => {
    reload(); // оновити список після збереження
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>{t('incidents.page_title') || 'Incidencias'}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('incidents.page_subtitle') || 'Crear y listar incidencias'}
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper sx={{ flex: 1, minWidth: 320 }}>
          <IncidentForm user={user} onSaved={handleSaved} />
        </Paper>

        <Paper sx={{ flex: 1, minWidth: 320, p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('incidents.list_title') || 'Lista'}</Typography>
          <Divider sx={{ mb: 1 }} />
          <List dense>
            {items.length === 0 && (
              <Typography color="text.secondary">{t('incidents.empty') || 'No hay incidencias.'}</Typography>
            )}
            {items.map((it) => (
              <ListItem key={it.id} alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemText
                  primary={`${fmt(it.date)} — ${it.client || '-'} — ${it.type || '-'}`}
                  secondary={it.description}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Stack>
    </Box>
  );
}

function fmt(v) { try { return v ? new Date(v).toLocaleString() : ''; } catch { return String(v || ''); } }

// Фолбек користувача, якщо не прийшов пропами
function getUserFallback() {
  // спробуємо взяти з глобальної сесії Electron/Preload або з localStorage
  try {
    const u = window?.api?.session?.get?.('user');
    if (u) return u;
  } catch {}
  try {
    const raw = localStorage.getItem('lainsa.currentUser');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { id: 'unknown', name: 'Operator' };
}
