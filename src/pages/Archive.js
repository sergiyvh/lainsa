import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box, Card, CardHeader, CardContent, IconButton, TextField, MenuItem, Autocomplete,
  Button, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Typography, Divider, TablePagination, Chip,
} from '@mui/material';
import { loadAllRawRecords } from '../utils/dataLoader';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import DeselectIcon from '@mui/icons-material/Deselect';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

import { t } from '../i18n/i18n';
import { normalizeRecord, computeKPI } from '../utils/records';
import { useI18n } from '../i18n/i18n';
import { exportReportPdf, loadImageAsDataUrl } from '../utils/pdf/reportPdf';
import { saveBlobSmart } from '../utils/pdf/savePdf';


// ---- i18n helper (soft fallback to Spanish text) ---------------------------
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

function printRecord(record) {
  const html = `
<!doctype html><html><head><meta charset="utf-8" />
<title>${tr('archive_printTitle', 'Imprimir Registro')} ${record.id}</title>
<style>
body{font-family:sans-serif;padding:24px}
h1{margin:0 0 8px}.grid{display:grid;grid-template-columns:160px 1fr;gap:8px 16px;margin-top:16px}
.kv{font-weight:600}.muted{color:#666}
</style></head><body>
<h1>${tr('archive_pdfTitle','Registro de Producción')}</h1>
<div class="muted">ID: ${record.id}</div>
<div class="grid">
  <div class="kv">${tr('labels_date','Fecha')}</div><div>${new Date(record.date).toLocaleString()}</div>
  <div class="kv">${tr('labels_shift','Turno')}</div><div>${record.shift || ''}</div>
  <div class="kv">${tr('labels_operators','Operadores')}</div><div>${(record.operators || []).join(', ')}</div>
  <div class="kv">${tr('labels_client','Cliente')}</div><div>${record.client || ''}</div>
  <div class="kv">${tr('labels_program','Programa')}</div><div>${record.programCode || ''}</div>
  <div class="kv">${tr('labels_machine','Máquina')}</div><div>${record.machineId || ''}</div>
  <div class="kv">${tr('labels_kg','Kg')}</div><div>${fmt(record.producedKg)}</div>
  <div class="kv">${tr('labels_hours','Horas')}</div><div>${fmt(record.kpi?.hours)}</div>
  <div class="kv">${tr('labels_kgh','Kg/h')}</div><div>${fmt(record.kpi?.kgPerHour)}</div>
  <div class="kv">${tr('labels_cycles','Ciclos')}</div><div>${record.cycles ?? 0}</div>
  <div class="kv">${tr('labels_rejectKg','Rechazo (kg)')}</div><div>${fmt(record.rejectKg ?? 0)}</div>
  <div class="kv">${tr('labels_notes','Notas')}</div><div>${record.notes || ''}</div>
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`.trim();

  const win = window.open('', '_blank');
  win.document.open(); win.document.write(html); win.document.close();
}

const shiftOptions = [
  { label: '—', value: '' },
  { label: 'mañana', value: 'mañana' },
  { label: 'tarde',  value: 'tarde'  },
];

