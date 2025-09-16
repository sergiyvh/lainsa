// src/components/Clock.js

import React, { useState, useEffect } from 'react';
// ✅ ВИПРАВЛЕННЯ: Додано Divider до імпорту
import { Paper, Typography, Box, Divider } from '@mui/material';

// Іконки для сезонів
import AcUnitIcon from '@mui/icons-material/AcUnit'; // Зима
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'; // Весна
import WbSunnyIcon from '@mui/icons-material/WbSunny'; // Літо
import ForestIcon from '@mui/icons-material/Forest'; // Осінь

/**
 * Розраховує астрономічний сезон (заснований на датах рівнодення та сонцестояння).
 * @param {Date} date - Поточна дата.
 * @returns {{name: string, icon: JSX.Element}} - Назва сезону та іконка.
 */
const getAstronomicalSeason = (date) => {
    const month = date.getMonth(); // 0-11
    const day = date.getDate();

    if ((month === 2 && day >= 20) || month === 3 || month === 4 || (month === 5 && day < 21)) {
        return { name: 'Primavera', icon: <LocalFloristIcon fontSize="small" sx={{ color: '#4caf50' }} /> };
    }
    if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day < 23)) {
        return { name: 'Verano', icon: <WbSunnyIcon fontSize="small" sx={{ color: '#fbc02d' }} /> };
    }
    if ((month === 8 && day >= 23) || month === 9 || month === 10 || (month === 11 && day < 21)) {
        return { name: 'Otoño', icon: <ForestIcon fontSize="small" sx={{ color: '#e65100' }} /> };
    }
    return { name: 'Invierno', icon: <AcUnitIcon fontSize="small" sx={{ color: '#0277bd' }} /> };
};

/**
 * Розраховує календарний (метеорологічний) сезон.
 * @param {Date} date - Поточна дата.
 * @returns {{name: string, icon: JSX.Element}} - Назва сезону та іконка.
 */
const getCalendarSeason = (date) => {
    const month = date.getMonth(); // 0-11

    if (month >= 2 && month <= 4) {
        return { name: 'Primavera', icon: <LocalFloristIcon fontSize="small" sx={{ color: '#4caf50' }} /> };
    }
    if (month >= 5 && month <= 7) {
        return { name: 'Verano', icon: <WbSunnyIcon fontSize="small" sx={{ color: '#fbc02d' }} /> };
    }
    if (month >= 8 && month <= 10) {
        return { name: 'Otoño', icon: <ForestIcon fontSize="small" sx={{ color: '#e65100' }} /> };
    }
    return { name: 'Invierno', icon: <AcUnitIcon fontSize="small" sx={{ color: '#0277bd' }} /> };
};


export default function Clock() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const astronomicalSeason = getAstronomicalSeason(currentDate);
  const calendarSeason = getCalendarSeason(currentDate);
  
  const formattedDate = currentDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Paper
      elevation={6}
      className="no-print"
      sx={{
        position: 'fixed',
        bottom: 72, 
        left: 16,
        p: '8px 16px',
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(5px)',
        zIndex: 1300,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>{formattedDate}</Typography>
      <Typography variant="h6" component="div" sx={{ fontFamily: 'monospace', textAlign: 'center', mb: 1 }}>
        {currentDate.toLocaleTimeString('es-ES')}
      </Typography>
      {/* Тепер Divider визначено */}
      <Divider sx={{mb: 1}}/>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {astronomicalSeason.icon}
        <Typography variant="body2">Astronómico: {astronomicalSeason.name}</Typography>
      </Box>
       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        {calendarSeason.icon}
        <Typography variant="body2">Calendario: {calendarSeason.name}</Typography>
      </Box>
    </Paper>
  );
}