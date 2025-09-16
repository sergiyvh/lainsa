// src/pages/StaffRoster.js
// Тижневий графік роботи: M/T/OFF/VAC/SICK з кольорами. Зберігається по ISO-тижнях.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import { getData, saveData } from '../services/storageService';

const STATUS = [
  { v: '',      label: '—',         color: 'default' },
  { v: 'M',     label: 'Mañana',    color: 'success' },
  { v: 'T',     label: 'Tarde',     color: 'primary' },
  { v: 'OFF',   label: 'Libre',     color: 'default' },
  { v: 'VAC',   label: 'Vacaciones',color: 'warning' },
  { v: 'SICK',  label: 'Baja',      color: 'error' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'operator', label: 'Operador' },
  { value: 'technician', label: 'Técnico' },
  { value: 'supervisor', label: 'Supervisor' },
];

function isoWeekLabel(d) {
  const date = new Date(d);
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
}

export default function StaffRoster() {
  const [staff, setStaff] = useState([]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // пн=0
    d.setDate(d.getDate() - day);
    d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10);
  });
  const [filterRole, setFilterRole] = useState('');
  const [filterPlace, setFilterPlace] = useState('');
  const [roster, setRoster] = useState({}); // { 'yyyy-mm-dd': { [staffId]: status } }

  // Завантаження співробітників
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getData('staff');
        if (alive) setStaff(Array.isArray(s) ? s : []);
      } catch {
        if (alive) setStaff([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Дні тижня
  const weekDays = useMemo(() => {
    const start = new Date(weekStart + 'T00:00:00');
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  // Завантажити/зберегти розклад
  useEffect(() => {
    let alive = true;
    (async () => {
      const key = `staff_roster_${isoWeekLabel(weekStart)}`;
      try {
        const data = await getData(key);
        if (alive) setRoster((data && typeof data === 'object') ? data : {});
      } catch {
        if (alive) setRoster({});
      }
    })();
    return () => { alive = false; };
  }, [weekStart]);

  const visibleStaff = useMemo(() => {
    return staff
      .filter(s => !filterRole || s.role === filterRole)
      .filter(s => !filterPlace || String(s.place||'').toLowerCase().includes(filterPlace.toLowerCase()))
      .sort((a,b) => {
        const r = (a.role||'').localeCompare(b.role||'');
        if (r !== 0) return r;
        const p = (a.place||'').localeCompare(b.place||'');
        if (p !== 0) return p;
        return (a.lastName||'').localeCompare(b.lastName||'');
      });
  }, [staff, filterRole, filterPlace]);

  function getVal(date, staffId) {
    const key = date.toISOString().slice(0,10);
    return roster?.[key]?.[staffId] || '';
  }
  function setVal(date, staffId, value) {
    const key = date.toISOString().slice(0,10);
    const day = { ...(roster[key] || {}), [staffId]: value };
    setRoster(prev => ({ ...prev, [key]: day }));
  }
  async function saveWeek() {
    const key = `staff_roster_${isoWeekLabel(weekStart)}`;
    await saveData(key, roster);
    alert('Guardado');
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Planificador semanal</Typography>

      <Paper sx={{ p:2, mb: 2, borderRadius:'12px' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              type="date" size="small" label="Inicio de semana (lunes)"
              value={weekStart} onChange={(e)=>setWeekStart(e.target.value)}
              InputLabelProps={{ shrink: true }} fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select label="Rol" value={filterRole} onChange={(e)=>setFilterRole(e.target.value)}>
                {ROLE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField size="small" fullWidth label="Filtrar por puesto/área"
              value={filterPlace} onChange={(e)=>setFilterPlace(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={2} sx={{ display:'flex', alignItems:'stretch' }}>
            <Button fullWidth variant="contained" onClick={saveWeek}>Guardar semana</Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius:'12px' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Puesto/Área</TableCell>
              {weekDays.map(d => (
                <TableCell key={d.toISOString()} align="center">{d.toLocaleDateString()}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleStaff.length === 0 ? (
              <TableRow><TableCell colSpan={10} align="center">Sin empleados</TableCell></TableRow>
            ) : visibleStaff.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.lastName} {s.firstName}</TableCell>
                <TableCell>{s.role}</TableCell>
                <TableCell>{s.place || '-'}</TableCell>
                {weekDays.map(d => {
                  const val = getVal(d, s.id);
                  const meta = STATUS.find(x => x.v === val) || STATUS[0];
                  return (
                    <TableCell key={`${s.id}-${d.toISOString()}`} align="center">
                      <FormControl size="small" fullWidth>
                        <Select
                          value={val}
                          onChange={(e)=>setVal(d, s.id, e.target.value)}
                          renderValue={(selected) => {
                            const m = STATUS.find(x => x.v === selected) || STATUS[0];
                            return <Chip label={m.label} color={m.color === 'default' ? undefined : m.color} size="small" />;
                          }}
                        >
                          {STATUS.map(opt => (
                            <MenuItem key={opt.v || 'none'} value={opt.v}>
                              <Chip
                                label={opt.label}
                                color={opt.color === 'default' ? undefined : opt.color}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