export default function Archive() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [shift, setShift] = useState('');
  const [operator, setOperator] = useState(null);
  const [client, setClient] = useState('');
  const [machine, setMachine] = useState('');
  const [query, setQuery] = useState('');

  // selection + pagination
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const reload = useCallback(async () => {
    setLoading(true); setErrorMsg('');
    try { setRaw(await loadAllRawRecords()); } catch { setErrorMsg(tr('common_loadError', 'No se pudo cargar')); }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const records = useMemo(() => (raw || []).map(r => {
    const n = normalizeRecord(r);
    const id = ensureId(n);
    const kpi = computeKPI(n);
    return { ...n, id, kpi };
  }), [raw]);

  const operatorOptions = useMemo(() => {
    const s = new Set(); records.forEach(r => (r.operators || []).forEach(op => s.add(op)));
    return Array.from(s).sort();
  }, [records]);

  const clientOptions = useMemo(() => {
    const s = new Set(); records.forEach(r => r.client && s.add(r.client));
    return Array.from(s).sort();
  }, [records]);

  const machineOptions = useMemo(() => {
    const s = new Set(); records.forEach(r => r.machineId && s.add(String(r.machineId)));
    return Array.from(s).sort();
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;
    return records.filter(r => {
      const tms = new Date(r.date).getTime();
      if (fromTs && tms < fromTs) return false;
      if (toTs && tms > toTs) return false;
      if (shift && r.shift !== shift) return false;
      if (operator && !(r.operators || []).includes(operator)) return false;
      if (client && r.client !== client) return false;
      if (machine && String(r.machineId) !== String(machine)) return false;
      if (!q) return true;
      const hay = [
        r.id, r.shift, (r.operators || []).join(' '), r.client,
        String(r.programCode ?? ''), String(r.machineId ?? ''),
        String(r.producedKg ?? ''), String(r.rejectKg ?? ''), String(r.cycles ?? ''), r.notes || '',
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [records, dateFrom, dateTo, shift, operator, client, machine, query]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const allOnPageSelected = paginated.length > 0 && paginated.every(r => selectedIds.includes(r.id));
  const someOnPageSelected = paginated.some(r => selectedIds.includes(r.id));

  const toggleSelect = (id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectAllOnPage = () => setSelectedIds(p => Array.from(new Set([...p, ...paginated.map(r => r.id)])));
  const deselectAllOnPage = () => {
    const ids = new Set(paginated.map(r => r.id));
    setSelectedIds(p => p.filter(id => !ids.has(id)));
  };
  const clearAllSelection = () => setSelectedIds([]);
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const exportSelectedToExcel = () => {
    const selection = records.filter(r => selectedIds.includes(r.id));
    if (selection.length === 0) return;
    exportRecordsToExcel(selection, 'archive_selected.xlsx');
  };

  const exportSelectedToPDF = () => {
    const selection = records.filter(r => selectedIds.includes(r.id));
    if (selection.length === 0) return;
    const doc = new jsPDF();
    selection.forEach((rec, idx) => {
      if (idx > 0) doc.addPage();
      const { kpi } = rec;
      doc.setFontSize(14); doc.text(`${tr('archive_record','Registro')} #${rec.id}`, 14, 18);
      doc.setFontSize(10);
      const rows = [
        [tr('labels_date','Fecha'), new Date(rec.date).toLocaleString()],
        [tr('labels_shift','Turno'), rec.shift || ''],
        [tr('labels_operators','Operadores'), (rec.operators || []).join(', ')],
        [tr('labels_client','Cliente'), rec.client || ''],
        [tr('labels_program','Programa'), String(rec.programCode ?? '')],
        [tr('labels_machine','Máquina'), String(rec.machineId ?? '')],
        [tr('labels_kg','Kg'), fmt(rec.producedKg)],
        [tr('labels_hours','Horas'), fmt(kpi?.hours)],
        [tr('labels_kgh','Kg/h'), fmt(kpi?.kgPerHour)],
        [tr('labels_cycles','Ciclos'), String(rec.cycles ?? 0)],
        [tr('labels_rejectKg','Rechazo (kg)'), fmt(rec.rejectKg ?? 0)],
        [tr('labels_notes','Notas'), rec.notes || ''],
      ];
      let y = 30; rows.forEach(([k, v]) => { doc.text(`${k}:`, 14, y); doc.text(String(v), 60, y); y += 8; });
    });
    doc.save('archive_selected.pdf');
  };

  // === NEW: PDF експорту однієї записи з i18n + логотипом (pdfmake) ===
  const handleExportPdf = useCallback(async (record) => {
    let logoDataUrl = null;
    try { logoDataUrl = await loadImageAsDataUrl('/lainsa-logo.png'); } catch {}
    const report = {
      id: record.id,
      title: record.title || t('archive_pdfTitle', 'Registro de Producción'),
      type: record.type || 'operator',
      clientName: record.clientName || (record.client?.name) || '',
      date: record.date || new Date().toISOString(),
      items: [
        { label: t('labels_date', 'Fecha'), value: new Date(record.date).toLocaleString() },
        { label: t('labels_shift', 'Turno'), value: record.shift || '' },
        { label: t('labels_operator', 'Operador'), value: record.operator || '' },
      ],
      photos: (record.photos || []).map(p => ({ dataUrl: p.dataUrl, path: p.path })),
    };
    const blob = await exportReportPdf(report, { t, logoDataUrl });
    await saveBlobSmart(blob, `report_${report.id || 'unknown'}.pdf`);
  }, [t]);

  const goView = (id) => navigate(`/view/${encodeURIComponent(id)}`);

  return (
    <Box p={2}>
      <Card>
        <CardHeader
          title={tr('archive_title', 'Archivo')}
          subheader={tr('archive_subtitle', 'Vista rápida, filtros, exportación')}
          action={
            <Tooltip title={tr('common_refresh', 'Actualizar')}>
              <IconButton onClick={reload}><RefreshIcon /></IconButton>
            </Tooltip>
          }
        />
        <CardContent>

          {/* ======= ФІЛЬТРИ: компактно + адаптивно ======= */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              columnGap: 1,
              rowGap: 1,
              alignItems: 'center',
              maxWidth: '100%',
            }}
          >
            <TextField
              label={tr('filters_from','Desde')}
              type="date" size="small" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: { xs: 140, sm: 140 } }}
            />
            <TextField
              label={tr('filters_to','Hasta')}
              type="date" size="small" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: { xs: 140, sm: 140 } }}
            />
            <TextField
              select label={tr('labels_shift','Turno')} size="small" value={shift}
              onChange={(e) => { setShift(e.target.value); setPage(0); }}
              sx={{ width: { xs: 120, sm: 120 } }}
            >
              {shiftOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>

            <Autocomplete
              options={operatorOptions}
              value={operator}
              onChange={(_, val) => { setOperator(val); setPage(0); }}
              renderInput={(params) => <TextField {...params} label={tr('labels_operator','Operador')} size="small" />}
              sx={{ width: { xs: 180, sm: 200, md: 220 } }}
              clearOnEscape
            />

            <Autocomplete
              options={clientOptions}
              value={client}
              onChange={(_, val) => { setClient(val || ''); setPage(0); }}
              renderInput={(params) => <TextField {...params} label={tr('labels_client','Cliente')} size="small" />}
              sx={{ width: { xs: 180, sm: 200, md: 220 } }}
              clearOnEscape
              freeSolo
            />

            <Autocomplete
              options={machineOptions}
              value={machine}
              onChange={(_, val) => { setMachine(val || ''); setPage(0); }}
              renderInput={(params) => <TextField {...params} label={tr('labels_machine','Máquina')} size="small" />}
              sx={{ width: { xs: 150, sm: 160, md: 180 } }}
              clearOnEscape
              freeSolo
            />

            <TextField
              label={tr('filters_search','Buscar')} size="small" value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder={tr('filters_placeholder','id, operador, cliente, máquina, notas…')}
              sx={{ flex: '1 1 260px', minWidth: 220 }}
            />
          </Box>

          {/* actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            <Tooltip title={tr('archive_selectPage','Seleccionar página')}>
              <Button size="small" startIcon={<SelectAllIcon />} onClick={selectAllOnPage}
                disabled={paginated.length === 0 || allOnPageSelected}>
                {tr('archive_selectPage','Seleccionar página')}
              </Button>
            </Tooltip>
            <Tooltip title={tr('archive_unselectPage','Quitar selección')}>
              <Button size="small" startIcon={<DeselectIcon />} onClick={deselectAllOnPage}
                disabled={!someOnPageSelected}>
                {tr('archive_unselectPage','Quitar selección')}
              </Button>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Button size="small" startIcon={<DownloadIcon />} onClick={exportSelectedToExcel}
              disabled={selectedIds.length === 0}>
              {tr('archive_exportExcelSel','Exportar seleccionados (Excel)')}
            </Button>
            <Button size="small" startIcon={<DownloadIcon />} onClick={exportSelectedToPDF}
              disabled={selectedIds.length === 0}>
              {tr('archive_exportPdfSel','Exportar seleccionados (PDF)')}
            </Button>
            {selectedIds.length > 0 && (
              <Chip label={`${tr('archive_selected','Seleccionados')}: ${selectedIds.length}`} size="small" onDelete={clearAllSelection} />
            )}
          </Box>

          {/* status */}
          {loading && <Typography variant="body2" color="text.secondary" mt={2}>{tr('common_loading','Cargando…')}</Typography>}
          {errorMsg && <Typography variant="body2" color="error" mt={2}>{errorMsg}</Typography>}

          {/* table */}
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="right">№</TableCell>
                  <TableCell>{tr('archive_fileName','Nombre de archivo')}</TableCell>
                  <TableCell>{tr('labels_createdAt','Fecha de creación')}</TableCell>
                  <TableCell>{tr('labels_operator','Operador')}</TableCell>
                  <TableCell>{tr('labels_shift','Turno')}</TableCell>
                  <TableCell align="center">{tr('labels_actions','Acciones')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((r, idx) => (
                  <TableRow key={r.id} hover>
                    <TableCell align="right">{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell>
                      <Typography noWrap title={r.fileName || `record_${r.id}.json`}>
                        {r.fileName || `record_${r.id}.json`}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(r.date).toLocaleString()}</TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography noWrap title={(r.operators || []).join(', ')}>
                        {(r.operators || []).join(', ') || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.shift ? <Chip size="small" label={r.shift} /> : '—'}</TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title={tr('actions_view','Ver')}>
                        <IconButton onClick={() => goView(r.id)}><VisibilityIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title={tr('actions_print','Imprimir')}>
                        <IconButton onClick={() => printRecord(r)}><PrintIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title={tr('actions_exportPdf','Exportar PDF')}>
                        <IconButton onClick={() => handleExportPdf(r)}><DownloadIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title={tr('actions_exportXlsx','Exportar Excel')}>
                        <IconButton onClick={() => exportRecordsToExcel([r], `record_${r.id}.xlsx`)}><DownloadIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {(!loading && paginated.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        {tr('archive_empty','No hay resultados para los filtros')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

function exportRecordsToExcel(records, filename = 'archive_export.xlsx') {
  const rows = records.map(r => ({
    id: r.id,
    [tr('labels_date', 'Fecha')]: r.date,
    [tr('labels_shift', 'Turno')]: r.shift,
    [tr('labels_operators', 'Operadores')]: (r.operators || []).join(', '),
    [tr('labels_client', 'Cliente')]: r.client,
    [tr('labels_program', 'Programa')]: r.programCode,
    [tr('labels_machine', 'Máquina')]: r.machineId,
    [tr('labels_kg', 'Kg')]: r.producedKg,
    [tr('labels_rejectKg', 'Rechazo (kg)')]: r.rejectKg,
    [tr('labels_cycles', 'Ciclos')]: r.cycles,
    [tr('labels_hours', 'Horas')]: r.kpi?.hours,
    [tr('labels_kgh', 'Kg/h')]: r.kpi?.kgPerHour,
    [tr('labels_notes', 'Notas')]: r.notes || '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tr('archive_sheetName', 'Archivo'));
  XLSX.writeFile(wb, filename);
}
