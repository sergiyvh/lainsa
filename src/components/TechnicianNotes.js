// src/components/TechnicianNotes.js

import React, { useState, useEffect } from 'react';
import { Paper, Typography, TextField, Button, Box, Alert } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';

// ✅ Імпорт сервісу зберігання
import { getData, saveData } from '../services/storageService';

export default function TechnicianNotes({ user }) {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadNote = async () => {
        // ✅ Читання даних через storageService
        const storedNote = await getData('technician_note');
        if (storedNote) {
            setNote(storedNote);
        }
    };
    loadNote();
  }, []);

  const handleSave = async () => {
    try {
        // ✅ Збереження даних через storageService
        await saveData('technician_note', note);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    } catch (error) {
        console.error("Failed to save technician note:", error);
        alert("Error al guardar la nota.");
    }
  };

  // Логіка відображення компонента (тільки для техніка)
  if (user?.role !== 'technician') {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 4, borderRadius: '12px' }}>
      <Typography variant="h6" gutterBottom>
        Nota para Operadores
      </Typography>
      <TextField
        label="Escribe un mensaje que verán los operadores en su turno"
        multiline
        rows={3}
        fullWidth
        value={note}
        onChange={(e) => setNote(e.target.value)}
        variant="outlined"
        margin="normal"
      />
      <Box sx={{ mt: 1, textAlign: 'right' }}>
        <Button
          variant="contained"
          startIcon={<EditNoteIcon />}
          onClick={handleSave}
        >
          Guardar Nota
        </Button>
      </Box>
      {saved && <Alert severity="success" sx={{ mt: 2 }}>Nota guardada correctamente.</Alert>}
    </Paper>
  );
}