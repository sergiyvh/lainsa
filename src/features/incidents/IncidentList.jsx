import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Chip, Divider, Grid, IconButton, Stack, TextField,
  Typography, Button
} from '@mui/material';
import { useI18n } from '../../i18n/i18n';
import { getIncidents, saveIncidents } from '../../services/dataBridge';
import { CLIENTS as clients } from '../../data/clients';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate } from 'react-router-dom';

export default function IncidentsList() {
  const { t } = useI18n();
  const navigate = useNavigate();

  // маленький хелпер: якщо ключа немає — показати fallback
  const tt = (key, fb) => (t(key) === key ? fb : t(key));

  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [clientId, setClientId] = useState('');

  const clientOptions = useMemo(() => clients || [], []);

  useEffect(() => { (async ()=> setItems(await getIncidents()))(); }, []);

  const filtered = items.filter(x => {
    const byClient = clientId ? x.clientId === clientId : true;
    const q = query.trim().toLowerCase();
    const byText = !q || (x.description || '').toLowerCase().includes(q) || (x.clientName || '').toLowerCase().includes(q);
    return byClient && byText;
  });

  const toggleClose = async (id) => {
    const next = items.map(it => it.id === id ? { ...it, status: it.status === 'open' ? 'closed' : 'open' } : it);
    setItems(next);
    await saveIncidents(next);
  };

  const remove = async (id) => {
    if (!window.confirm(tt('incidents.list.confirmDelete', 'Видалити інцидент?'))) return;
    const next = items.filter(it => it.id !== id);
    setItems(next);
    await saveIncidents(next);
  };

  const exportCsv = () => {
    const rows = filtered.map(x => ({
      id: x.id,
      date: x.date,
      type: x.type,
      client: x.clientName || '',
      status: x.status,
      description: (x.description || '').replace(/\r?\n/g, ' '),
      photos: (x.photos?.length || 0)
    }));

    const headers = ['id','date','type','client','status','description','photos'];
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => csvEscape(r[h])).join(','))
    ].join('\r\n');

    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' }); // BOM для Excel
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:T\-]/g,'').split('.')[0];
    a.href = URL.createObjectURL(blob);
    a.download = `incidents_${ts}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const printPdf = () => {
    const html = renderPrintableHTML(filtered);
    const w = window.open('', '_blank', 'width=1024,height=768');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    // невелика пауза, щоб браузер намалював DOM
    setTimeout(() => w.print(), 300);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">{tt('incidents.list.title', 'Інциденти')}</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCsv}>
            {tt('incidents.actions.exportCsv', 'Експорт CSV')}
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={printPdf}>
            {tt('incidents.actions.printPdf', 'Друк / PDF')}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/incidents/new')}>
            {tt('incidents.actions.add', 'Додати інцидент')}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label={tt('incidents.list.filters.search', 'Пошук...')}
                     value={query} onChange={e=>setQuery(e.target.value)} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField select fullWidth label={tt('incidents.form.fields.client', 'Клієнт')}
                     value={clientId} onChange={e=>setClientId(e.target.value)}>
            <option value=""></option>
            {clientOptions.map(c => (
              <option key={c.id || c.name} value={c.id}>{c.name}</option>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Stack spacing={2}>
        {filtered.map(x => (
          <Card key={x.id}>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">
                    #{x.id} · {x.type === 'client'
                      ? tt('incidents.form.types.client', 'Клієнтський')
                      : tt('incidents.form.types.internal', 'Внутрішній')}
                    {x.clientName ? ` · ${x.clientName}` : ''}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={x.status === 'open'
                                  ? tt('incidents.status.open', 'Відкрито')
                                  : tt('incidents.status.closed', 'Закрито')}
                          color={x.status === 'open' ? 'warning' : 'success'} size="small" />
                    <IconButton onClick={()=>toggleClose(x.id)} title={tt('incidents.list.actions.toggle','Відкр./закр.')}>
                      <CheckIcon />
                    </IconButton>
                    <IconButton onClick={()=>remove(x.id)} color="error" title={tt('incidents.list.actions.delete','Видалити')}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>

                <Typography variant="body2" color="text.secondary">{x.date}</Typography>
                {x.description && <Typography>{x.description}</Typography>}

                {!!x.photos?.length && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                      {x.photos.map((p, i) => {
                        const src = p.path ? `file:///${p.path.replace(/\\/g,'/')}` : p.inline;
                        return <img key={i} src={src} alt={`photo-${i+1}`} style={{ width: '100%', borderRadius: 8 }} />;
                      })}
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
        {!filtered.length && <Typography color="text.secondary">{tt('incidents.list.empty', 'Поки що немає інцидентів')}</Typography>}
      </Stack>
    </Stack>
  );
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function renderPrintableHTML(list) {
  const rows = list.map(x => `
    <tr>
      <td>${escapeHtml(x.id)}</td>
      <td>${escapeHtml(x.date || '')}</td>
      <td>${escapeHtml(x.type)}</td>
      <td>${escapeHtml(x.clientName || '')}</td>
      <td>${escapeHtml(x.status)}</td>
      <td>${escapeHtml((x.description || '').replace(/\r?\n/g,' '))}</td>
      <td>${x.photos?.length || 0}</td>
    </tr>
  `).join('');
  return `
<!doctype html><html><head>
<meta charset="utf-8"/>
<title>Incidents</title>
<style>
  body { font-family: system-ui, Arial, sans-serif; padding: 16px; }
  h1 { font-size: 18px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #888; padding: 6px 8px; font-size: 12px; }
  th { background: #eee; text-align: left; }
</style>
</head><body>
  <h1>Incidents export (${new Date().toLocaleString()})</h1>
  <table>
    <thead>
      <tr><th>ID</th><th>Date</th><th>Type</th><th>Client</th><th>Status</th><th>Description</th><th>Photos</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body></html>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;');
}
