// src/pages/Reports.js (повний вміст файлу)

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardHeader, CardContent, IconButton, TextField, MenuItem,
  Button, Tooltip, Grid as MuiGrid, Stack, Typography, Divider, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer, Chip
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { loadAllRawRecords } from '../utils/dataLoader';
import RefreshIcon from '@mui/icons-material/Refresh';
import { t } from '../i18n/i18n';

const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : '—');

const shifts = [
  { label: '—', value: '' },
  { label: 'mañana', value: 'mañana' },
  { label: 'tarde', value: 'tarde' },
];

export default function Reports() {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [shift, setShift] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await loadAllRawRecords();
    setRaw(Array.isArray(rows) ? rows : []);
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const records = useMemo(() => {
    return (raw || []).filter(r => r.recordType === 'shift_report')
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [raw]);

  const filtered = useMemo(() => {
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;
    return records.filter(r => {
      const tms = new Date(r.fecha).getTime();
      if (fromTs && tms < fromTs) return false;
      if (toTs && tms > toTs) return false;
      if (shift && r.turno !== shift) return false;
      return true;
    });
  }, [records, dateFrom, dateTo, shift]);

  const summary = useMemo(() => {
    const data = { kg: 0, rejectKg: 0, clientWeight: 0, cycles: 0, count: 0 };
    filtered.forEach(r => {
        data.count++;
        data.kg += Object.values(r.tunel || {}).reduce((s, v) => s + Number(v || 0), 0);
        data.rejectKg += Object.values(r.rech_tunel || {}).reduce((s, v) => s + Number(v || 0), 0);
        data.cycles += Object.values(r.lav_ciclos || {}).reduce((s, v) => s + Number(v || 0), 0);
        data.clientWeight += (r.pesoCliente || []).reduce((s, v) => s + Number(v.weight || 0), 0);
    });
    return data;
  }, [filtered]);

  const byTunnelProgram = useMemo(() => {
    const agg = {};
    filtered.forEach(r => {
        Object.entries(r.tunel || {}).forEach(([prog, kg]) => {
            agg[prog] = (agg[prog] || 0) + Number(kg || 0);
        });
    });
    return Object.entries(agg).map(([name, kg]) => ({ name, kg: parseFloat(kg.toFixed(2)) })).sort((a,b) => b.kg - a.kg);
  }, [filtered]);

  const byClientWeight = useMemo(() => {
    const agg = {};
    filtered.forEach(r => {
        (r.pesoCliente || []).forEach(item => {
            if (item.client && item.weight) {
                agg[item.client] = (agg[item.client] || 0) + Number(item.weight || 0);
            }
        });
    });
    return Object.entries(agg).map(([name, kg]) => ({ name, kg: parseFloat(kg.toFixed(2)) })).sort((a,b) => b.kg - a.kg);
  }, [filtered]);

  const byMeterReadings = useMemo(() => {
    if (filtered.length < 2) return {};
    const first = filtered[0].cont || {};
    const last = filtered[filtered.length - 1].cont || {};
    const consumption = {};
    for (const key in last) {
      if (key in first) {
        const diff = Number(last[key] || 0) - Number(first[key] || 0);
        if (diff > 0) {
          consumption[key] = diff;
        }
      }
    }
    return consumption;
  }, [filtered]);

  return (
    <Box p={2}>
      <Card>
        <CardHeader
          title={t('reports_detailed_title', 'Informes Detallados')}
          subheader={t('reports_detailed_subtitle', 'Análisis de datos de los informes de operador')}
          action={ <Tooltip title={t('common_refresh', 'Actualizar')}><IconButton onClick={reload}><RefreshIcon /></IconButton></Tooltip> }
        />
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField label={t('filters_from', 'Desde')} type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <TextField label={t('filters_to', 'Hasta')} type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <TextField select label={t('labels_shift', 'Turno')} size="small" value={shift} onChange={(e) => setShift(e.target.value)} sx={{ width: 140 }}>
              {shifts.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>
          </Stack>

          <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {t('reports_period', 'Período')}: {dateFrom || '—'} — {dateTo || '—'}
                <Chip label={`${t('reports_records', 'Registros')}: ${summary.count}`} size="small" sx={{ ml: 2 }} />
              </Typography>
              <MuiGrid container spacing={2} mt={1}>
                  <MuiGrid item xs={6} md={3}><Stat label={t('reports_total_production')} value={fmt(summary.kg)} /></MuiGrid>
                  <MuiGrid item xs={6} md={3}><Stat label={t('reports_total_rejection')} value={fmt(summary.rejectKg)} /></MuiGrid>
                  <MuiGrid item xs={6} md={3}><Stat label={t('reports_total_cycles')} value={fmt(summary.cycles)} /></MuiGrid>
                  <MuiGrid item xs={6} md={3}><Stat label={t('reports_total_client_weight')} value={fmt(summary.clientWeight)} /></MuiGrid>
              </MuiGrid>
            </CardContent>
          </Card>

          {/* ✅ ВИПРАВЛЕНО: Замість Grid, тепер це прості блоки з відступом знизу (mb: 3) */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader title={t('reports_meter_summary')} />
            <TableContainer>
                <Table size="small">
                <TableHead>
                    <TableRow>
                    <TableCell>{t('reports_meter_header_name', 'Contador')}</TableCell>
                    <TableCell align="right">{t('reports_meter_header_consumption', 'Consumo')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.keys(byMeterReadings).length > 0 ? (
                    Object.entries(byMeterReadings).map(([key, value]) => (
                        <TableRow key={key}><TableCell>{key}</TableCell><TableCell align="right">{fmt(value)}</TableCell></TableRow>
                    ))
                    ) : (
                    <TableRow><TableCell colSpan={2} align="center"><Typography color="text.secondary" sx={{ py: 2 }}>{t('archive_empty')}</Typography></TableCell></TableRow>
                    )}
                </TableBody>
                </Table>
            </TableContainer>
          </Card>

          <Card variant="outlined" sx={{ height: 400, mb: 3 }}>
            <CardHeader title={t('reports_by_tunnel_program')} />
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={byTunnelProgram} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <RechartsTooltip formatter={(value) => `${fmt(value)} kg`} />
                    <Bar dataKey="kg" fill="#8884d8" name={t('labels_kg', 'Kg')} />
                </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card variant="outlined" sx={{ height: 400 }}>
            <CardHeader title={t('reports_by_client_weight')} />
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={byClientWeight.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <RechartsTooltip formatter={(value) => `${fmt(value)} kg`} />
                    <Legend />
                    <Bar dataKey="kg" fill="#82ca9d" name={t('reports_client_weight_legend', 'Kg (Top 10)')} />
                </BarChart>
            </ResponsiveContainer>
          </Card>

        </CardContent>
      </Card>
    </Box>
  );
}

const Stat = ({ label, value }) => (
    <Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
    </Box>
);