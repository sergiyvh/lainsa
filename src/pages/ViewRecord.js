import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box, Card, CardHeader, CardContent, CardActions, Chip, Typography, Stack,
  Divider, IconButton, Button, Tooltip, Grid, Skeleton,
} from '@mui/material';
import { loadAllRawRecords } from '../utils/dataLoader';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

import { t } from '../i18n/i18n';
import { normalizeRecord, computeKPI } from '../utils/records';

// ---- i18n helper -----------------------------------------------------------
const tr = (key, esFallback) => {
  const s = t(key);
  return s === key ? esFallback : s;
};

function ensureId(rec) {
  if (rec.id) return rec.id;
  const key = [
    rec.date ?? '', rec.shift ?? '', rec.client ?? '', rec.programCode ?? '',
    rec.machineId ?? '', (rec.operators || []).join('|') ?? '', rec.producedKg ?? '', rec.cycles ?? '',
  ].join('::');
  let h = 0; for (let i = 0; i < key.length; i++) { h = ((h << 5) - h) + key.charCodeAt(i); h |= 0; }
  return `auto-${Math.abs(h)}`;
}
const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : '—');

// ---------- exports ----------
function exportRecordToPDF(record) {
  const doc = new jsPDF();
  const { kpi } = record;

  doc.setFontSize(18);
  doc.text(tr('view_titlePdf','Registro de Producción'), 14, 18);

  doc.setFontSize(11);
  const lines = [
    `ID: ${record.id}`,
    `${tr('labels_date','Fecha')}: ${new Date(record.date).toLocaleString()}`,
    `${tr('labels_shift','Turno')}: ${record.shift || ''}`,
    `${tr('labels_operators','Operadores')}: ${(record.operators || []).join(', ')}`,
    `${tr('labels_client','Cliente')}: ${record.client || ''}`,
    `${tr('labels_program','Programa')}: ${record.programCode || ''}`,
    `${tr('labels_machine','Máquina')}: ${record.machineId || ''}`,
    `${tr('labels_kg','Kg')}: ${fmt(record.producedKg)}    ${tr('labels_hours','Horas')}: ${fmt(kpi.hours)}    ${tr('labels_kgh','Kg/h')}: ${fmt(kpi.kgPerHour)}`,
    `${tr('labels_cycles','Ciclos')}: ${record.cycles ?? 0}    ${tr('labels_rejectKg','Rechazo (kg)')}: ${fmt(record.rejectKg ?? 0)}`,
    `${tr('labels_notes','Notas')}: ${record.notes || ''}`,
  ];

  let y = 30; lines.forEach((line) => { doc.text(line, 14, y); y += 8; });

  doc.save(`record_${record.id}.pdf`);
}

function exportRecordToExcel(record) {
  const row = [{
    id: record.id,
    [tr('labels_date','Fecha')]: record.date,
    [tr('labels_shift','Turno')]: record.shift,
    [tr('labels_operators','Operadores')]: (record.operators || []).join(', '),
    [tr('labels_client','Cliente')]: record.client,
    [tr('labels_program','Programa')]: record.programCode,
    [tr('labels_machine','Máquina')]: record.machineId,
    [tr('labels_kg','Kg')]: record.producedKg,
    [tr('labels_rejectKg','Rechazo (kg)')]: record.rejectKg,
    [tr('labels_cycles','Ciclos')]: record.cycles,
    [tr('labels_hours','Horas')]: record.kpi?.hours,
    [tr('labels_kgh','Kg/h')]: record.kpi?.kgPerHour,
    [tr('labels_notes','Notas')]: record.notes || '',
  }];
  const ws = XLSX.utils.json_to_sheet(row);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tr('view_sheetName','Registro'));
  XLSX.writeFile(wb, `record_${record.id}.xlsx`);
}

function printRecord(record) {
  const html = `
<!doctype html><html><head><meta charset="utf-8" />
<title>${tr('view_printTitle','Imprimir Registro')} ${record.id}</title>
<style>
body{font-family:sans-serif;padding:24px}
h1{margin:0 0 8px}
.grid{display:grid;grid-template-columns:160px 1fr;gap:8px 16px;margin-top:16px}
.kv{font-weight:600}.muted{color:#666}
.kpi{display:flex;gap:16px;margin:16px 0}
.kpi .card{border:1px solid #ddd;border-radius:12px;padding:12px 16px}
.kpi .val{font-size:26px;font-weight:700}
.kpi .lbl{font-size:12px;color:#666}
</style></head><body>
<h1>${tr('view_titlePdf','Registro de Producción')}</h1>
<div class="muted">ID: ${record.id}</div>

<div class="kpi">
  <div class="card"><div class="lbl">${tr('labels_kg','Kg')}</div><div class="val">${fmt(record.producedKg)}</div></div>
  <div class="card"><div class="lbl">${tr('labels_hours','Horas')}</div><div class="val">${fmt(record.kpi?.hours)}</div></div>
  <div class="card"><div class="lbl">${tr('labels_kgh','Kg/h')}</div><div class="val">${fmt(record.kpi?.kgPerHour)}</div></div>
</div>

<div class="grid">
  <div class="kv">${tr('labels_date','Fecha')}</div><div>${new Date(record.date).toLocaleString()}</div>
  <div class="kv">${tr('labels_shift','Turno')}</div><div>${record.shift || ''}</div>
  <div class="kv">${tr('labels_operators','Operadores')}</div><div>${(record.operators || []).join(', ')}</div>
  <div class="kv">${tr('labels_client','Cliente')}</div><div>${record.client || ''}</div>
  <div class="kv">${tr('labels_program','Programa')}</div><div>${record.programCode || ''}</div>
  <div class="kv">${tr('labels_machine','Máquina')}</div><div>${record.machineId || ''}</div>
  <div class="kv">${tr('labels_cycles','Ciclos')}</div><div>${record.cycles ?? 0}</div>
  <div class="kv">${tr('labels_rejectKg','Rechazo (kg)')}</div><div>${fmt(record.rejectKg ?? 0)}</div>
  <div class="kv">${tr('labels_notes','Notas')}</div><div>${record.notes || ''}</div>
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`.trim();

  const win = window.open('', '_blank');
  win.document.open(); win.document.write(html); win.document.close();
}

