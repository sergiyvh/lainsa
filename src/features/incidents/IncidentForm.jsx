// src/features/incidents/IncidentForm.jsx
import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import { useI18n } from '../../i18n/i18n';
import { getIncidents, saveIncidents, newId, savePhotoDataUrl } from '../../services/dataBridge';
import { CLIENTS as clients } from '../../data/clients';
import CameraCapture from '../../components/CameraCapture';

// Витягнемо список клієнтів у форматі для UI
function useClientOptions() {
  const list = Array.isArray(clients) ? clients : [];
  return list.map(c => ({
    id: c.id ?? c.code ?? String(c.name || ''),
    name: c.name || c.title || c.label || String(c.id || ''),
  }));
}

export default function IncidentForm({ onSaved }) {
  const { t } = useI18n();

  // --- Стейт форми ---
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [responsible, setResponsible] = useState(''); // Відповідальний (текстове поле)
  const [type, setType] = useState('client'); // client | internal
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState(''); // авто-заповнюється з обраного клієнта
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState([]); // довільні ярлики (опційно)
  const [photos, setPhotos] = useState([]); // [{preview,dataUrl}]

  const clientOptions = useClientOptions();

  const selectedClient = useMemo(
    () => clientOptions.find(c => c.id === clientId) || null,
    [clientId, clientOptions]
  );

  // Валідація (мінімальні вимоги)
  const isClientRequired = type === 'client';
  const isValid =
    !!date &&
    (!!responsible && responsible.trim().length >= 2) &&
    (!isClientRequired || !!clientId) &&
    (!!desc && desc.trim().length >= 4);

  // Додати/видалити тег
  const addTag = (txt) => {
    const v = (txt || '').trim();
    if (!v) return;
    setTags(prev => (prev.includes(v) ? prev : [...prev, v]));
  };
  const removeTag = (v) => setTags(prev => prev.filter(x => x !== v));

  // Прийом фото із компонента камери
  const handleShot = (dataUrl) => {
    setPhotos(p => [...p, { preview: dataUrl, dataUrl }]);
  };

  // Збереження інциденту
  const handleSave = async () => {
    if (!isValid) return;

    const now = new Date().toISOString();
    const id = newId();

    // Збережемо фото у userData/assets (Electron) або у DataDirectory (Android)
    const saved = [];
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const res = await savePhotoDataUrl(p.dataUrl, `inc_${id}_${i + 1}`);
      saved.push(res?.success ? { path: res.path } : { inline: p.dataUrl });
    }

    const list = await getIncidents();
    const client = selectedClient;
    const record = {
      id,
      createdAt: now,
      date,
      type,                    // client | internal
      responsible: responsible.trim(),
      clientId: client?.id || null,
      clientName: client?.name || clientName || '',
      desc: desc.trim(),
      tags,
      photos: saved,
      status: 'open',          // open | closed
    };

    await saveIncidents([record, ...(Array.isArray(list) ? list : [])]);
    // Очистимо форму
    setDesc('');
    setTags([]);
    setPhotos([]);
    if (type === 'client') {
      setClientId('');
      setClientName('');
    }
    onSaved?.(record);
  };

  // UI допоміжне
  const bigFieldSx = { width: '100%' };
  const sectionTitle = (text) => (
    <Typography variant="subtitle1" sx={{ fontWeight: 600, opacity: 0.9, mb: 1 }}>
      {text}
    </Typography>
  );

  return (
    <Card elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <CardHeader
        title={t('incidents.createTitle') || 'Створення інциденту'}
        subheader={t('incidents.createSubtitle') || 'Додайте ключову інформацію та прикріпіть фото за потреби.'}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          {/* ===== Шапка: Дата, Відповідальний, Тип ===== */}
          <Grid item xs={12}>
            {sectionTitle(t('incidents.section_basic') || 'Основне')}
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label={t('labels_date') || 'Дата'}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              size="medium"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label={t('incidents.responsible') || 'Відповідальний'}
              placeholder={t('incidents.responsible_ph') || 'Ім’я та прізвище'}
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              fullWidth
              size="medium"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              label={t('incidents.type') || 'Тип інциденту'}
              value={type}
              onChange={(e) => setType(e.target.value)}
              fullWidth
              size="medium"
            >
              <MenuItem value="client">{t('incidents.type_client') || 'Клієнтський'}</MenuItem>
              <MenuItem value="internal">{t('incidents.type_internal') || 'Внутрішній'}</MenuItem>
            </TextField>
          </Grid>

          {/* ===== Клієнт (велике поле, зверху візуально) ===== */}
          <Grid item xs={12}>
            {sectionTitle(t('incidents.section_client') || 'Клієнт')}
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              select
              label={t('labels_client') || 'Клієнт'}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              fullWidth
              size="medium"
              disabled={type !== 'client'}
              helperText={
                type !== 'client'
                  ? (t('incidents.client_disabled') || 'Поле неактивне для внутрішніх інцидентів')
                  : (t('incidents.client_hint') || 'Оберіть клієнта зі списку')
              }
              SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 380, width: 520 } } } }}
            >
              <MenuItem value="">{t('common_select') || '— Оберіть —'}</MenuItem>
              {clientOptions.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar sx={{ width: 24, height: 24 }}>{(c.name || '?').slice(0, 1)}</Avatar>
                    <span>{c.name}</span>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      · {c.id}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label={t('incidents.client_contact') || 'Контакт клієнта (опціонально)'}
              placeholder={t('incidents.client_contact_ph') || 'Ім’я/телефон/email'}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              fullWidth
              size="medium"
              disabled={type !== 'client'}
            />
          </Grid>

          {/* ===== Опис + ярлики ===== */}
          <Grid item xs={12}>
            {sectionTitle(t('incidents.section_details') || 'Деталі')}
          </Grid>

          <Grid item xs={12}>
            <TextField
              label={t('incidents.description') || 'Опис інциденту'}
              placeholder={t('incidents.description_ph') || 'Коротко опишіть, що трапилось'}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              fullWidth
              size="medium"
              multiline
              minRows={3}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              label={t('incidents.add_tag') || 'Додати ярлик'}
              placeholder={t('incidents.add_tag_ph') || 'Напр.: рушник, пляма, пральня…'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              fullWidth
              size="medium"
              helperText={t('incidents.tag_help') || 'Натисніть Enter, щоб додати'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', minHeight: 48 }}>
              {tags.map(tag => (
                <Chip key={tag} label={tag} onDelete={() => removeTag(tag)} sx={{ mb: 1 }} />
              ))}
            </Stack>
          </Grid>

          {/* ===== Фото ===== */}
          <Grid item xs={12}>
            {sectionTitle(t('incidents.section_photos') || 'Фото')}
          </Grid>

          <Grid item xs={12} md={6}>
            <CameraCapture onShot={handleShot} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {photos.map((p, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: 160,
                    height: 110,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 1,
                    position: 'relative',
                    mr: 1, mb: 1,
                  }}
                >
                  <img src={p.preview} alt={`inc${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => setPhotos(arr => arr.filter((_, i) => i !== idx))}
                    sx={{ position: 'absolute', right: 6, bottom: 6, borderRadius: 2 }}
                  >
                    {t('actions_remove') || 'Видалити'}
                  </Button>
                </Box>
              ))}
              {photos.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('incidents.no_photos') || 'Фото ще не додані.'}
                </Typography>
              )}
            </Stack>
          </Grid>

          {/* ===== Дії ===== */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => {
                  setDesc(''); setTags([]); setPhotos([]);
                  setClientId(''); setClientName(''); setResponsible('');
                }}
              >
                {t('actions_clear') || 'Очистити'}
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={!isValid}>
                {t('actions_save') || 'Зберегти інцидент'}
              </Button>
            </Stack>
            {!isValid && (
              <Typography sx={{ mt: 1 }} color="warning.main">
                {t('incidents.form_incomplete') || 'Заповніть дату, відповідального, опис та (за потреби) клієнта.'}
              </Typography>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
