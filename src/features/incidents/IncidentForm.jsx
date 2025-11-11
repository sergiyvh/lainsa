// src/features/incidents/IncidentForm.jsx
import React, { useMemo, useState } from 'react';
import {
  Box, Button, Card, CardContent, Divider, Grid, MenuItem, Stack, TextField,
  Typography, Chip, Avatar, FormControl, InputLabel, Select
} from '@mui/material';
import { useI18n } from '../../i18n/i18n';
import { getIncidents, saveIncidents, newId, savePhotoDataUrl } from '../../services/dataBridge';
import { CLIENTS as clients } from '../../data/clients';
import CameraCapture from '../../components/CameraCapture';

function useClientOptions() {
  const list = Array.isArray(clients) ? clients : [];
  return list.map(c => ({ id: c.code, name: c.name }));
}

export default function IncidentForm({ user, onSaved }) {
  const { t } = useI18n();
  const clientOptions = useClientOptions();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [responsible, setResponsible] = useState(user?.username || '');
  const [type, setType] = useState('client');
  const [clientId, setClientId] = useState('');
  const [description, setDesc] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isCameraOpen, setCameraOpen] = useState(false);

  const isValid = useMemo(() => date && responsible && description && type, [date, responsible, description, type]);

  const handlePhotoCaptured = (dataUrl) => {
    if (dataUrl) {
      setPhotos(prev => [...prev, { name: `photo_${Date.now()}.jpg`, dataUrl }]);
    }
    setCameraOpen(false);
  };
  
  const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => setPhotos(prev => [...prev, { name: file.name, dataUrl: e.target.result }]);
          reader.readAsDataURL(file);
      }
  };

  const handleSave = async () => {
    if (!isValid) {
      alert(t('incidents_form_incomplete'));
      return;
    }

    const savedPhotos = [];
    for (const photo of photos) {
        const result = await savePhotoDataUrl(photo.dataUrl, photo.name);
        if (result.path) savedPhotos.push({ path: result.path });
    }

    const newIncident = {
      id: newId(), createdAt: new Date().toISOString(), date, type, clientId,
      clientName: clientOptions.find(c => c.id == clientId)?.name || '',
      description, responsible, status: 'open', photos: savedPhotos,
    };
    
    const allIncidents = await getIncidents();
    await saveIncidents([newIncident, ...allIncidents]);
    
    setDate(new Date().toISOString().slice(0, 10));
    setDesc('');
    setPhotos([]);
    setClientId('');
    if (onSaved) onSaved();
  };

  if (isCameraOpen) {
    return <CameraCapture onCapture={handlePhotoCaptured} />;
  }

  return (
    <Card elevation={3} sx={{ borderRadius: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{t('incidents_form_title')}</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>{t('incidents_type')}</InputLabel>
                        <Select value={type} label={t('incidents_type')} onChange={e => setType(e.target.value)}>
                            <MenuItem value="client">{t('incidents_type_client')}</MenuItem>
                            <MenuItem value="technical">{t('incidents_type_technical')}</MenuItem>
                            <MenuItem value="logistics">{t('incidents_type_logistics')}</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" disabled={type !== 'client'}>
                        <InputLabel>{t('incidents_client')}</InputLabel>
                        <Select value={clientId} label={t('incidents_client')} onChange={e => setClientId(e.target.value)}>
                            <MenuItem value=""><em>N/A</em></MenuItem>
                            {clientOptions.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField label={t('incidents_date')} type="date" value={date} onChange={e => setDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
                    <TextField label={t('incidents_responsible')} value={responsible} onChange={e => setResponsible(e.target.value)} size="small" />
                </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                    <TextField label={t('incidents_description')} multiline rows={5} value={description} onChange={e => setDesc(e.target.value)} placeholder={t('incidents_description_placeholder')} />
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>{t('incidents_photos')}</Typography>
                        <Stack direction="row" spacing={1}>
                            <Button variant="outlined" size="small" onClick={() => setCameraOpen(true)}>{t('incidents_add_photo_cam')}</Button>
                            <Button variant="outlined" size="small" component="label">{t('incidents_add_photo_gal')}<input type="file" accept="image/*" hidden onChange={handleFileUpload} /></Button>
                        </Stack>
                        {photos.map((p, i) => (
                           <Chip key={i} avatar={<Avatar src={p.dataUrl} />} label={p.name} onDelete={() => setPhotos(photos.filter((_, idx) => idx !== i))} sx={{mt:1, mr:1}} />
                        ))}
                    </Box>
                </Stack>
            </Grid>
            <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => { setDesc(''); setPhotos([]); setClientId(''); }}>{t('actions_clear')}</Button>
                    <Button variant="contained" onClick={handleSave} disabled={!isValid}>{t('actions_save')}</Button>
                </Stack>
            </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}