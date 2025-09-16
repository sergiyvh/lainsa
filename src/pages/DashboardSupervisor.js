// src/pages/DashboardSupervisor.js
// Дашборд супервізора: InfoWidget зверху, KPI-резюме та плитки на ключові сторінки.

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Grid, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getData } from '../services/storageService';
import { useI18n, t } from '../i18n/i18n';
import InfoWidget from '../components/InfoWidget';

function toNum(x, d = 0) { const n = Number(x); return Number.isFinite(n) ? n : d; }
function getRecordWeight(rec) { return rec?.weight != null ? toNum(rec.weight, 0) : (rec?.kg != null ? toNum(rec.kg, 0) : 0); }
function getRecordHours(rec) {
  try {
    if (rec?.startTime && rec?.endTime) {
      const st = new Date(rec.startTime), en = new Date(rec.endTime);
      const ms = en - st; if (Number.isFinite(ms) && ms > 0) return ms / 36e5;
    }
    if (rec?.durationHours) return toNum(rec.durationHours, 0);
  } catch {}
  return 0;
}

export default function DashboardSupervisor() {
  const { lang } = useI18n();
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const u = await getData('current_user'); if (alive) setUser(u); } catch {}
      try { const r = await getData('lainsa_records'); if (alive) setRecords(Array.isArray(r) ? r : []); } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const kpi = useMemo(() => {
    if (!records.length) return { totalKg: 0, totalHours: 0, kgh: 0 };
    const now = new Date();
    const from = new Date(); from.setDate(now.getDate() - 6); from.setHours(0,0,0,0);
    let kg = 0, h = 0;
    for (const rec of records) {
      const raw = rec?.date || rec?.createdAt || rec?.day;
      if (!raw) continue;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;
      if (d >= from && d <= now) {
        kg += getRecordWeight(rec);
        h  += getRecordHours(rec);
      }
    }
    const k = h ? kg / h : 0;
    return { totalKg: Number(kg.toFixed(1)), totalHours: Number(h.toFixed(2)), kgh: Number(k.toFixed(2)) };
  }, [records]);

  const heading = useMemo(() => t('panel_supervisor'), [lang]);

  return (
    <Box>
      {/* InfoWidget вгорі */}
      <InfoWidget />

      {/* Заголовок + коротке резюме KPI */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: '12px', mt: 2 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {heading} {user?.username ? `— ${user.username}` : ''}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">{t('kpi_avg')}</Typography>
            <Typography variant="h5">{kpi.kgh}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">{t('kpi_total_kg')}</Typography>
            <Typography variant="h5">{kpi.totalKg}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">{t('kpi_total_hours')}</Typography>
            <Typography variant="h5">{kpi.totalHours}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Великі плитки навігації */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>{t('nav_analytics')}</Typography>
            <Button component={RouterLink} to="/analytics" variant="contained" size="large" sx={{ width:'100%', py:2, fontSize:18 }}>
              {t('nav_analytics')}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>{t('nav_machines')}</Typography>
            <Button component={RouterLink} to="/machines" variant="outlined" size="large" sx={{ width:'100%', py:2, fontSize:18 }}>
              {t('nav_machines')}
            </Button>
          </Paper>
        </Grid>

        {/* Нові сторінки керування персоналом */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Directorio del personal</Typography>
            <Button component={RouterLink} to="/staff" variant="outlined" size="large" sx={{ width:'100%', py:2, fontSize:18 }}>
              Abrir directorio
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Planificador semanal</Typography>
            <Button component={RouterLink} to="/staff-roster" variant="outlined" size="large" sx={{ width:'100%', py:2, fontSize:18 }}>
              Abrir planificador
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