// ---------- component ----------
export default function ViewRecord() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const all = await loadAllRawRecords();
    const normalized = (all || []).map(r => {
      const n = normalizeRecord(r);
      const id = ensureId(n);
      const kpi = computeKPI(n);
      return { ...n, id, kpi };
    });
    const rec = normalized.find(r => String(r.id) === decodeURIComponent(String(routeId || '')));
    setRaw(rec || null);
    setLoading(false);
  }, [routeId]);

  useEffect(() => { reload(); }, [reload]);

  const record = raw;
  const kpi = record?.kpi;

  const headerTitle = useMemo(() => {
    if (!record) return tr('view_title','Registro');
    const d = new Date(record.date).toLocaleString();
    return `${tr('view_title','Registro')} · ${d}`;
  }, [record]);

  return (
    <Box p={2}>
      <Card>
        <CardHeader
          title={headerTitle}
          subheader={record ? `ID: ${record.id}` : ''}
          action={
            <Tooltip title={tr('common_back','Volver')}>
              <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
            </Tooltip>
          }
        />

        <CardContent>
          {loading && (
            <Box>
              <Skeleton height={32} width={280} />
              <Skeleton height={18} width="80%" />
              <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: 2 }} />
            </Box>
          )}

          {!loading && !record && (
            <Typography color="error">{tr('view_notFound','No se encontró el registro')}</Typography>
          )}

          {!loading && record && (
            <Box>
              {/* Верхня інформація */}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {record.shift && <Chip label={record.shift} size="small" />}
                {(record.tags || []).map(tag => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Stack>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} md={8}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">{tr('labels_operators','Operadores')}</Typography>
                        <Typography>{(record.operators || []).join(', ') || '—'}</Typography>

                        <Divider sx={{ my: 1 }} />

                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary">{tr('labels_client','Cliente')}</Typography>
                            <Typography>{record.client || '—'}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="text.secondary">{tr('labels_program','Programa')}</Typography>
                            <Typography>{String(record.programCode ?? '—')}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="text.secondary">{tr('labels_machine','Máquina')}</Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Typography>{String(record.machineId ?? '—')}</Typography>
                              {!!record.machineId && (
                                <Tooltip title={tr('view_openMachine','Abrir detalles de la máquina')}>
                                  <IconButton
                                    size="small"
                                    onClick={() => navigate(`/machine-details/${encodeURIComponent(String(record.machineId))}`)}
                                  >
                                    <OpenInNewIcon fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 1 }} />

                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="text.secondary">{tr('labels_cycles','Ciclos')}</Typography>
                            <Typography>{record.cycles ?? 0}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="text.secondary">{tr('labels_rejectKg','Rechazo (kg)')}</Typography>
                            <Typography>{fmt(record.rejectKg ?? 0)}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="text.secondary">{tr('view_start','Inicio')}</Typography>
                            <Typography>{record.startTime ? new Date(record.startTime).toLocaleString() : '—'}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="text.secondary">{tr('view_end','Fin')}</Typography>
                            <Typography>{record.endTime ? new Date(record.endTime).toLocaleString() : '—'}</Typography>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="subtitle2" color="text.secondary">{tr('labels_notes','Notas')}</Typography>
                        <Typography whiteSpace="pre-wrap">{record.notes || '—'}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* KPI */}
                <Grid item xs={12} md={4}>
                  <Stack spacing={2}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="overline" color="text.secondary">{tr('view_kpi','Indicadores')}</Typography>
                        <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
                          <Box sx={{ minWidth: 110 }}>
                            <Typography variant="body2" color="text.secondary">{tr('labels_kg','Kg')}</Typography>
                            <Typography variant="h4">{fmt(record.producedKg)}</Typography>
                          </Box>
                          <Box sx={{ minWidth: 110 }}>
                            <Typography variant="body2" color="text.secondary">{tr('labels_hours','Horas')}</Typography>
                            <Typography variant="h4">{fmt(kpi?.hours)}</Typography>
                          </Box>
                          <Box sx={{ minWidth: 110 }}>
                            <Typography variant="body2" color="text.secondary">{tr('labels_kgh','Kg/h')}</Typography>
                            <Typography variant="h4">{fmt(kpi?.kgPerHour)}</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>

        {/* Дії */}
        {record && (
          <CardActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap', px: 2, pb: 2 }}>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
                {tr('common_back','Volver')}
              </Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<PrintIcon />} onClick={() => printRecord(record)}>
                {tr('actions_print','Imprimir')}
              </Button>
              <Button startIcon={<DownloadIcon />} onClick={() => exportRecordToPDF(record)}>
                {tr('actions_exportPdf','Exportar PDF')}
              </Button>
              <Button startIcon={<DownloadIcon />} onClick={() => exportRecordToExcel(record)}>
                {tr('actions_exportXlsx','Exportar Excel')}
              </Button>
            </Stack>
          </CardActions>
        )}
      </Card>
    </Box>
  );
}
