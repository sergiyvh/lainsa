// src/pages/MachineDetailsPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, TextField, Alert, Grid, Select, MenuItem,
  FormControl, InputLabel, CardMedia, List, ListItem, ListItemText, Divider, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { CLIENTS } from '../data/clients';

// ✅ Імпорт сервісу зберігання
import { getData, saveData } from '../services/storageService';

// --- Константи ---
const PROGRAMS = [
  { code: 21, name: '21 - MANTELERÍA (CALIENTE)' }, { code: 22, name: '22 - MANTELERÍA (FRÍO)' },
  { code: 23, name: '23 - SÁBANA (CALIENTE)' }, { code: 24, name: '24 - SÁBANA (FRÍO)' },
  { code: 25, name: '25 - COLOR (CALIENTE)' }, { code: 26, name: '26 - COLOR (FRÍO)' },
  { code: 27, name: '27 - RECHAZO (FRÍO)' }, { code: 30, name: '28 - RECHAZO (CALIENTE)' },
  { code: 29, name: '29 - Centrífugo' }, { code: 30, name: '30 - DESAPRESTO (CALIENTE)' }
];
const initialMachineData = [
  { id: 1, name: 'Máquina #1', capacity: 40, status: 'Disponible', model: 'GIRBAU HS 4040', imageUrl: `${process.env.PUBLIC_URL}/images/girbau_hs4040.jpg` },
    { id: 2, name: 'Máquina #2', capacity: 40, status: 'Requiere Servicio', model: 'Carbonell', imageUrl: `${process.env.PUBLIC_URL}/images/machine_broken.png` },
    { id: 3, name: 'Máquina #3', capacity: 60, maxLoad: 55, status: 'Disponible', model: 'GIRBAU HS 6057', imageUrl: `${process.env.PUBLIC_URL}/images/girbau_hs6057.jpg` },
    { id: 4, name: 'Máquina #4', capacity: 60, maxLoad: 55, status: 'En Uso', model: 'GIRBAU HS 6057', imageUrl: `${process.env.PUBLIC_URL}/images/girbau_hs6057.jpg` },
    { id: 5, name: 'Máquina #5', capacity: 20, status: 'Disponible', model: 'GIRBAU HS 6024', imageUrl: `${process.env.PUBLIC_URL}/images/girbau_hs6024.jpg` },
];

