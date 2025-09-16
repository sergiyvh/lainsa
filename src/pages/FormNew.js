// src/pages/FormNew.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TabsWrapper from '../components/TabsWrapper';
import { Paper, Typography, Box, Divider, CircularProgress } from '@mui/material'; // Імпорти MUI

// ✅ Імпорт сервісу зберігання
import { getData } from '../services/storageService';

export default function FormNew({ user }) {
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true); // Стан завантаження
  const navigate = useNavigate();

  useEffect(() => {
    const loadShiftData = async () => {
      try {
        const shiftData = await getData('current_shift');
        if (shiftData) {
          setActiveShift(shiftData);
        } else {
          alert('No hay un turno activo. Abriendo un nuevo turno...');
          navigate('/open-shift');
        }
      } catch (error) {
        console.error("Error loading active shift data:", error);
        alert("Error al cargar los datos del turno.");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadShiftData();
  }, [navigate]);

  if (loading || !activeShift) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Cargando datos del turno...</Typography>
        </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        <Typography variant="h5" component="h2">
          PARTE DE PRODUCCIÓN (Turno Activo)
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography><strong>Fecha:</strong> {activeShift.fecha}</Typography>
          <Typography><strong>Turno:</strong> {activeShift.turno}</Typography>
          <Typography><strong>Operadores:</strong> {activeShift.operators.join(', ')}</Typography>
        </Box>
      </Paper>
      {/* Передаємо завантажені дані до TabsWrapper */}
      <TabsWrapper user={user} shiftData={activeShift} />
    </Box>
  );
}