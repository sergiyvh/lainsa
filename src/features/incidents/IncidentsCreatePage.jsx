// IncidentsCreatePage.jsx
import React from 'react';
import {
  Box, Stack, TextField, Button, MenuItem, Typography, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Autocomplete from '@mui/material/Autocomplete';

import { addIncident } from './incidentsService';
import PhotoPicker from './PhotoPicker';
import { useI18n } from '../../i18n/i18n';
import { useNavigate } from 'react-router-dom';

// ІМПОРТ СПИСКУ КЛІЄНТІВ
// Підтримуються формати: ['Melia', 'Iberostar', ...] або [{id, name}, ...] або [{title: 'Melia'}, ...]
import { CLIENTS as clientsRaw } from '../../data/clients';


function normalizeClients(list) {
  if (!Array.isArray(list)) return [];
  return list.map((x) => {
    if (typeof x === 'string') return { id: x, name: x };
    if (x && typeof x === 'object') {
      return {
        id: x.id ?? x.name ?? x.title ?? String(Math.random()),
        name: x.name ?? x.title ?? String(x?.toString?.() || ''),
        ...x,
      };
    }
    return { id: String(x), name: String(x) };
  }).filter(x => x.name && x.name.trim().length > 0);
}

const CLIENTS = normalizeClients(clientsRaw);

export default function IncidentsCreatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [form, setForm] = React.useState({
    date: new Date().toISOString(),
    responsible: '',
    client: '',
    type: '',
    description: '',
    photos: []
  });

  const set = (key) => (e) =>
    setForm(f => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    try {
      const created = addIncident(form);
      alert(t('incidents.created_ok'));
      navigate(`/incidents/list`);
    } catch (err) {
      console.error(err);
      alert(t('incidents.created_fail'));
    }
  };

  const handleClientChange = (_evt, option) => {
    const value = typeof option === 'string' ? option : option?.name || '';
    setForm(f => ({ ...f, client: value }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>{t('incidents.create_title')}</Typography>

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Дата/час */}
          <TextField
            label={t('common.date')}
            type="datetime-local"
            value={toLocalInput(form.date)}
            onChange={e => setForm(f => ({ ...f, date: fromLocalInput(e.target.value) }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          {/* Відповідальний */}
          <TextField
            label={t('incidents.responsible')}
            value={form.responsible}
            onChange={set('responsible')}
            fullWidth
          />

          {/* Клієнт — Autocomplete зі списку */}
          <Autocomplete
  options={CLIENTS}
  getOptionLabel={(opt) => (typeof opt === 'string' ? opt : (opt?.name || ''))}
  isOptionEqualToValue={(opt, val) => (opt?.id ?? opt?.name) === (val?.id ?? val?.name)}
  value={CLIENTS.find(o => (o?.name || o) === form.client) || null}
  onChange={(_evt, option) => {
    const value = typeof option === 'string' ? option : option?.name || '';
    setForm(f => ({ ...f, client: value }));
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label={t('incidents.client')}
      placeholder={t('incidents.client')}
      fullWidth
    />
  )}
  clearOnBlur={false}
  autoHighlight
  includeInputInList
  blurOnSelect
/>


          {/* Тип інциденту */}
          <TextField
            label={t('incidents.type')}
            value={form.type}
            onChange={set('type')}
            select
            fullWidth
          >
            <MenuItem value="ropa">Ropa</MenuItem>
            <MenuItem value="maquinaria">Maquinaria</MenuItem>
            <MenuItem value="otro">{t('common.other') || 'Other'}</MenuItem>
          </TextField>

          {/* Опис */}
          <TextField
            label={t('incidents.description')}
            value={form.description}
            onChange={set('description')}
            multiline
            minRows={3}
            fullWidth
          />

          {/* Фото */}
          <PhotoPicker value={form.photos} onChange={set('photos')} t={t} />

          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" startIcon={<AddIcon />}>
              {t('incidents.create_btn')}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

function toLocalInput(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth()+1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch { return ''; }
}
function fromLocalInput(v) {
  try { return new Date(v).toISOString(); } catch { return new Date().toISOString(); }
}
