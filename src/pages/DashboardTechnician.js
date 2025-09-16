// src/pages/DashboardTechnician.js
// Дашборд техніка: один InfoWidget (вгорі) + відступ знизу, ТО + плитки.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Button, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getData } from '../services/storageService';
import { useI18n, t } from '../i18n/i18n';
import InfoWidget from '../components/InfoWidget';

function parseDate(d) {
  if (!d) return null;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

export default function DashboardTechnician() {
  const { lang } = useI18n();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const u = await getData('current_user'); if (alive) setUser(u); } catch {}
      try {
        const m = await getData('maintenance');
        const arr = Array.isArray(m) ? m : [];
        if (!alive) return;
        const norm = arr.map((x) => ({
          id: x.id || `${x.machineId || x.machine || 'M'}-${x.dueDate || x.date || Math.random()}`,
          machine: x.machineName || x.name || (x.machineId ? `${t('machine')} ${x.machineId}` : t('machine')),
          date: parseDate(x.dueDate || x.date),
        }))
        .filter(x => x.date)
        .sort((a,b) => a.date - b.date)
        .slice(0, 8);
        setTasks(norm);
      } catch {
        setTasks([]);
      }
    })();
    return () => { alive = false; };
  }, [lang]);

  const heading = useMemo(() => t('panel_technician'), [lang]);

  return (
    <Box>
      {/* ЄДИНИЙ InfoWidget + відступ знизу */}
      <Box sx={{ mb: 2 }}>
        <InfoWidget />
      </Box>

      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {heading} {user?.username ? `— ${user.username}` : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('upcoming_maint')}
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        {tasks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t('no_tasks')}</Typography>
        ) : (
          <List dense>
            {tasks.map((tks, idx) => (
              <React.Fragment key={tks.id}>
                <ListItem>
                  <ListItemText
                    primary={tks.machine}
                    secondary={`${t('due')}: ${tks.date.toLocaleDateString()}`}
                  />
                </ListItem>
                {idx < tasks.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Великі плитки */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>{t('nav_machines')}</Typography>
            <Button component={RouterLink} to="/machines" variant="contained" size="large" sx={{ width:'100%', py:2, fontSize:18 }}>
              {t('nav_machines')}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Asignaciones de planchado</Typography>
            <Button component={RouterLink} to="/iron-assignments" variant="outlined" size="large" sx={{ width:'100%', py:2, fontSize:18 }}>
              Abrir asignaciones
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
