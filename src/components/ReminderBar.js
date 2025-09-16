// src/components/ReminderBar.js

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Alert } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';

// ✅ Імпорт сервісу зберігання
import { getData } from '../services/storageService';

const SHIFT_LABELS = {
  mañana: 'Turno Mañana',
  tarde: 'Turno Tarde'
};

// Функція розрахунку часу (без змін)
function getNextReminderTime() {
  const now = new Date();
  let reminderHour = now.getHours();
  if (reminderHour % 2 !== 0) {
    reminderHour += 1;
  } else {
    reminderHour += 2;
  }
  const reminderTime = new Date();
  reminderTime.setHours(reminderHour, 0, 0, 0);
  return reminderTime;
}

export default function ReminderBar({ shift, role }) {
  const [now, setNow] = useState(new Date());
  const [nextFilterCleanAt, setNextFilterCleanAt] = useState(getNextReminderTime);
  const [technicianNote, setTechnicianNote] = useState('');

  useEffect(() => {
    const loadNote = async () => {
        // ✅ Читання даних через storageService
        const storedNote = await getData('technician_note');
        if (storedNote) {
            setTechnicianNote(storedNote);
        }
    };
    loadNote();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (now >= nextFilterCleanAt) {
      if (role === 'operator') {
        // alert('Recordatorio: Limpiar filtros de secadoras (cada 2 horas).');
      }
      setNextFilterCleanAt(getNextReminderTime());
    }
  }, [now, nextFilterCleanAt, role]);

  const dailyNotes = useMemo(() => [
    'Sacar los contenedores de basura al final del día.',
    'Bolsas de pelusas: Sec 1 y 2 -> Turno Mañana; Sec 3 y 4 -> Turno Tarde.',
    'Sec. 5: Limpiar filtro 1 vez al turno.'
  ], []);

  return (
    <Box sx={{ background: '#fff8e1', borderBottom: '1px solid #ffe0a3', p: 1.5, fontSize: 14 }}>
      {technicianNote && (
        <Alert severity="info" icon={<CampaignIcon />} sx={{ mb: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Nota del técnico: {technicianNote}</Typography>
        </Alert>
      )}

      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
        Notas técnicas — {SHIFT_LABELS[shift] || 'Turno'}
      </Typography>
      <List dense sx={{ py: 0 }}>
        {dailyNotes.map((n, i) => (
          <ListItem key={i} sx={{ py: 0, px: 2 }}>
            <ListItemText primary={`• ${n}`} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        ))}
      </List>
      {role === 'operator' && (
        <Typography variant="body2" sx={{ mt: 1, color: '#a15c00', fontWeight: 'bold', pl: 2 }}>
          Próximo recordatorio de filtros: {nextFilterCleanAt.toLocaleTimeString('es-ES')}
        </Typography>
      )}
    </Box>
  );
}