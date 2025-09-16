// src/pages/AnalyticsPage.js
// Аналітика + KPI + експорт CSV/PDF (jsPDF+html2canvas) з i18n (ES/UK/CA/EN).

import React, { useEffect, useMemo, useState } from 'react';
import {
  Paper, Typography, Box, Select, MenuItem,
  FormControl, InputLabel, TextField, Grid, Button, Divider
} from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line
} from 'recharts';

import { getData } from '../services/storageService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// i18n
import { useI18n, t } from '../i18n/i18n';

// ===== KPI утиліти =====
const SHIFT_HOURS_DEFAULT = 8;

function normalizeShift(raw) {
  if (!raw) return 'unknown';
  const s = String(raw).toLowerCase();
  if (s.includes('mañ') || s.includes('man') || s.includes('am')) return 'maniana';
  if (s.includes('tar') || s.includes('pm') || s.includes('eve')) return 'tarde';
  return s;
}
function getISOWeekLabel(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
function ymd(date) { return date.toISOString().slice(0, 10); }
function toNum(x, def = 0) { const n = Number(x); return Number.isFinite(n) ? n : def; }
function getRecordHours(rec, fallbackShiftHours = SHIFT_HOURS_DEFAULT) {
  try {
    if (rec?.startTime && rec?.endTime) {
      const st = new Date(rec.startTime);
      const en = new Date(rec.endTime);
      const ms = en - st;
      if (Number.isFinite(ms) && ms > 0) return ms / 36e5;
    }
    if (rec?.durationHours) {
      const d = toNum(rec.durationHours, 0);
      if (d > 0) return d;
    }
  } catch {}
  return toNum(fallbackShiftHours, SHIFT_HOURS_DEFAULT);
}
function getRecordWeight(rec) {
  if (rec && typeof rec === 'object') {
    if (rec.weight != null) return toNum(rec.weight, 0);
    if (rec.kg != null) return toNum(rec.kg, 0);
  }
  return 0;
}
function getRecordDate(rec) {
  const raw = rec?.date || rec?.createdAt || rec?.day;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}
function buildKpiSeries(records, { period = 'day', startDate, endDate, fallbackShiftHours = SHIFT_HOURS_DEFAULT } = {}) {
  if (!Array.isArray(records)) return { rows: [], byLabelShift: new Map() };

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const agg = new Map(); // key = label__shift
  const labels = new Set();

  for (const rec of records) {
    const d = getRecordDate(rec);
    if (!d) continue;
    if (start && d < new Date(start)) continue;
    if (end && d > new Date(end)) continue;

    const label = period === 'week' ? getISOWeekLabel(d) : ymd(d);
    labels.add(label);

    const shift = normalizeShift(rec?.shift);
    const key = `${label}__${shift}`;
    const kg = getRecordWeight(rec);
    const hours = getRecordHours(rec, fallbackShiftHours);

    const prev = agg.get(key) || { kg: 0, hours: 0 };
    prev.kg += kg;
    prev.hours += Math.max(0, toNum(hours, 0));
    agg.set(key, prev);

    const totalKey = `${label}__total`;
    const prevT = agg.get(totalKey) || { kg: 0, hours: 0 };
    prevT.kg += kg;
    prevT.hours += Math.max(0, toNum(hours, 0));
    agg.set(totalKey, prevT);
  }

  const rows = [...labels].sort().map(label => {
    const man = agg.get(`${label}__maniana`) || { kg: 0, hours: 0 };
    const tar = agg.get(`${label}__tarde`)   || { kg: 0, hours: 0 };
    const tot = agg.get(`${label}__total`)   || { kg: 0, hours: 0 };

    const kgh_m = man.hours ? man.kg / man.hours : 0;
    const kgh_t = tar.hours ? tar.kg / tar.hours : 0;
    const kgh_x = tot.hours ? tot.kg / tot.hours : 0;

    return {
      label,
      kgh_maniana: Number(kgh_m.toFixed(2)),
      kgh_tarde: Number(kgh_t.toFixed(2)),
      kgh_total: Number(kgh_x.toFixed(2)),
      kg_total: Number(tot.kg.toFixed(1)),
      hours_total: Number(tot.hours.toFixed(2)),
    };
  });

  return { rows, byLabelShift: agg };
}

// ===== Експорт (локалізовано) =====
function safeDate(s) { return String(s || "").replace(/[^0-9\-W]/g, ""); }
function exportKpiToCsv(chartData, { startDate, endDate, strings } = {}) {
  const S = strings || {};
  const header = [
    S.col_label || 'Etiqueta',
    S.col_kgh_maniana || 'Kg/h Mañana',
    S.col_kgh_tarde || 'Kg/h Tarde',
    S.col_kgh_total || 'Kg/h Total',
    S.col_kg_total || 'Kg Total',
    S.col_hours_total || 'Horas Totales'
  ];
  const rows = chartData.map(r => [
    r.label ?? '',
    r.kgh_maniana ?? '',
    r.kgh_tarde ?? '',
    r.kgh_total ?? '',
    r.kg_total ?? '',
    r.hours_total ?? '',
  ]);
  const toCell = (v) => {
    const s = v == null ? '' : String(v);
    return /[;,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    `${S.export_title || 'KPI de Producción'};`,
    `${S.export_period || 'Período'};${startDate || ""}..${endDate || ""}`,
    `${S.export_generated || 'Generado'};${new Date().toISOString()}`,
    "",
    header.join(";"),
    ...rows.map(r => r.map(toCell).join(";")),
  ];
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  const sd = safeDate(startDate), ed = safeDate(endDate);
  a.href = URL.createObjectURL(blob);
  a.download = `KPI_${sd}_${ed}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

async function exportKpiToPdf(chartData, { startDate, endDate, strings } = {}) {
  const S = strings || {};
  const head = `
    <tr>
      <th>${S.col_label || 'Etiqueta'}</th>
      <th>${S.col_kgh_maniana || 'Kg/h Mañana'}</th>
      <th>${S.col_kgh_tarde || 'Kg/h Tarde'}</th>
      <th>${S.col_kgh_total || 'Kg/h Total'}</th>
      <th>${S.col_kg_total || 'Kg Total'}</th>
      <th>${S.col_hours_total || 'Horas Totales'}</th>
    </tr>`;
  const body = chartData.map(r => `
    <tr>
      <td>${r.label ?? ""}</td>
      <td>${r.kgh_maniana ?? ""}</td>
      <td>${r.kgh_tarde ?? ""}</td>
      <td>${r.kgh_total ?? ""}</td>
      <td>${r.kg_total ?? ""}</td>
      <td>${r.hours_total ?? ""}</td>
    </tr>`).join("");
  const html = `
    <div id="kpi-pdf-root" style="width:1123px; padding:24px; font-family:Arial, Helvetica, sans-serif; background:#fff;">
      <h1 style="margin:0 0 8px; font-size:20px;">${S.export_title || 'KPI de Producción'}</h1>
      <div style="color:#555; margin-bottom:16px;">
        <div><b>${S.export_period || 'Período'}:</b> ${startDate || ""} .. ${endDate || ""}</div>
        <div><b>${S.export_generated || 'Generado'}:</b> ${new Date().toLocaleString()}</div>
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>${head}</thead>
        <tbody>${body}</tbody>
      </table>
      <style>
        table, th, td { border:1px solid #ddd; }
        th, td { padding:6px 8px; text-align:right; }
        th:first-child, td:first-child { text-align:left; }
        thead th { background:#f0f0f0; }
      </style>
    </div>
  `;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const node = container.querySelector('#kpi-pdf-root');
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;
    pdf.addImage(imgData, 'JPEG', x, y, imgW, imgH);
    const sd = String(startDate || '').replace(/[^0-9\-W]/g, '');
    const ed = String(endDate || '').replace(/[^0-9\-W]/g, '');
    pdf.save(`KPI_${sd}_${ed}.pdf`);
  } catch (err) {
    console.error('PDF export error:', err);
    alert('Помилка експорту PDF.');
  } finally {
    document.body.removeChild(container);
  }
}

export default function AnalyticsPage() {
  const { lang, setLang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState([]);

  const [period, setPeriod] = useState('day'); // 'day' | 'week'
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [shiftHours, setShiftHours] = useState(SHIFT_HOURS_DEFAULT);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rec = await getData('lainsa_records');
        if (alive) setAllRecords(Array.isArray(rec) ? rec : []);
      } catch (e) {
        console.error('load records error', e);
        if (alive) setAllRecords([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const kpi = useMemo(() => {
    return buildKpiSeries(allRecords, {
      period, startDate, endDate,
      fallbackShiftHours: Number(shiftHours) || SHIFT_HOURS_DEFAULT
    });
  }, [allRecords, period, startDate, endDate, shiftHours]);

  const chartData = kpi.rows;

  const headline = useMemo(() => {
    if (!chartData.length) return { avgKgh: 0, totalKg: 0, totalHours: 0 };
    const sumKg = chartData.reduce((s, r) => s + (r.kg_total || 0), 0);
    const sumHours = chartData.reduce((s, r) => s + (r.hours_total || 0), 0);
    const avgKgh = sumHours ? (sumKg / sumHours) : 0;
    return {
      avgKgh: Number(avgKgh.toFixed(2)),
      totalKg: Number(sumKg.toFixed(1)),
      totalHours: Number(sumHours.toFixed(2))
    };
  }, [chartData]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>Cargando…</Box>;
  }

  const strings = {
    export_title: t('export_title'),
    export_period: t('export_period'),
    export_generated: t('export_generated'),
    col_label: t('col_label'),
    col_kgh_maniana: t('col_kgh_maniana'),
    col_kgh_tarde: t('col_kgh_tarde'),
    col_kgh_total: t('col_kgh_total'),
    col_kg_total: t('col_kg_total'),
    col_hours_total: t('col_hours_total'),
  };

  return (
    <Box>
      {/* селектор мови */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <FormControl size="small">
          <InputLabel>{t('lang_label')}</InputLabel>
          <Select label={t('lang_label')} value={lang} onChange={(e)=>setLang(e.target.value)}>
            <MenuItem value="es">{t('lang_es')}</MenuItem>
            <MenuItem value="uk">{t('lang_uk')}</MenuItem>
            <MenuItem value="ca">{t('lang_ca')}</MenuItem>
            <MenuItem value="en">{t('lang_en')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography variant="h4" gutterBottom>{t('export_title')}</Typography>

      {/* Фільтри */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>{t('params')}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel id="period-label">{t('period')}</InputLabel>
              <Select
                labelId="period-label"
                label={t('period')}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <MenuItem value="day">{t('period_day')}</MenuItem>
                <MenuItem value="week">{t('period_week')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <TextField
              size="small"
              type="date"
              label={t('start')}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <TextField
              size="small"
              type="date"
              label={t('end')}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={12} md={3}>
            <TextField
              size="small"
              type="number"
              label={t('shift_hours')}
              value={shiftHours}
              onChange={(e) => setShiftHours(e.target.value)}
              fullWidth
              inputProps={{ step: 0.5, min: 1, max: 24 }}
              helperText={t('shift_hours_hint')}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Резюме KPI */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: '12px' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">{t('kpi_avg')}</Typography>
            <Typography variant="h5">{headline.avgKgh}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">{t('kpi_total_kg')}</Typography>
            <Typography variant="h5">{headline.totalKg}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">{t('kpi_total_hours')}</Typography>
            <Typography variant="h5">{headline.totalHours}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Кнопки експорту */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant="contained" onClick={() => exportKpiToCsv(chartData, { startDate, endDate, strings })}>
          CSV (Excel)
        </Button>
        <Button variant="outlined" onClick={() => exportKpiToPdf(chartData, { startDate, endDate, strings })}>
          PDF
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="text" onClick={() => console.table(chartData)}>Console</Button>
      </Box>

      {/* Порівняння змін */}
      <Typography variant="h6" gutterBottom>{t('chart_shift')}</Typography>
      <Paper elevation={2} sx={{ p: 2, borderRadius: '12px', height: 380, mb: 3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="kgh_maniana" name={t('maniana')} />
            <Bar dataKey="kgh_tarde" name={t('tarde')} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Загальний тренд */}
      <Typography variant="h6" gutterBottom>{t('chart_trend')}</Typography>
      <Paper elevation={2} sx={{ p: 2, borderRadius: '12px', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="kgh_total" name={t('total')} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Divider sx={{ my: 4 }} />
      <Typography variant="body2" color="text.secondary">
        {t('shift_hours_hint')}
      </Typography>
    </Box>
  );
}
