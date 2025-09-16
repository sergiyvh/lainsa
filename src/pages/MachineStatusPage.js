// src/pages/MachineStatusPage.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card, CardContent, Typography, Grid, Box, Select, MenuItem, FormControl, InputLabel, CardMedia, CircularProgress
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AutorenewIcon from '@mui/icons-material/Autorenew';

import { getData, saveData } from '../services/storageService';

const initialMachineData = [
    { id: 1, name: 'Máquina #1', capacity: 40, status: 'Disponible', model: 'GIRBAU HS 4040', imageUrl: `${process.env.PUBLIC_URL}/images/girbau_hs4040.jpg` },
    { id: 2, name: 'Máquina #2', capacity: 40, status: 'Requiere Servicio', model: 'Carbonell', imageUrl: `${process.env.PUBLIC_URL}/images/machine_broken.png` },
    { id: 3, name: 'Máquina #3', capacity: 60, maxLoad: 55, status: 'Disponible', model: 'GIRBAU HS 6057', imageUrl: `${process.env.PUBLIC_URL}/images/girbau_hs6057.jpg` },
    { id: 4, name: 'Máquina #4', capacity: 60, maxLoad: 55, status: 'En Uso', model: 'GIRBAU HS 6057', imageUrl: `${process.env.PUBLIC_URL}/images/girbau_hs6057.jpg` },
    { id: 5, name: 'Máquina #5', capacity: 20, status: 'Disponible', model: 'GIRBAU HS 6024', imageUrl: `${process.env.PUBLIC_URL}/images/girbau_hs6024.jpg` },
];

const STATUS_OPTIONS = ['Disponible', 'En Uso', 'Requiere Servicio'];

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'Disponible':
      return <CheckCircleIcon sx={{ color: 'green', fontSize: '1.8rem' }} />;
    case 'En Uso':
      return <AutorenewIcon className="rotating" sx={{ color: 'blue', fontSize: '1.8rem' }} />;
    case 'Requiere Servicio':
      return <ErrorIcon sx={{ color: 'red', fontSize: '1.8rem' }} />;
    default:
      return null;
  }
};

export default function MachineStatusPage() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMachines = async () => {
        setLoading(true);
        try {
            let savedMachines = await getData('machine_statuses');
            if (!savedMachines || savedMachines.length === 0) {
                savedMachines = initialMachineData;
                await saveData('machine_statuses', savedMachines);
            }
            setMachines(savedMachines);
        } catch (error) {
            console.error("Failed to load machine statuses:", error);
            setMachines(initialMachineData);
        } finally {
            setLoading(false);
        }
    };
    loadMachines();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    const updatedMachines = machines.map(m =>
      m.id === id ? { ...m, status: newStatus } : m
    );
    setMachines(updatedMachines);
    try {
        await saveData('machine_statuses', updatedMachines);
    } catch (error) {
        console.error("Failed to save machine status change:", error);
        alert("Error al guardar el estado.");
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Disponible') return 'green';
    if (status === 'En Uso') return 'blue';
    if (status === 'Requiere Servicio') return 'red';
    return 'grey';
  };

  if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Estado de las Máquinas
      </Typography>
      <Grid container spacing={3}>
        {machines.map((machine) => (
          <Grid item xs={12} sm={6} md={4} key={machine.id} sx={{ display: 'flex' }}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
              <Link to={`/machine-details/${machine.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={machine.imageUrl}
                  alt={machine.name}
                  sx={{
                    objectFit: 'contain',
                    padding: '8px',
                    backgroundColor: '#fafafa',
                    filter: machine.status !== 'Disponible' && machine.status !== 'En Uso' ? 'grayscale(80%) opacity(0.7)' : 'none'
                  }}
                />
              </Link>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h5" component="div">
                    <Link to={`/machine-details/${machine.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {machine.name}
                    </Link>
                  </Typography>
                  <StatusIcon status={machine.status} />
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  Modelo: {machine.model || 'N/A'} | Capacidad: {machine.capacity} kg
                </Typography>
                <FormControl fullWidth sx={{ mt: 'auto' }} onClick={e => e.stopPropagation()}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={machine.status}
                    label="Estado"
                    // ✅ ВИПРАВЛЕННЯ: machineId -> machine.id
                    onChange={e => handleStatusChange(machine.id, e.target.value)}
                    sx={{ fontWeight: 'bold', color: getStatusColor(machine.status) }}
                  >
                    {STATUS_OPTIONS.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}