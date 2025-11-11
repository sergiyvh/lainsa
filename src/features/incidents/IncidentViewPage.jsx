// IncidentViewPage.jsx
import React from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Stack, Typography, Button, Divider, Chip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import IosShareIcon from '@mui/icons-material/IosShare';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { getIncident } from './incidentsService';
import { jsonToBlob, saveBlobToDevice, shareBlob } from '../../core/files/saveShare';
import { buildIncidentPDF, downloadDoc } from '../../core/pdf/exporters';
import { useI18n } from '../../i18n/i18n';

export default function IncidentViewPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = React.useState(null);

  React.useEffect(() => {
    const it = getIncident(id);
    if (!it) {
      alert(t('incidents.not_found') || 'Incident not found');
      navigate(-1);
      return;
    }
    setIncident(it);
  }, [id, navigate, t]);

  if (!incident) return null;

  const fileBase = `Incident_${safeName(incident.client)}_${(incident.date || '').slice(0,10)}`;

  const handleSaveJson = async () => {
    const blob = jsonToBlob(incident);
    await saveBlobToDevice(blob, `${fileBase}.json`);
  };

  const handleShareJson = async () => {
    const blob = jsonToBlob(incident);
    await shareBlob(blob, `${fileBase}.json`, 'application/json');
  };

  const handleExportPdf = async () => {
    const doc = buildIncidentPDF({ incident, t });
    downloadDoc(doc, `${fileBase}.pdf`);
  };

  const handleExportExcel = async () => {
    const XLSX = (await import('xlsx')).default;
    const wb = XLSX.utils.book_new();

    // Sheet "Detalle"
    const detalle = [
      [t('common.date'), fmt(incident.date)],
      [t('incidents.responsible'), incident.responsible || ''],
      [t('incidents.client'), incident.client || ''],
      [t('incidents.type'), incident.type || ''],
      [t('incidents.description'), incident.description || ''],
      [t('incidents.photos'), (incident.photos || []).length]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(detalle);
    XLSX.utils.book_append_sheet(wb, ws1, 'Detalle');

    // Sheet "Fotos" (listado de nombres/rutas)
    const photos = (incident.photos || []).map((p, i) => ({
      n: i + 1,
      name: p.name || '',
      path: p.path || '',
      platform: p.platform || '',
      mime: p.mime || '',
    }));
    const ws2 = XLSX.utils.json_to_sheet(photos);
    XLSX.utils.book_append_sheet(wb, ws2, 'Fotos');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    await saveBlobToDevice(blob, `${fileBase}.xlsx`);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} variant="text">
          {t('back') || 'Back'}
        </Button>
      </Stack>

      <Typography variant="h5" sx={{ mb: 1 }}>
        {t('incidents.view_title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {fmt(incident.date)}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSaveJson}>
          {t('actions.save_to_device')}
        </Button>
        <Button startIcon={<IosShareIcon />} variant="outlined" onClick={handleShareJson}>
          {t('actions.share')}
        </Button>
        <Button startIcon={<PictureAsPdfIcon />} variant="outlined" onClick={handleExportPdf}>
          {t('actions.export_pdf')}
        </Button>
        <Button startIcon={<GridOnIcon />} variant="outlined" onClick={handleExportExcel}>
          {t('actions.export_excel')}
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={0.75}>
        <Row label={t('incidents.responsible')} value={incident.responsible} />
        <Row label={t('incidents.client')} value={incident.client} />
        <Row label={t('incidents.type')} value={<Chip size="small" label={incident.type || ''} />} />
        <Row label={t('incidents.description')} value={incident.description} />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {t('incidents.photos')}
      </Typography>
      {(incident.photos || []).length ? (
        <Stack spacing={0.5}>
          {(incident.photos || []).map((p, idx) => (
            <Typography key={p.id || idx} variant="body2">
              • {p.name || p.path || p.id}
            </Typography>
          ))}
        </Stack>
      ) : (
        <Typography color="text.secondary">{t('incidents.no_photos')}</Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <Button
        component={RouterLink}
        to="/incidents/list"
        variant="text"
      >
        {t('incidents.list_title')}
      </Button>
    </Box>
  );
}

function Row({ label, value }) {
  return (
    <Stack direction="row" spacing={1}>
      <Typography sx={{ minWidth: 140, fontWeight: 600 }}>{label}:</Typography>
      {typeof value === 'string' || typeof value === 'number'
        ? <Typography>{value || '-'}</Typography>
        : value}
    </Stack>
  );
}

function fmt(v) { try { return v ? new Date(v).toLocaleString() : ''; } catch { return String(v || ''); } }
function safeName(s='') { return s.replace(/[^\w\-]+/g, '_'); }
