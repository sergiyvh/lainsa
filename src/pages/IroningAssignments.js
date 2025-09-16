// src/pages/IroningAssignments.js
// Призначення працівників на праски за обрану дату.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody,
  FormControl, InputLabel, Select, MenuItem, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { getData, saveData } from '../services/storageService';

export default function IroningAssignments() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [staff, setStaff] = useState([]);
  const [stations, setStations] = useState(['Pl.1','Pl.2','Pl.3','Pl.4']);
  const [newStation, setNewStation] = useState('');
  const [assign, setAssign] = useState({}); // { station: staffId }

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const s = await getData('staff'); if (alive) setStaff(Array.isArray(s) ? s : []); } catch {}
    })();
    return () => { alive = false; };
  }, []);

  // завантажити призначення на обрану дату
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const key = `iron_assignments_${date}`;
        const a = await getData(key);
        if (alive) setAssign((a && typeof a === 'object') ? a : {});
      } catch {
        if (alive) setAssign({});
      }
    })();
    return () => { alive = false; };
  }, [date]);

  const operators = useMemo(
    () => staff.filter(s => s.role === 'operator' || s.role === 'technician'),
    [staff]
  );

  function setVal(station, staffId) {
    setAssign(prev => ({ ...prev, [station]: staffId || '' }));
  }
  async function saveDay() {
    const key = `iron_assignments_${date}`;
    await saveData(key, assign);
    alert('Guardado');
  }

  const addStation = () => {
    const name = newStation.trim();
    if (!name) return;
    if (stations.includes(name)) return alert('Ya existe esa estación');
    setStations(prev => [...prev, name]);
    setNewStation('');
  };
  const removeStation = (name) => {
    if (!window.confirm('¿Eliminar estación?')) return;
    setStations(prev => prev.filter(s => s !== name));
    setAssign(prev => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Asignaciones de planchado</Typography>

      <Paper sx={{ p:2, mb:2, borderRadius:'12px' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              type="date" size="small" label="Fecha"
              value={date} onChange={(e)=>setDate(e.target.value)}
              InputLabelProps={{ shrink: true }} fullWidth
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <TextField
              size="small" fullWidth label="Añadir estación (ej.: Pl.5)"
              value={newStation} onChange={(e)=>setNewStation(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2} sx={{ display:'flex', alignItems:'stretch' }}>
            <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={addStation}>Añadir</Button>
          </Grid>
        </Grid>
      </Paper>

      <Table component={Paper} sx={{ borderRadius:'12px' }}>
        <TableHead>
          <TableRow>
            <TableCell>Estación</TableCell>
            <TableCell>Empleado</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align="center">Sin estaciones</TableCell>
            </TableRow>
          ) : stations.map(st => (
            <TableRow key={st}>
              <TableCell>{st}</TableCell>
              <TableCell>
                <FormControl size="small" fullWidth>
                  <InputLabel>Empleado</InputLabel>
                  <Select
                    label="Empleado"
                    value={assign[st] || ''}
                    onChange={(e)=>setVal(st, e.target.value)}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {operators.map(o => (
                      <MenuItem key={o.id} value={o.id}>{o.lastName} {o.firstName} ({o.role})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell align="right">
                <IconButton color="error" onClick={()=>removeStation(st)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box sx={{ mt: 2, display:'flex', justifyContent:'flex-end' }}>
        <Button variant="contained" onClick={saveDay}>Guardar</Button>
      </Box>
    </Box>
  );
}