export default function MachineDetailsPage({ user }) {
  const { machineId } = useParams();
  const navigate = useNavigate();

  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Стан завантаження
  const [saved, setSaved] = useState(false);

  // Стани форми циклу
  const [client, setClient] = useState('');
  const [program, setProgram] = useState('');
  const [duration, setDuration] = useState('');

  // Нотатки та журнал обслуговування
  const [technicianNote, setTechnicianNote] = useState('');
  const [maintenanceLog, setMaintenanceLog] = useState([]);
  const [newLogEntry, setNewLogEntry] = useState('');

  // Цикли прання
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    const loadAllData = async () => {
        setLoading(true);
        try {
            // 1. Завантаження статусу машини
            const allMachines = await getData('machine_statuses') || initialMachineData;
            const foundMachine = allMachines.find(m => m.id == machineId);
            setMachine(foundMachine);

            // 2. Завантаження нотаток техніка
            const allNotes = await getData('machine_notes') || {};
            setTechnicianNote(allNotes[machineId] || '');

            // 3. Завантаження журналу обслуговування
            const allLogs = await getData('machine_maintenance_logs') || {};
            setMaintenanceLog(allLogs[machineId] || []);

            // 4. Завантаження циклів цієї машини
            const savedCycles = await getData(`machine_${machineId}_cycles`) || [];
            setCycles(savedCycles);
        } catch (error) {
            console.error("Error loading machine details:", error);
        } finally {
            setLoading(false);
        }
    };
    loadAllData();
  }, [machineId]);

  // Збереження замітки
  const handleSaveNote = async () => {
    const allNotes = await getData('machine_notes') || {};
    allNotes[machineId] = technicianNote;
    await saveData('machine_notes', allNotes);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Додавання запису в журнал обслуговування
  const handleAddLogEntry = async () => {
    if (newLogEntry.trim() === '') return;
    const newEntry = { id: Date.now(), date: new Date().toISOString(), technician: user.username, note: newLogEntry.trim() };
    
    const allLogs = await getData('machine_maintenance_logs') || {};
    const currentMachineLogs = allLogs[machineId] || [];
    const updatedLogs = [newEntry, ...currentMachineLogs];
    allLogs[machineId] = updatedLogs;

    await saveData('machine_maintenance_logs', allLogs);
    setMaintenanceLog(updatedLogs);
    setNewLogEntry('');
  };

  // Додавання нового циклу прання
  const handleAddCycle = async () => {
    if (!client || !program || !duration) {
      alert('Por favor, complete todos los campos para iniciar el ciclo.');
      return;
    }
    const newCycle = {
      id: Date.now(),
      client: CLIENTS.find(c => c.code === client)?.name || '',
      program: PROGRAMS.find(p => p.code === program)?.name || '',
      duration: Number(duration),
      shift: machine?.status === 'En Uso' ? 'En Uso' : 'Disponible', // Припускаємо, що зміна визначається статусом машини
      timestamp: new Date().toISOString()
    };
    const updatedCycles = [...cycles, newCycle];
    setCycles(updatedCycles);
    await saveData(`machine_${machineId}_cycles`, updatedCycles);

    setClient('');
    setProgram('');
    setDuration('');
  };

  // Підрахунок тривалості циклів (без змін)
  const chartData = useMemo(() => {
    // TODO: Потрібно уточнити логіку визначення зміни (mañana/tarde) для циклу. 
    // Наразі використовується приклад, який може невірно рахувати.
    const morningSum = cycles.filter(c => c.shift === 'mañana' || c.shift === 'Disponible').reduce((acc, cur) => acc + cur.duration, 0);
    const eveningSum = cycles.filter(c => c.shift === 'tarde' || c.shift === 'En Uso').reduce((acc, cur) => acc + cur.duration, 0);
    return [
      { name: 'Turno Mañana/Disponible', duration: morningSum },
      { name: 'Turno Tarde/En Uso', duration: eveningSum },
    ];
  }, [cycles]);

  if (loading || !machine) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/machines')} sx={{ mb: 2 }}>
        Volver al listado
      </Button>
      <Grid container spacing={3}>
        {/* Ліва колонка */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
            {machine.imageUrl && (
              <CardMedia component="img" height="200" image={machine.imageUrl} alt={machine.name} sx={{ objectFit: 'contain', padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px', mb: 2, filter: machine.status !== 'Disponible' && machine.status !== 'En Uso' ? 'grayscale(80%) opacity(0.7)' : 'none' }} />
            )}
            <Typography variant="h4" gutterBottom>{machine.name}</Typography>
            <Typography variant="h6">Estado actual: <span style={{ color: machine.status === 'Disponible' ? 'green' : machine.status === 'En Uso' ? 'blue' : 'red' }}>{machine.status}</span></Typography>
            <Typography>Modelo: {machine.model}</Typography>
            <Typography>Capacidad: {machine.capacity} kg {machine.maxLoad && `(carga máxima recomendada ${machine.maxLoad} kg)`}</Typography>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
            <Typography variant="h5" gutterBottom>Registrar Nuevo Ciclo</Typography>
            <Box component="form" sx={{ mt: 2 }} noValidate autoComplete="off">
              <FormControl fullWidth margin="normal">
                <InputLabel>Cliente</InputLabel>
                <Select value={client} label="Cliente" onChange={e => setClient(e.target.value)}>
                  {CLIENTS.map(c => <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Programa</InputLabel>
                <Select value={program} label="Programa" onChange={e => setProgram(e.target.value)}>
                  {PROGRAMS.map(p => <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Duración del ciclo (minutos)" type="number" fullWidth margin="normal" value={duration} onChange={e => setDuration(e.target.value)} />
              <Button variant="contained" size="large" startIcon={<PlayCircleOutlineIcon />} sx={{ mt: 2 }} onClick={handleAddCycle}>Añadir Ciclo</Button>
            </Box>
          </Paper>
        </Grid>

        {/* Права колонка */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
            <Typography variant="h6" gutterBottom>Observaciones del Técnico</Typography>
            <TextField label="Mensaje para los operadores" multiline rows={4} fullWidth value={technicianNote} onChange={e => setTechnicianNote(e.target.value)} InputProps={{ readOnly: user?.role !== 'technician' }} variant={user?.role === 'technician' ? 'outlined' : 'filled'} />
            {user?.role === 'technician' && (<Box sx={{ mt: 2, textAlign: 'right' }}><Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveNote}>Guardar Nota</Button></Box>)}
            {saved && (<Alert severity="success" sx={{ mt: 2 }}>Observación guardada.</Alert>)}
          </Paper>

          <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
            <Typography variant="h6" gutterBottom>Historial de Mantenimiento</Typography>
            {user?.role === 'technician' && (
              <Box sx={{ mb: 2 }}>
                <TextField label="Nuevo registro de mantenimiento" multiline rows={3} fullWidth variant="outlined" value={newLogEntry} onChange={e => setNewLogEntry(e.target.value)} />
                <Button variant="contained" color="primary" startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={handleAddLogEntry}>Añadir al historial</Button>
              </Box>
            )}
            <List dense sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {maintenanceLog.length > 0 ? (
                maintenanceLog.map((entry, index) => (
                  <React.Fragment key={entry.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText primary={entry.note} secondary={`— ${entry.technician} | ${new Date(entry.date).toLocaleString('es-ES')}`} />
                    </ListItem>
                    {index < maintenanceLog.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No hay registros de mantenimiento.</Typography>
              )}
            </List>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
            <Typography variant="h6" gutterBottom>Ciclos Registrados</Typography>
            {cycles.length === 0 ? (
              <Typography>No hay ciclos registrados.</Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 200 }}>
                <Table stickyHeader size="small">
                  <TableHead><TableRow><TableCell>Cliente</TableCell><TableCell>Programa</TableCell><TableCell align="right">Duración (min)</TableCell></TableRow></TableHead>
                  <TableBody>
                    {cycles.map(cycle => (
                      <TableRow key={cycle.id}>
                        <TableCell>{cycle.client}</TableCell>
                        <TableCell>{cycle.program}</TableCell>
                        <TableCell align="right">{cycle.duration}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
            <Typography variant="h6" gutterBottom>Duración total por turno (WIP)</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="duration" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}