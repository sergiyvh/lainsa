import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardHeader, CardContent, CardActions, IconButton,
  TextField, MenuItem, Autocomplete, Button, Tooltip, Grid, Stack,
  Typography, Divider, Chip, Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { loadAllRawRecords } from '../utils/dataLoader';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

import { t } from '../i18n/i18n';
import { normalizeRecord, computeKPI } from '../utils/records';

// ---- i18n helper (soft fallback) -------------------------------------------
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

// Aggregate helpers
function addAgg(agg, key, kg, hours, cycles = 0, reject = 0) {
  const a = agg[key] || { kg: 0, hours: 0, cycles: 0, reject: 0 };
  a.kg += kg || 0;
  a.hours += hours || 0;
  a.cycles += cycles || 0;
  a.reject += reject || 0;
  agg[key] = a;
}
function toListWithKPI(agg) {
  return Object.entries(agg).map(([key, v]) => ({
    key,
    ...v,
    kgh: v.hours > 0 ? v.kg / v.hours : 0,
  }));
}

// ---- component -------------------------------------------------------------
const shifts = [
  { label: '—', value: '' },
  { label: 'mañana', value: 'mañana' },
  { label: 'tarde', value: 'tarde' },
];

export default function Reports() {
  // raw data
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [shift, setShift] = useState('');
  const [operator, setOperator] = useState(null);
  const [client, setClient] = useState('');
  const [machine, setMachine] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await loadAllRawRecords();
    setRaw(Array.isArray(rows) ? rows : []);
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  // normalize + KPI
  const records = useMemo(() => {
    return (raw || []).map(r => {
      const n = normalizeRecord(r);
      const id = ensureId(n);
      const kpi = computeKPI(n); // {hours, kgPerHour}
      return { ...n, id, kpi };
    });
  }, [raw]);

  // options
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

  // apply filters
  const filtered = useMemo(() => {
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
      return true;
    });
  }, [records, dateFrom, dateTo, shift, operator, client, machine]);

  // aggregates
  const summary = useMemo(() => {
    let kg = 0, hours = 0, cycles = 0, reject = 0;
    filtered.forEach(r => {
      kg += Number(r.producedKg) || 0;
      hours += Number(r.kpi?.hours) || 0;
      cycles += Number(r.cycles) || 0;
      reject += Number(r.rejectKg) || 0;
    });
    return {
      kg,
      hours,
      cycles,
      reject,
      kgh: hours > 0 ? kg / hours : 0,
      count: filtered.length,
    };
  }, [filtered]);

  const byShift = useMemo(() => {
    const agg = {};
    filtered.forEach(r => addAgg(agg, r.shift || '—', r.producedKg, r.kpi?.hours, r.cycles, r.rejectKg));
    return toListWithKPI(agg).sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered]);

  const byOperator = useMemo(() => {
    const agg = {};
    filtered.forEach(r => (r.operators || []).forEach(op => addAgg(agg, op, r.producedKg, r.kpi?.hours, r.cycles, r.rejectKg)));
    const list = toListWithKPI(agg);
    return {
      topKg: [...list].sort((a, b) => b.kg - a.kg).slice(0, 5),
      topKgh: [...list].filter(x => x.hours > 2).sort((a, b) => b.kgh - a.kgh).slice(0, 5), // маленький фільтр шуму
      all: list.sort((a, b) => b.kg - a.kg),
    };
  }, [filtered]);

  const byMachine = useMemo(() => {
    const agg = {};
    filtered.forEach(r => addAgg(agg, String(r.machineId ?? '—'), r.producedKg, r.kpi?.hours, r.cycles, r.rejectKg));
    return toListWithKPI(agg).sort((a, b) => b.kg - a.kg);
  }, [filtered]);

  const byProgram = useMemo(() => {
    const agg = {};
    filtered.forEach(r => addAgg(agg, String(r.programCode ?? '—'), r.producedKg, r.kpi?.hours, r.cycles, r.rejectKg));
    return toListWithKPI(agg).sort((a, b) => b.kg - a.kg);
  }, [filtered]);

  // simple bar style
  const barWrap = { background: '#eee', borderRadius: 8, height: 10, width: '100%' };
  const barInner = (pct) => ({ background: '#9aa7ff', borderRadius: 8, height: '100%', width: `${Math.max(0, Math.min(100, pct))}%` });

  // Export
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const wsSummary = XLSX.utils.json_to_sheet([{
      [tr('reports_period','Período')]: `${dateFrom || '—'} — ${dateTo || '—'}`,
      [tr('labels_kg','Kg')]: summary.kg,
      [tr('labels_hours','Horas')]: summary.hours,
      [tr('labels_kgh','Kg/h')]: summary.kgh,
      [tr('labels_cycles','Ciclos')]: summary.cycles,
      [tr('labels_rejectKg','Rechazo (kg)')]: summary.reject,
      [tr('reports_records','Registros')]: summary.count,
    }]);
    XLSX.utils.book_append_sheet(wb, wsSummary, tr('reports_summary','Resumen'));

    const sheetify = (list, name) => {
      const rows = list.map(r => ({
        key: r.key,
        [tr('labels_kg','Kg')]: r.kg,
        [tr('labels_hours','Horas')]: r.hours,
        [tr('labels_kgh','Kg/h')]: r.kgh,
        [tr('labels_cycles','Ciclos')]: r.cycles,
        [tr('labels_rejectKg','Rechazo (kg)')]: r.reject,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    sheetify(byShift, tr('reports_byShift','Por turnos'));
    sheetify(byOperator.all, tr('reports_byOperator','Por operadores'));
    sheetify(byMachine, tr('reports_byMachine','Por máquinas'));
    sheetify(byProgram, tr('reports_byProgram','Por programas'));

    XLSX.writeFile(wb, 'report.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 40;
    const line = (text) => { doc.text(String(text), 40, y); y += 18; };
    const head = (text) => { doc.setFontSize(14); line(text); doc.setFontSize(11); };

    head(tr('reports_title','Reportes'));
    line(`${tr('reports_period','Período')}: ${dateFrom || '—'} — ${dateTo || '—'}`);
    line(`${tr('labels_kg','Kg')}: ${fmt(summary.kg)}   ${tr('labels_hours','Horas')}: ${fmt(summary.hours)}   ${tr('labels_kgh','Kg/h')}: ${fmt(summary.kgh)}`);
    line(`${tr('labels_cycles','Ciclos')}: ${summary.cycles}   ${tr('labels_rejectKg','Rechazo (kg)')}: ${fmt(summary.reject)}   ${tr('reports_records','Registros')}: ${summary.count}`);
    y += 8;

    const section = (title, rows) => {
      if (y > 760) { doc.addPage(); y = 40; }
      head(title);
      rows.slice(0, 30).forEach(r => {
        line(`${r.key}:  ${tr('labels_kg','Kg')}: ${fmt(r.kg)}   ${tr('labels_hours','Horas')}: ${fmt(r.hours)}   ${tr('labels_kgh','Kg/h')}: ${fmt(r.kgh)}`);
      });
      y += 6;
    };

    section(tr('reports_byShift','Por turnos'), byShift);
    section(tr('reports_topKg','Top-5 por Kg'), byOperator.topKg);
    section(tr('reports_topKgh','Top-5 por Kg/h'), byOperator.topKgh);
    section(tr('reports_byMachine','Por máquinas'), byMachine);
    section(tr('reports_byProgram','Por programas'), byProgram);

    doc.save('report.pdf');
  };

  // max values for bars
  const maxKgShift = Math.max(1, ...byShift.map(x => x.kg));
  const maxKgOp = Math.max(1, ...byOperator.all.map(x => x.kg));
  const maxKgMachine = Math.max(1, ...byMachine.map(x => x.kg));
  const maxKgProgram = Math.max(1, ...byProgram.map(x => x.kg));

  return (
    <Box p={2}>
      <Card>
        <CardHeader
          title={tr('reports_title','Reportes')}
          subheader={tr('reports_subtitle','Resumen y análisis por período')}
          action={
            <Tooltip title={tr('common_refresh','Actualizar')}>
              <IconButton onClick={reload}><RefreshIcon /></IconButton>
            </Tooltip>
          }
        />
        <CardContent>
          {/* Filters */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
            <TextField
              label={tr('filters_from','Desde')} type="date" size="small"
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }} sx={{ width: 140 }}
            />
            <TextField
              label={tr('filters_to','Hasta')} type="date" size="small"
              value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }} sx={{ width: 140 }}
            />
            <TextField
              select label={tr('labels_shift','Turno')} size="small" value={shift}
              onChange={(e) => setShift(e.target.value)} sx={{ width: 130 }}
            >
              {shifts.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>
            <Autocomplete
              options={operatorOptions}
              value={operator}
              onChange={(_, v) => setOperator(v)}
              renderInput={(p) => <TextField {...p} label={tr('labels_operator','Operador')} size="small" />}
              sx={{ width: { xs: 180, sm: 220 } }}
              clearOnEscape
            />
            <Autocomplete
              options={clientOptions}
              value={client}
              onChange={(_, v) => setClient(v || '')}
              renderInput={(p) => <TextField {...p} label={tr('labels_client','Cliente')} size="small" />}
              sx={{ width: { xs: 180, sm: 220 } }}
              clearOnEscape
              freeSolo
            />
            <Autocomplete
              options={machineOptions}
              value={machine}
              onChange={(_, v) => setMachine(v || '')}
              renderInput={(p) => <TextField {...p} label={tr('labels_machine','Máquina')} size="small" />}
              sx={{ width: { xs: 160, sm: 180 } }}
              clearOnEscape
              freeSolo
            />
          </Box>

          {/* Summary */}
          <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {tr('reports_period','Período')}: {dateFrom || '—'} — {dateTo || '—'}
              </Typography>
              <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
                <Box sx={{ minWidth: 140 }}>
                  <Typography variant="body2" color="text.secondary">{tr('labels_kg','Kg')}</Typography>
                  <Typography variant="h4">{fmt(summary.kg)}</Typography>
                </Box>
                <Box sx={{ minWidth: 140 }}>
                  <Typography variant="body2" color="text.secondary">{tr('labels_hours','Horas')}</Typography>
                  <Typography variant="h4">{fmt(summary.hours)}</Typography>
                </Box>
                <Box sx={{ minWidth: 140 }}>
                  <Typography variant="body2" color="text.secondary">{tr('labels_kgh','Kg/h')}</Typography>
                  <Typography variant="h4">{fmt(summary.kgh)}</Typography>
                </Box>
                <Box sx={{ minWidth: 140 }}>
                  <Typography variant="body2" color="text.secondary">{tr('labels_cycles','Ciclos')}</Typography>
                  <Typography variant="h4">{summary.cycles}</Typography>
                </Box>
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="body2" color="text.secondary">{tr('labels_rejectKg','Rechazo (kg)')}</Typography>
                  <Typography variant="h4">{fmt(summary.reject)}</Typography>
                </Box>
                <Box sx={{ minWidth: 140 }}>
                  <Typography variant="body2" color="text.secondary">{tr('reports_records','Registros')}</Typography>
                  <Typography variant="h4">{summary.count}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {/* By shifts */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">{tr('reports_byShift','Por turnos')}</Typography>
                  <Divider sx={{ my: 1 }} />
                  {byShift.length === 0 && (
                    <Typography variant="body2" color="text.secondary">{tr('archive_empty','No hay resultados para los filtros')}</Typography>
                  )}
                  {byShift.map(row => (
                    <Box key={row.key} sx={{ mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ mr: 1 }}>{row.key}</Typography>
                        <Typography variant="caption">
                          {tr('labels_kg','Kg')}: {fmt(row.kg)} · {tr('labels_kgh','Kg/h')}: {fmt(row.kgh)}
                        </Typography>
                      </Stack>
                      <Box sx={barWrap}>
                        <Box sx={barInner((row.kg / maxKgShift) * 100)} />
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Operators */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">{tr('reports_operators','Operadores')}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">{tr('reports_topKg','Top-5 por Kg')}</Typography>
                      {byOperator.topKg.map(row => (
                        <Box key={row.key} sx={{ mb: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ mr: 1 }}>{row.key}</Typography>
                            <Typography variant="caption">{fmt(row.kg)} {tr('labels_kg','Kg')}</Typography>
                          </Stack>
                          <Box sx={barWrap}>
                            <Box sx={barInner((row.kg / maxKgOp) * 100)} />
                          </Box>
                        </Box>
                      ))}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">{tr('reports_topKgh','Top-5 por Kg/h')}</Typography>
                      {byOperator.topKgh.map(row => (
                        <Box key={row.key} sx={{ mb: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ mr: 1 }}>{row.key}</Typography>
                            <Typography variant="caption">{fmt(row.kgh)} {tr('labels_kgh','Kg/h')}</Typography>
                          </Stack>
                          <Box sx={barWrap}>
                            <Box sx={barInner((row.kgh / Math.max(1, ...byOperator.topKgh.map(x => x.kgh))) * 100)} />
                          </Box>
                        </Box>
                      ))}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Machines */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">{tr('reports_byMachine','Por máquinas')}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{tr('labels_machine','Máquina')}</TableCell>
                        <TableCell align="right">{tr('labels_kg','Kg')}</TableCell>
                        <TableCell align="right">{tr('labels_hours','Horas')}</TableCell>
                        <TableCell align="right">{tr('labels_kgh','Kg/h')}</TableCell>
                        <TableCell align="right">{tr('labels_cycles','Ciclos')}</TableCell>
                        <TableCell align="right">{tr('labels_rejectKg','Rechazo (kg)')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {byMachine.map(r => (
                        <TableRow key={r.key}>
                          <TableCell>{r.key}</TableCell>
                          <TableCell align="right">{fmt(r.kg)}</TableCell>
                          <TableCell align="right">{fmt(r.hours)}</TableCell>
                          <TableCell align="right">{fmt(r.kgh)}</TableCell>
                          <TableCell align="right">{r.cycles}</TableCell>
                          <TableCell align="right">{fmt(r.reject)}</TableCell>
                        </TableRow>
                      ))}
                      {byMachine.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">{tr('archive_empty','No hay resultados para los filtros')}</Typography>
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* Programs */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">{tr('reports_byProgram','Por programas')}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{tr('labels_program','Programa')}</TableCell>
                        <TableCell align="right">{tr('labels_kg','Kg')}</TableCell>
                        <TableCell align="right">{tr('labels_hours','Horas')}</TableCell>
                        <TableCell align="right">{tr('labels_kgh','Kg/h')}</TableCell>
                        <TableCell align="right">{tr('labels_cycles','Ciclos')}</TableCell>
                        <TableCell align="right">{tr('labels_rejectKg','Rechazo (kg)')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {byProgram.map(r => (
                        <TableRow key={r.key}>
                          <TableCell>{r.key}</TableCell>
                          <TableCell align="right">{fmt(r.kg)}</TableCell>
                          <TableCell align="right">{fmt(r.hours)}</TableCell>
                          <TableCell align="right">{fmt(r.kgh)}</TableCell>
                          <TableCell align="right">{r.cycles}</TableCell>
                          <TableCell align="right">{fmt(r.reject)}</TableCell>
                        </TableRow>
                      ))}
                      {byProgram.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">{tr('archive_empty','No hay resultados para los filtros')}</Typography>
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            {tr('reports_hint','Cambia los filtros para recalcular los datos al instante')}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button startIcon={<PrintIcon />} onClick={exportPDF}>
              {tr('actions_exportPdf','Exportar PDF')}
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={exportExcel}>
              {tr('actions_exportXlsx','Exportar Excel')}
            </Button>
          </Stack>
        </CardActions>
      </Card>
    </Box>
  );
}
