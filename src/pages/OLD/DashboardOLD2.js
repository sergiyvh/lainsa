// src/pages/Dashboard.js
// Операторський дашборд: привітання, кнопки, статус зміни + "Закрити зміну".
// Працює з файловою БД (storageService) і дублює стан у localStorage для шапки Layout.

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Grid, Button, Chip, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getData, saveData } from '../services/storageService';
import { useI18n, t } from '../i18n/i18n';

// Невеликий набір «цікавих фактів» по мовах
const FACTS = {
  es: [
    'Un ciclo a menor carga puede gastar más agua por kg.',
    'Limpia los filtros: mejora el consumo y alarga la vida útil.',
    'Equilibrar la carga reduce vibraciones y fallos.'
  ],
  uk: [
    'Цикл з меншою завантаженістю витрачає більше води на 1 кг.',
    'Чисть фільтри — це знижує витрати і подовжує ресурс.',
    'Балансування білизни зменшує вібрації та поломки.'
  ],
  ca: [
    'Un cicle amb menys càrrega gasta més aigua per kg.',
    'Neteja els filtres: millora el consum i la vida útil.',
    'Equilibrar la càrrega redueix vibracions i avaries.'
  ],
  en: [
    'A lighter load often uses more water per kg.',
    'Clean filters to cut consumption and extend lifespan.',
    'Balanced loads reduce vibration and failures.'
  ]
};

export default function Dashboard() {
  const { lang } = useI18n();
  const [user, setUser] = useState(null);
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);

  // завантажуємо користувача (якщо у тебе є інший спосіб — можна прибрати)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await getData('current_user'); // якщо нема — залишиться null
        if (alive) setUser(u);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getData('current_shift');
        if (alive) setShift(s || null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const greeting = useMemo(() => {
    const name = user?.username || 'operario';
    return t('hello_name', { name });
  }, [user, lang]);

  const fact = useMemo(() => {
    const arr = FACTS[lang] || FACTS.es;
    return arr[Math.floor(Math.random() * arr.length)];
  }, [lang]);

  const closeShift = async () => {
    if (!window.confirm(lang === 'uk' ? 'Закрити зміну?' : '¿Cerrar turno?')) return;
    try {
      await saveData('current_shift', null);
    } catch {}
    try { localStorage.removeItem('current_shift'); } catch {}
    setShift(null);
    // за бажанням — записати час закриття у журнал змін
  };

  if (loading) return null;

  return (
    <Box>
      {/* Привітання + статус зміни */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ mb: 1 }}>{greeting}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1">{t('shift_label')}:</Typography>
              {shift ? (
                <Chip color="success" label={t('shift_open')} />
              ) : (
                <Chip color="default" label={t('shift_closed')} />
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            {shift ? (
              <Button size="large" variant="contained" color="error" onClick={closeShift}>
                CERRAR TURNO
              </Button>
            ) : (
              <Button size="large" variant="contained" component={RouterLink} to="/open-shift">
                {t('btn_open_shift')}
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Великі кнопки дій */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>{t('nav_form')}</Typography>
            <Button
              component={RouterLink}
              to="/form"
              variant="contained"
              size="large"
              sx={{ width: '100%', py: 2, fontSize: 18 }}
            >
              {t('btn_form')}
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>{t('nav_analytics')}</Typography>
            <Button
              component={RouterLink}
              to="/analytics"
              variant="outlined"
              size="large"
              sx={{ width: '100%', py: 2, fontSize: 18 }}
            >
              {t('btn_analytics')}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Цікавий факт */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: '12px' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
          {lang === 'uk' ? 'Цікавий факт' : lang === 'ca' ? 'Dada curiosa' : lang === 'en' ? 'Fun fact' : 'Dato curioso'}
        </Typography>
        <Typography variant="body1">{fact}</Typography>
      </Paper>
    </Box>
  );
}
