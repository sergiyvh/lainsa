// src/components/TabsWrapper.js

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Tab, Box, TextField, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReminderBar from '../components/ReminderBar';
import { CLIENTS } from '../data/clients';

// ✅ Імпорт сервісу зберігання
import { saveSessionItem } from '../services/storageService';

// Константи та логіка (без змін)
const PROGRAMS = [
    { code: '01', name: 'Sábana' }, { code: '02', name: 'Sábana nueva' }, { code: '03', name: 'Toallas nuevas' },
    { code: '04', name: 'Manteleria' }, { code: '06', name: 'Toallas Espigas/Rayas' }, { code: '08', name: 'Toallas color' },
    { code: '09', name: 'Nórdicos' }, { code: '10', name: 'Toallas Premium' }, { code: '11', name: 'Rechazo sábana' },
    { code: '12', name: 'Rechazo manteleria' }, { code: '13', name: 'Rechazo toallas' }, { code: '14', name: 'Albornoces' },
    { code: 'otros', name: 'Otros' },
];
function num(v) { const n = Number(v); return isNaN(n) || n < 0 ? 0 : n; }

// Допоміжний компонент таблиці циклів (без змін)
function CyclesTableUnified({ values, setValues, labels }) {
  const WEIGHTS = ['20', '40', '60'];
  const getVal = (lbl, w) => values[`${lbl}-${w}`] || 0;
  const changeVal = (lbl, w, dir) => {
    const key = `${lbl}-${w}`;
    const newValue = Math.max(0, (getVal(lbl, w) + dir));
    setValues({ ...values, [key]: newValue });
  };
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            {WEIGHTS.map((w) => (<TableCell key={w} align="center"><b>{w} kg</b></TableCell>))}
          </TableRow>
        </TableHead>
        <TableBody>
          {labels.map(({ key, label }) => (
            <TableRow key={key}>
              <TableCell component="th" scope="row">{label}</TableCell>
              {WEIGHTS.map((w) => (
                <TableCell key={w} align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton size="small" onClick={() => changeVal(key, w, -1)}><RemoveIcon /></IconButton>
                    <Typography sx={{ minWidth: '2ch', textAlign: 'center' }}>{getVal(key, w)}</Typography>
                    <IconButton size="small" onClick={() => changeVal(key, w, +1)}><AddIcon /></IconButton>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// === ГОЛОВНИЙ КОМПОНЕНТ ===
export default function TabsWrapper({ user, shiftData }) {
  const [tabIndex, setTabIndex] = useState(0);
  
  // ✅ Ініціалізуємо стан з даних, отриманих від FormNew.js
  const [formData, setFormData] = useState(() => ({
    ...shiftData,
    // Переконуємося, що pesoCliente існує, навіть якщо в shiftData його немає (для нових змін)
    pesoCliente: shiftData.pesoCliente || [{ client: '', program: '', weight: '' }],
  }));

  // ✅ Зберігаємо дані через storageService при кожній зміні formData
  useEffect(() => {
    // Функція для збереження, щоб уникнути race conditions, якщо користувач швидко вводить дані
    const saveCurrentData = async () => {
        await saveSessionItem('current_shift', formData);
    };
    saveCurrentData();
  }, [formData]);

  // Функції оновлення стану (без змін)
  const updateField = (section, field, value) => { setFormData(p => ({ ...p, [section]: { ...p[section], [field]: value } })); };
  const updateSection = (section, newValues) => { setFormData(p => ({ ...p, [section]: newValues })); };
  const totalTunel = useMemo(() => ['pro1', 'pro2', 'pro3', 'pro4', 'pro6', 'pro8', 'pro9', 'pro10', 'pro14'].reduce((acc, key) => acc + num(formData.tunel[key]), 0), [formData.tunel]);
  const totalRechTunel = useMemo(() => ['r11', 'r12', 'r13', 'rotas'].reduce((acc, key) => acc + num(formData.rech_tunel[key]), 0), [formData.rech_tunel]);
  const totalLavCiclos = useMemo(() => Object.values(formData.lav_ciclos || {}).reduce((acc, val) => acc + num(val), 0), [formData.lav_ciclos]);

  // Константи для лейблів таблиць (без змін)
  const cyclesLabels = [
    { key: 'mant', label: 'Mantelería' }, { key: 'sab', label: 'Sábanas' }, { key: 'pis', label: 'Piscina' },
    { key: 'otr', label: 'Otros' }, { key: 'otr-29', label: 'Otros - programa 29' }, { key: 'otr-30', label: 'Otros - programa 30' },
    { key: 'cent', label: 'Centrífugo' },
  ];
  const rechazosLabels = [ { key: 'toallas', label: 'Rech. toallas' }, { key: 'nordicos', label: 'Rech. nórdicos' }, { key: 'sabanas', label: 'Rech. sábanas' }, { key: 'otros', label: 'Otros rechazos' } ];

  const handleWeightTableUpdate = (newRows) => updateSection('pesoCliente', newRows);
  const addWeightRow = () => handleWeightTableUpdate([...(formData.pesoCliente || []), { client: '', program: '', weight: '' }]);

  // --- JSX (Візуальна частина без змін) ---
  return (
    <Paper elevation={3} sx={{ borderRadius: '12px' }}>
      <ReminderBar shift={formData.turno} role={user?.role} />
      <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} variant="scrollable" scrollButtons="auto">
        <Tab label="Producción túnel" />
        <Tab label="Lavadoras" />
        <Tab label="Lectura contadores" />
        <Tab label="Peso de cliente" />
      </Tabs>
      <Box sx={{ p: 2 }}>
        {tabIndex === 0 && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Producción túnel (KG)</Typography>
              {[{ key: 'pro1', label: 'Pro.1 - sábanas' }, { key: 'pro2', label: 'Pro.2 - sábana nueva' }, { key: 'pro3', label: 'Pro.3 - toalla nueva' }, { key: 'pro4', label: 'Pro.4 - mantelería' }, { key: 'pro6', label: 'Pro.6 - toallas espigas/rayas' }, { key: 'pro8', label: 'Pro.8 - toallas color' }, { key: 'pro9', label: 'Pro.9 - nórdicos' }, { key: 'pro10', label: 'Pro.10 - premium' }, { key: 'pro14', label: 'Pro.14 - albornoces' }].map(({ key, label }) => (
                <TextField key={key} label={label} type="number" size="small" margin="dense" fullWidth value={formData.tunel[key] || ''} onChange={(e) => updateField('tunel', key, num(e.target.value))} />
              ))}
              <Typography sx={{ mt: 2 }}><b>Total túnel: {totalTunel} kg</b></Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Prod. túnel — Rechazos (KG)</Typography>
              {[{ key: 'r11', label: 'Pro.11 - rechazo sáb' }, { key: 'r12', label: 'Pro.12 - rechazo mant' }, { key: 'r13', label: 'Pro.13 - rechazo toalla' }, { key: 'rotas', label: 'Rotas - limpieza' }].map(({ key, label }) => (
                <TextField key={key} label={label} type="number" size="small" margin="dense" fullWidth value={formData.rech_tunel[key] || ''} onChange={(e) => updateField('rech_tunel', key, num(e.target.value))} />
              ))}
              <Typography sx={{ mt: 2 }}><b>Total rechazo: {totalRechTunel} kg</b></Typography>
            </Grid>
          </Grid>
        )}
        {tabIndex === 1 && (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Lavadoras — ciclos (cant.)</Typography>
              <CyclesTableUnified values={formData.lav_ciclos || {}} setValues={(v) => updateSection('lav_ciclos', v)} labels={cyclesLabels} />
              <Typography sx={{ mt: 2 }}><b>Total ciclos: {totalLavCiclos}</b></Typography>
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>Lavadoras — Rechazos</Typography>
              <CyclesTableUnified values={formData.lav_rechazos || {}} setValues={(v) => updateSection('lav_rechazos', v)} labels={rechazosLabels} />
            </Box>
          </Box>
        )}
        {tabIndex === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Lectura contadores</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '400px' }}>
              {[{ key: 'aguaTunel', label: 'Cont. agua túnel', unit: 'm³' }, { key: 'aguaPozo', label: 'Cont. agua pozo', unit: 'm³' }, { key: 'aguaLav', label: 'Cont. agua lavadoras', unit: 'm³' }, { key: 'aguaCal', label: 'Cont. agua calderas', unit: 'm³' }, { key: 'propDep', label: 'Cont. propano depósito', unit: '%' }, { key: 'propCaldera', label: 'Cont. propano caldera', unit: 'm³' }, { key: 'propSaba', label: 'Cont. propano cal. saba', unit: 'm³' }, { key: 'propMedio', label: 'Cont. propano cal. medio', unit: 'm³' }, { key: 'propHibri', label: 'Cont. propano cal. hibri', unit: 'm³' }, { key: 'propSec', label: 'Cont. propano secadoras', unit: 'm³' }].map(({ key, label, unit }) => (
                <TextField key={key} label={`${label} [${unit}]`} type="number" size="small" value={formData.cont[key] || ''} onChange={(e) => updateField('cont', key, num(e.target.value))} />
              ))}
            </Box>
          </Box>
        )}
        {tabIndex === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Peso de cliente</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Cliente</TableCell><TableCell>Programa</TableCell><TableCell>Peso (kg)</TableCell></TableRow></TableHead>
                <TableBody>
                  {(formData.pesoCliente || []).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell><Select size="small" fullWidth value={row.client} onChange={(e) => handleWeightTableUpdate(formData.pesoCliente.map((r, i) => i === index ? { ...r, client: e.target.value } : r))}><MenuItem value=""><em>Seleccionar</em></MenuItem>{CLIENTS.map(c => <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>)}</Select></TableCell>
                      <TableCell><Select size="small" fullWidth value={row.program} onChange={(e) => handleWeightTableUpdate(formData.pesoCliente.map((r, i) => i === index ? { ...r, program: e.target.value } : r))}><MenuItem value=""><em>Seleccionar</em></MenuItem>{PROGRAMS.map(p => <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>)}</Select></TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="XX.XX" value={row.weight} onChange={(e) => handleWeightTableUpdate(formData.pesoCliente.map((r, i) => i === index ? { ...r, weight: e.target.value } : r))} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button onClick={addWeightRow} startIcon={<AddIcon />} sx={{ mt: 2 }}>Añadir fila</Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
}